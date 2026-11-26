import { Button, Column, Heading, Row, Section, Text } from '@react-email/components'
import { EmailLayout, NotificationFooter } from './email-layout'
import { typography, button, colors } from './shared-styles'
import { t } from '../i18n'

export interface PostMentionEmailProps {
  mentionerName: string
  postTitle: string
  /** Paragraph context for the mention. Empty string suppresses the quote block. */
  excerpt: string
  postUrl: string
  workspaceName: string
  unsubscribeUrl?: string
  logoUrl?: string
  locale?: string
}

export function PostMentionEmail({
  mentionerName,
  postTitle,
  excerpt,
  postUrl,
  workspaceName,
  unsubscribeUrl,
  logoUrl,
  locale,
}: PostMentionEmailProps) {
  const displayName = mentionerName || t(locale, 'mention.anonymous')
  const hasExcerpt = excerpt.length > 0

  return (
    <EmailLayout
      preview={t(locale, 'mention.preview', { name: displayName, title: postTitle })}
      logoUrl={logoUrl}
      logoAlt={workspaceName}
    >
      {/* Content */}
      <Heading style={typography.h1}>{t(locale, 'mention.heading')}</Heading>
      <Text style={typography.text}>
        {t(locale, 'mention.body', { name: displayName, title: postTitle })}
      </Text>

      {/* Post Title */}
      <Section
        style={{
          backgroundColor: colors.surfaceMuted,
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '16px',
        }}
      >
        <Text
          style={{
            ...typography.textSmall,
            marginTop: '0',
            marginBottom: '4px',
            color: colors.textMuted,
          }}
        >
          {t(locale, 'label.feedback')}
        </Text>
        <Text style={{ ...typography.text, marginTop: '0', marginBottom: '0', fontWeight: '600' }}>
          {postTitle}
        </Text>
      </Section>

      {/* Excerpt — using Row/Column instead of border-left for Outlook compatibility */}
      {hasExcerpt ? (
        <Row style={{ marginBottom: '24px' }}>
          <Column style={{ width: '3px', backgroundColor: colors.primary, borderRadius: '2px' }} />
          <Column style={{ paddingLeft: '16px' }}>
            <Text
              style={{
                ...typography.text,
                marginTop: '0',
                marginBottom: '0',
                fontStyle: 'italic',
              }}
            >
              &quot;{excerpt}&quot;
            </Text>
          </Column>
        </Row>
      ) : null}

      {/* CTA Button */}
      <Section style={{ textAlign: 'center', marginTop: '32px', marginBottom: '32px' }}>
        <Button style={button.primary} href={postUrl}>
          {t(locale, 'cta.viewFeedback')}
        </Button>
      </Section>

      {/* Footer */}
      {unsubscribeUrl ? (
        <NotificationFooter
          reason={t(locale, 'mention.reason', { workspace: workspaceName })}
          unsubscribeUrl={unsubscribeUrl}
          locale={locale}
        />
      ) : (
        <Text style={typography.footer}>
          {t(locale, 'mention.reason', { workspace: workspaceName })}
        </Text>
      )}
    </EmailLayout>
  )
}
