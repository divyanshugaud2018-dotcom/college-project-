import 'dotenv/config';

const clientId = process.env.GMAIL_CLIENT_ID;
const clientSecret = process.env.GMAIL_CLIENT_SECRET;
const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
const sender = process.env.GMAIL_SENDER;

if (!clientId || !clientSecret || !refreshToken || !sender) {
  console.error('Missing one or more Gmail env vars: GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN, GMAIL_SENDER');
  process.exit(1);
}

console.log('Checking Gmail OAuth setup...');
console.log('Client ID present:', Boolean(clientId));
console.log('Client secret present:', Boolean(clientSecret));
console.log('Refresh token present:', Boolean(refreshToken));
console.log('Sender present:', Boolean(sender));

const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  }),
});

const tokenText = await tokenRes.text();
console.log('Token status:', tokenRes.status);
if (!tokenRes.ok) {
  console.error(tokenText);
  console.error('Fix: check the OAuth client credentials and refresh token. Recreate the refresh token if needed.');
  process.exit(1);
}

const token = JSON.parse(tokenText);
const accessToken = token.access_token;
if (!accessToken) {
  console.error('No access token returned.');
  process.exit(1);
}

const message = [
  `From: ${sender}`,
  'To: student@college.ac.in',
  'Subject: DoubtNest Gmail verification test',
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset="UTF-8"',
  '',
  'This is a Gmail OAuth smoke test from DoubtNest.'
].join('\r\n');

const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ raw: Buffer.from(message).toString('base64url') }),
});

const gmailText = await gmailRes.text();
console.log('Gmail send status:', gmailRes.status);
console.log(gmailText);

if (!gmailRes.ok) {
  console.error('Fix required: enable Gmail API in the Google Cloud project for this OAuth client and re-create the refresh token.');
  process.exit(1);
}

console.log('Gmail send succeeded. OTP email flow is ready.');
