import { Button, Heading, Hr, Section, Text } from '@react-email/components'
import { EmailLayout, TransactionalFooter } from './email-layout'
import { typography, button, utils, colors } from './shared-styles'
import { t } from '../i18n'

interface MagicLinkEmailProps {
  signInUrl: string
  code: string
  logoUrl?: string
  locale?: string
}

/**
 * Sign-in email containing both a one-click magic link and a 6-digit code.
 *
 * The link is the lower-friction path on desktop; the code is the
 * cross-device fallback (start on desktop, open email on phone — type
 * the code on the device that started the flow). Either consumes the
 * verification record on the server, so the user can pick whichever is
 * convenient.
 */
export function MagicLinkEmail({ signInUrl, code, logoUrl, locale }: MagicLinkEmailProps) {
  return (
    <EmailLayout preview={t(locale, 'magicLink.preview')} logoUrl={logoUrl}>
      <Heading style={{ ...typography.h1, textAlign: 'center' }}>
        {t(locale, 'magicLink.heading')}
      </Heading>
      <Text style={{ ...typography.text, textAlign: 'center' }}>
        {t(locale, 'magicLink.intro')}
      </Text>

      <Section style={{ textAlign: 'center', marginTop: '32px', marginBottom: '32px' }}>
        <Button style={button.primary} href={signInUrl}>
          {t(locale, 'magicLink.button')}
        </Button>
      </Section>

      <Hr style={{ margin: '32px 0', borderColor: colors.border }} />

      <Text style={{ ...typography.text, textAlign: 'center' }}>
        {t(locale, 'magicLink.orCode')}
      </Text>

      <Section style={utils.codeBox}>
        <Text style={utils.code}>{code}</Text>
      </Section>

      <Text style={{ ...typography.textSmall, textAlign: 'center' }}>
        {t(locale, 'magicLink.expires')}
      </Text>

      <TransactionalFooter>{t(locale, 'magicLink.ignore')}</TransactionalFooter>
    </EmailLayout>
  )
}
