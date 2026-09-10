const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

function parseEnv(filePath) {
  const env = {};
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index === -1) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    env[key] = value;
  }
  return env;
}

async function main() {
  const root = process.cwd();
  const env = parseEnv(path.join(root, ".env"));
  const uri = env.MONGODB_URI;
  const dbName = env.MONGODB_DB;

  if (!uri || !dbName) {
    throw new Error("MONGODB_URI or MONGODB_DB missing in .env");
  }

  const records = JSON.parse(fs.readFileSync(path.join(root, "data", "submissions.json"), "utf8"));

  const client = new MongoClient(uri);
  await client.connect();
  try {
    const collection = client.db(dbName).collection("selecthub_submissions");

    let upserts = 0;
    let updates = 0;

    for (const record of records) {
      const result = await collection.updateOne(
        { id: record.id },
        { $set: record },
        { upsert: true },
      );
      if (result.upsertedCount > 0) upserts += 1;
      else if (result.matchedCount > 0) updates += 1;
    }

    const totalInCollection = await collection.countDocuments();
    console.log(
      JSON.stringify(
        { seededFromJson: records.length, upserts, updates, totalInCollection },
        null,
        2,
      ),
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("Mongo seed failed:", error.message);
  process.exit(1);
});
