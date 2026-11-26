/**
 * Langue des e-mails (Seb 2026-11-26) : les six langues de Diafane, l'anglais pour toutes les autres.
 *
 * Un e-mail est écrit dans la langue du DESTINATAIRE (`users.locale`, tenue à jour à chaque visite du portail ou du
 * widget), jamais dans celle de l'expéditeur. Une langue inconnue, ou une adresse sans langue connue, donne l'anglais.
 *
 * Les textes vivent ici, une table par langue, parce que le paquet d'e-mails est autonome (il n'importe rien de
 * l'application). Une clé neuve s'écrit dans les SIX tables : le test `i18n.test.ts` refuse qu'une langue en manque.
 * Les variables s'écrivent `{nom}`, le gras `**texte**`. Registre : vouvoiement en français, espagnol, allemand et
 * néerlandais, forme de politesse en italien (un e-mail est de la correspondance, pas de l'interface).
 */
import { createElement, Fragment } from 'react'
import type { ReactNode } from 'react'

export const EMAIL_LOCALES = ['en', 'fr', 'it', 'es', 'de', 'nl'] as const
export type EmailLocale = (typeof EMAIL_LOCALES)[number]

/** 'fr-FR' -> 'fr' ; une langue sans table, ou une valeur vide, -> 'en'. */
export function normalizeEmailLocale(locale?: string | null): EmailLocale {
  if (!locale) return 'en'
  const base = locale.toLowerCase().split(/[-_]/)[0]
  return (EMAIL_LOCALES as readonly string[]).includes(base) ? (base as EmailLocale) : 'en'
}

const en = {
  'footer.unsubscribePost': 'Unsubscribe from this post',
  'footer.reasonFeedback':
    'You received this email because you submitted or subscribed to this feedback.',
  'cta.viewFeedback': 'View Feedback',
  'label.feedback': 'Feedback',
  'link.copyPaste': 'Or copy and paste this link into your browser:',
  'magicLink.subject': 'Your Diafane sign-in link',
  'magicLink.preview': 'Your sign-in link',
  'magicLink.heading': 'Sign in to Diafane',
  'magicLink.intro': 'Click the button below to finish signing in.',
  'magicLink.button': 'Sign in',
  'magicLink.orCode': 'Or enter this code on the sign-in screen:',
  'magicLink.expires': 'The link and code expire in 10 minutes.',
  'magicLink.ignore': "If you didn't request this, you can safely ignore this email.",
  'passwordReset.subject': 'Reset your Diafane feedback password',
  'passwordReset.preview': 'Reset your Diafane feedback password',
  'passwordReset.heading': 'Reset your password',
  'passwordReset.body':
    'Click the button below to set a new password. This link expires in 24 hours.',
  'passwordReset.button': 'Reset Password',
  'passwordReset.ignore':
    "If you didn't request a password reset, you can safely ignore this email.",
  'welcome.subject': 'Welcome to {workspace}!',
  'welcome.preview': 'Welcome to {workspace}',
  'welcome.heading': 'Welcome to {workspace}!',
  'welcome.body':
    'Hi {name}, your workspace **{workspace}** is ready. Start collecting and managing customer feedback today.',
  'welcome.feature1': 'Create feedback boards',
  'welcome.feature2': 'Invite your team',
  'welcome.feature3': 'Share your public roadmap',
  'welcome.feature4': 'Connect GitHub, Slack & Discord',
  'welcome.button': 'Go to Dashboard',
  'welcome.footer': 'Happy collecting!',
  'welcome.team': 'The {workspace} team',
  'invitation.subject': "You've been invited to join {workspace}",
  'invitation.preview': 'Join {workspace}',
  'invitation.headingNamed': "Hi {name}, you're invited!",
  'invitation.heading': "You're invited!",
  'invitation.body': '**{invitedBy}** has invited you to join **{workspace}**.',
  'invitation.button': 'Accept Invitation',
  'invitation.ignore': "If you weren't expecting this invitation, you can ignore this email.",
  'portalInvite.subject': "You've been invited to {workspace}",
  'portalInvite.preview': "You've been invited to access the {workspace} portal",
  'portalInvite.heading': "You've been invited!",
  'portalInvite.body':
    "You've been invited to access the **{workspace}** portal. Click below to accept and sign in.",
  'portalInvite.button': 'Accept invitation',
  'portalInvite.ignore': "If you weren't expecting this invitation, you can ignore this email.",
  'newSignIn.subject': 'New sign-in to your account',
  'newSignIn.preview': 'A new sign-in was detected on your account',
  'newSignIn.heading': 'New sign-in to your account',
  'newSignIn.bodyWorkspace':
    "Someone just signed in to your {workspace} account on a device we haven't seen before.",
  'newSignIn.body': "Someone just signed in to your account on a device we haven't seen before.",
  'newSignIn.when': 'When:',
  'newSignIn.ip': 'IP:',
  'newSignIn.device': 'Device:',
  'newSignIn.action':
    "If that was you, no action needed. If it wasn't, change your password and revoke any other active sessions.",
  'newSignIn.footer':
    "You're receiving this because a new sign-in was detected on your account. These alerts are required and can't be disabled.",
  'recovery.subject': 'A recovery code on your account was just used',
  'recovery.preview': 'A recovery code was used to sign in',
  'recovery.previewWorkspace': 'A recovery code was used to sign in for {workspace}',
  'recovery.heading': 'A recovery code was used',
  'recovery.body': 'Someone signed in to your account using one of your saved recovery codes.',
  'recovery.bodyWorkspace':
    'Someone signed in to your account for {workspace} using one of your saved recovery codes.',
  'recovery.when': 'When:',
  'recovery.ip': 'IP address:',
  'recovery.device': 'Device:',
  'recovery.ifYou':
    "If this was you, no action is needed. The code is now spent and can't be reused.",
  'recovery.ifNot':
    "If this wasn't you, sign in and rotate your recovery codes immediately. The person who used the code now has an active session — revoke it from your security settings.",
  'recovery.footer':
    "You're receiving this because a recovery code on your account was just used. These alerts are required and can't be disabled.",
  'status.open': 'Open',
  'status.under_review': 'Under Review',
  'status.planned': 'Planned',
  'status.in_progress': 'In Progress',
  'status.complete': 'Complete',
  'status.closed': 'Closed',
  'statusChange.subject': 'Your feedback is now {status}!',
  'statusChange.preview': 'Your feedback is now {status}',
  'statusChange.heading': 'Your feedback is now {status}!',
  'statusChange.body': 'Great news! The status of your feedback has been updated on {workspace}.',
  'newComment.subject': 'New comment on "{title}"',
  'newComment.preview': 'New comment on "{title}"',
  'newComment.heading': 'New comment on your feedback',
  'newComment.body': '{name}{team} commented on your feedback in {workspace}.',
  'newComment.team': ' (Team)',
  'newComment.button': 'View Comment',
  'chat.reply.subject': 'New reply from {workspace}',
  'chat.reply.heading': 'New reply from {workspace}',
  'chat.reply.intro': '{sender} replied to your conversation with {workspace}.',
  'chat.reply.reason':
    'You received this email because you have an open conversation with this team.',
  'chat.started.subject': 'New message from {workspace}',
  'chat.started.heading': 'New message from {workspace}',
  'chat.started.intro': '{sender} from {workspace} sent you a message.',
  'chat.started.reason': 'You received this email because {workspace} sent you a message.',
  'chat.visitor.subject': 'New chat message in {workspace}',
  'chat.visitor.heading': 'New chat message',
  'chat.visitor.intro': '{sender} started a conversation in {workspace}.',
  'chat.visitor.reason': 'You received this email because you are a member of this workspace.',
  'chat.viewConversation': 'View conversation',
  'chat.openInbox': 'Open inbox',
  'mention.subject': '{name} mentioned you in "{title}"',
  'mention.preview': '{name} mentioned you in "{title}"',
  'mention.heading': 'You were mentioned',
  'mention.body': '{name} mentioned you in {title}.',
  'mention.anonymous': 'Anonymous user',
  'mention.reason': 'You received this email because you were mentioned in {workspace}.',
  'changelog.subject': 'New update: {title}',
  'changelog.preview': 'New update from {workspace}: {title}',
  'changelog.heading': 'New update published',
  'changelog.body': '{workspace} just published an update related to your feedback.',
  'changelog.button': 'View Update',
  'changelog.reason':
    'You received this email because you submitted or subscribed to feedback related to this update.',
  'linked.subject': 'Your feedback has been linked to "{title}"',
  'linked.preview': 'Your feedback has been linked to "{title}"',
  'linked.heading': 'Your feedback is being tracked!',
  'linked.thanksNamed': 'Thanks {name}!',
  'linked.thanks': 'Thanks!',
  'linked.attributedBy': '{by} from the {workspace} team has linked your feedback to a post.',
  'linked.attributed': 'Your feedback has been linked to a post on {workspace}.',
  'linked.updates': "You'll receive updates when the status changes or new comments are posted.",
  'linked.reason': 'You received this email because your feedback was attributed to this post.',
} as const

