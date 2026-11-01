const ANNUAL_PERIOD_FACTORS = {
  monthly: 12,
  yearly: 1,
  // Approximate full-time annual hours; actual hours vary by role and location.
  hourly: 2080,
};

const normalizeSalary = (amount, period) => amount * ANNUAL_PERIOD_FACTORS[period];

const salaryMatches = (profile, job) => {
  const expectedMin = profile.expectedSalaryMin > 0 ? profile.expectedSalaryMin : null;
  const expectedMax = profile.expectedSalaryMax > 0 ? profile.expectedSalaryMax : null;
  if ((expectedMin === null && expectedMax === null)
    || (job.salaryMin == null && job.salaryMax == null)) return true;

  const profileCurrency = (profile.currency || "USD").toUpperCase();
  const jobCurrency = (job.currency || "USD").toUpperCase();
  if (profileCurrency !== jobCurrency) return true;

  const profilePeriod = profile.expectedSalaryPeriod || "monthly";
  const jobPeriod = job.salaryPeriod || "monthly";
  const normalizedExpectedMin = expectedMin === null
    ? null
    : normalizeSalary(expectedMin, profilePeriod);
  const normalizedExpectedMax = expectedMax === null
    ? null
    : normalizeSalary(expectedMax, profilePeriod);
  const normalizedJobMin = job.salaryMin == null
    ? null
    : normalizeSalary(job.salaryMin, jobPeriod);
  const normalizedJobMax = job.salaryMax == null
    ? null
    : normalizeSalary(job.salaryMax, jobPeriod);

  return !(normalizedJobMax !== null
    && normalizedExpectedMin !== null
    && normalizedJobMax < normalizedExpectedMin)
    && !(normalizedExpectedMax !== null
      && normalizedJobMin !== null
      && normalizedJobMin > normalizedExpectedMax);
};

export const scoreApplicantJobMatch = (profile, job) => {
  const skills = new Set((profile.skills || []).map((skill) => skill.toLowerCase()));
  const required = [...new Set((job.requiredSkills || []).map((skill) => skill.toLowerCase()))];
  const matchedSkills = required.filter((skill) => skills.has(skill));
  const missingSkills = required.filter((skill) => !skills.has(skill));
  const skillScore = required.length ? (matchedSkills.length / required.length) * 100 : 100;
  const now = new Date();
  const experienceYears = (profile.experience || []).reduce((total, experience) => {
    if (!experience.startDate) return total;
    const end = experience.current || !experience.endDate ? now : experience.endDate;
    return total + Math.max(end - experience.startDate, 0) / (365.25 * 24 * 60 * 60 * 1000);
  }, 0);
  const experienceScore = job.minExperienceYears === 0
    ? 100
    : Math.min((experienceYears / job.minExperienceYears) * 100, 100);
  const preferredWorkModes = profile.preferredWorkModes || [];
  const preferredLocations = profile.preferredLocations || [];
  const workMatch = !preferredWorkModes.length || preferredWorkModes.includes(job.workMode);
  const locationMatch = job.workMode === "remote"
    || !preferredLocations.length
    || preferredLocations.some((location) => job.location?.toLowerCase().includes(location.toLowerCase()));
  const locationScore = workMatch && locationMatch ? 100 : 25;
  const salaryMatch = salaryMatches(profile, job);
  const salaryScore = salaryMatch ? 100 : 0;
  const score = Math.round(skillScore * 0.6 + experienceScore * 0.2 + locationScore * 0.15 + salaryScore * 0.05);

  return {
    score,
    breakdown: {
      requiredSkills: skillScore,
      experience: experienceScore,
      locationAndWorkMode: locationScore,
      salaryMin: salaryScore,
    },
    matchedSkills,
    missingSkills,
    explanation: `${matchedSkills.length} of ${required.length} required skills match; ${locationMatch && workMatch ? "work preferences align" : "work preferences may differ"}.`,
  };
};
