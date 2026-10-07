/**
 * DIAFANE : le service qui sauvegarde la base du portail
 * (docker/sauvegarde/sauvegarder.sh, service `sauvegarde` du compose).
 *
 * Le script tourne ici pour de vrai, sous bash, mais ses outils (pg_dump,
 * pg_restore, restic, psql, createdb, dropdb, curl) sont remplaces par de faux
 * programmes qui notent ce qu'on leur demande. On verifie donc l'ENCHAINEMENT
 * et ce qui se passe quand une etape echoue, pas PostgreSQL ni Scaleway : la
 * premiere vraie copie, puis `sauvegarder verifier`, se font sur le serveur.
 */
import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const SCRIPT = fileURLToPath(new URL('../sauvegarder.sh', import.meta.url))
const COMPOSE = fileURLToPath(new URL('../../../docker-compose.prod.yml', import.meta.url))

const FAUX_PROGRAMMES: Record<string, string> = {
  pg_dump: `
[ -n "\${ECHEC_PG_DUMP:-}" ] && exit 1
for a in "$@"; do case "$a" in --file=*) printf 'PGDMP' > "\${a#--file=}" ;; esac; done
exit 0`,
  pg_restore: `
for a in "$@"; do case "$a" in --use-list=*) cp "\${a#--use-list=}" "$TRACES/liste-utilisee" ;; esac; done
case " $* " in
  *" --list "*)
    [ -n "\${ECHEC_PG_RESTORE_LISTE:-}" ] && exit 1
    printf '%s\\n' '; Archive created at 2026-10-07' \\
      '5; 2615 16385 SCHEMA - cron quackback' \\
      '6; 3079 16386 EXTENSION - pg_cron' \\
      '7; 0 0 COMMENT - EXTENSION pg_cron' \\
      '8; 3079 16400 EXTENSION - vector' \\
      '220; 1259 16500 TABLE public posts quackback' \\
      '3400; 0 16500 TABLE DATA public posts quackback' \\
      '3401; 0 16600 TABLE DATA cron job quackback'
    exit 0 ;;
esac
[ -n "\${ECHEC_PG_RESTORE_BASE:-}" ] && exit 1
exit 0`,
  restic: `
case "$1" in
  cat)
    if [ -n "\${DEPOT_ABSENT:-}" ] && [ ! -f "$TRACES/depot-cree" ]; then
      echo "Fatal: repository does not exist" >&2; exit 1
    fi
    exit 0 ;;
  init) touch "$TRACES/depot-cree"; exit 0 ;;
  backup) [ -n "\${ECHEC_RESTIC_BACKUP:-}" ] && exit 1; exit 0 ;;
  check) [ -n "\${ECHEC_RESTIC_CHECK:-}" ] && exit 1; exit 0 ;;
  restore)
    [ -n "\${ECHEC_RESTIC_RESTORE:-}" ] && exit 1
    cible=""; prochain=""
    for a in "$@"; do
      if [ -n "$prochain" ]; then cible="$a"; prochain=""; fi
      [ "$a" = "--target" ] && prochain=1
    done
    mkdir -p "$cible$SAUVEGARDE_DOSSIER" && printf 'PGDMP' > "$cible$SAUVEGARDE_DOSSIER/quackback.dump"
    exit 0 ;;
  snapshots)
    case " $* " in
      *" --latest 1 "*) echo '[{"time":"2026-10-12T02:30:04.5+00:00","short_id":"c3"}]' ;;
      *" --json "*) echo '[{"short_id":"a1"},{"short_id":"b2"},{"short_id":"c3"}]' ;;
    esac
    exit 0 ;;
esac
exit 0`,
  psql: `
[ -n "\${ECHEC_PSQL:-}" ] && exit 1
case "$*" in
  *to_regclass*)
    # Une base de la 0.14 : \`votes\` et \`comments\` y sont renommees.
    case "$*" in *'"votes"'* | *'"comments"'*) echo f ;; *) echo t ;; esac ;;
  *'count(*)'*)
    case "$*" in
      *'"post_votes"'*) echo 52 ;;
      *'"post_comments"'*) echo 9 ;;
      *'"posts"'*) echo 14 ;;
      *'"conversations"'*) echo 6 ;;
      *'"user"'*) echo 20 ;;
    esac ;;
esac
exit 0`,
  createdb: `[ -n "\${ECHEC_CREATEDB:-}" ] && exit 1; exit 0`,
  dropdb: `exit 0`,
  curl: `printf '%s\\n' "$*" >> "$TRACES/telegram"; exit 0`,
  // Le vrai \`timeout\` de Debian lance la commande et rend 124 au-delà du délai.
  timeout: `
[ -n "\${DELAI_DEPASSE:-}" ] && exit 124
shift
exec "$@"`,
}