export type EmailKey = keyof typeof en
type Table = Record<EmailKey, string>

const fr: Table = {
  'footer.unsubscribePost': 'Se désabonner de cette idée',
  'footer.reasonFeedback':
    'Vous recevez cet e-mail parce que vous avez proposé cette idée ou que vous vous y êtes abonné.',
  'cta.viewFeedback': "Voir l'idée",
  'label.feedback': 'Idée',
  'link.copyPaste': 'Ou copiez et collez ce lien dans votre navigateur :',
  'magicLink.subject': 'Votre lien de connexion Diafane',
  'magicLink.preview': 'Votre lien de connexion',
  'magicLink.heading': 'Connexion à Diafane',
  'magicLink.intro': 'Cliquez sur le bouton ci-dessous pour terminer votre connexion.',
  'magicLink.button': 'Se connecter',
  'magicLink.orCode': 'Ou saisissez ce code sur l’écran de connexion :',
  'magicLink.expires': 'Le lien et le code expirent dans 10 minutes.',
  'magicLink.ignore':
    'Si vous n’êtes pas à l’origine de cette demande, ignorez simplement cet e-mail.',
  'passwordReset.subject': 'Réinitialisez votre mot de passe Diafane Feedback',
  'passwordReset.preview': 'Réinitialisez votre mot de passe Diafane Feedback',
  'passwordReset.heading': 'Réinitialisez votre mot de passe',
  'passwordReset.body':
    'Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe. Ce lien expire dans 24 heures.',
  'passwordReset.button': 'Réinitialiser le mot de passe',
  'passwordReset.ignore':
    'Si vous n’avez pas demandé cette réinitialisation, ignorez simplement cet e-mail.',
  'welcome.subject': 'Bienvenue dans {workspace} !',
  'welcome.preview': 'Bienvenue dans {workspace}',
  'welcome.heading': 'Bienvenue dans {workspace} !',
  'welcome.body':
    'Bonjour {name}, votre espace **{workspace}** est prêt. Commencez dès aujourd’hui à recueillir et à gérer les retours de vos clients.',
  'welcome.feature1': 'Créer des tableaux d’idées',
  'welcome.feature2': 'Inviter votre équipe',
  'welcome.feature3': 'Partager votre feuille de route publique',
  'welcome.feature4': 'Connecter GitHub, Slack et Discord',
  'welcome.button': 'Aller au tableau de bord',
  'welcome.footer': 'Bonne collecte !',
  'welcome.team': 'L’équipe {workspace}',
  'invitation.subject': 'Vous êtes invité à rejoindre {workspace}',
  'invitation.preview': 'Rejoindre {workspace}',
  'invitation.headingNamed': 'Bonjour {name}, vous êtes invité !',
  'invitation.heading': 'Vous êtes invité !',
  'invitation.body': '**{invitedBy}** vous invite à rejoindre **{workspace}**.',
  'invitation.button': 'Accepter l’invitation',
  'invitation.ignore': 'Si vous n’attendiez pas cette invitation, vous pouvez ignorer cet e-mail.',
  'portalInvite.subject': 'Vous êtes invité à rejoindre {workspace}',
  'portalInvite.preview': 'Vous êtes invité à accéder au portail {workspace}',
  'portalInvite.heading': 'Vous êtes invité !',
  'portalInvite.body':
    'Vous êtes invité à accéder au portail **{workspace}**. Cliquez ci-dessous pour accepter et vous connecter.',
  'portalInvite.button': 'Accepter l’invitation',
  'portalInvite.ignore':
    'Si vous n’attendiez pas cette invitation, vous pouvez ignorer cet e-mail.',
  'newSignIn.subject': 'Nouvelle connexion à votre compte',
  'newSignIn.preview': 'Une nouvelle connexion a été détectée sur votre compte',
  'newSignIn.heading': 'Nouvelle connexion à votre compte',
  'newSignIn.bodyWorkspace':
    'Quelqu’un vient de se connecter à votre compte {workspace} depuis un appareil que nous ne connaissions pas.',
  'newSignIn.body':
    'Quelqu’un vient de se connecter à votre compte depuis un appareil que nous ne connaissions pas.',
  'newSignIn.when': 'Quand :',
  'newSignIn.ip': 'IP :',
  'newSignIn.device': 'Appareil :',
  'newSignIn.action':
    'Si c’était vous, aucune action n’est nécessaire. Sinon, changez votre mot de passe et fermez toutes les autres sessions actives.',
  'newSignIn.footer':
    'Vous recevez ce message parce qu’une nouvelle connexion a été détectée sur votre compte. Ces alertes sont obligatoires et ne peuvent pas être désactivées.',
  'recovery.subject': 'Un code de récupération de votre compte vient d’être utilisé',
  'recovery.preview': 'Un code de récupération a servi à se connecter',
  'recovery.previewWorkspace': 'Un code de récupération a servi à se connecter à {workspace}',
  'recovery.heading': 'Un code de récupération a été utilisé',
  'recovery.body':
    'Quelqu’un s’est connecté à votre compte avec l’un de vos codes de récupération enregistrés.',
  'recovery.bodyWorkspace':
    'Quelqu’un s’est connecté à votre compte {workspace} avec l’un de vos codes de récupération enregistrés.',
  'recovery.when': 'Quand :',
  'recovery.ip': 'Adresse IP :',
  'recovery.device': 'Appareil :',
  'recovery.ifYou':
    'Si c’était vous, aucune action n’est nécessaire. Le code est maintenant utilisé et ne peut plus servir.',
  'recovery.ifNot':
    'Si ce n’était pas vous, connectez-vous et renouvelez immédiatement vos codes de récupération. La personne qui a utilisé le code dispose d’une session active : fermez-la depuis vos paramètres de sécurité.',
  'recovery.footer':
    'Vous recevez ce message parce qu’un code de récupération de votre compte vient d’être utilisé. Ces alertes sont obligatoires et ne peuvent pas être désactivées.',
  'status.open': 'Ouverte',
  'status.under_review': 'À l’étude',
  'status.planned': 'Planifiée',
  'status.in_progress': 'En cours',
  'status.complete': 'Terminée',
  'status.closed': 'Fermée',
  'statusChange.subject': 'Votre idée est maintenant « {status} »',
  'statusChange.preview': 'Votre idée est maintenant « {status} »',
  'statusChange.heading': 'Votre idée est maintenant « {status} »',
  'statusChange.body': 'Bonne nouvelle ! Le statut de votre idée a changé sur {workspace}.',
  'newComment.subject': 'Nouveau commentaire sur « {title} »',
  'newComment.preview': 'Nouveau commentaire sur « {title} »',
  'newComment.heading': 'Nouveau commentaire sur votre idée',
  'newComment.body': '{name}{team} a commenté votre idée sur {workspace}.',
  'newComment.team': ' (équipe)',
  'newComment.button': 'Voir le commentaire',
  'chat.reply.subject': 'Nouvelle réponse de {workspace}',
  'chat.reply.heading': 'Nouvelle réponse de {workspace}',
  'chat.reply.intro': '{sender} a répondu à votre conversation avec {workspace}.',
  'chat.reply.reason':
    'Vous recevez cet e-mail parce que vous avez une conversation ouverte avec cette équipe.',
  'chat.started.subject': 'Nouveau message de {workspace}',
  'chat.started.heading': 'Nouveau message de {workspace}',
  'chat.started.intro': '{sender} de {workspace} vous a envoyé un message.',
  'chat.started.reason': 'Vous recevez cet e-mail parce que {workspace} vous a envoyé un message.',
  'chat.visitor.subject': 'Nouveau message de conversation sur {workspace}',
  'chat.visitor.heading': 'Nouveau message de conversation',
  'chat.visitor.intro': '{sender} a ouvert une conversation sur {workspace}.',
  'chat.visitor.reason': 'Vous recevez cet e-mail parce que vous êtes membre de cet espace.',
  'chat.viewConversation': 'Voir la conversation',
  'chat.openInbox': 'Ouvrir la boîte de réception',
  'mention.subject': '{name} vous a mentionné dans « {title} »',
  'mention.preview': '{name} vous a mentionné dans « {title} »',
  'mention.heading': 'Vous avez été mentionné',
  'mention.body': '{name} vous a mentionné dans {title}.',
  'mention.anonymous': 'Un utilisateur anonyme',
  'mention.reason': 'Vous recevez cet e-mail parce que vous avez été mentionné sur {workspace}.',
  'changelog.subject': 'Nouveauté : {title}',
  'changelog.preview': 'Nouveauté de {workspace} : {title}',
  'changelog.heading': 'Une nouveauté a été publiée',
  'changelog.body': '{workspace} vient de publier une nouveauté liée à votre idée.',
  'changelog.button': 'Voir la nouveauté',
  'changelog.reason':
    'Vous recevez cet e-mail parce que vous avez proposé une idée liée à cette nouveauté, ou que vous vous y êtes abonné.',
  'linked.subject': 'Votre idée a été rattachée à « {title} »',
  'linked.preview': 'Votre idée a été rattachée à « {title} »',
  'linked.heading': 'Votre idée est suivie !',
  'linked.thanksNamed': 'Merci {name} !',
  'linked.thanks': 'Merci !',
  'linked.attributedBy': '{by}, de l’équipe {workspace}, a rattaché votre idée à une publication.',
  'linked.attributed': 'Votre idée a été rattachée à une publication sur {workspace}.',
  'linked.updates':
    'Vous recevrez des mises à jour lorsque le statut change ou que de nouveaux commentaires sont publiés.',
  'linked.reason':
    'Vous recevez cet e-mail parce que votre idée a été rattachée à cette publication.',
}

