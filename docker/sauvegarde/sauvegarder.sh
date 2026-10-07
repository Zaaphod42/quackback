#!/usr/bin/env bash
# ============================================================================
# DIAFANE : la sauvegarde de la base du portail (feedback.diafane.com)
# ============================================================================
# POURQUOI (2026-10-07) : la base PostgreSQL du portail (idees, votes,
# commentaires, conversations, comptes) n'etait sauvegardee nulle part. Et la
# montee en 0.14 joue environ 140 migrations SANS RETOUR EN ARRIERE : une fois
# la base migree, la 0.13 ne sait plus la lire, et seule une copie permet de
# revenir. Le modele est celui des sauvegardes de Diafane : une copie
# coherente (pg_dump), chiffree et dedupliquee par restic, envoyee HORS du VPS
# (un compartiment Scaleway a part).
#
# Sous-commandes :
#   boucle              (par defaut) une sauvegarde chaque nuit a
#                       SAUVEGARDE_HEURE (UTC), puis, le lundi, une
#                       verification complete
#   maintenant [etiq.]  une sauvegarde tout de suite. Etiquette par defaut :
#                       manuel. La retention n'efface que les copies `nuit` :
#                       une copie posee a la main reste jusqu'a ce qu'on
#                       l'efface soi-meme
#   nuit                ce que fait la boucle chaque nuit, tout de suite :
#                       une copie `nuit`, puis le tri des anciennes
#   verifier            restaure la derniere copie dans une base d'essai,
#                       compte ce qu'elle contient, puis efface la base d'essai
#   avant               la copie d'avant chaque deploiement (service
#                       `sauvegarde-avant`) : rend TOUJOURS la main avec
#                       succes, au plus tard apres SAUVEGARDE_AVANT_MAX
#                       secondes (300 par defaut)
#   copie-avant         interne : ce que `avant` fait dans sa limite de temps
#   lister              les copies du depot
#   prochaine           dans combien de secondes tombe la prochaine sauvegarde
#
# CE QU'IL NE FAIT JAMAIS : arreter le portail. Une variable manquante ou un
# echec se disent dans le journal du conteneur, et sur Telegram quand il est
# configure, puis la boucle continue. C'est pour cette raison que le service
# n'a aucune variable obligatoire dans docker-compose.prod.yml : un `${VAR:?}`
# y ferait refuser le demarrage de TOUTE la pile, portail compris.
#
# Ecrit pour le bash 3.2 de macOS aussi (les tests tournent sur le Mac) :
# ni tableau associatif, ni `date -d`, ni `mapfile`.
# ============================================================================

set -uo pipefail

DOSSIER="${SAUVEGARDE_DOSSIER:-/sauvegarde}"
FICHIER="$DOSSIER/quackback.dump"
# restic regroupe les copies par machine. Le nom du conteneur change a chaque
# deploiement : sans nom fixe, chaque deploiement ouvrirait une nouvelle serie
# et la retention ne s'appliquerait plus a rien.
HOTE="feedback"
HEURE_PAR_DEFAUT="02:30"
BASE_ESSAI="quackback_verification"

# Les variables que lit ce script, et le nom sous lequel Seb les pose dans
# Coolify (docker-compose.prod.yml fait la correspondance).
VARIABLES="RESTIC_PASSWORD:SAUVEGARDE_MOT_DE_PASSE AWS_ACCESS_KEY_ID:SAUVEGARDE_CLE_ID AWS_SECRET_ACCESS_KEY:SAUVEGARDE_CLE_SECRETE PGPASSWORD:POSTGRES_PASSWORD RESTIC_REPOSITORY:SAUVEGARDE_DEPOT"

journal() {
  printf '%s [sauvegarde] %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$*"
}