let dossier: string

function preparer() {
  dossier = mkdtempSync(join(tmpdir(), 'sauvegarde-'))
  const bin = join(dossier, 'bin')
  spawnSync('mkdir', ['-p', bin, join(dossier, 'traces')])
  for (const [nom, corps] of Object.entries(FAUX_PROGRAMMES)) {
    const chemin = join(bin, nom)
    // Chaque faux programme note son appel avant de faire quoi que ce soit.
    writeFileSync(chemin, `#!/bin/bash\necho "${nom} $*" >> "$APPELS"\n${corps}\n`)
    chmodSync(chemin, 0o755)
  }
}

function lancer(args: string[], env: Record<string, string | undefined> = {}) {
  const base: Record<string, string> = {
    PATH: `${join(dossier, 'bin')}:/usr/bin:/bin`,
    APPELS: join(dossier, 'traces', 'appels'),
    TRACES: join(dossier, 'traces'),
    SAUVEGARDE_DOSSIER: join(dossier, 'sauvegarde'),
    RESTIC_REPOSITORY: 's3:s3.fr-par.scw.cloud/essai/base',
    RESTIC_PASSWORD: 'mot-de-passe-essai',
    AWS_ACCESS_KEY_ID: 'cle',
    AWS_SECRET_ACCESS_KEY: 'secret',
    PGPASSWORD: 'pg',
    TELEGRAM_BOT_TOKEN: 'jeton',
    TELEGRAM_CHAT_ID: '42',
  }
  const fusion: Record<string, string> = { ...base }
  for (const [cle, valeur] of Object.entries(env)) {
    if (valeur === undefined) delete fusion[cle]
    else fusion[cle] = valeur
  }
  const r = spawnSync('/bin/bash', [SCRIPT, ...args], { env: fusion, encoding: 'utf8' })
  return { statut: r.status, sortie: `${r.stdout}${r.stderr}`, resultat: r.stdout.trim() }
}

function appels(): string[] {
  const f = join(dossier, 'traces', 'appels')
  return existsSync(f) ? readFileSync(f, 'utf8').trim().split('\n') : []
}

function telegram(): string {
  const f = join(dossier, 'traces', 'telegram')
  return existsSync(f) ? readFileSync(f, 'utf8') : ''
}

describe('sauvegarder maintenant', () => {
  beforeEach(preparer)
  afterEach(() => rmSync(dossier, { recursive: true, force: true }))

  it('copie la base, relit la copie, puis l’envoie sous son étiquette et le nom fixe « feedback »', () => {
    const r = lancer(['maintenant', 'avant-0.14'])
    expect(r.statut).toBe(0)
    const fichier = join(dossier, 'sauvegarde', 'quackback.dump')
    expect(appels()).toEqual([
      `pg_dump --format=custom --file=${fichier}`,
      `pg_restore --list ${fichier}`,
      'restic cat config',
      'restic unlock',
      `restic backup --host feedback --tag avant-0.14 ${fichier}`,
    ])
    // La copie en clair ne reste pas dans le conteneur une fois envoyée.
    expect(existsSync(fichier)).toBe(false)
    expect(telegram()).toBe('')
  })

  it('prend l’étiquette « manuel » par défaut, que la rétention ne touche pas', () => {
    lancer(['maintenant'])
    expect(appels().some((a) => a.includes('--tag manuel'))).toBe(true)
  })

  it('crée le dépôt la première fois', () => {
    const r = lancer(['maintenant'], { DEPOT_ABSENT: '1' })
    expect(r.statut).toBe(0)
    expect(appels()).toContain('restic init')
    expect(appels().some((a) => a.startsWith('restic backup'))).toBe(true)
  })

  it('n’essaie rien et nomme les variables Coolify qui manquent', () => {
    const r = lancer(['maintenant'], { RESTIC_PASSWORD: undefined, AWS_SECRET_ACCESS_KEY: '' })
    expect(r.statut).toBe(2)
    expect(r.sortie).toContain('SAUVEGARDE_MOT_DE_PASSE')
    expect(r.sortie).toContain('SAUVEGARDE_CLE_SECRETE')
    expect(appels().filter((a) => !a.startsWith('curl'))).toEqual([])
    expect(telegram()).toContain('variables manquantes')
  })

  it('prévient sur Telegram et n’envoie rien quand pg_dump échoue', () => {
    const r = lancer(['maintenant'], { ECHEC_PG_DUMP: '1' })
    expect(r.statut).toBe(1)
    expect(appels().some((a) => a.startsWith('restic'))).toBe(false)
    expect(telegram()).toContain('pg_dump')
    expect(telegram()).toContain('chat_id=42')
  })

  it('n’envoie pas une copie illisible', () => {
    const r = lancer(['maintenant'], { ECHEC_PG_RESTORE_LISTE: '1' })
    expect(r.statut).toBe(1)
    expect(appels().some((a) => a.startsWith('restic backup'))).toBe(false)
    expect(telegram()).toContain('relecture')
  })

  it('dit l’échec de l’envoi', () => {
    const r = lancer(['maintenant'], { ECHEC_RESTIC_BACKUP: '1' })
    expect(r.statut).toBe(1)
    expect(telegram()).toContain('restic backup')
  })

  it('sans Telegram, échoue quand même proprement et le dit dans le journal', () => {
    const r = lancer(['maintenant'], { ECHEC_PG_DUMP: '1', TELEGRAM_BOT_TOKEN: undefined })
    expect(r.statut).toBe(1)
    expect(r.sortie).toContain('Telegram non configuré')
    expect(appels().some((a) => a.startsWith('curl'))).toBe(false)
  })
})

