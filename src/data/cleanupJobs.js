export const TOTAL_CLEANUP_LEVELS = 750;

export const COMMONS_RUBBISH_JOB = Object.freeze({
  id: "commons-rubbish-cluster",
  jobId: "job-waste-park-commons-001",
  jobType: "waste",
  gameKey: "waste-collection",
  title: "Willow Commons Rubbish Cluster",
  shortTitle: "Commons rubbish",
  zone: "park",
  icon: "🧹",
  world: Object.freeze({
    x: 1810,
    y: 1300,
    approach: Object.freeze({ x: 1738, y: 1340 }),
    interactionRadius: 112,
  }),
  items: Object.freeze([
    Object.freeze({ id: "commons-bottle", type: "bottle", label: "Plastic bottle", icon: "🧴", x: 492, y: 224, color: 0x75b8c5 }),
    Object.freeze({ id: "commons-can", type: "can", label: "Empty can", icon: "🥫", x: 775, y: 218, color: 0xa6acb0 }),
    Object.freeze({ id: "commons-cup", type: "cup", label: "Takeaway cup", icon: "🥤", x: 1024, y: 303, color: 0xc99167 }),
    Object.freeze({ id: "commons-wrapper", type: "wrapper", label: "Food wrapper", icon: "🍬", x: 620, y: 420, color: 0xd66b70 }),
    Object.freeze({ id: "commons-paper", type: "paper", label: "Wet newspaper", icon: "📰", x: 905, y: 476, color: 0xd6d1bd }),
    Object.freeze({ id: "commons-tissue", type: "tissue", label: "Dirty tissue", icon: "🧻", x: 380, y: 512, color: 0xe9e4d6 }),
  ]),
});

export const CLEANUP_JOBS = Object.freeze({
  [COMMONS_RUBBISH_JOB.id]: COMMONS_RUBBISH_JOB,
});

export function validateCleanupJobs(jobs = CLEANUP_JOBS) {
  const errors = [];
  for (const [targetId, job] of Object.entries(jobs)) {
    if (job.id !== targetId) errors.push(`${targetId} has a mismatched target id.`);
    if (job.jobType !== "waste" || job.gameKey !== "waste-collection") errors.push(`${targetId} is not a Waste Collection job.`);
    if (!job.world || !Number.isFinite(job.world.x) || !Number.isFinite(job.world.y)) errors.push(`${targetId} has no valid town position.`);
    const ids = job.items?.map((item) => item.id) || [];
    if (ids.length < 1 || new Set(ids).size !== ids.length) errors.push(`${targetId} must contain unique rubbish items.`);
  }
  return { ok: errors.length === 0, errors };
}
