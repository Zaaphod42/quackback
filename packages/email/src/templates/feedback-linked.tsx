import { Button, Heading, Section, Text } from '@react-email/components'
import { EmailLayout, NotificationFooter } from './email-layout'
import { typography, button, colors } from './shared-styles'
import { t } from '../i18n'

interface FeedbackLinkedEmailProps {
  recipientName?: string
  postTitle: string
  postUrl: string
  workspaceName: string
  unsubscribeUrl: string
  attributedByName?: string
  logoUrl?: string
  locale?: string
}

export function FeedbackLinkedEmail({
  recipientName,
  postTitle,
  postUrl,
  workspaceName,
  unsubscribeUrl,
  attributedByName,
  logoUrl,
  locale,
}: FeedbackLinkedEmailProps) {
  const greeting = recipientName
    ? t(locale, 'linked.thanksNamed', { name: recipientName })
    : t(locale, 'linked.thanks')
  const attribution = attributedByName
    ? t(locale, 'linked.attributedBy', { by: attributedByName, workspace: workspaceName })
    : t(locale, 'linked.attributed', { workspace: workspaceName })

  return (
    <EmailLayout
      preview={t(locale, 'linked.preview', { title: postTitle })}
      logoUrl={logoUrl}
      logoAlt={workspaceName}
    >
      {/* Content */}
      <Heading style={typography.h1}>{t(locale, 'linked.heading')}</Heading>
      <Text style={typography.text}>
        {greeting} {attribution} {t(locale, 'linked.updates')}
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

      {/* CTA Button */}
      <Section style={{ textAlign: 'center', marginTop: '32px', marginBottom: '32px' }}>
        <Button style={button.primary} href={postUrl}>
          {t(locale, 'cta.viewFeedback')}
        </Button>
      </Section>

      {/* Footer */}
      <NotificationFooter
        reason={t(locale, 'linked.reason')}
        unsubscribeUrl={unsubscribeUrl}
        locale={locale}
      />
    </EmailLayout>
  )
}
