/**
 * Populates the CareerCluster reference collection that drives the parent
 * portal's Career Insights — safe to run against a live database (upserts by
 * clusterId, touches nothing else). Unlike db:seed, this does not wipe any data.
 * Run once per environment: npm run db:seed-careers
 */

import mongoose from "mongoose"
import * as dotenv from "dotenv"
import path from "path"

dotenv.config({ path: path.resolve(__dirname, "../../.env") })

import CareerCluster from "../models/CareerCluster"
import { careerClustersData } from "./careerClustersData"

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error("MONGODB_URI not set in .env")

  await mongoose.connect(uri)
  console.log("Connected to MongoDB")

  let upserted = 0
  let updated = 0

  for (const cluster of careerClustersData) {
    const result = await CareerCluster.updateOne(
      { clusterId: cluster.clusterId },
      { $set: cluster },
      { upsert: true }
    )
    if (result.upsertedCount > 0) upserted++
    else if (result.modifiedCount > 0) updated++
  }

  console.log(`\n✅ Done: ${upserted} created, ${updated} updated, ${careerClustersData.length - upserted - updated} unchanged`)
  await mongoose.disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
