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
  const salaryMatch = !profile.expectedSalaryMin || !job.salaryMax || job.salaryMax >= profile.expectedSalaryMin;
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