# Un message Telegram, si le robot est configure. Un envoi rate ne fait jamais
# echouer une sauvegarde : il se dit dans le journal, c'est tout.
prevenir() {
  if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] || [ -z "${TELEGRAM_CHAT_ID:-}" ]; then
    journal "Telegram non configuré, message non envoyé : $1"
    return 0
  fi
  curl -fsS --max-time 15 -o /dev/null \
    "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=$1" \
    || journal "l'envoi du message Telegram a échoué"
  return 0
}

echec() {
  journal "ÉCHEC ($1) : $2"
  prevenir "⚠️ Portail feedback : la sauvegarde de la base a échoué ($2). Le détail est dans Coolify, ressource feedback, onglet Logs, conteneur quackback-sauvegarde."
}

variables_manquantes() {
  local manquantes="" paire lue coolify
  for paire in $VARIABLES; do
    lue="${paire%%:*}"
    coolify="${paire##*:}"
    if [ -z "${!lue:-}" ]; then
      manquantes="$manquantes $coolify"
    fi
  done
  printf '%s' "$manquantes"
}

taille() {
  wc -c < "$1" | awk '{ printf "%.1f Mo", $1 / 1048576 }'
}

# Le depot existe-t-il ? Sinon, on le cree. Si `cat config` echoue pour une
# autre raison (reseau, mauvais mot de passe), `init` refusera de toute facon
# d'ecraser un depot existant : restic ne reinitialise jamais.
preparer_depot() {
  local erreur
  if erreur="$(restic cat config 2>&1 >/dev/null)"; then
    # Retire les verrous laisses par une copie interrompue (un deploiement
    # pendant la sauvegarde). `unlock` ne touche qu'aux verrous perimes.
    restic unlock >/dev/null 2>&1 || true
    return 0
  fi
  journal "dépôt illisible ($erreur), tentative de création"
  restic init
}

sauvegarder() {
  local etiquette="$1" manquantes
  manquantes="$(variables_manquantes)"
  if [ -n "$manquantes" ]; then
    echec "$etiquette" "variables manquantes dans Coolify :$manquantes"
    return 2
  fi

  mkdir -p "$DOSSIER" && rm -f "$FICHIER"
  journal "copie de la base ($etiquette)"
  if ! pg_dump --format=custom --file="$FICHIER"; then
    echec "$etiquette" "la copie de la base (pg_dump)"
    return 1
  fi
  # Une copie illisible ne vaut rien, et on ne l'apprendrait que le jour ou
  # l'on en a besoin : on la relit AVANT de l'envoyer.
  if ! pg_restore --list "$FICHIER" >/dev/null; then
    echec "$etiquette" "la relecture de la copie (pg_restore)"
    return 1
  fi
  if ! preparer_depot; then
    echec "$etiquette" "l'accès au dépôt Scaleway (restic)"
    return 1
  fi
  local poids
  poids="$(taille "$FICHIER")"
  if ! restic backup --host "$HOTE" --tag "$etiquette" "$FICHIER"; then
    echec "$etiquette" "l'envoi de la copie (restic backup)"
    return 1
  fi
  rm -f "$FICHIER"
  journal "copie envoyée ($etiquette, $poids)"
  return 0
}

# La retention, calquee sur celle de Diafane (30 jours, puis 12 mois). Elle ne
# touche QUE les copies de la nuit.
nettoyer() {
  if ! restic forget --host "$HOTE" --tag nuit --keep-daily 30 --keep-monthly 12 --prune; then
    echec "nuit" "le tri des anciennes copies (restic forget), la copie de la nuit est pourtant envoyée"
    return 1
  fi
  return 0
}

compter() {
  # Compte les lignes d'une table si elle existe (la 0.14 renomme `votes` en
  # `post_votes` et `comments` en `post_comments`). Rien si elle n'existe pas.
  local table="$1" existe
  existe="$(psql -d "$BASE_ESSAI" -Atc "SELECT to_regclass('public.\"$table\"') IS NOT NULL")" || return 1
  if [ "$existe" = "t" ]; then
    psql -d "$BASE_ESSAI" -Atc "SELECT count(*) FROM public.\"$table\""
  fi
}

