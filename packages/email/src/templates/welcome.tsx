import { Button, Column, Heading, Row, Section, Text } from '@react-email/components'
import { EmailLayout, TransactionalFooter } from './email-layout'
import { typography, button, colors } from './shared-styles'
import { t, rich } from '../i18n'

interface WelcomeEmailProps {
  name: string
  workspaceName: string
  dashboardUrl: string
  logoUrl?: string
  locale?: string
}

export function WelcomeEmail({
  name,
  workspaceName,
  dashboardUrl,
  logoUrl,
  locale,
}: WelcomeEmailProps) {
  return (
    <EmailLayout
      preview={t(locale, 'welcome.preview', { workspace: workspaceName })}
      logoUrl={logoUrl}
      logoAlt={workspaceName}
    >
      {/* Content */}
      <Heading style={typography.h1}>
        {t(locale, 'welcome.heading', { workspace: workspaceName })}
      </Heading>
      <Text style={typography.text}>
        {rich(t(locale, 'welcome.body', { name, workspace: workspaceName }))}
      </Text>

      {/* Features List - using Row/Column instead of spans for email compatibility */}
      <Section style={{ marginBottom: '24px' }}>
        {(
          ['welcome.feature1', 'welcome.feature2', 'welcome.feature3', 'welcome.feature4'] as const
        ).map((feature) => (
          <Row key={feature} style={{ marginBottom: '4px' }}>
            <Column style={{ width: '28px', verticalAlign: 'top' }}>
              <Text style={checkIcon}>&#10003;</Text>
            </Column>
            <Column>
              <Text style={featureText}>{t(locale, feature)}</Text>
            </Column>
          </Row>
        ))}
      </Section>

      {/* CTA Button */}
      <Section style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Button style={button.primary} href={dashboardUrl}>
          {t(locale, 'welcome.button')}
        </Button>
      </Section>

      {/* Footer */}
      <TransactionalFooter>
        {t(locale, 'welcome.footer')}
        <br />
        {t(locale, 'welcome.team', { workspace: workspaceName })}
      </TransactionalFooter>
    </EmailLayout>
  )
}

const checkIcon = {
  color: colors.primary,
  fontSize: '15px',
  fontWeight: '700' as const,
  lineHeight: '28px',
  marginTop: '0',
  marginBottom: '0',
}

const featureText = {
  color: colors.text,
  fontSize: '15px',
  lineHeight: '28px',
  marginTop: '0',
  marginBottom: '0',
}
