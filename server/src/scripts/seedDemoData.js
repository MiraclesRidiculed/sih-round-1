import { connectMongo } from "../config/db.js";
import { demoDocuments, demoOwnershipEvents, demoParcels, demoUsers } from "../data/demoParcels.js";
import { DocumentRecord } from "../models/DocumentRecord.js";
import { OwnershipEvent } from "../models/OwnershipEvent.js";
import { Parcel } from "../models/Parcel.js";
import { User } from "../models/User.js";
import { VerificationScan } from "../models/VerificationScan.js";

const seed = async () => {
  await connectMongo();

  await Promise.all([
    VerificationScan.deleteMany({}),
    DocumentRecord.deleteMany({}),
    OwnershipEvent.deleteMany({}),
    Parcel.deleteMany({}),
    User.deleteMany({})
  ]);

  const insertedParcels = await Parcel.insertMany(demoParcels);
  const parcelMap = new Map(insertedParcels.map((parcel) => [parcel.parcelId, parcel._id]));

  await OwnershipEvent.insertMany(
    demoOwnershipEvents.map((event) => ({
      ...event,
      parcel: parcelMap.get(event.parcelId)
    }))
  );

  await DocumentRecord.insertMany(
    demoDocuments.map((document) => ({
      ...document,
      parcel: parcelMap.get(document.parcelId)
    }))
  );

  await User.insertMany(demoUsers);

  console.log(`Seeded ${insertedParcels.length} Karnataka demo parcels`);
  process.exit(0);
};

seed().catch((error) => {
  console.error("Failed to seed demo data", error);
  process.exit(1);
});

