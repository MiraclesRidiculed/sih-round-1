import { connectMongo } from "../config/db.js";
import { demoDocuments, demoOwnershipEvents, demoParcels, demoUsers } from "../data/demoParcels.js";
import { DocumentRecord } from "../models/DocumentRecord.js";
import { OwnershipEvent } from "../models/OwnershipEvent.js";
import { Parcel } from "../models/Parcel.js";
import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { deriveDemoUserPassword } from "../utils/demoSeedCredentials.js";
import bcrypt from "bcryptjs";

export const seedUsers = async () => {
  if (env.nodeEnv === "production") {
    throw new Error("Demo user seeding is disabled in production.");
  }
  if (Buffer.byteLength(env.demoSeedPassword, "utf8") < 32) {
    throw new Error("Set DEMO_SEED_PASSWORD to at least 32 bytes of secret material before seeding demo users.");
  }

  const updatedUsers = [];
  for (const user of demoUsers) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(deriveDemoUserPassword(user.email), salt);
    const doc = await User.findOneAndUpdate(
      { email: user.email.toLowerCase() },
      {
        $set: {
          name: user.name,
          email: user.email.toLowerCase(),
          role: user.role,
          designation: user.designation,
          department: user.department,
          jurisdiction: user.jurisdiction || "National / Multi-State",
          passwordHash
        },
        $setOnInsert: {
          lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    updatedUsers.push(doc);
  }
  return updatedUsers;
};

export const seedParcelsAndRelated = async () => {
  const upsertedParcels = [];
  for (const parcel of demoParcels) {
    const doc = await Parcel.findOneAndUpdate(
      { parcelId: parcel.parcelId },
      { $set: parcel },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    upsertedParcels.push(doc);
  }

  const parcelMap = new Map(upsertedParcels.map((parcel) => [parcel.parcelId, parcel._id]));

  for (const event of demoOwnershipEvents) {
    const parcelMongoId = parcelMap.get(event.parcelId);
    if (parcelMongoId) {
      const { parcelId, ...eventData } = event;
      await OwnershipEvent.findOneAndUpdate(
        { parcel: parcelMongoId, eventType: event.eventType, eventDate: new Date(event.eventDate) },
        { $set: { ...eventData, parcel: parcelMongoId, eventDate: new Date(event.eventDate) } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }

  for (const document of demoDocuments) {
    const parcelMongoId = parcelMap.get(document.parcelId);
    if (parcelMongoId) {
      const { parcelId, ...docData } = document;
      await DocumentRecord.findOneAndUpdate(
        { sha256Hash: document.sha256Hash.toLowerCase() },
        { $set: { ...docData, parcel: parcelMongoId, sha256Hash: document.sha256Hash.toLowerCase() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
  }

  return upsertedParcels;
};

const runSeed = async () => {
  await connectMongo();

  const seededUsers = await seedUsers();
  const seededParcels = await seedParcelsAndRelated();

  console.log(`✓ Idempotent seed completed successfully.`);
  console.log(`  - Users verified/upserted: ${seededUsers.length}`);
  console.log(`  - Parcels verified/upserted: ${seededParcels.length}`);
  process.exit(0);
};

// Auto-run if executed directly
if (process.argv[1]?.endsWith("seedDemoData.js")) {
  runSeed().catch((error) => {
    console.error("Failed to seed demo data:", error);
    process.exit(1);
  });
}