const it: Table = {
  'footer.unsubscribePost': 'Annulla l’iscrizione a questa idea',
  'footer.reasonFeedback':
    'Ricevi questa e-mail perché hai proposto questa idea o ti sei iscritto per seguirla.',
  'cta.viewFeedback': 'Vedi l’idea',
  'label.feedback': 'Idea',
  'link.copyPaste': 'Oppure copia e incolla questo link nel browser:',
  'magicLink.subject': 'Il tuo link di accesso a Diafane',
  'magicLink.preview': 'Il tuo link di accesso',
  'magicLink.heading': 'Accedi a Diafane',
  'magicLink.intro': 'Fai clic sul pulsante qui sotto per completare l’accesso.',
  'magicLink.button': 'Accedi',
  'magicLink.orCode': 'Oppure inserisci questo codice nella schermata di accesso:',
  'magicLink.expires': 'Il link e il codice scadono tra 10 minuti.',
  'magicLink.ignore': 'Se non hai richiesto l’accesso, puoi ignorare questa e-mail.',
  'passwordReset.subject': 'Reimposta la tua password di Diafane Feedback',
  'passwordReset.preview': 'Reimposta la tua password di Diafane Feedback',
  'passwordReset.heading': 'Reimposta la tua password',
  'passwordReset.body':
    'Fai clic sul pulsante qui sotto per scegliere una nuova password. Il link scade tra 24 ore.',
  'passwordReset.button': 'Reimposta la password',
  'passwordReset.ignore': 'Se non hai richiesto la reimpostazione, puoi ignorare questa e-mail.',
  'welcome.subject': 'Benvenuto in {workspace}!',
  'welcome.preview': 'Benvenuto in {workspace}',
  'welcome.heading': 'Benvenuto in {workspace}!',
  'welcome.body':
    'Ciao {name}, il tuo spazio **{workspace}** è pronto. Inizia subito a raccogliere e gestire i feedback dei tuoi clienti.',
  'welcome.feature1': 'Creare bacheche di idee',
  'welcome.feature2': 'Invitare il tuo team',
  'welcome.feature3': 'Condividere la tua roadmap pubblica',
  'welcome.feature4': 'Collegare GitHub, Slack e Discord',
  'welcome.button': 'Vai alla dashboard',
  'welcome.footer': 'Buona raccolta!',
  'welcome.team': 'Il team {workspace}',
  'invitation.subject': 'Sei stato invitato a unirti a {workspace}',
  'invitation.preview': 'Unisciti a {workspace}',
  'invitation.headingNamed': 'Ciao {name}, sei stato invitato!',
  'invitation.heading': 'Sei stato invitato!',
  'invitation.body': '**{invitedBy}** ti ha invitato a unirti a **{workspace}**.',
  'invitation.button': 'Accetta l’invito',
  'invitation.ignore': 'Se non ti aspettavi questo invito, puoi ignorare questa e-mail.',
  'portalInvite.subject': 'Sei stato invitato a {workspace}',
  'portalInvite.preview': 'Sei stato invitato ad accedere al portale {workspace}',
  'portalInvite.heading': 'Sei stato invitato!',
  'portalInvite.body':
    'Sei stato invitato ad accedere al portale **{workspace}**. Fai clic qui sotto per accettare e accedere.',
  'portalInvite.button': 'Accetta l’invito',
  'portalInvite.ignore': 'Se non ti aspettavi questo invito, puoi ignorare questa e-mail.',
  'newSignIn.subject': 'Nuovo accesso al tuo account',
  'newSignIn.preview': 'È stato rilevato un nuovo accesso al tuo account',
  'newSignIn.heading': 'Nuovo accesso al tuo account',
  'newSignIn.bodyWorkspace':
    'Qualcuno ha appena effettuato l’accesso al tuo account {workspace} da un dispositivo che non conosciamo.',
  'newSignIn.body':
    'Qualcuno ha appena effettuato l’accesso al tuo account da un dispositivo che non conosciamo.',
  'newSignIn.when': 'Quando:',
  'newSignIn.ip': 'IP:',
  'newSignIn.device': 'Dispositivo:',
  'newSignIn.action':
    'Se eri tu, non occorre fare nulla. Altrimenti, cambia la password e chiudi tutte le altre sessioni attive.',
  'newSignIn.footer':
    'Ricevi questo messaggio perché è stato rilevato un nuovo accesso al tuo account. Questi avvisi sono obbligatori e non possono essere disattivati.',
  'recovery.subject': 'Un codice di recupero del tuo account è stato appena usato',
  'recovery.preview': 'Un codice di recupero è stato usato per accedere',
  'recovery.previewWorkspace': 'Un codice di recupero è stato usato per accedere a {workspace}',
  'recovery.heading': 'È stato usato un codice di recupero',
  'recovery.body':
    'Qualcuno ha effettuato l’accesso al tuo account con uno dei tuoi codici di recupero salvati.',
  'recovery.bodyWorkspace':
    'Qualcuno ha effettuato l’accesso al tuo account {workspace} con uno dei tuoi codici di recupero salvati.',
  'recovery.when': 'Quando:',
  'recovery.ip': 'Indirizzo IP:',
  'recovery.device': 'Dispositivo:',
  'recovery.ifYou':
    'Se eri tu, non occorre fare nulla. Il codice è ora esaurito e non può essere riutilizzato.',
  'recovery.ifNot':
    'Se non eri tu, accedi e rigenera subito i codici di recupero. Chi ha usato il codice ha ora una sessione attiva: chiudila dalle impostazioni di sicurezza.',
  'recovery.footer':
    'Ricevi questo messaggio perché un codice di recupero del tuo account è stato appena usato. Questi avvisi sono obbligatori e non possono essere disattivati.',
  'status.open': 'Aperta',
  'status.under_review': 'In valutazione',
  'status.planned': 'Pianificata',
  'status.in_progress': 'In corso',
  'status.complete': 'Completata',
  'status.closed': 'Chiusa',
  'statusChange.subject': 'La tua idea è ora «{status}»',
  'statusChange.preview': 'La tua idea è ora «{status}»',
  'statusChange.heading': 'La tua idea è ora «{status}»',
  'statusChange.body': 'Buone notizie! Lo stato della tua idea è stato aggiornato su {workspace}.',
  'newComment.subject': 'Nuovo commento su «{title}»',
  'newComment.preview': 'Nuovo commento su «{title}»',
  'newComment.heading': 'Nuovo commento sulla tua idea',
  'newComment.body': '{name}{team} ha commentato la tua idea su {workspace}.',
  'newComment.team': ' (team)',
  'newComment.button': 'Vedi il commento',
  'chat.reply.subject': 'Nuova risposta da {workspace}',
  'chat.reply.heading': 'Nuova risposta da {workspace}',
  'chat.reply.intro': '{sender} ha risposto alla tua conversazione con {workspace}.',
  'chat.reply.reason': 'Ricevi questa e-mail perché hai una conversazione aperta con questo team.',
  'chat.started.subject': 'Nuovo messaggio da {workspace}',
  'chat.started.heading': 'Nuovo messaggio da {workspace}',
  'chat.started.intro': '{sender} di {workspace} ti ha inviato un messaggio.',
  'chat.started.reason': 'Ricevi questa e-mail perché {workspace} ti ha inviato un messaggio.',
  'chat.visitor.subject': 'Nuovo messaggio in chat su {workspace}',
  'chat.visitor.heading': 'Nuovo messaggio in chat',
  'chat.visitor.intro': '{sender} ha avviato una conversazione su {workspace}.',
  'chat.visitor.reason': 'Ricevi questa e-mail perché sei membro di questo spazio.',
  'chat.viewConversation': 'Vedi la conversazione',
  'chat.openInbox': 'Apri la posta in arrivo',
  'mention.subject': '{name} ti ha menzionato in «{title}»',
  'mention.preview': '{name} ti ha menzionato in «{title}»',
  'mention.heading': 'Sei stato menzionato',
  'mention.body': '{name} ti ha menzionato in {title}.',
  'mention.anonymous': 'Un utente anonimo',
  'mention.reason': 'Ricevi questa e-mail perché sei stato menzionato su {workspace}.',
  'changelog.subject': 'Novità: {title}',
  'changelog.preview': 'Novità da {workspace}: {title}',
  'changelog.heading': 'Pubblicata una novità',
  'changelog.body': '{workspace} ha appena pubblicato una novità legata alla tua idea.',
  'changelog.button': 'Vedi la novità',
  'changelog.reason':
    'Ricevi questa e-mail perché hai proposto un’idea legata a questa novità o ti sei iscritto per seguirla.',
  'linked.subject': 'La tua idea è stata collegata a «{title}»',
  'linked.preview': 'La tua idea è stata collegata a «{title}»',
  'linked.heading': 'La tua idea è seguita!',
  'linked.thanksNamed': 'Grazie {name}!',
  'linked.thanks': 'Grazie!',
  'linked.attributedBy':
    '{by}, del team {workspace}, ha collegato la tua idea a una pubblicazione.',
  'linked.attributed': 'La tua idea è stata collegata a una pubblicazione su {workspace}.',
  'linked.updates':
    'Riceverai aggiornamenti quando lo stato cambia o vengono pubblicati nuovi commenti.',
  'linked.reason':
    'Ricevi questa e-mail perché la tua idea è stata collegata a questa pubblicazione.',
}

