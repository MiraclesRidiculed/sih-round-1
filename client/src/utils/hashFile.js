export const hashFileSha256 = async (file) => {
  const buffer = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buffer);
  const bytes = Array.from(new Uint8Array(hash));
  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
};

