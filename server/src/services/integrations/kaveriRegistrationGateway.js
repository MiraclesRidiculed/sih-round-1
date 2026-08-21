export const fetchRegistrationSnapshot = async (parcel, documents, ownershipEvents) => {
  const latestSaleDeed = documents
    .filter((document) => document.documentType === "SALE_DEED")
    .sort((left, right) => new Date(right.metadata.issueDate) - new Date(left.metadata.issueDate))[0];

  const latestRegistrationEvent = ownershipEvents
    .filter((event) => event.registrationNumber)
    .sort((left, right) => new Date(right.eventDate) - new Date(left.eventDate))[0];

  return {
    authorityLabel: "Kaveri Registration Demo Adapter",
    integrationMode: "demo",
    authoritative: false,
    disclaimer:
      "Registration and encumbrance details are demo records surfaced through a clean adapter because this MVP does not claim access to one canonical Karnataka API.",
    registrationReference: parcel.authoritativeRecords.registrationReference,
    registrationDate: parcel.authoritativeRecords.registrationDate,
    encumbranceCertificateNo: parcel.authoritativeRecords.encumbranceCertificateNo,
    encumbranceStatus: parcel.authoritativeRecords.encumbranceStatus,
    latestSaleDeedHash: latestSaleDeed?.sha256Hash || "",
    latestRegisteredOwnerNames: latestRegistrationEvent?.owners?.map((owner) => owner.name) || []
  };
};