const es: Table = {
  'footer.unsubscribePost': 'Cancelar la suscripción a esta idea',
  'footer.reasonFeedback':
    'Recibe este correo porque propuso esta idea o se suscribió para seguirla.',
  'cta.viewFeedback': 'Ver la idea',
  'label.feedback': 'Idea',
  'link.copyPaste': 'O copie y pegue este enlace en su navegador:',
  'magicLink.subject': 'Su enlace de acceso a Diafane',
  'magicLink.preview': 'Su enlace de acceso',
  'magicLink.heading': 'Acceda a Diafane',
  'magicLink.intro': 'Haga clic en el botón de abajo para terminar de iniciar sesión.',
  'magicLink.button': 'Iniciar sesión',
  'magicLink.orCode': 'O introduzca este código en la pantalla de acceso:',
  'magicLink.expires': 'El enlace y el código caducan en 10 minutos.',
  'magicLink.ignore': 'Si no lo ha solicitado, puede ignorar este correo.',
  'passwordReset.subject': 'Restablezca su contraseña de Diafane Feedback',
  'passwordReset.preview': 'Restablezca su contraseña de Diafane Feedback',
  'passwordReset.heading': 'Restablezca su contraseña',
  'passwordReset.body':
    'Haga clic en el botón de abajo para elegir una nueva contraseña. Este enlace caduca en 24 horas.',
  'passwordReset.button': 'Restablecer la contraseña',
  'passwordReset.ignore': 'Si no ha solicitado el restablecimiento, puede ignorar este correo.',
  'welcome.subject': '¡Bienvenido a {workspace}!',
  'welcome.preview': 'Bienvenido a {workspace}',
  'welcome.heading': '¡Bienvenido a {workspace}!',
  'welcome.body':
    'Hola {name}, su espacio **{workspace}** está listo. Empiece hoy mismo a recopilar y gestionar los comentarios de sus clientes.',
  'welcome.feature1': 'Crear tableros de ideas',
  'welcome.feature2': 'Invitar a su equipo',
  'welcome.feature3': 'Compartir su hoja de ruta pública',
  'welcome.feature4': 'Conectar GitHub, Slack y Discord',
  'welcome.button': 'Ir al panel',
  'welcome.footer': '¡Feliz recopilación!',
  'welcome.team': 'El equipo de {workspace}',
  'invitation.subject': 'Le han invitado a unirse a {workspace}',
  'invitation.preview': 'Únase a {workspace}',
  'invitation.headingNamed': 'Hola {name}, ¡le han invitado!',
  'invitation.heading': '¡Le han invitado!',
  'invitation.body': '**{invitedBy}** le ha invitado a unirse a **{workspace}**.',
  'invitation.button': 'Aceptar la invitación',
  'invitation.ignore': 'Si no esperaba esta invitación, puede ignorar este correo.',
  'portalInvite.subject': 'Le han invitado a {workspace}',
  'portalInvite.preview': 'Le han invitado a acceder al portal de {workspace}',
  'portalInvite.heading': '¡Le han invitado!',
  'portalInvite.body':
    'Le han invitado a acceder al portal de **{workspace}**. Haga clic abajo para aceptar y acceder.',
  'portalInvite.button': 'Aceptar la invitación',
  'portalInvite.ignore': 'Si no esperaba esta invitación, puede ignorar este correo.',
  'newSignIn.subject': 'Nuevo acceso a su cuenta',
  'newSignIn.preview': 'Se ha detectado un nuevo acceso a su cuenta',
  'newSignIn.heading': 'Nuevo acceso a su cuenta',
  'newSignIn.bodyWorkspace':
    'Alguien acaba de acceder a su cuenta de {workspace} desde un dispositivo que no conocemos.',
  'newSignIn.body': 'Alguien acaba de acceder a su cuenta desde un dispositivo que no conocemos.',
  'newSignIn.when': 'Cuándo:',
  'newSignIn.ip': 'IP:',
  'newSignIn.device': 'Dispositivo:',
  'newSignIn.action':
    'Si fue usted, no es necesario hacer nada. Si no, cambie su contraseña y cierre las demás sesiones activas.',
  'newSignIn.footer':
    'Recibe este mensaje porque se ha detectado un nuevo acceso a su cuenta. Estos avisos son obligatorios y no se pueden desactivar.',
  'recovery.subject': 'Se acaba de usar un código de recuperación de su cuenta',
  'recovery.preview': 'Se usó un código de recuperación para acceder',
  'recovery.previewWorkspace': 'Se usó un código de recuperación para acceder a {workspace}',
  'recovery.heading': 'Se usó un código de recuperación',
  'recovery.body':
    'Alguien ha accedido a su cuenta con uno de sus códigos de recuperación guardados.',
  'recovery.bodyWorkspace':
    'Alguien ha accedido a su cuenta de {workspace} con uno de sus códigos de recuperación guardados.',
  'recovery.when': 'Cuándo:',
  'recovery.ip': 'Dirección IP:',
  'recovery.device': 'Dispositivo:',
  'recovery.ifYou':
    'Si fue usted, no es necesario hacer nada. El código ya está gastado y no se puede reutilizar.',
  'recovery.ifNot':
    'Si no fue usted, acceda y renueve de inmediato sus códigos de recuperación. Quien usó el código tiene ahora una sesión activa: ciérrela desde los ajustes de seguridad.',
  'recovery.footer':
    'Recibe este mensaje porque se acaba de usar un código de recuperación de su cuenta. Estos avisos son obligatorios y no se pueden desactivar.',
  'status.open': 'Abierta',
  'status.under_review': 'En revisión',
  'status.planned': 'Planificada',
  'status.in_progress': 'En curso',
  'status.complete': 'Completada',
  'status.closed': 'Cerrada',
  'statusChange.subject': 'Su idea ahora está «{status}»',
  'statusChange.preview': 'Su idea ahora está «{status}»',
  'statusChange.heading': 'Su idea ahora está «{status}»',
  'statusChange.body': '¡Buenas noticias! El estado de su idea se ha actualizado en {workspace}.',
  'newComment.subject': 'Nuevo comentario en «{title}»',
  'newComment.preview': 'Nuevo comentario en «{title}»',
  'newComment.heading': 'Nuevo comentario en su idea',
  'newComment.body': '{name}{team} ha comentado su idea en {workspace}.',
  'newComment.team': ' (equipo)',
  'newComment.button': 'Ver el comentario',
  'chat.reply.subject': 'Nueva respuesta de {workspace}',
  'chat.reply.heading': 'Nueva respuesta de {workspace}',
  'chat.reply.intro': '{sender} ha respondido a su conversación con {workspace}.',
  'chat.reply.reason': 'Recibe este correo porque tiene una conversación abierta con este equipo.',
  'chat.started.subject': 'Nuevo mensaje de {workspace}',
  'chat.started.heading': 'Nuevo mensaje de {workspace}',
  'chat.started.intro': '{sender} de {workspace} le ha enviado un mensaje.',
  'chat.started.reason': 'Recibe este correo porque {workspace} le ha enviado un mensaje.',
  'chat.visitor.subject': 'Nuevo mensaje de chat en {workspace}',
  'chat.visitor.heading': 'Nuevo mensaje de chat',
  'chat.visitor.intro': '{sender} ha iniciado una conversación en {workspace}.',
  'chat.visitor.reason': 'Recibe este correo porque es miembro de este espacio.',
  'chat.viewConversation': 'Ver la conversación',
  'chat.openInbox': 'Abrir la bandeja de entrada',
  'mention.subject': '{name} le ha mencionado en «{title}»',
  'mention.preview': '{name} le ha mencionado en «{title}»',
  'mention.heading': 'Le han mencionado',
  'mention.body': '{name} le ha mencionado en {title}.',
  'mention.anonymous': 'Un usuario anónimo',
  'mention.reason': 'Recibe este correo porque le han mencionado en {workspace}.',
  'changelog.subject': 'Novedad: {title}',
  'changelog.preview': 'Novedad de {workspace}: {title}',
  'changelog.heading': 'Se ha publicado una novedad',
  'changelog.body': '{workspace} acaba de publicar una novedad relacionada con su idea.',
  'changelog.button': 'Ver la novedad',
  'changelog.reason':
    'Recibe este correo porque propuso una idea relacionada con esta novedad o se suscribió para seguirla.',
  'linked.subject': 'Su idea se ha vinculado a «{title}»',
  'linked.preview': 'Su idea se ha vinculado a «{title}»',
  'linked.heading': '¡Su idea tiene seguimiento!',
  'linked.thanksNamed': '¡Gracias, {name}!',
  'linked.thanks': '¡Gracias!',
  'linked.attributedBy': '{by}, del equipo de {workspace}, ha vinculado su idea a una publicación.',
  'linked.attributed': 'Su idea se ha vinculado a una publicación en {workspace}.',
  'linked.updates':
    'Recibirá actualizaciones cuando cambie el estado o se publiquen nuevos comentarios.',
  'linked.reason': 'Recibe este correo porque su idea se ha vinculado a esta publicación.',
}

