const API_BASE = process.env.API_BASE || "http://localhost:9090";

const COMMENTS_BY_CATEGORY = {
  Photography: "Fantastic direction and quick edits. The gallery captured all the key moments beautifully.",
  Florist: "Arrangements were fresh, on-theme, and looked even better than the mockups.",
  Catering: "Food quality and service timing were excellent. Guests kept complimenting the menu.",
  Venue: "Great space and smooth coordination on event day. Setup and teardown were organized.",
  DJ: "Great playlist balance and crowd reading. Kept the dance floor active all night.",
  Videography: "Professional filming and a polished highlight video delivered quickly.",
  Planner: "Very organized timeline and calm communication from start to finish.",
  default: "Great communication and dependable service. Would book again.",
};

const NAMES = ["Jordan", "Maya", "Alex", "Priya", "Sam", "Taylor", "Chris", "Morgan"];

async function http(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  const text = await res.text();
  let body = text;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    // keep text fallback
  }

  if (!res.ok) {
    const msg =
      (body && body.message) ||
      (body && body.error) ||
      (typeof body === "string" ? body : "") ||
      `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return body;
}

function hashCode(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

async function main() {
  const vendors = await http("/vendors");
  if (!Array.isArray(vendors)) throw new Error("Unexpected /vendors payload");

  let created = 0;
  let skipped = 0;

  for (const vendor of vendors) {
    const existing = await http(`/vendors/${vendor.id}/reviews`);
    if (Array.isArray(existing) && existing.length >= 2) {
      skipped += 1;
      continue;
    }

    const baseHash = hashCode(`${vendor.businessName}-${vendor.category}`);
    const toCreate = Math.max(0, 2 - (existing?.length || 0));

    for (let i = 0; i < toCreate; i += 1) {
      const rating = 4 + ((baseHash + i) % 2); // 4 or 5
      const name = NAMES[(baseHash + i) % NAMES.length];
      const comment =
        COMMENTS_BY_CATEGORY[vendor.category] || COMMENTS_BY_CATEGORY.default;

      await http(`/vendors/${vendor.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name,
          rating,
          comment,
        }),
      });
      created += 1;
    }
  }

  console.log(`Review seeding complete. Created: ${created}, Skipped vendors: ${skipped}`);
}

main().catch((err) => {
  console.error(`Review seeding failed: ${err.message}`);
  process.exit(1);
});
