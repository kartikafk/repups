import BodyProportions from "../models/BodyProportions.js";
import CohortRange from "../models/CohortRange.js";
import PostureRecord from "../models/PostureRecord.js";
import Session from "../models/Session.js";
import { cohortKeyFor, MIN_COHORT_SAMPLES } from "../services/cohortBaseline.js";
import { featureEntries } from "../services/assessmentFeatures.js";

const makeStats = (values) => { const mean = values.reduce((total, value) => total + value, 0) / values.length; return { mean, std: Math.sqrt(values.reduce((total, value) => total + (value - mean) ** 2, 0) / values.length), sampleCount: values.length }; };

export async function refineCohortRanges() {
  const profiles = await BodyProportions.find().lean();
  const cohorts = new Map();
  profiles.forEach((profile) => { const cohortKey = cohortKeyFor(profile); cohorts.set(cohortKey, [...(cohorts.get(cohortKey) || []), String(profile.userId)]); });
  for (const [cohortKey, userIds] of cohorts) {
    if (userIds.length < MIN_COHORT_SAMPLES) continue;
    const [posture, sessions] = await Promise.all([PostureRecord.find({ profileId: { $in: userIds } }).select("featureVector overallScore").lean(), Session.find({ userId: { $in: userIds } }).select("featureVector").lean()]);
    const valuesByFeature = new Map();
    [...posture.map((item) => item.featureVector || { overallScore: item.overallScore }), ...sessions.map((item) => item.featureVector || {})].forEach((sample) => featureEntries(sample).forEach(([feature, value]) => valuesByFeature.set(feature, [...(valuesByFeature.get(feature) || []), value])));
    for (const [feature, values] of valuesByFeature) if (values.length >= MIN_COHORT_SAMPLES) await CohortRange.findOneAndUpdate({ cohortKey, feature }, { stats: makeStats(values), lastComputedAt: new Date() }, { upsert: true });
  }
}