const de: Table = {
  'footer.unsubscribePost': 'Diese Idee nicht mehr verfolgen',
  'footer.reasonFeedback':
    'Sie erhalten diese E-Mail, weil Sie diese Idee eingereicht oder abonniert haben.',
  'cta.viewFeedback': 'Idee ansehen',
  'label.feedback': 'Idee',
  'link.copyPaste': 'Oder kopieren Sie diesen Link in Ihren Browser:',
  'magicLink.subject': 'Ihr Anmeldelink für Diafane',
  'magicLink.preview': 'Ihr Anmeldelink',
  'magicLink.heading': 'Bei Diafane anmelden',
  'magicLink.intro': 'Klicken Sie auf die Schaltfläche unten, um die Anmeldung abzuschließen.',
  'magicLink.button': 'Anmelden',
  'magicLink.orCode': 'Oder geben Sie diesen Code auf dem Anmeldebildschirm ein:',
  'magicLink.expires': 'Link und Code laufen in 10 Minuten ab.',
  'magicLink.ignore': 'Wenn Sie das nicht angefordert haben, können Sie diese E-Mail ignorieren.',
  'passwordReset.subject': 'Setzen Sie Ihr Diafane-Feedback-Passwort zurück',
  'passwordReset.preview': 'Setzen Sie Ihr Diafane-Feedback-Passwort zurück',
  'passwordReset.heading': 'Passwort zurücksetzen',
  'passwordReset.body':
    'Klicken Sie auf die Schaltfläche unten, um ein neues Passwort festzulegen. Der Link läuft in 24 Stunden ab.',
  'passwordReset.button': 'Passwort zurücksetzen',
  'passwordReset.ignore':
    'Wenn Sie das Zurücksetzen nicht angefordert haben, können Sie diese E-Mail ignorieren.',
  'welcome.subject': 'Willkommen bei {workspace}!',
  'welcome.preview': 'Willkommen bei {workspace}',
  'welcome.heading': 'Willkommen bei {workspace}!',
  'welcome.body':
    'Hallo {name}, Ihr Arbeitsbereich **{workspace}** ist bereit. Beginnen Sie noch heute, das Feedback Ihrer Kunden zu sammeln und zu verwalten.',
  'welcome.feature1': 'Ideen-Boards erstellen',
  'welcome.feature2': 'Ihr Team einladen',
  'welcome.feature3': 'Ihre öffentliche Roadmap teilen',
  'welcome.feature4': 'GitHub, Slack und Discord verbinden',
  'welcome.button': 'Zum Dashboard',
  'welcome.footer': 'Viel Erfolg beim Sammeln!',
  'welcome.team': 'Das Team von {workspace}',
  'invitation.subject': 'Sie wurden eingeladen, {workspace} beizutreten',
  'invitation.preview': '{workspace} beitreten',
  'invitation.headingNamed': 'Hallo {name}, Sie wurden eingeladen!',
  'invitation.heading': 'Sie wurden eingeladen!',
  'invitation.body': '**{invitedBy}** hat Sie eingeladen, **{workspace}** beizutreten.',
  'invitation.button': 'Einladung annehmen',
  'invitation.ignore':
    'Wenn Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.',
  'portalInvite.subject': 'Sie wurden zu {workspace} eingeladen',
  'portalInvite.preview': 'Sie wurden eingeladen, auf das Portal von {workspace} zuzugreifen',
  'portalInvite.heading': 'Sie wurden eingeladen!',
  'portalInvite.body':
    'Sie wurden eingeladen, auf das Portal von **{workspace}** zuzugreifen. Klicken Sie unten, um anzunehmen und sich anzumelden.',
  'portalInvite.button': 'Einladung annehmen',
  'portalInvite.ignore':
    'Wenn Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.',
  'newSignIn.subject': 'Neue Anmeldung bei Ihrem Konto',
  'newSignIn.preview': 'Bei Ihrem Konto wurde eine neue Anmeldung erkannt',
  'newSignIn.heading': 'Neue Anmeldung bei Ihrem Konto',
  'newSignIn.bodyWorkspace':
    'Jemand hat sich gerade von einem uns unbekannten Gerät bei Ihrem Konto für {workspace} angemeldet.',
  'newSignIn.body':
    'Jemand hat sich gerade von einem uns unbekannten Gerät bei Ihrem Konto angemeldet.',
  'newSignIn.when': 'Wann:',
  'newSignIn.ip': 'IP:',
  'newSignIn.device': 'Gerät:',
  'newSignIn.action':
    'Wenn Sie das waren, ist nichts weiter zu tun. Andernfalls ändern Sie Ihr Passwort und beenden Sie alle anderen aktiven Sitzungen.',
  'newSignIn.footer':
    'Sie erhalten diese Nachricht, weil bei Ihrem Konto eine neue Anmeldung erkannt wurde. Diese Hinweise sind verpflichtend und können nicht deaktiviert werden.',
  'recovery.subject': 'Ein Wiederherstellungscode Ihres Kontos wurde soeben verwendet',
  'recovery.preview': 'Ein Wiederherstellungscode wurde zur Anmeldung verwendet',
  'recovery.previewWorkspace':
    'Ein Wiederherstellungscode wurde zur Anmeldung bei {workspace} verwendet',
  'recovery.heading': 'Ein Wiederherstellungscode wurde verwendet',
  'recovery.body':
    'Jemand hat sich mit einem Ihrer gespeicherten Wiederherstellungscodes bei Ihrem Konto angemeldet.',
  'recovery.bodyWorkspace':
    'Jemand hat sich mit einem Ihrer gespeicherten Wiederherstellungscodes bei Ihrem Konto für {workspace} angemeldet.',
  'recovery.when': 'Wann:',
  'recovery.ip': 'IP-Adresse:',
  'recovery.device': 'Gerät:',
  'recovery.ifYou':
    'Wenn Sie das waren, ist nichts weiter zu tun. Der Code ist nun verbraucht und kann nicht erneut verwendet werden.',
  'recovery.ifNot':
    'Wenn Sie das nicht waren, melden Sie sich an und erneuern Sie sofort Ihre Wiederherstellungscodes. Die Person, die den Code verwendet hat, hat jetzt eine aktive Sitzung: Beenden Sie sie in Ihren Sicherheitseinstellungen.',
  'recovery.footer':
    'Sie erhalten diese Nachricht, weil ein Wiederherstellungscode Ihres Kontos soeben verwendet wurde. Diese Hinweise sind verpflichtend und können nicht deaktiviert werden.',
  'status.open': 'Offen',
  'status.under_review': 'In Prüfung',
  'status.planned': 'Geplant',
  'status.in_progress': 'In Arbeit',
  'status.complete': 'Abgeschlossen',
  'status.closed': 'Geschlossen',
  'statusChange.subject': 'Ihre Idee hat jetzt den Status „{status}“',
  'statusChange.preview': 'Ihre Idee hat jetzt den Status „{status}“',
  'statusChange.heading': 'Ihre Idee hat jetzt den Status „{status}“',
  'statusChange.body':
    'Gute Nachrichten! Der Status Ihrer Idee wurde bei {workspace} aktualisiert.',
  'newComment.subject': 'Neuer Kommentar zu „{title}“',
  'newComment.preview': 'Neuer Kommentar zu „{title}“',
  'newComment.heading': 'Neuer Kommentar zu Ihrer Idee',
  'newComment.body': '{name}{team} hat Ihre Idee bei {workspace} kommentiert.',
  'newComment.team': ' (Team)',
  'newComment.button': 'Kommentar ansehen',
  'chat.reply.subject': 'Neue Antwort von {workspace}',
  'chat.reply.heading': 'Neue Antwort von {workspace}',
  'chat.reply.intro': '{sender} hat auf Ihre Unterhaltung mit {workspace} geantwortet.',
  'chat.reply.reason':
    'Sie erhalten diese E-Mail, weil Sie eine offene Unterhaltung mit diesem Team haben.',
  'chat.started.subject': 'Neue Nachricht von {workspace}',
  'chat.started.heading': 'Neue Nachricht von {workspace}',
  'chat.started.intro': '{sender} von {workspace} hat Ihnen eine Nachricht gesendet.',
  'chat.started.reason':
    'Sie erhalten diese E-Mail, weil {workspace} Ihnen eine Nachricht gesendet hat.',
  'chat.visitor.subject': 'Neue Chat-Nachricht bei {workspace}',
  'chat.visitor.heading': 'Neue Chat-Nachricht',
  'chat.visitor.intro': '{sender} hat bei {workspace} eine Unterhaltung begonnen.',
  'chat.visitor.reason':
    'Sie erhalten diese E-Mail, weil Sie Mitglied dieses Arbeitsbereichs sind.',
  'chat.viewConversation': 'Unterhaltung ansehen',
  'chat.openInbox': 'Posteingang öffnen',
  'mention.subject': '{name} hat Sie in „{title}“ erwähnt',
  'mention.preview': '{name} hat Sie in „{title}“ erwähnt',
  'mention.heading': 'Sie wurden erwähnt',
  'mention.body': '{name} hat Sie in {title} erwähnt.',
  'mention.anonymous': 'Ein anonymer Nutzer',
  'mention.reason': 'Sie erhalten diese E-Mail, weil Sie bei {workspace} erwähnt wurden.',
  'changelog.subject': 'Neuigkeit: {title}',
  'changelog.preview': 'Neuigkeit von {workspace}: {title}',
  'changelog.heading': 'Neuigkeit veröffentlicht',
  'changelog.body': '{workspace} hat soeben eine Neuigkeit zu Ihrer Idee veröffentlicht.',
  'changelog.button': 'Neuigkeit ansehen',
  'changelog.reason':
    'Sie erhalten diese E-Mail, weil Sie eine Idee zu dieser Neuigkeit eingereicht oder abonniert haben.',
  'linked.subject': 'Ihre Idee wurde mit „{title}“ verknüpft',
  'linked.preview': 'Ihre Idee wurde mit „{title}“ verknüpft',
  'linked.heading': 'Ihre Idee wird verfolgt!',
  'linked.thanksNamed': 'Danke, {name}!',
  'linked.thanks': 'Danke!',
  'linked.attributedBy': '{by} vom Team von {workspace} hat Ihre Idee mit einem Beitrag verknüpft.',
  'linked.attributed': 'Ihre Idee wurde mit einem Beitrag bei {workspace} verknüpft.',
  'linked.updates':
    'Sie erhalten Updates, wenn sich der Status ändert oder neue Kommentare veröffentlicht werden.',
  'linked.reason': 'Sie erhalten diese E-Mail, weil Ihre Idee mit diesem Beitrag verknüpft wurde.',
}