describe('sauvegarder nuit', () => {
  beforeEach(preparer)
  afterEach(() => rmSync(dossier, { recursive: true, force: true }))

  it('trie ensuite les copies de la nuit, et elles seules', () => {
    const r = lancer(['nuit'])
    expect(r.statut).toBe(0)
    expect(appels().at(-1)).toBe(
      'restic forget --host feedback --tag nuit --keep-daily 30 --keep-monthly 12 --prune'
    )
  })

  it('ne trie rien si la copie de la nuit a échoué', () => {
    lancer(['nuit'], { ECHEC_RESTIC_BACKUP: '1' })
    expect(appels().some((a) => a.startsWith('restic forget'))).toBe(false)
  })
})

describe('sauvegarder verifier', () => {
  beforeEach(preparer)
  afterEach(() => rmSync(dossier, { recursive: true, force: true }))

  it('restaure la dernière copie dans une base d’essai, sans pg_cron, compte, prévient, puis fait le ménage', () => {
    const r = lancer(['verifier'])
    expect(r.statut).toBe(0)
    const a = appels()
    expect(a).toContain('restic check')
    expect(a.some((x) => /^restic restore latest --host feedback --target /.test(x))).toBe(true)
    expect(a).toContain('createdb quackback_verification')
    expect(
      a.some((x) => x.startsWith('pg_restore --dbname=quackback_verification --use-list='))
    ).toBe(true)
    // pg_cron ne s'installe que dans la base principale : la liste restaurée
    // l'écarte, et garde tout le reste.
    const liste = readFileSync(join(dossier, 'traces', 'liste-utilisee'), 'utf8')
    expect(liste).not.toMatch(/pg_cron| cron /)
    expect(liste).toContain('TABLE DATA public posts')
    expect(liste).toContain('EXTENSION - vector')
    // Le ménage, en dernier.
    expect(a.at(-1)).toBe('dropdb --if-exists quackback_verification')
    // Les noms de la 0.14 (post_votes, post_comments) sont trouvés.
    const message = telegram()
    expect(message).toContain('14 idées, 52 votes, 9 commentaires, 6 conversations, 20 comptes')
    expect(message).toContain('2026-10-12 02:30 UTC')
    expect(message).toContain('3 copies')
  })

  it('fait le ménage aussi quand la restauration échoue, et le dit', () => {
    const r = lancer(['verifier'], { ECHEC_PG_RESTORE_BASE: '1' })
    expect(r.statut).toBe(1)
    expect(appels().at(-1)).toBe('dropdb --if-exists quackback_verification')
    expect(telegram()).toContain("base d'essai")
  })

  it('s’arrête si le dépôt est abîmé', () => {
    const r = lancer(['verifier'], { ECHEC_RESTIC_CHECK: '1' })
    expect(r.statut).toBe(1)
    expect(appels().some((x) => x.startsWith('restic restore'))).toBe(false)
    expect(telegram()).toContain('restic check')
  })
})

