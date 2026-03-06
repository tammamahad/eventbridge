const API_BASE = process.env.API_BASE || "http://localhost:9090";

const PRICING_BY_CATEGORY = {
  Photography: { startingPrice: 220, pricingType: "PER_HOUR", priceNote: "2-hour minimum" },
  Florist: { startingPrice: 1400, pricingType: "PACKAGE", priceNote: "Seasonal flower pricing applies" },
  Catering: { startingPrice: 55, pricingType: "PER_EVENT", priceNote: "Per guest estimate for 100 guests" },
  Venue: { startingPrice: 4200, pricingType: "PER_EVENT", priceNote: "Includes 8-hour venue block" },
  DJ: { startingPrice: 180, pricingType: "PER_HOUR", priceNote: "Sound setup included" },
  Videography: { startingPrice: 2600, pricingType: "PACKAGE", priceNote: "Highlight film + raw footage" },
  "Event Rentals": { startingPrice: 900, pricingType: "PER_EVENT", priceNote: "Tables and chairs package" },
  "Photo Booth": { startingPrice: 650, pricingType: "PER_EVENT", priceNote: "3-hour booth session" },
  Bakery: { startingPrice: 500, pricingType: "PER_EVENT", priceNote: "Custom dessert table base package" },
  Decor: { startingPrice: 1200, pricingType: "PER_EVENT", priceNote: "Ceremony + reception decor" },
  "Live Music": { startingPrice: 320, pricingType: "PER_HOUR", priceNote: "3-hour minimum performance" },
  Planner: { startingPrice: 1800, pricingType: "PACKAGE", priceNote: "Month-of coordination package" },
  Transportation: { startingPrice: 140, pricingType: "PER_HOUR", priceNote: "2-hour minimum booking" },
  "Makeup Artist": { startingPrice: 180, pricingType: "PER_EVENT", priceNote: "Bridal trial sold separately" },
  Attire: { startingPrice: 300, pricingType: "PER_EVENT", priceNote: "Average tux or gown package" },
  Lighting: { startingPrice: 750, pricingType: "PER_EVENT", priceNote: "Uplighting starter package" },
  "Bar Service": { startingPrice: 35, pricingType: "PER_EVENT", priceNote: "Per guest estimate, non-alcoholic mixers included" },
  Invitations: { startingPrice: 380, pricingType: "PACKAGE", priceNote: "100-card print package" },
  "AV Services": { startingPrice: 950, pricingType: "PER_EVENT", priceNote: "Basic AV and operator support" },
  Officiant: { startingPrice: 450, pricingType: "PER_EVENT", priceNote: "Ceremony + filing support" },
};

const DEFAULT_PRICING = { startingPrice: 500, pricingType: "PER_EVENT", priceNote: "Custom quote available" };

const DESCRIPTION_BY_CATEGORY = {
  Photography: "Documentary-style event coverage with fast turnaround previews and polished final galleries.",
  Florist: "Custom floral designs for ceremonies and receptions with delivery and onsite setup.",
  Catering: "Full-service catering menus built around guest count, dietary needs, and service style.",
  Venue: "Flexible event venue with layout support, vendor coordination, and day-of hosting.",
  DJ: "Professional DJ services with MC support, curated playlists, and dance-floor pacing.",
  Videography: "Cinematic event films with multi-angle capture, highlight edits, and optional drone footage.",
  "Event Rentals": "Tables, chairs, linens, and lounge rentals with delivery, setup, and breakdown.",
  "Photo Booth": "Interactive photo booth setup with instant prints, digital sharing, and custom overlays.",
  Bakery: "Custom cakes and dessert spreads tailored to event style, guest size, and dietary preferences.",
  Decor: "Event styling with focal installations, table design, and cohesive visual concepts.",
  "Live Music": "Live performance packages for cocktail hour, ceremony, and reception entertainment.",
  Planner: "Planning and coordination support from timeline design to day-of vendor management.",
  Transportation: "Guest and VIP transportation logistics with punctual routing and dispatch coordination.",
  "Makeup Artist": "On-location beauty services for bridal and event parties with trial options available.",
  Attire: "Formalwear consultations and fittings for wedding parties and special event occasions.",
  Lighting: "Ambient and accent lighting design to elevate venue atmosphere and photo quality.",
  "Bar Service": "Licensed bar staffing and menu planning with streamlined beverage service operations.",
  Invitations: "Custom invitation suites, RSVP cards, and stationery design for cohesive branding.",
  "AV Services": "Audio visual production with microphones, speakers, and onsite technical operation.",
  Officiant: "Personalized ceremony services with rehearsal guidance and legally compliant filing.",
};