const nl: Table = {
  'footer.unsubscribePost': 'Dit idee niet meer volgen',
  'footer.reasonFeedback':
    'U ontvangt deze e-mail omdat u dit idee hebt ingediend of ervoor bent geabonneerd.',
  'cta.viewFeedback': 'Idee bekijken',
  'label.feedback': 'Idee',
  'link.copyPaste': 'Of kopieer deze link en plak hem in uw browser:',
  'magicLink.subject': 'Uw inloglink voor Diafane',
  'magicLink.preview': 'Uw inloglink',
  'magicLink.heading': 'Inloggen bij Diafane',
  'magicLink.intro': 'Klik op de knop hieronder om het inloggen af te ronden.',
  'magicLink.button': 'Inloggen',
  'magicLink.orCode': 'Of voer deze code in op het inlogscherm:',
  'magicLink.expires': 'De link en de code verlopen over 10 minuten.',
  'magicLink.ignore': 'Hebt u dit niet aangevraagd, dan kunt u deze e-mail negeren.',
  'passwordReset.subject': 'Stel uw Diafane Feedback-wachtwoord opnieuw in',
  'passwordReset.preview': 'Stel uw Diafane Feedback-wachtwoord opnieuw in',
  'passwordReset.heading': 'Stel uw wachtwoord opnieuw in',
  'passwordReset.body':
    'Klik op de knop hieronder om een nieuw wachtwoord in te stellen. Deze link verloopt over 24 uur.',
  'passwordReset.button': 'Wachtwoord opnieuw instellen',
  'passwordReset.ignore':
    'Hebt u geen nieuw wachtwoord aangevraagd, dan kunt u deze e-mail negeren.',
  'welcome.subject': 'Welkom bij {workspace}!',
  'welcome.preview': 'Welkom bij {workspace}',
  'welcome.heading': 'Welkom bij {workspace}!',
  'welcome.body':
    'Hallo {name}, uw werkruimte **{workspace}** is klaar. Begin vandaag nog met het verzamelen en beheren van de feedback van uw klanten.',
  'welcome.feature1': 'Ideeënborden maken',
  'welcome.feature2': 'Uw team uitnodigen',
  'welcome.feature3': 'Uw openbare roadmap delen',
  'welcome.feature4': 'GitHub, Slack en Discord koppelen',
  'welcome.button': 'Naar het dashboard',
  'welcome.footer': 'Veel plezier met verzamelen!',
  'welcome.team': 'Het team van {workspace}',
  'invitation.subject': 'U bent uitgenodigd om lid te worden van {workspace}',
  'invitation.preview': 'Word lid van {workspace}',
  'invitation.headingNamed': 'Hallo {name}, u bent uitgenodigd!',
  'invitation.heading': 'U bent uitgenodigd!',
  'invitation.body': '**{invitedBy}** heeft u uitgenodigd om lid te worden van **{workspace}**.',
  'invitation.button': 'Uitnodiging accepteren',
  'invitation.ignore': 'Verwachtte u deze uitnodiging niet, dan kunt u deze e-mail negeren.',
  'portalInvite.subject': 'U bent uitgenodigd voor {workspace}',
  'portalInvite.preview': 'U bent uitgenodigd voor het portaal van {workspace}',
  'portalInvite.heading': 'U bent uitgenodigd!',
  'portalInvite.body':
    'U bent uitgenodigd voor het portaal van **{workspace}**. Klik hieronder om te accepteren en in te loggen.',
  'portalInvite.button': 'Uitnodiging accepteren',
  'portalInvite.ignore': 'Verwachtte u deze uitnodiging niet, dan kunt u deze e-mail negeren.',
  'newSignIn.subject': 'Nieuwe aanmelding bij uw account',
  'newSignIn.preview': 'Er is een nieuwe aanmelding bij uw account gedetecteerd',
  'newSignIn.heading': 'Nieuwe aanmelding bij uw account',
  'newSignIn.bodyWorkspace':
    'Iemand heeft zich zojuist aangemeld bij uw account voor {workspace} vanaf een apparaat dat we niet kennen.',
  'newSignIn.body':
    'Iemand heeft zich zojuist aangemeld bij uw account vanaf een apparaat dat we niet kennen.',
  'newSignIn.when': 'Wanneer:',
  'newSignIn.ip': 'IP:',
  'newSignIn.device': 'Apparaat:',
  'newSignIn.action':
    'Was u het zelf, dan hoeft u niets te doen. Zo niet, wijzig dan uw wachtwoord en sluit alle andere actieve sessies af.',
  'newSignIn.footer':
    'U ontvangt dit bericht omdat er een nieuwe aanmelding bij uw account is gedetecteerd. Deze meldingen zijn verplicht en kunnen niet worden uitgeschakeld.',
  'recovery.subject': 'Er is zojuist een herstelcode van uw account gebruikt',
  'recovery.preview': 'Er is een herstelcode gebruikt om in te loggen',
  'recovery.previewWorkspace': 'Er is een herstelcode gebruikt om in te loggen bij {workspace}',
  'recovery.heading': 'Er is een herstelcode gebruikt',
  'recovery.body':
    'Iemand heeft zich bij uw account aangemeld met een van uw opgeslagen herstelcodes.',
  'recovery.bodyWorkspace':
    'Iemand heeft zich bij uw account voor {workspace} aangemeld met een van uw opgeslagen herstelcodes.',
  'recovery.when': 'Wanneer:',
  'recovery.ip': 'IP-adres:',
  'recovery.device': 'Apparaat:',
  'recovery.ifYou':
    'Was u het zelf, dan hoeft u niets te doen. De code is nu verbruikt en kan niet opnieuw worden gebruikt.',
  'recovery.ifNot':
    'Was u het niet, log dan in en vernieuw direct uw herstelcodes. Wie de code heeft gebruikt, heeft nu een actieve sessie: sluit die af via uw beveiligingsinstellingen.',
  'recovery.footer':
    'U ontvangt dit bericht omdat er zojuist een herstelcode van uw account is gebruikt. Deze meldingen zijn verplicht en kunnen niet worden uitgeschakeld.',
  'status.open': 'Open',
  'status.under_review': 'In beoordeling',
  'status.planned': 'Gepland',
  'status.in_progress': 'In uitvoering',
  'status.complete': 'Voltooid',
  'status.closed': 'Gesloten',
  'statusChange.subject': 'Uw idee heeft nu de status “{status}”',
  'statusChange.preview': 'Uw idee heeft nu de status “{status}”',
  'statusChange.heading': 'Uw idee heeft nu de status “{status}”',
  'statusChange.body': 'Goed nieuws! De status van uw idee is bijgewerkt bij {workspace}.',
  'newComment.subject': 'Nieuwe reactie op “{title}”',
  'newComment.preview': 'Nieuwe reactie op “{title}”',
  'newComment.heading': 'Nieuwe reactie op uw idee',
  'newComment.body': '{name}{team} heeft gereageerd op uw idee bij {workspace}.',
  'newComment.team': ' (team)',
  'newComment.button': 'Reactie bekijken',
  'chat.reply.subject': 'Nieuw antwoord van {workspace}',
  'chat.reply.heading': 'Nieuw antwoord van {workspace}',
  'chat.reply.intro': '{sender} heeft geantwoord op uw gesprek met {workspace}.',
  'chat.reply.reason': 'U ontvangt deze e-mail omdat u een openstaand gesprek hebt met dit team.',
  'chat.started.subject': 'Nieuw bericht van {workspace}',
  'chat.started.heading': 'Nieuw bericht van {workspace}',
  'chat.started.intro': '{sender} van {workspace} heeft u een bericht gestuurd.',
  'chat.started.reason': 'U ontvangt deze e-mail omdat {workspace} u een bericht heeft gestuurd.',
  'chat.visitor.subject': 'Nieuw chatbericht bij {workspace}',
  'chat.visitor.heading': 'Nieuw chatbericht',
  'chat.visitor.intro': '{sender} is een gesprek gestart bij {workspace}.',
  'chat.visitor.reason': 'U ontvangt deze e-mail omdat u lid bent van deze werkruimte.',
  'chat.viewConversation': 'Gesprek bekijken',
  'chat.openInbox': 'Postvak IN openen',
  'mention.subject': '{name} heeft u genoemd in “{title}”',
  'mention.preview': '{name} heeft u genoemd in “{title}”',
  'mention.heading': 'U bent genoemd',
  'mention.body': '{name} heeft u genoemd in {title}.',
  'mention.anonymous': 'Een anonieme gebruiker',
  'mention.reason': 'U ontvangt deze e-mail omdat u bent genoemd bij {workspace}.',
  'changelog.subject': 'Nieuws: {title}',
  'changelog.preview': 'Nieuws van {workspace}: {title}',
  'changelog.heading': 'Nieuws gepubliceerd',
  'changelog.body': '{workspace} heeft zojuist nieuws gepubliceerd over uw idee.',
  'changelog.button': 'Nieuws bekijken',
  'changelog.reason':
    'U ontvangt deze e-mail omdat u een idee over dit nieuws hebt ingediend of ervoor bent geabonneerd.',
  'linked.subject': 'Uw idee is gekoppeld aan “{title}”',
  'linked.preview': 'Uw idee is gekoppeld aan “{title}”',
  'linked.heading': 'Uw idee wordt gevolgd!',
  'linked.thanksNamed': 'Bedankt, {name}!',
  'linked.thanks': 'Bedankt!',
  'linked.attributedBy':
    '{by} van het team van {workspace} heeft uw idee aan een bericht gekoppeld.',
  'linked.attributed': 'Uw idee is gekoppeld aan een bericht bij {workspace}.',
  'linked.updates':
    'U ontvangt updates wanneer de status verandert of er nieuwe reacties worden geplaatst.',
  'linked.reason': 'U ontvangt deze e-mail omdat uw idee aan dit bericht is gekoppeld.',
}

