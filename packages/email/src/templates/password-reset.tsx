import { Button, Heading, Link, Section, Text } from '@react-email/components'
import { EmailLayout, TransactionalFooter } from './email-layout'
import { typography, button, utils } from './shared-styles'
import { t } from '../i18n'

interface PasswordResetEmailProps {
  resetLink: string
  logoUrl?: string
  locale?: string
}

export function PasswordResetEmail({ resetLink, logoUrl, locale }: PasswordResetEmailProps) {
  return (
    <EmailLayout preview={t(locale, 'passwordReset.preview')} logoUrl={logoUrl}>
      {/* Content */}
      <Heading style={{ ...typography.h1, textAlign: 'center' }}>
        {t(locale, 'passwordReset.heading')}
      </Heading>
      <Text style={{ ...typography.text, textAlign: 'center' }}>
        {t(locale, 'passwordReset.body')}
      </Text>

      {/* CTA Button */}
      <Section style={{ textAlign: 'center', marginTop: '32px', marginBottom: '32px' }}>
        <Button style={button.primary} href={resetLink}>
          {t(locale, 'passwordReset.button')}
        </Button>
      </Section>

      {/* Fallback Link */}
      <Text style={typography.textSmall}>
        {t(locale, 'link.copyPaste')}{' '}
        <Link href={resetLink} style={utils.link}>
          {resetLink}
        </Link>
      </Text>

      {/* Footer */}
      <TransactionalFooter>{t(locale, 'passwordReset.ignore')}</TransactionalFooter>
    </EmailLayout>
  )
}