const BASE_STREET_BY_CITY = {
  Detroit: "1200 Woodward Ave",
  Dearborn: "5400 Michigan Ave",
  "Dearborn Heights": "25150 Ford Rd",
  "Royal Oak": "215 W 4th St",
  Southfield: "26500 Northwestern Hwy",
  Novi: "43155 Main St",
  Warren: "29000 Van Dyke Ave",
  Troy: "755 W Big Beaver Rd",
  Ferndale: "201 E 9 Mile Rd",
  Livonia: "17100 Laurel Park Dr",
  Canton: "42400 Ford Rd",
  Birmingham: "150 S Old Woodward Ave",
  "Rochester Hills": "1910 S Rochester Rd",
  "West Bloomfield": "6335 Orchard Lake Rd",
  "Grosse Pointe": "17000 Kercheval Ave",
  "Ann Arbor": "330 S State St",
  "Madison Heights": "31000 John R Rd",
  Plymouth: "447 Forest Ave",
  "Bloomfield Hills": "39550 Woodward Ave",
  "Farmington Hills": "30000 Northwestern Hwy",
  "Sterling Heights": "38000 Van Dyke Ave",
};

const COORDS_BY_CITY = {
  Detroit: { latitude: 42.3314, longitude: -83.0458 },
  Dearborn: { latitude: 42.3223, longitude: -83.1763 },
  "Dearborn Heights": { latitude: 42.3369, longitude: -83.2733 },
  "Royal Oak": { latitude: 42.4895, longitude: -83.1446 },
  Southfield: { latitude: 42.4734, longitude: -83.2219 },
  Novi: { latitude: 42.4806, longitude: -83.4755 },
  Warren: { latitude: 42.5145, longitude: -83.0147 },
  Troy: { latitude: 42.6064, longitude: -83.1498 },
  Ferndale: { latitude: 42.4606, longitude: -83.1346 },
  Livonia: { latitude: 42.3684, longitude: -83.3527 },
  Canton: { latitude: 42.3086, longitude: -83.4822 },
  Birmingham: { latitude: 42.5467, longitude: -83.2113 },
  "Rochester Hills": { latitude: 42.6584, longitude: -83.1499 },
  "West Bloomfield": { latitude: 42.5684, longitude: -83.383 },
  "Grosse Pointe": { latitude: 42.3861, longitude: -82.9119 },
  "Ann Arbor": { latitude: 42.2808, longitude: -83.743 },
  "Madison Heights": { latitude: 42.4859, longitude: -83.1052 },
  Plymouth: { latitude: 42.3714, longitude: -83.4702 },
  "Bloomfield Hills": { latitude: 42.5836, longitude: -83.2455 },
  "Farmington Hills": { latitude: 42.4989, longitude: -83.3677 },
  "Sterling Heights": { latitude: 42.5803, longitude: -83.0302 },
};

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
    // Keep text as-is.
  }

  if (!res.ok) {
    const message =
      (body && body.message) ||
      (body && body.error) ||
      (typeof body === "string" ? body : "") ||
      `HTTP ${res.status}`;
    throw new Error(message);
  }
  return body;
}

function missingPricing(v) {
  return !v.pricingType || !v.startingPrice || v.startingPrice <= 0;
}

function missingProfile(v) {
  return !String(v.shortDescription || "").trim() || !String(v.address || "").trim();
}

function missingCoords(v) {
  const lat = v.latitude;
  const lng = v.longitude;
  if (lat === null || lat === undefined || lat === "") return true;
  if (lng === null || lng === undefined || lng === "") return true;
  return !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng));
}

function hashCode(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildAddress(v) {
  const city = String(v.city || "").trim();
  const baseStreet = BASE_STREET_BY_CITY[city] || "100 Main St";
  const suite = (hashCode(v.businessName || city || "vendor") % 400) + 100;
  return `${baseStreet}, Suite ${suite}, ${city || "Detroit"}, MI`;
}

async function main() {
  const vendors = await http("/vendors");
  if (!Array.isArray(vendors)) throw new Error("Unexpected /vendors payload");

  let updated = 0;
  for (const v of vendors) {
    if (!missingPricing(v) && !missingProfile(v) && !missingCoords(v)) continue;
    const pricing = PRICING_BY_CATEGORY[v.category] || DEFAULT_PRICING;
    const shortDescription =
      String(v.shortDescription || "").trim() || DESCRIPTION_BY_CATEGORY[v.category] || "Experienced local event vendor delivering reliable service and collaborative planning support.";
    const address = String(v.address || "").trim() || buildAddress(v);
    const coords = COORDS_BY_CITY[String(v.city || "").trim()] || COORDS_BY_CITY.Detroit;

    await http(`/vendors/${v.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName: v.businessName,
        category: v.category,
        city: v.city,
        phone: v.phone,
        email: v.email,
        shortDescription,
        address,
        latitude: missingCoords(v) ? coords.latitude : v.latitude,
        longitude: missingCoords(v) ? coords.longitude : v.longitude,
        startingPrice: missingPricing(v) ? pricing.startingPrice : v.startingPrice,
        pricingType: missingPricing(v) ? pricing.pricingType : v.pricingType,
        priceNote: missingPricing(v) ? pricing.priceNote : v.priceNote,
      }),
    });
    updated += 1;
  }

  console.log(`Backfill complete. Updated vendors: ${updated}`);
}

main().catch((err) => {
  console.error(`Backfill failed: ${err.message}`);
  process.exit(1);
});
