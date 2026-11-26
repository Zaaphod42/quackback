import { Button, Heading, Section, Text } from '@react-email/components'
import { EmailLayout, NotificationFooter } from './email-layout'
import { typography, button, colors } from './shared-styles'
import { t, statusLabel } from '../i18n'

interface StatusChangeEmailProps {
  postTitle: string
  postUrl: string
  previousStatus: string
  newStatus: string
  organizationName: string
  unsubscribeUrl: string
  logoUrl?: string
  locale?: string
}

function getStatusEmoji(status: string): string {
  const map: Record<string, string> = {
    open: '\u{1F4E5}',
    under_review: '\u{1F440}',
    planned: '\u{1F4C5}',
    in_progress: '\u{1F6A7}',
    complete: '\u2705',
    closed: '\u{1F512}',
  }
  return map[status.toLowerCase().replace(/\s+/g, '_')] || '\u{1F4CC}'
}

export function StatusChangeEmail({
  postTitle,
  postUrl,
  previousStatus,
  newStatus,
  organizationName,
  unsubscribeUrl,
  logoUrl,
  locale,
}: StatusChangeEmailProps) {
  const emoji = getStatusEmoji(newStatus)
  const formattedNewStatus = statusLabel(locale, newStatus)
  const formattedPreviousStatus = statusLabel(locale, previousStatus)

  return (
    <EmailLayout
      preview={`${emoji} ${t(locale, 'statusChange.preview', { status: formattedNewStatus })}`}
      logoUrl={logoUrl}
      logoAlt={organizationName}
    >
      {/* Content */}
      <Heading style={typography.h1}>
        {emoji} {t(locale, 'statusChange.heading', { status: formattedNewStatus })}
      </Heading>
      <Text style={typography.text}>
        {t(locale, 'statusChange.body', { workspace: organizationName })}
      </Text>

      {/* Post Title */}
      <Section
        style={{
          backgroundColor: colors.surfaceMuted,
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '24px',
        }}
      >
        <Text style={{ ...typography.text, marginTop: '0', marginBottom: '0', fontWeight: '600' }}>
          {postTitle}
        </Text>
      </Section>

      {/* Status Change */}
      <Text style={typography.text}>
        {formattedPreviousStatus}
        {' \u2192 '}
        <strong>{formattedNewStatus}</strong>
      </Text>

      {/* CTA Button */}
      <Section style={{ textAlign: 'center', marginTop: '32px', marginBottom: '32px' }}>
        <Button style={button.primary} href={postUrl}>
          {t(locale, 'cta.viewFeedback')}
        </Button>
      </Section>

      {/* Footer */}
      <NotificationFooter
        reason={t(locale, 'footer.reasonFeedback')}
        unsubscribeUrl={unsubscribeUrl}
        locale={locale}
      />
    </EmailLayout>
  )
}
