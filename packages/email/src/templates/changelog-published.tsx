import { Button, Heading, Section, Text } from '@react-email/components'
import { EmailLayout, NotificationFooter } from './email-layout'
import { typography, button, colors } from './shared-styles'
import { t } from '../i18n'

interface ChangelogPublishedEmailProps {
  changelogTitle: string
  changelogUrl: string
  contentPreview: string
  organizationName: string
  unsubscribeUrl: string
  logoUrl?: string
  locale?: string
}

export function ChangelogPublishedEmail({
  changelogTitle,
  changelogUrl,
  contentPreview,
  organizationName,
  unsubscribeUrl,
  logoUrl,
  locale,
}: ChangelogPublishedEmailProps) {
  return (
    <EmailLayout
      preview={t(locale, 'changelog.preview', {
        workspace: organizationName,
        title: changelogTitle,
      })}
      logoUrl={logoUrl}
      logoAlt={organizationName}
    >
      {/* Content */}
      <Heading style={typography.h1}>{t(locale, 'changelog.heading')}</Heading>
      <Text style={typography.text}>
        {t(locale, 'changelog.body', { workspace: organizationName })}
      </Text>

      {/* Changelog Title */}
      <Section
        style={{
          backgroundColor: colors.surfaceMuted,
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '24px',
        }}
      >
        <Text style={{ ...typography.text, marginTop: '0', marginBottom: '0', fontWeight: '600' }}>
          {changelogTitle}
        </Text>
        {contentPreview && (
          <Text style={{ ...typography.textSmall, marginTop: '8px', marginBottom: '0' }}>
            {contentPreview}
          </Text>
        )}
      </Section>

      {/* CTA Button */}
      <Section style={{ textAlign: 'center', marginTop: '32px', marginBottom: '32px' }}>
        <Button style={button.primary} href={changelogUrl}>
          {t(locale, 'changelog.button')}
        </Button>
      </Section>

      {/* Footer */}
      <NotificationFooter
        reason={t(locale, 'changelog.reason')}
        unsubscribeUrl={unsubscribeUrl}
        locale={locale}
      />
    </EmailLayout>
  )
}
