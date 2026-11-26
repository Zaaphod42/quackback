import { Button, Heading, Link, Section, Text } from '@react-email/components'
import { EmailLayout, TransactionalFooter } from './email-layout'
import { typography, button, utils, colors } from './shared-styles'
import { t, rich } from '../i18n'

interface PortalInviteEmailProps {
  workspaceName: string
  inviteLink: string
  logoUrl?: string
  personalMessage?: string
  locale?: string
}

export function PortalInviteEmail({
  workspaceName,
  inviteLink,
  logoUrl,
  personalMessage,
  locale,
}: PortalInviteEmailProps) {
  return (
    <EmailLayout
      preview={t(locale, 'portalInvite.preview', { workspace: workspaceName })}
      logoUrl={logoUrl}
      logoAlt={workspaceName}
    >
      {/* Content */}
      <Heading style={typography.h1}>{t(locale, 'portalInvite.heading')}</Heading>
      <Text style={typography.text}>
        {rich(t(locale, 'portalInvite.body', { workspace: workspaceName }))}
      </Text>

      {personalMessage && (
        <Section
          style={{
            backgroundColor: colors.surfaceMuted,
            borderLeft: `3px solid ${colors.border}`,
            padding: '12px 16px',
            marginTop: '24px',
            marginBottom: '8px',
            borderRadius: '4px',
          }}
        >
          <Text style={{ ...typography.textSmall, margin: 0, fontStyle: 'italic' }}>
            {personalMessage}
          </Text>
        </Section>
      )}

      {/* CTA Button */}
      <Section style={{ textAlign: 'center', marginTop: '32px', marginBottom: '32px' }}>
        <Button style={button.primary} href={inviteLink}>
          {t(locale, 'portalInvite.button')}
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
      <TransactionalFooter>{t(locale, 'portalInvite.ignore')}</TransactionalFooter>
    </EmailLayout>
  )
}
