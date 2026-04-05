const API_BASE = process.env.API_BASE || "http://localhost:9090";

const COMMENT_BANK = {
  Photography: [
    "We wanted a candid, documentary-style gallery and they delivered exactly that.",
    "Turnaround was fast and the final album felt polished without looking over-edited.",
    "They handled family portraits and event coverage smoothly from start to finish.",
    "Strong eye for lighting and crowd moments. The preview set looked great.",
  ],
  Florist: [
    "The floral design felt elevated and matched the event palette perfectly.",
    "Centerpieces looked fuller than expected and still held up through the night.",
    "Easy to collaborate with and quick to adjust the arrangement plan.",
  ],
  Catering: [
    "Guests kept asking who handled the food. Service timing was sharp all evening.",
    "The menu felt thoughtful and the setup looked clean and professional.",
    "Staff stayed organized during a busy service window and kept things moving.",
  ],
  Venue: [
    "The room layout worked well for both dinner and dancing. Coordination was smooth.",
    "A strong space for medium-size events with a clean setup flow.",
    "The venue team was responsive and flexible during planning.",
  ],
  DJ: [
    "Read the room well and kept the energy balanced without overpowering the event.",
    "Transitions were clean and the playlist felt tailored to the crowd.",
    "Handled announcements clearly and kept the pace moving all night.",
  ],
  default: [
    "Easy to work with, responsive, and dependable on event day.",
    "Good communication throughout planning and a polished final result.",
    "Professional team and a much smoother experience than expected.",
  ],
};

const NAME_BANK = [
  "Jordan",
  "Maya",
  "Alex",
  "Priya",
  "Chris",
  "Taylor",
  "Morgan",
  "Sam",
  "Nina",
  "Elijah",
  "Camila",
  "Noah",
];

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

function plannedRatings(seed, count) {
  const patterns = [
    [5, 5, 4],
    [5, 4, 4, 5],
    [4, 4, 5, 4, 5],
    [5, 5, 5, 4, 5, 4],
    [4, 5],
  ];
  const pattern = patterns[seed % patterns.length];
  return pattern.slice(0, count);
}

async function main() {
  const vendors = await http("/vendors");
  if (!Array.isArray(vendors)) throw new Error("Unexpected /vendors payload");

  let created = 0;
  let skipped = 0;

  for (const vendor of vendors) {
    const existing = await http(`/vendors/${vendor.id}/reviews`);
    if (Array.isArray(existing) && existing.length >= 5) {
      skipped += 1;
      continue;
    }

    const seed = hashCode(`${vendor.businessName}-${vendor.category}-${vendor.city}`);
    const desiredCount = 1 + (seed % 7);
    const toCreate = Math.max(0, desiredCount - (existing?.length || 0));
    const comments = COMMENT_BANK[vendor.category] || COMMENT_BANK.default;
    const ratings = plannedRatings(seed, desiredCount);

    for (let i = 0; i < toCreate; i += 1) {
      const reviewIndex = (existing?.length || 0) + i;
      const rating = ratings[reviewIndex] || 4;
      const name = NAME_BANK[(seed + reviewIndex) % NAME_BANK.length];
      const comment = comments[(seed + reviewIndex) % comments.length];

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
