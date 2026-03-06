const API_BASE = process.env.API_BASE || "http://localhost:9090";

const METRO_DETROIT_CITIES = new Set([
  "Detroit",
  "Dearborn",
  "Dearborn Heights",
  "Royal Oak",
  "Southfield",
  "Novi",
  "Warren",
  "Troy",
  "Ferndale",
  "Livonia",
  "Canton",
  "Birmingham",
  "Rochester Hills",
  "West Bloomfield",
  "Grosse Pointe",
  "Ann Arbor",
  "Madison Heights",
  "Plymouth",
  "Bloomfield Hills",
  "Farmington Hills",
  "Sterling Heights",
  "Oak Park",
  "Pontiac",
  "Hamtramck",
  "Clawson",
  "Auburn Hills",
  "Allen Park",
  "Taylor",
  "Redford",
  "Wyandotte",
]);

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
    // Keep text body as-is for error reporting.
  }

  if (!res.ok) {
    const message =
      (body && body.message) ||
      (body && body.error) ||
      (typeof body === "string" ? body : "") ||
      `HTTP ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}

function isMetroDetroitCity(city) {
  return METRO_DETROIT_CITIES.has(String(city || "").trim());
}

async function main() {
  const vendors = await http("/vendors");
  if (!Array.isArray(vendors)) {
    throw new Error("Unexpected /vendors response.");
  }

  const outside = vendors.filter((v) => !isMetroDetroitCity(v.city));

  let deleted = 0;
  let reassigned = 0;
  let failed = 0;

  for (const vendor of outside) {
    try {
      await http(`/vendors/${vendor.id}`, { method: "DELETE" });
      deleted += 1;
      continue;
    } catch (err) {
      const payload = {
        businessName: vendor.businessName,
        category: vendor.category,
        city: "Detroit",
        phone: vendor.phone,
        email: vendor.email,
      };

      try {
        await http(`/vendors/${vendor.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        reassigned += 1;
      } catch {
        failed += 1;
      }
    }
  }

  const after = await http("/vendors");
  const remainingNonMetro = Array.isArray(after)
    ? after.filter((v) => !isMetroDetroitCity(v.city))
    : [];

  console.log(
    `Processed ${outside.length} non-metro vendors. Deleted: ${deleted}, Reassigned city: ${reassigned}, Failed: ${failed}`
  );
  console.log(`Remaining non-metro vendors: ${remainingNonMetro.length}`);
}

main().catch((err) => {
  console.error(`Prune failed: ${err.message}`);
  process.exit(1);
});
