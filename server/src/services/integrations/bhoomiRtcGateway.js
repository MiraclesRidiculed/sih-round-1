export const fetchRtcSnapshot = async (parcel) => ({
  authorityLabel: "Bhoomi RTC Demo Adapter",
  integrationMode: "demo",
  authoritative: false,
  disclaimer:
    "This MVP does not assume a universal live Karnataka government API. RTC-style data below is seeded demo data shaped through a Bhoomi-like adapter.",
  rtcNumber: parcel.authoritativeRecords.rtcNumber,
  rtcLastUpdated: parcel.authoritativeRecords.rtcLastUpdated,
  khataStatus: parcel.authoritativeRecords.khataStatus,
  mutationNumber: parcel.authoritativeRecords.mutationNumber,
  mutationStatus: parcel.authoritativeRecords.mutationStatus,
  currentKhatedars: parcel.currentOwners.map((owner) => owner.name),
  landUse: parcel.landUse,
  landClassification: parcel.landClassification
});

