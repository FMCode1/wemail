import { google } from "googleapis";

export async function sendGmail(
  refreshToken: string,
  userEmail: string,
  to: string,
  subject: string,
  html: string,
  attachments: {
    filename: string;
    content: Buffer;
    contentType?: string;
  }[] = []
) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client,
  });

  const boundary = "wemail_boundary";

  let message = "";

  message += `From: ${userEmail}\r\n`;
  message += `To: ${to}\r\n`;
  message += `Subject: ${subject}\r\n`;
  message += `MIME-Version: 1.0\r\n`;
  message += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n`;
  message += `\r\n`;

  message += `--${boundary}\r\n`;
  message += `Content-Type: text/html; charset="UTF-8"\r\n`;
  message += `Content-Transfer-Encoding: 7bit\r\n`;
  message += `\r\n`;
  message += `${html}\r\n`;
  message += `\r\n`;

  for (const attachment of attachments) {
    const base64 = attachment.content.toString("base64");

    message += `--${boundary}\r\n`;
    message += `Content-Type: ${
      attachment.contentType || "application/octet-stream"
    }; name="${attachment.filename}"\r\n`;
    message += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
    message += `Content-Transfer-Encoding: base64\r\n`;
    message += `\r\n`;

    for (let i = 0; i < base64.length; i += 76) {
      message += base64.substring(i, i + 76) + "\r\n";
    }

    message += `\r\n`;
  }

  message += `--${boundary}--`;

  const encodedMessage = Buffer.from(message)
    .toString("base64url");

  await gmail.users.messages.send({
    userId: "me",
    requestBody: {
      raw: encodedMessage,
    },
  });
}
