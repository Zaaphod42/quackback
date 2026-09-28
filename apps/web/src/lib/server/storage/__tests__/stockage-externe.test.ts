/**
 * Le stockage des fichiers du portail est un service S3 EXTERIEUR (Scaleway
 * depuis le 2026-09-28), et plus un MinIO lance a cote de l'application :
 * MinIO n'est plus distribue, son image n'existait plus que dans le cache du
 * VPS. Ces tests tiennent les deux moities de ce choix.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'

const mockConfig = {
  baseUrl: 'https://feedback.example.com',
  s3Endpoint: 'https://s3.fr-par.scw.cloud',
  s3Bucket: 'stockage-exemple',
  s3Region: 'fr-par',
  s3AccessKeyId: 'CLE-EXEMPLE',
  s3SecretAccessKey: 'secret-exemple',
  s3ForcePathStyle: true,
  s3PublicUrl: undefined as string | undefined,
  s3Proxy: true,
}
vi.mock('@/lib/server/config', () => ({ config: mockConfig }))

// Ce que recoit le constructeur du vrai client, capture a chaque creation.
const clientsCrees: unknown[] = []
const envoyes: unknown[] = []
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    constructor(options: unknown) {
      clientsCrees.push(options)
    }
    async send(commande: unknown) {
      envoyes.push(commande)
      return {}
    }
    destroy() {}
  },
  PutObjectCommand: class {
    constructor(public input: unknown) {}
  },
  GetObjectCommand: class {
    constructor(public input: unknown) {}
  },
  DeleteObjectCommand: class {
    constructor(public input: unknown) {}
  },
}))

const { optionsClientS3, getS3Config, deleteObject } = await import('@/lib/server/storage/s3')

describe('le client S3', () => {
  // Depuis la 3.729 du SDK, chaque envoi porte une somme CRC32 que plusieurs
  // stockages compatibles S3 refusent : on ne l'envoie que si l'operation
  // l'exige.
  it('ne demande les sommes de contrôle que lorsqu’elles sont obligatoires', () => {
    const options = optionsClientS3(getS3Config())
    expect(options.requestChecksumCalculation).toBe('WHEN_REQUIRED')
    expect(options.responseChecksumValidation).toBe('WHEN_REQUIRED')
  })

  it('reprend le point d’accès, la région et les clés de la configuration', () => {
    expect(optionsClientS3(getS3Config())).toMatchObject({
      endpoint: 'https://s3.fr-par.scw.cloud',
      region: 'fr-par',
      forcePathStyle: true,
      credentials: { accessKeyId: 'CLE-EXEMPLE', secretAccessKey: 'secret-exemple' },
    })
  })

  it('est vraiment construit avec ces options', async () => {
    await deleteObject('logos/exemple.png')
    expect(clientsCrees).toHaveLength(1)
    expect(clientsCrees[0]).toMatchObject({
      requestChecksumCalculation: 'WHEN_REQUIRED',
      responseChecksumValidation: 'WHEN_REQUIRED',
    })
    expect(envoyes).toHaveLength(1)
  })
})

// ⚠️ Ce qui suit protege contre une MONTEE DE VERSION de Quackback : le fichier
// de deploiement de l'amont lance MinIO, et un conflit resolu en prenant sa
// version remettrait une image que plus aucun registre ne sert.
describe('le fichier de déploiement', () => {
  const compose = readFileSync(
    fileURLToPath(new URL('../../../../../../../docker-compose.prod.yml', import.meta.url)),
    'utf8'
  )
  const app = compose.slice(compose.indexOf('\n  app:\n'), compose.indexOf('\n  postgres:\n'))

  it('ne lance plus MinIO', () => {
    expect(compose).not.toMatch(/^ {2}minio:/m)
    expect(compose).not.toMatch(/^ {2}minio-init:/m)
    expect(compose).not.toMatch(/image:\s*quay\.io\/minio/)
  })

  it('laisse les variables de Coolify régler tout le stockage', () => {
    expect(app).toContain('env_file: .env')
    for (const cle of ['S3_ENDPOINT', 'S3_BUCKET', 'S3_ACCESS_KEY_ID', 'S3_SECRET_ACCESS_KEY']) {
      expect(app).not.toMatch(new RegExp(`^\\s+${cle}:`, 'm'))
    }
  })

  it('sert toujours les fichiers par le proxy de l’application', () => {
    expect(app).toMatch(/^\s+S3_PROXY: 'true'/m)
  })
})
