const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
})[character]);

const formatSalary = (job) => {
  if (job.salaryMin == null && job.salaryMax == null) return "Salary not listed";
  const currency = job.currency || "USD";
  const min = job.salaryMin == null ? null : `${currency} ${job.salaryMin.toLocaleString("en-US")}`;
  const max = job.salaryMax == null ? null : `${currency} ${job.salaryMax.toLocaleString("en-US")}`;
  if (min && max) return `${min} - ${max}`;
  return min || `Up to ${max}`;
};

export const buildJobRecommendationsEmail = ({ applicantName, jobs, frontendUrl }) => {
  const safeName = escapeHtml(applicantName);
  const cards = jobs.map(({ job, match }) => {
    const title = escapeHtml(job.title);
    const company = escapeHtml(job.company?.name || "Company");
    const category = escapeHtml(job.category?.name || "");
    const location = escapeHtml(job.workMode === "remote" ? "Remote" : job.location || job.workMode);
    const employmentType = escapeHtml((job.employmentType || "job").replaceAll("_", " "));
    const salary = escapeHtml(formatSalary(job));
    const reason = escapeHtml(match.explanation);
    const skills = match.matchedSkills.length
      ? `<div style="margin-top:12px;color:#475569;font-size:13px">Matching skills: ${escapeHtml(match.matchedSkills.join(", "))}</div>`
      : "";
    const link = `${frontendUrl}/jobs/${encodeURIComponent(String(job._id))}`;
    return `
      <tr><td style="padding:0 0 16px">
        <table role="presentation" width="100%" style="border:1px solid #e2e8f0;border-radius:12px;border-spacing:0">
          <tr><td style="padding:20px">
            <p style="margin:0 0 6px;color:#0f766e;font-size:12px;font-weight:700;text-transform:uppercase">${match.score}% match${category ? ` · ${category}` : ""}</p>
            <h2 style="margin:0 0 5px;font-size:19px;line-height:1.35"><a href="${escapeHtml(link)}" style="color:#0f172a;text-decoration:none">${title}</a></h2>
            <p style="margin:0;color:#475569">${company} · ${location}</p>
            <p style="margin:10px 0 0;color:#475569;font-size:13px">${employmentType} · ${salary}</p>
            <p style="margin:12px 0 0;color:#334155;font-size:14px">${reason}</p>${skills}
            <div style="height:16px;line-height:16px">&nbsp;</div>
            <a href="${escapeHtml(link)}" style="display:inline-block;padding:10px 16px;border-radius:8px;background:#0f766e;color:#fff;font-size:14px;font-weight:600;text-decoration:none">View job</a>
          </td></tr>
        </table>
      </td></tr>`;
  }).join("");

  const text = [
    `Hi ${applicantName},`,
    "",
    "Here are new jobs that match your profile:",
    ...jobs.flatMap(({ job, match }) => [
      "",
      `${job.title} at ${job.company?.name || "Company"} (${match.score}% match)`,
      `${job.workMode === "remote" ? "Remote" : job.location || job.workMode} | ${formatSalary(job)}`,
      match.explanation,
      `${frontendUrl}/jobs/${encodeURIComponent(String(job._id))}`,
    ]),
    "",
    `Manage email preferences: ${frontendUrl}/applicant/profile`,
  ].join("\n");

  return {
    subject: `${jobs.length} new job${jobs.length === 1 ? "" : "s"} matched to your profile`,
    text,
    html: `<!doctype html>
      <html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a">
        <table role="presentation" width="100%" style="border-spacing:0;background:#f1f5f9"><tr><td align="center" style="padding:32px 12px">
          <table role="presentation" width="100%" style="max-width:620px;border-spacing:0;background:#fff;border-radius:16px">
            <tr><td style="padding:30px 28px 20px">
              <p style="margin:0 0 8px;color:#0f766e;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Your job digest</p>
              <h1 style="margin:0 0 10px;font-size:26px;line-height:1.25">Fresh opportunities, ${safeName}</h1>
              <p style="margin:0;color:#475569;font-size:15px;line-height:1.6">We found ${jobs.length} recently published ${jobs.length === 1 ? "job" : "jobs"} that match your profile.</p>
            </td></tr>
            <tr><td style="padding:8px 20px 4px"><table role="presentation" width="100%" style="border-spacing:0">${cards}</table></td></tr>
            <tr><td style="padding:12px 28px 28px;color:#64748b;font-size:12px;line-height:1.6">
              You received this email because you opted in to job recommendation emails.
              <a href="${escapeHtml(`${frontendUrl}/applicant/profile`)}" style="color:#0f766e">Manage your email preferences</a>.
            </td></tr>
          </table>
        </td></tr></table>
      </body></html>`,
  };
};
