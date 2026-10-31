const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
})[character]);

export const buildPasswordResetEmail = ({ name, resetUrl }) => {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(resetUrl);
  return {
    subject: "Reset your HirePulse password",
    text: [
      `Hi ${name},`,
      "",
      "We received a request to reset your HirePulse password.",
      `Reset your password using this link (valid for one hour): ${resetUrl}`,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: `<!doctype html>
      <html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
        <table role="presentation" width="100%" style="border-spacing:0;background:#f1f5f9"><tr><td align="center" style="padding:32px 12px">
          <table role="presentation" width="100%" style="max-width:560px;border-spacing:0;background:#fff;border-radius:16px">
            <tr><td style="padding:32px">
              <h1 style="margin:0 0 16px;font-size:24px">Reset your password</h1>
              <p style="color:#475569;line-height:1.6">Hi ${safeName}, we received a request to reset your HirePulse password. This link expires in one hour.</p>
              <p style="margin:24px 0"><a href="${safeUrl}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#0f766e;color:#fff;font-weight:600;text-decoration:none">Reset password</a></p>
              <p style="color:#64748b;font-size:13px;line-height:1.6">If you did not request this, you can ignore this email. Your password will not change.</p>
            </td></tr>
          </table>
        </td></tr></table>
      </body></html>`,
  };
};
