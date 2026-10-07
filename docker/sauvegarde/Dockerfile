# ============================================================================
# DIAFANE : l'image du service qui sauvegarde la base du portail
# ============================================================================
# Elle part de la MEME image que la base (docker/postgres/Dockerfile) : son
# pg_dump est donc toujours de la version du serveur PostgreSQL, et cette
# couche est deja dans le cache du VPS. Elle n'y ajoute que restic (le chiffrement,
# la deduplication et l'envoi chez Scaleway, comme les sauvegardes de Diafane)
# et curl (le message Telegram quand une sauvegarde echoue).
# Le detail du fonctionnement est en tete de sauvegarder.sh.
FROM postgres:18

RUN apt-get update \
    && apt-get install -y --no-install-recommends restic curl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY sauvegarder.sh /usr/local/bin/sauvegarder
RUN chmod 0755 /usr/local/bin/sauvegarder

ENTRYPOINT ["/usr/local/bin/sauvegarder"]
CMD ["boucle"]
