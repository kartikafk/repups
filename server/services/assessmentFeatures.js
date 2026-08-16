const key = (value = "") => String(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

export function postureFeatures({ overallScore, planes = {} } = {}) {
  const features = { overallScore: Number(overallScore) };
  for (const [planeName, plane] of Object.entries(planes)) {
    if (Number.isFinite(Number(plane?.score))) features[`${key(planeName)}_score`] = Number(plane.score);
    for (const joint of plane?.joints || []) {
      if (Number.isFinite(Number(joint?.value))) features[`${key(planeName)}_${key(joint.metric || joint.label)}`] = Number(joint.value);
    }
  }
  return Object.fromEntries(Object.entries(features).filter(([, value]) => Number.isFinite(value)));
}

export function sessionFeatures({ avgScore, avgRom, consistency, repCount, avgTempo = {} } = {}) {
  return Object.fromEntries(Object.entries({ avgScore: Number(avgScore), avgRom: Number(avgRom), consistency: Number(consistency), repCount: Number(repCount), eccTempo: Number(avgTempo?.ecc), pauseTempo: Number(avgTempo?.pause), conTempo: Number(avgTempo?.con) }).filter(([, value]) => Number.isFinite(value)));
}

export const featureEntries = (features = {}) => Object.entries(features).filter(([, value]) => Number.isFinite(value));
