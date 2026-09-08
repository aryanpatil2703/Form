import fs from "fs/promises";
import path from "path";
import { MongoClient } from "mongodb";
import type { SelectHubPayload } from "./selecthub/payload";

type SubmissionStatus = "pending" | "submitted" | "failed";
export type SubmissionRecord = {
  id: string;
  created_at: string;
  status: SubmissionStatus;
  campaign_slug: string;
  scorecard_id: string;
  lead: Record<string, string>;
  selecthub_payload: SelectHubPayload;
  error?: string;
};

const localFile = path.join(process.cwd(), "data", "submissions.json");

function databaseConfigured() {
  return Boolean(process.env.MONGODB_URI && process.env.MONGODB_DB);
}

export function hasDurableSubmissionStore() {
  return databaseConfigured() || process.env.NODE_ENV !== "production";
}

declare global {
  var selectHubMongoClient: MongoClient | undefined;
  var selectHubMongoClientPromise: Promise<MongoClient> | undefined;
}

async function submissionsCollection() {
  const uri = process.env.MONGODB_URI;
  const database = process.env.MONGODB_DB;
  if (!uri || !database) throw new Error("MONGODB_URI and MONGODB_DB are required.");
  if (!global.selectHubMongoClientPromise) {
    const client = global.selectHubMongoClient || new MongoClient(uri);
    global.selectHubMongoClient = client;
    global.selectHubMongoClientPromise = client.connect();
  }
  const client = await global.selectHubMongoClientPromise;
  return client.db(database).collection<SubmissionRecord>("selecthub_submissions");
}

export async function ensureSubmissionCollection() {
  if (!databaseConfigured()) return;
  await (await submissionsCollection()).createIndex({ scorecard_id: 1 }, { unique: true });
  await (await submissionsCollection()).createIndex({ created_at: -1 });
}

export async function createSubmission(record: SubmissionRecord) {
  if (databaseConfigured()) {
    await ensureSubmissionCollection();
    await (await submissionsCollection()).insertOne(record);
    return;
  }
  const records = await readLocal();
  records.unshift(record);
  await fs.mkdir(path.dirname(localFile), { recursive: true });
  await fs.writeFile(localFile, JSON.stringify(records, null, 2), "utf8");
}

export async function updateSubmission(id: string, status: SubmissionStatus, error?: string) {
  if (databaseConfigured()) {
    await ensureSubmissionCollection();
    await (await submissionsCollection()).updateOne({ id }, { $set: { status, error } });
    return;
  }
  const records = await readLocal();
  const record = records.find((item) => item.id === id);
  if (record) {
    record.status = status;
    record.error = error;
    await fs.writeFile(localFile, JSON.stringify(records, null, 2), "utf8");
  }
}

export async function listSubmissions(): Promise<SubmissionRecord[]> {
  if (databaseConfigured()) {
    await ensureSubmissionCollection();
    return (await (await submissionsCollection()).find({}, { projection: { _id: 0 } }).sort({ created_at: -1 }).limit(1000).toArray()) as SubmissionRecord[];
  }
  return readLocal();
}

async function readLocal(): Promise<SubmissionRecord[]> {
  try {
    return JSON.parse(await fs.readFile(localFile, "utf8")) as SubmissionRecord[];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}