premier_compte() {
  local table n
  for table in "$@"; do
    n="$(compter "$table")" || return 1
    if [ -n "$n" ]; then
      printf '%s' "$n"
      return 0
    fi
  done
  printf '?'
}

verifier() {
  local manquantes dossier statut
  manquantes="$(variables_manquantes)"
  if [ -n "$manquantes" ]; then
    echec "vérification" "variables manquantes dans Coolify :$manquantes"
    return 2
  fi
  dossier="$(mktemp -d)"
  verifier_dans "$dossier"
  statut=$?
  # Le menage se fait quoi qu'il arrive : ni copie restauree qui traine dans
  # le conteneur, ni base d'essai qui reste sur le serveur PostgreSQL.
  rm -rf "$dossier"
  dropdb --if-exists "$BASE_ESSAI" >/dev/null 2>&1 || true
  return "$statut"
}

verifier_dans() {
  local dossier="$1"
  journal "vérification de la dernière copie"
  if ! restic check; then
    echec "vérification" "l'état du dépôt (restic check)"
    return 1
  fi
  if ! restic restore latest --host "$HOTE" --target "$dossier"; then
    echec "vérification" "la restauration de la dernière copie (restic restore)"
    return 1
  fi
  local copie="$dossier$FICHIER"
  if [ ! -s "$copie" ] || ! pg_restore --list "$copie" > "$dossier/liste"; then
    echec "vérification" "la relecture de la copie restaurée (pg_restore)"
    return 1
  fi

  # pg_cron ne s'installe que dans la base que nomme `cron.database_name` :
  # la base d'essai ne peut pas le recevoir. On restaure donc tout le reste.
  grep -v -E 'pg_cron| cron ' "$dossier/liste" > "$dossier/liste-sans-cron"
  dropdb --if-exists "$BASE_ESSAI" >/dev/null 2>&1 || true
  if ! createdb "$BASE_ESSAI" \
    || ! pg_restore --dbname="$BASE_ESSAI" --use-list="$dossier/liste-sans-cron" \
      --no-owner --no-privileges --exit-on-error "$copie"; then
    echec "vérification" "la restauration dans une base d'essai (pg_restore)"
    return 1
  fi

  local idees votes commentaires conversations comptes
  idees="$(premier_compte posts)" \
    && votes="$(premier_compte post_votes votes)" \
    && commentaires="$(premier_compte post_comments comments)" \
    && conversations="$(premier_compte conversations)" \
    && comptes="$(premier_compte user)" \
    || { echec "vérification" "le comptage dans la base d'essai (psql)"; return 1; }

  local copies date_copie
  copies="$(restic snapshots --host "$HOTE" --json | grep -o '"short_id"' | wc -l | tr -d ' ')"
  date_copie="$(restic snapshots --host "$HOTE" --latest 1 --json | grep -o '"time":"[^"]*"' | head -1 | cut -d'"' -f4 | cut -c1-16 | tr 'T' ' ')"

  journal "vérification réussie : $idees idées, $votes votes, $commentaires commentaires, $conversations conversations, $comptes comptes ; $copies copies dans le dépôt"
  prevenir "✅ Portail feedback : sauvegarde vérifiée. La dernière copie (${date_copie} UTC) se restaure sans erreur : $idees idées, $votes votes, $commentaires commentaires, $conversations conversations, $comptes comptes. $copies copies dans le dépôt."
  return 0
}

# La copie d'avant chaque deploiement (service `sauvegarde-avant` du compose).
# Coolify arrete l'ancienne version du portail avant de demarrer la nouvelle :
# ce service tourne entre les deux, donc sur une base au repos, et AVANT que la
# nouvelle version ne joue ses migrations. C'est le pendant du
# `backup:create --tag=predeploy` de Diafane : une montee de version ne peut
# plus partir sans sa copie, personne n'a a y penser.
#
# Il rend TOUJOURS la main avec succes : l'application attend qu'il ait fini
# (`service_completed_successfully`), et une copie ratee ne doit jamais laisser
# le portail arrete. L'echec se dit sur Telegram, le portail demarre.
avant() {
  local max="${SAUVEGARDE_AVANT_MAX:-300}" statut
  journal "copie d'avant déploiement, au plus $max secondes"
  if command -v timeout >/dev/null 2>&1; then
    timeout "$max" bash "$0" copie-avant
    statut=$?
  else
    copie_avant
    statut=$?
  fi
  if [ "$statut" -eq 124 ]; then
    echec "avant-deploiement" "la copie a dépassé $max secondes, le portail a démarré sans elle"
  elif [ "$statut" -ne 0 ]; then
    journal "le portail démarre sans copie d'avant déploiement"
  fi
  exit 0
}

# Les copies d'avant deploiement : les dix dernieres sont gardees.
copie_avant() {
  sauvegarder avant-deploiement || return $?
  if ! restic forget --host "$HOTE" --tag avant-deploiement --keep-last 10 --prune; then
    echec "avant-deploiement" "le tri des anciennes copies (restic forget), la copie est pourtant envoyée"
  fi
  return 0
}

secondes_avant() {
  local heure="$1" h m maintenant cible jour attente
  case "$heure" in
    [0-1][0-9]:[0-5][0-9] | 2[0-3]:[0-5][0-9]) ;;
    *)
      journal "SAUVEGARDE_HEURE illisible ($heure), $HEURE_PAR_DEFAUT retenu" >&2
      heure="$HEURE_PAR_DEFAUT"
      ;;
  esac
  h=$((10#${heure%%:*}))
  m=$((10#${heure##*:}))
  maintenant="${SAUVEGARDE_HORLOGE:-$(date -u +%s)}"
  cible=$((h * 3600 + m * 60))
  jour=$((maintenant % 86400))
  attente=$(((cible - jour + 86400) % 86400))
  if [ "$attente" -eq 0 ]; then
    attente=86400
  fi
  printf '%s' "$attente"
}

boucle() {
  local heure="${SAUVEGARDE_HEURE:-$HEURE_PAR_DEFAUT}" manquantes attente
  # `sleep` tourne en arriere-plan pour que l'arret du conteneur (SIGTERM) soit
  # entendu tout de suite, et non au reveil.
  trap 'journal "arrêt demandé"; exit 0' TERM INT
  journal "service démarré : une sauvegarde chaque nuit à $heure UTC, vérifiée chaque lundi"
  manquantes="$(variables_manquantes)"
  if [ -n "$manquantes" ]; then
    journal "ATTENTION : rien ne sera sauvegardé tant que ces variables manquent dans Coolify :$manquantes"
  fi
  while true; do
    attente="$(secondes_avant "$heure")"
    journal "prochaine sauvegarde dans $((attente / 60)) minutes"
    sleep "$attente" &
    wait $!
    sauvegarder nuit && nettoyer
    if [ "$(date -u +%u)" = "1" ]; then
      verifier
    fi
  done
}

commande="${1:-boucle}"
if [ "$#" -gt 0 ]; then
  shift
fi
case "$commande" in
  boucle) boucle ;;
  maintenant) sauvegarder "${1:-manuel}" ;;
  nuit) sauvegarder nuit && nettoyer ;;
  verifier) verifier ;;
  avant) avant ;;
  copie-avant) copie_avant ;;
  lister) restic snapshots --host "$HOTE" ;;
  prochaine) secondes_avant "${1:-${SAUVEGARDE_HEURE:-$HEURE_PAR_DEFAUT}}" && echo ;;
  *)
    echo "usage : sauvegarder [boucle | maintenant [etiquette] | nuit | verifier | avant | lister | prochaine [HH:MM]]" >&2
    exit 64
    ;;
esac
