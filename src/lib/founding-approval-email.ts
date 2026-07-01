const SITE = "https://connections.inm8tebook.net";
const SIGNUP_URL = `${SITE}/auth?mode=signup`;
const SUPPORT = "support@inm8tebook.net";

export function foundingInviteEmail(firstName: string, email: string) {
  const greeting = firstName.trim() && firstName.toLowerCase() !== "there" ? firstName : "there";
  const subject = "You're invited to join Anew";
  const body = `Hi ${greeting},

You've been personally invited to join Anew's founding group — a private community for people beginning a new chapter, and for those open to loving someone beyond their past.

Create your account here (about two minutes):

${SIGNUP_URL}

Please sign up using this email address: ${email}

Once you're in, you'll complete a short profile and can start exploring the community.

If you have any questions, reply to this email or write to ${SUPPORT}.

Warmly,
The Anew team`;

  return { subject, body, mailto: mailtoLink(email, subject, body) };
}

export function foundingApprovalEmail(firstName: string, email: string) {
  const subject = "You're invited to join Anew";
  const body = `Hi ${firstName},

Thank you for applying to Anew. We've reviewed your application and would love to welcome you to our founding group.

Your next step is to create your account (about two minutes):

${SIGNUP_URL}

Please sign up using this email address: ${email}

Once you're in, you'll complete a short profile and can start exploring the community.

If you have any questions, reply to this email or write to ${SUPPORT}.

Warmly,
The Anew team`;

  return { subject, body, mailto: mailtoLink(email, subject, body) };
}

export function foundingDenialEmail(firstName: string) {
  const subject = "Your Anew application";
  const body = `Hi ${firstName},

Thank you for taking the time to apply to Anew and for sharing a bit of your story with us.

After careful review, we're not able to offer you a place in the founding group at this time. We're opening slowly to keep the community intentional and manageable.

If you believe we missed something, you're welcome to reach out at ${SUPPORT}.

We appreciate your interest and wish you well.

Warmly,
The Anew team`;

  return { subject, body };
}

function mailtoLink(to: string, subject: string, body: string) {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function copyApprovalEmail(firstName: string, email: string) {
  const { subject, body } = foundingApprovalEmail(firstName, email);
  const text = `Subject: ${subject}\n\n${body}`;
  await navigator.clipboard.writeText(text);
}

export async function copyDenialEmail(firstName: string) {
  const { subject, body } = foundingDenialEmail(firstName);
  const text = `Subject: ${subject}\n\n${body}`;
  await navigator.clipboard.writeText(text);
}
