import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { refineCohortRanges } from "./refineCohortRanges.js";
import logger from "../utils/logger.js";

const queueName = "repups-ml-maintenance";
export function startMlSchedule() {
  if (!process.env.REDIS_URL) { logger.info("ML maintenance queue disabled: REDIS_URL is not configured"); return null; }
  const connection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
  const queue = new Queue(queueName, { connection });
  const worker = new Worker(queueName, async () => {
    await refineCohortRanges();
    const url = process.env.ML_SERVICE_URL;
    if (url) await fetch(`${url.replace(/\/$/, "")}/ml/v1/pipeline/export-train`, { method: "POST" }).catch(() => null);
  }, { connection });
  worker.on("failed", (_job, error) => logger.error({ error }, "ML maintenance job failed"));
  queue.upsertJobScheduler("nightly-ml-maintenance", { pattern: "0 2 * * *" }, { name: "nightly-ml-maintenance", data: {} }).catch((error) => logger.error({ error }, "Unable to schedule ML maintenance"));
  logger.info("ML maintenance queue scheduled for 02:00 daily");
  return { queue, worker };
}
