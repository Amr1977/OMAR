interface MatchingFactors {
  ageCompatibility: number;
  religiousCompatibility: number;
  locationCompatibility: number;
  educationCompatibility: number;
  maritalStatusMatch: number;
  profileCompleteness: number;
}

interface WardInfo {
  age?: number;
  nationality?: string;
  education?: string;
  maritalStatus?: string;
}

interface ProfileForMatching {
  wifeAgeMin: number;
  wifeAgeMax: number;
  madhab: string;
  prayerCommitment: string;
  quranMemorization: string;
  wifeNationality?: string | null;
  wifeCountry?: string | null;
  wifeEducation?: string | null;
  wifeMaritalStatus: string;
  wifeHasChildren: string;
  wifeReligiousLevel: string;
  education: string;
  displayName: string;
  selfIntroduction: string;
  additionalNotes?: string | null;
  religiousDescription?: string | null;
  wifeAdditionalNotes?: string | null;
  user?: { isVerified: boolean };
}

const matchingWeights = {
  ageCompatibility: 0.20,
  religiousCompatibility: 0.30,
  locationCompatibility: 0.15,
  educationCompatibility: 0.10,
  maritalStatusMatch: 0.15,
  profileCompleteness: 0.10,
};

export const calculateMatchScore = (
  profile: ProfileForMatching,
  ward: WardInfo
): { score: number; factors: MatchingFactors } => {
  const factors: MatchingFactors = {
    ageCompatibility: calculateAgeCompatibility(profile, ward),
    religiousCompatibility: calculateReligiousCompatibility(profile),
    locationCompatibility: calculateLocationCompatibility(profile, ward),
    educationCompatibility: calculateEducationCompatibility(profile, ward),
    maritalStatusMatch: calculateMaritalStatusMatch(profile, ward),
    profileCompleteness: calculateProfileCompleteness(profile),
  };

  const score = (
    factors.ageCompatibility * matchingWeights.ageCompatibility +
    factors.religiousCompatibility * matchingWeights.religiousCompatibility +
    factors.locationCompatibility * matchingWeights.locationCompatibility +
    factors.educationCompatibility * matchingWeights.educationCompatibility +
    factors.maritalStatusMatch * matchingWeights.maritalStatusMatch +
    factors.profileCompleteness * matchingWeights.profileCompleteness
  );

  return { score: Math.round(score * 100), factors };
};

const calculateAgeCompatibility = (profile: ProfileForMatching, ward: WardInfo): number => {
  if (!ward.age) return 0.5;
  if (ward.age >= profile.wifeAgeMin && ward.age <= profile.wifeAgeMax) return 1;
  const dist = Math.min(Math.abs(ward.age - profile.wifeAgeMin), Math.abs(ward.age - profile.wifeAgeMax));
  return Math.max(0, 1 - dist / 20);
};

const calculateReligiousCompatibility = (profile: ProfileForMatching): number => {
  let score = 0;
  const prayerValues: Record<string, number> = { ALWAYS: 1, MOSTLY: 0.8, SOMETIMES: 0.5, WORKING_ON_IT: 0.3 };
  score += prayerValues[profile.prayerCommitment] || 0.5;

  const quranValues: Record<string, number> = {
    FULL: 1, THREE_QUARTERS: 0.9, HALF: 0.7, QUARTER: 0.5,
    SOME_SURAHS: 0.3, FATIHA_ONLY: 0.1, NONE: 0,
  };
  score += quranValues[profile.quranMemorization] || 0.3;
  if (profile.religiousDescription && profile.religiousDescription.length > 50) score += 0.2;

  return Math.min(1, score / 2.2);
};

const calculateLocationCompatibility = (profile: ProfileForMatching, ward: WardInfo): number => {
  if (!ward.nationality) return 0.5;
  if (profile.wifeNationality === ward.nationality || !profile.wifeNationality) return 1;
  if (profile.wifeCountry === ward.nationality) return 0.8;
  return 0.3;
};

const calculateEducationCompatibility = (profile: ProfileForMatching, ward: WardInfo): number => {
  if (!ward.education || !profile.wifeEducation) return 0.5;
  if (profile.wifeEducation === 'any') return 1;
  if (profile.wifeEducation.toLowerCase().includes(ward.education.toLowerCase())) return 1;
  return 0.5;
};

const calculateMaritalStatusMatch = (profile: ProfileForMatching, ward: WardInfo): number => {
  if (!ward.maritalStatus) return 0.5;
  if (profile.wifeMaritalStatus === 'any' || profile.wifeMaritalStatus === ward.maritalStatus) return 1;
  return 0.3;
};

const calculateProfileCompleteness = (profile: ProfileForMatching): number => {
  const fields = [
    profile.displayName, profile.education, profile.selfIntroduction,
    profile.wifeReligiousLevel, profile.wifeMaritalStatus,
  ];
  const filled = fields.filter((f) => f && f.length > 0).length;
  const bonusFields = [profile.additionalNotes, profile.religiousDescription, profile.wifeAdditionalNotes];
  const bonusFilled = bonusFields.filter((f) => f && f.length > 0).length;
  return Math.min(1, (filled / fields.length) + (bonusFilled * 0.1));
};
