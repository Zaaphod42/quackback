import { Heading, Hr, Section, Text } from '@react-email/components'
import { EmailLayout, TransactionalFooter } from './email-layout'
import { typography, utils, colors } from './shared-styles'
import { t } from '../i18n'

interface NewSignInEmailProps {
  workspaceName?: string
  occurredAt: string
  ipAddress?: string | null
  userAgent?: string | null
  logoUrl?: string
  locale?: string
}

/**
 * "New device" sign-in notification — sent only on first-sight of a
 * (UA, /24 IP) combination for the recipient's account. The user is
 * already signed in by the time this lands; the alert is purely
 * informational with a recovery path if it wasn't them.
 */
export function NewSignInEmail({
  workspaceName,
  occurredAt,
  ipAddress,
  userAgent,
  logoUrl,
  locale,
}: NewSignInEmailProps) {
  return (
    <EmailLayout preview={t(locale, 'newSignIn.preview')} logoUrl={logoUrl}>
      <Heading style={typography.h1}>{t(locale, 'newSignIn.heading')}</Heading>
      <Text style={typography.text}>
        {workspaceName
          ? t(locale, 'newSignIn.bodyWorkspace', { workspace: workspaceName })
          : t(locale, 'newSignIn.body')}
      </Text>

      <Section style={utils.codeBox}>
        <Text style={typography.text}>
          <strong>{t(locale, 'newSignIn.when')}</strong> {occurredAt}
        </Text>
        {ipAddress ? (
          <Text style={typography.text}>
            <strong>{t(locale, 'newSignIn.ip')}</strong> {ipAddress}
          </Text>
        ) : null}
        {userAgent ? (
          <Text style={typography.text}>
            <strong>{t(locale, 'newSignIn.device')}</strong> {userAgent}
          </Text>
        ) : null}
      </Section>

      <Hr style={{ margin: '24px 0', borderColor: colors.border }} />

      <Text style={typography.text}>{t(locale, 'newSignIn.action')}</Text>

      <TransactionalFooter>{t(locale, 'newSignIn.footer')}</TransactionalFooter>
    </EmailLayout>
  )
}
