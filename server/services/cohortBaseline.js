import BodyProportions from "../models/BodyProportions.js";
import CohortRange from "../models/CohortRange.js";
import { featureEntries } from "./assessmentFeatures.js";

export const MIN_COHORT_SAMPLES = 30;
const bucket = (value) => Math.round(Number(value || 0) / 0.05) * 0.05;
export const cohortKeyFor = (profile) => [bucket(profile?.torsoToLegRatio), bucket(profile?.shoulderToHipRatio), bucket(profile?.limbLengthRatio)].join(":");

export async function baselineFor(userId, features) {
  const proportions = await BodyProportions.findOne({ userId }).lean();
  if (!proportions) return { cohortKey: null, values: {}, reason: "body_proportions_not_available" };
  const cohortKey = cohortKeyFor(proportions);
  const names = featureEntries(features).map(([name]) => name);
  const ranges = await CohortRange.find({ cohortKey, feature: { $in: names } }).lean();
  const byFeature = new Map(ranges.map((range) => [range.feature, range.stats]));
  const values = Object.fromEntries(featureEntries(features).map(([feature, value]) => {
    const stats = byFeature.get(feature);
    if (!stats || stats.sampleCount < MIN_COHORT_SAMPLES || !stats.std) return [feature, { value, zScore: null, sampleCount: stats?.sampleCount || 0 }];
    return [feature, { value, zScore: Number(((value - stats.mean) / stats.std).toFixed(3)), sampleCount: stats.sampleCount }];
  }));
  return { cohortKey, values };
}
