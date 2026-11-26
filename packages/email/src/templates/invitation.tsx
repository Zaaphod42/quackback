import { Button, Heading, Link, Section, Text } from '@react-email/components'
import { EmailLayout, TransactionalFooter } from './email-layout'
import { typography, button, utils } from './shared-styles'
import { t, rich } from '../i18n'

interface InvitationEmailProps {
  invitedByName: string
  inviteeName?: string
  organizationName: string
  inviteLink: string
  logoUrl?: string
  locale?: string
}

export function InvitationEmail({
  invitedByName,
  inviteeName,
  organizationName,
  inviteLink,
  logoUrl,
  locale,
}: InvitationEmailProps) {
  return (
    <EmailLayout
      preview={t(locale, 'invitation.preview', { workspace: organizationName })}
      logoUrl={logoUrl}
      logoAlt={organizationName}
    >
      {/* Content */}
      <Heading style={typography.h1}>
        {inviteeName
          ? t(locale, 'invitation.headingNamed', { name: inviteeName })
          : t(locale, 'invitation.heading')}
      </Heading>
      <Text style={typography.text}>
        {rich(
          t(locale, 'invitation.body', { invitedBy: invitedByName, workspace: organizationName })
        )}
      </Text>

      {/* CTA Button */}
      <Section style={{ textAlign: 'center', marginTop: '32px', marginBottom: '32px' }}>
        <Button style={button.primary} href={inviteLink}>
          {t(locale, 'invitation.button')}
        </Button>
      </Section>

      {/* Fallback Link */}
      <Text style={typography.textSmall}>
        {t(locale, 'link.copyPaste')}{' '}
        <Link href={inviteLink} style={utils.link}>
          {inviteLink}
        </Link>
      </Text>

      {/* Footer */}
      <TransactionalFooter>{t(locale, 'invitation.ignore')}</TransactionalFooter>
    </EmailLayout>
  )
}
