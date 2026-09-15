import "server-only";
import { readJson, writeJson } from "./data-store";
import type { ActivityLogEntry } from "./types";

const ACTIVITY_KEY = "activity-log.json";
const MAX_LOGS = 200;

export async function getActivityLogs(): Promise<ActivityLogEntry[]> {
  const stored = await readJson<ActivityLogEntry[]>(ACTIVITY_KEY);
  return stored || [];
}

export async function logActivity(username: string, action: string): Promise<void> {
  const logs = await getActivityLogs();
  logs.unshift({
    id: "LOG-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    username,
    action,
    timestamp: new Date().toISOString(),
  });
  await writeJson(ACTIVITY_KEY, logs.slice(0, MAX_LOGS));
}
