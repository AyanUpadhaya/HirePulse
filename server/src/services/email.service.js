import { Message, SMTPClient } from "emailjs";
import { env } from "../config/env.js";

export const sendEmail = async ({ to, subject, text, html }) => {
  if (!env.isEmailConfigured) throw new Error("SMTP email is not configured");
  const client = new SMTPClient({
    host: env.smtpHost,
    port: env.smtpPort,
    user: env.smtpUser,
    password: env.smtpPassword,
    ssl: env.smtpSecure || env.smtpPort === 465,
    tls: !env.smtpSecure && env.smtpPort !== 465,
    timeout: 15000,
  });
  try {
    return await client.sendAsync(new Message({
      from: env.emailFrom,
      to,
      subject,
      text,
      attachment: [{ data: html, alternative: true, contentType: "text/html" }],
    }));
  } finally {
    client.smtp.close();
  }
};