describe('sauvegarder avant (la copie d’avant chaque déploiement)', () => {
  beforeEach(preparer)
  afterEach(() => rmSync(dossier, { recursive: true, force: true }))

  it('copie la base dans le délai, puis garde les dix dernières copies d’avant déploiement', () => {
    const r = lancer(['avant'])
    expect(r.statut).toBe(0)
    const a = appels()
    expect(a[0]).toMatch(/^timeout 300 bash .*sauvegarder\.sh copie-avant$/)
    expect(a.some((x) => x.includes('restic backup --host feedback --tag avant-deploiement'))).toBe(
      true
    )
    expect(a.at(-1)).toBe(
      'restic forget --host feedback --tag avant-deploiement --keep-last 10 --prune'
    )
    expect(telegram()).toBe('')
  })

  it('rend la main avec succès même quand la copie échoue, pour ne jamais bloquer le portail', () => {
    const r = lancer(['avant'], { ECHEC_PG_DUMP: '1' })
    expect(r.statut).toBe(0)
    expect(r.sortie).toContain('le portail démarre sans copie')
    expect(telegram()).toContain('pg_dump')
  })

  it('rend la main avec succès même sans aucune variable', () => {
    const r = lancer(['avant'], {
      RESTIC_PASSWORD: undefined,
      AWS_ACCESS_KEY_ID: undefined,
      AWS_SECRET_ACCESS_KEY: undefined,
    })
    expect(r.statut).toBe(0)
  })

  it('ne fait pas attendre le portail au-delà du délai, et le dit', () => {
    const r = lancer(['avant'], { DELAI_DEPASSE: '1', SAUVEGARDE_AVANT_MAX: '120' })
    expect(r.statut).toBe(0)
    expect(appels()[0]).toMatch(/^timeout 120 /)
    expect(telegram()).toContain('120 secondes')
  })
})

describe('l’heure de la sauvegarde', () => {
  beforeEach(preparer)
  afterEach(() => rmSync(dossier, { recursive: true, force: true }))

  const MINUIT = 86400 * 20000

  it('attend jusqu’à l’heure dite, le jour même ou le lendemain', () => {
    expect(
      lancer(['prochaine', '02:30'], { SAUVEGARDE_HORLOGE: `${MINUIT + 3600}` }).resultat
    ).toBe('5400')
    expect(
      lancer(['prochaine', '02:30'], { SAUVEGARDE_HORLOGE: `${MINUIT + 9000}` }).resultat
    ).toBe('86400')
    expect(
      lancer(['prochaine', '02:30'], { SAUVEGARDE_HORLOGE: `${MINUIT + 9060}` }).resultat
    ).toBe('86340')
  })

  it('retombe sur 02:30 quand l’heure posée est illisible, et le dit', () => {
    const r = lancer(['prochaine', '25:99'], { SAUVEGARDE_HORLOGE: `${MINUIT}` })
    expect(r.sortie).toContain('illisible')
    expect(r.resultat).toBe('9000')
  })

  it('refuse une commande inconnue', () => {
    expect(lancer(['effacer']).statut).toBe(64)
  })
})

describe('le service dans docker-compose.prod.yml', () => {
  const compose = readFileSync(COMPOSE, 'utf8')
  const service = compose.slice(
    compose.indexOf('\n  sauvegarde:\n'),
    compose.indexOf('\n  sauvegarde-avant:\n')
  )
  const avant = compose.slice(
    compose.indexOf('\n  sauvegarde-avant:\n'),
    compose.indexOf('\nvolumes:\n')
  )
  const variables = (bloc: string) =>
    bloc
      .slice(bloc.indexOf('    environment:\n'), bloc.indexOf('    depends_on:\n'))
      .split('\n')
      .filter((l) => /^ {6}[A-Z_]+:/.test(l) && !/SAUVEGARDE_(HEURE|AVANT_MAX)/.test(l))
  const app = compose.slice(compose.indexOf('\n  app:\n'), compose.indexOf('\n  postgres:\n'))

  it('existe en deux services, construits depuis ce dépôt', () => {
    for (const bloc of [service, avant]) {
      expect(bloc).toContain('context: ./docker/sauvegarde')
      expect(bloc).not.toMatch(/^\s+image:/m)
    }
  })

  it('n’a aucune variable obligatoire : une variable manquante ne doit jamais arrêter le portail', () => {
    expect(service).not.toContain(':?')
    expect(avant).not.toContain(':?')
  })

  it('donne les mêmes variables aux deux services', () => {
    expect(variables(service).length).toBeGreaterThan(8)
    expect(variables(avant)).toEqual(variables(service))
  })

  it('lance la copie d’avant déploiement une seule fois, sans la relancer', () => {
    expect(avant).toContain("restart: 'no'")
    expect(avant).toContain("command: ['avant']")
  })

  it('ne reçoit que ses variables, sous des noms SAUVEGARDE_* côté Coolify', () => {
    expect(service).not.toContain('env_file')
    expect(service).toContain('RESTIC_PASSWORD: ${SAUVEGARDE_MOT_DE_PASSE:-}')
    expect(service).toContain('AWS_ACCESS_KEY_ID: ${SAUVEGARDE_CLE_ID:-}')
    expect(service).toContain('AWS_SECRET_ACCESS_KEY: ${SAUVEGARDE_CLE_SECRETE:-}')
  })

  it('l’application attend la copie d’avant déploiement, et ne dépend pas de la sauvegarde de la nuit', () => {
    expect(app).toMatch(/ sauvegarde-avant:\n\s+condition: service_completed_successfully/)
    expect(app).not.toMatch(/^ {6}sauvegarde:/m)
  })
})