export const EMAIL_MESSAGES: Record<EmailLocale, Table> = { en, fr, it, es, de, nl }

/** Texte d'une clé dans la langue demandée, variables `{nom}` remplacées ; l'anglais en repli. */
export function t(
  locale: string | null | undefined,
  key: EmailKey,
  vars: Record<string, string | number> = {}
): string {
  const table = EMAIL_MESSAGES[normalizeEmailLocale(locale)]
  const raw = table[key] ?? en[key]
  return raw.replace(/\{(\w+)\}/g, (whole, name: string) =>
    name in vars ? String(vars[name]) : whole
  )
}

/** Le texte d'un statut : sa traduction si on la connaît, sinon son nom mis en capitales de mots. */
export function statusLabel(locale: string | null | undefined, status: string): string {
  const slug = status.toLowerCase().trim().replace(/\s+/g, '_')
  const key = `status.${slug}` as EmailKey
  if (key in en) return t(locale, key)
  return status
    .split(/[_\s]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/** `**gras**` -> <strong>, pour les phrases qui mettent un nom en valeur. */
export function rich(text: string): ReactNode {
  const parts = text.split('**')
  return createElement(
    Fragment,
    null,
    ...parts.map((part, i) =>
      i % 2 === 1
        ? createElement('strong', { key: i }, part)
        : createElement(Fragment, { key: i }, part)
    )
  )
}
