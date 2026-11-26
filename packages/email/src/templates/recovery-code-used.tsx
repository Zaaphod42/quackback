import { Heading, Section, Text } from '@react-email/components'
import { EmailLayout, TransactionalFooter } from './email-layout'
import { typography } from './shared-styles'
import { t } from '../i18n'

interface RecoveryCodeUsedEmailProps {
  workspaceName?: string
  ipAddress?: string | null
  userAgent?: string | null
  occurredAt: string
  logoUrl?: string
  locale?: string
}

/**
 * Security alert sent after a recovery code is consumed. Mirrors the
 * "new sign-in from unrecognised device" pattern most platforms send
 * — the recipient is the one whose code was used, so the email is
 * their canary against unauthorised access.
 */
export function RecoveryCodeUsedEmail({
  workspaceName,
  ipAddress,
  userAgent,
  occurredAt,
  logoUrl,
  locale,
}: RecoveryCodeUsedEmailProps) {
  return (
    <EmailLayout
      preview={
        workspaceName
          ? t(locale, 'recovery.previewWorkspace', { workspace: workspaceName })
          : t(locale, 'recovery.preview')
      }
      logoUrl={logoUrl}
    >
      <Heading style={{ ...typography.h1, textAlign: 'center' }}>
        {t(locale, 'recovery.heading')}
      </Heading>
      <Text style={{ ...typography.text, textAlign: 'center' }}>
        {workspaceName
          ? t(locale, 'recovery.bodyWorkspace', { workspace: workspaceName })
          : t(locale, 'recovery.body')}
      </Text>

      <Section style={{ marginTop: '24px', marginBottom: '24px' }}>
        <Text style={typography.textSmall}>
          <strong>{t(locale, 'recovery.when')}</strong> {occurredAt}
        </Text>
        {ipAddress ? (
          <Text style={typography.textSmall}>
            <strong>{t(locale, 'recovery.ip')}</strong> {ipAddress}
          </Text>
        ) : null}
        {userAgent ? (
          <Text style={typography.textSmall}>
            <strong>{t(locale, 'recovery.device')}</strong> {userAgent}
          </Text>
        ) : null}
      </Section>

      <Text style={typography.text}>{t(locale, 'recovery.ifYou')}</Text>
      <Text style={typography.text}>{t(locale, 'recovery.ifNot')}</Text>

      <TransactionalFooter>{t(locale, 'recovery.footer')}</TransactionalFooter>
    </EmailLayout>
  )
}
