export const formatDate = (value) => {
  if (!value) {
    return "Not available";
  }

  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(new Date(value));
};

export const formatArea = (acres) => `${Number(acres || 0).toFixed(2)} acres`;

export const shortHash = (hash) => {
  if (!hash) {
    return "Not anchored";
  }

  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};

export const ownerLine = (owners = []) =>
  owners.map((owner) => `${owner.name}${owner.sharePercent ? ` (${owner.sharePercent}%)` : ""}`).join(", ");

