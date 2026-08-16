export async function getCoachResponse(context, question = "") {
  const latest = context.records[0];
  const focus = latest?.findings?.[0] || "steady, controlled movement";
  const score = Number.isFinite(latest?.score) ? ` Your latest score is ${Math.round(latest.score)}.` : "";
  const prefix = question ? `For “${question}”, ` : "";
  return { message: `${prefix}start with ${focus}. Keep the load comfortable, move slowly, and stop if you feel pain.${score} ${context.trend}`, mode: "mock" };
}
