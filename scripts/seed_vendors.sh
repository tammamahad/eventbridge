#!/usr/bin/env sh
set -eu

API_BASE="${API_BASE:-http://localhost:9090}"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required but not installed."
  exit 1
fi

if ! curl -fsS "${API_BASE}/vendors" >/dev/null 2>&1; then
  echo "Backend is not reachable at ${API_BASE}. Start Spring Boot first."
  exit 1
fi

existing_json="$(curl -fsS "${API_BASE}/vendors")"
created=0
skipped=0

pricing_for_category() {
  case "$1" in
    Photography) echo "220|PER_HOUR|2-hour minimum" ;;
    Florist) echo "1400|PACKAGE|Seasonal flower pricing applies" ;;
    Catering) echo "55|PER_EVENT|Per guest estimate for 100 guests" ;;
    Venue) echo "4200|PER_EVENT|Includes 8-hour venue block" ;;
    DJ) echo "180|PER_HOUR|Sound setup included" ;;
    Videography) echo "2600|PACKAGE|Highlight film + raw footage" ;;
    "Event Rentals") echo "900|PER_EVENT|Tables and chairs package" ;;
    "Photo Booth") echo "650|PER_EVENT|3-hour booth session" ;;
    Bakery) echo "500|PER_EVENT|Custom dessert table base package" ;;
    Decor) echo "1200|PER_EVENT|Ceremony + reception decor" ;;
    "Live Music") echo "320|PER_HOUR|3-hour minimum performance" ;;
    Planner) echo "1800|PACKAGE|Month-of coordination package" ;;
    Transportation) echo "140|PER_HOUR|2-hour minimum booking" ;;
    "Makeup Artist") echo "180|PER_EVENT|Bridal trial sold separately" ;;
    Attire) echo "300|PER_EVENT|Average tux or gown package" ;;
    Lighting) echo "750|PER_EVENT|Uplighting starter package" ;;
    "Bar Service") echo "35|PER_EVENT|Per guest estimate, non-alcoholic mixers included" ;;
    Invitations) echo "380|PACKAGE|100-card print package" ;;
    "AV Services") echo "950|PER_EVENT|Basic AV and operator support" ;;
    Officiant) echo "450|PER_EVENT|Ceremony + filing support" ;;
    *) echo "500|PER_EVENT|Custom quote available" ;;
  esac
}

description_for_category() {
  case "$1" in
    Photography) echo "Documentary-style event coverage with fast turnaround previews and polished final galleries." ;;
    Florist) echo "Custom floral designs for ceremonies and receptions with delivery and onsite setup." ;;
    Catering) echo "Full-service catering menus built around guest count, dietary needs, and service style." ;;
    Venue) echo "Flexible event venue with layout support, vendor coordination, and day-of hosting." ;;
    DJ) echo "Professional DJ services with MC support, curated playlists, and dance-floor pacing." ;;
    Videography) echo "Cinematic event films with multi-angle capture, highlight edits, and optional drone footage." ;;
    "Event Rentals") echo "Tables, chairs, linens, and lounge rentals with delivery, setup, and breakdown." ;;
    "Photo Booth") echo "Interactive photo booth setup with instant prints, digital sharing, and custom overlays." ;;
    Bakery) echo "Custom cakes and dessert spreads tailored to event style, guest size, and dietary preferences." ;;
    Decor) echo "Event styling with focal installations, table design, and cohesive visual concepts." ;;
    "Live Music") echo "Live performance packages for cocktail hour, ceremony, and reception entertainment." ;;
    Planner) echo "Planning and coordination support from timeline design to day-of vendor management." ;;
    Transportation) echo "Guest and VIP transportation logistics with punctual routing and dispatch coordination." ;;
    "Makeup Artist") echo "On-location beauty services for bridal and event parties with trial options available." ;;
    Attire) echo "Formalwear consultations and fittings for wedding parties and special event occasions." ;;
    Lighting) echo "Ambient and accent lighting design to elevate venue atmosphere and photo quality." ;;
    "Bar Service") echo "Licensed bar staffing and menu planning with streamlined beverage service operations." ;;
    Invitations) echo "Custom invitation suites, RSVP cards, and stationery design for cohesive branding." ;;
    "AV Services") echo "Audio visual production with microphones, speakers, and onsite technical operation." ;;
    Officiant) echo "Personalized ceremony services with rehearsal guidance and legally compliant filing." ;;
    *) echo "Experienced local event vendor delivering reliable service and collaborative planning support." ;;
  esac
}

base_street_for_city() {
  case "$1" in
    Detroit) echo "1200 Woodward Ave" ;;
    Dearborn) echo "5400 Michigan Ave" ;;
    "Dearborn Heights") echo "25150 Ford Rd" ;;
    "Royal Oak") echo "215 W 4th St" ;;
    Southfield) echo "26500 Northwestern Hwy" ;;
    Novi) echo "43155 Main St" ;;
    Warren) echo "29000 Van Dyke Ave" ;;
    Troy) echo "755 W Big Beaver Rd" ;;
    Ferndale) echo "201 E 9 Mile Rd" ;;
    Livonia) echo "17100 Laurel Park Dr" ;;
    Canton) echo "42400 Ford Rd" ;;
    Birmingham) echo "150 S Old Woodward Ave" ;;
    "Rochester Hills") echo "1910 S Rochester Rd" ;;
    "West Bloomfield") echo "6335 Orchard Lake Rd" ;;
    "Grosse Pointe") echo "17000 Kercheval Ave" ;;
    "Ann Arbor") echo "330 S State St" ;;
    "Madison Heights") echo "31000 John R Rd" ;;
    Plymouth) echo "447 Forest Ave" ;;
    "Bloomfield Hills") echo "39550 Woodward Ave" ;;
    "Farmington Hills") echo "30000 Northwestern Hwy" ;;
    "Sterling Heights") echo "38000 Van Dyke Ave" ;;
    *) echo "100 Main St" ;;
  esac
}

coords_for_city() {
  case "$1" in
    Detroit) echo "42.3314|-83.0458" ;;
    Dearborn) echo "42.3223|-83.1763" ;;
    "Dearborn Heights") echo "42.3369|-83.2733" ;;
    "Royal Oak") echo "42.4895|-83.1446" ;;
    Southfield) echo "42.4734|-83.2219" ;;
    Novi) echo "42.4806|-83.4755" ;;
    Warren) echo "42.5145|-83.0147" ;;
    Troy) echo "42.6064|-83.1498" ;;
    Ferndale) echo "42.4606|-83.1346" ;;
    Livonia) echo "42.3684|-83.3527" ;;
    Canton) echo "42.3086|-83.4822" ;;
    Birmingham) echo "42.5467|-83.2113" ;;
    "Rochester Hills") echo "42.6584|-83.1499" ;;
    "West Bloomfield") echo "42.5684|-83.3830" ;;
    "Grosse Pointe") echo "42.3861|-82.9119" ;;
    "Ann Arbor") echo "42.2808|-83.7430" ;;
    "Madison Heights") echo "42.4859|-83.1052" ;;
    Plymouth) echo "42.3714|-83.4702" ;;
    "Bloomfield Hills") echo "42.5836|-83.2455" ;;
    "Farmington Hills") echo "42.4989|-83.3677" ;;
    "Sterling Heights") echo "42.5803|-83.0302" ;;
    *) echo "42.3314|-83.0458" ;;
  esac
}

suite_for_business() {
  hash="$(printf '%s' "$1" | cksum | cut -d' ' -f1)"
  echo $((hash % 400 + 100))
}

while IFS='|' read -r business category city phone email; do
  [ -z "${business}" ] && continue

  if printf '%s' "${existing_json}" | grep -Fqi "\"businessName\":\"${business}\""; then
    skipped=$((skipped + 1))
    continue
  fi

  pricing_data="$(pricing_for_category "${category}")"
  starting_price="$(printf '%s' "${pricing_data}" | cut -d'|' -f1)"
  pricing_type="$(printf '%s' "${pricing_data}" | cut -d'|' -f2)"
  price_note="$(printf '%s' "${pricing_data}" | cut -d'|' -f3-)"
  short_description="$(description_for_category "${category}")"
  base_street="$(base_street_for_city "${city}")"
  suite="$(suite_for_business "${business}")"
  address="${base_street}, Suite ${suite}, ${city}, MI"
  coords="$(coords_for_city "${city}")"
  latitude="$(printf '%s' "${coords}" | cut -d'|' -f1)"
  longitude="$(printf '%s' "${coords}" | cut -d'|' -f2)"

  payload=$(cat <<JSON
{"businessName":"${business}","category":"${category}","city":"${city}","phone":"${phone}","email":"${email}","shortDescription":"${short_description}","address":"${address}","latitude":${latitude},"longitude":${longitude},"startingPrice":${starting_price},"pricingType":"${pricing_type}","priceNote":"${price_note}"}
JSON
)

  curl -fsS -X POST "${API_BASE}/vendors" \
    -H "Content-Type: application/json" \
    -d "${payload}" >/dev/null

  created=$((created + 1))
done <<'DATA'
Riverfront Lens Studio|Photography|Detroit|313-555-0101|hello@riverfrontlens.com
Motown Bloom Florals|Florist|Dearborn|313-555-0102|book@motownbloom.com
Woodward Social Catering|Catering|Royal Oak|248-555-0103|events@woodwardsocial.com
Eastern Market Loft|Venue|Detroit|313-555-0104|sales@easternmarketloft.com
313 Spin DJs|DJ|Southfield|248-555-0105|mix@313spindjs.com
Great Lakes Cinema Co|Videography|Novi|248-555-0106|team@greatlakescinema.com
MotorCity Event Rentals|Event Rentals|Warren|586-555-0107|orders@motorcityrentals.com
FlashFrame Booths|Photo Booth|Troy|248-555-0108|hi@flashframebooths.com
Cass Corner Cakes|Bakery|Detroit|313-555-0109|custom@casscornercakes.com
Midtown Arch and Decor|Decor|Detroit|313-555-0110|design@midtownarchdecor.com
Belle Isle Strings|Live Music|Grosse Pointe|313-555-0111|bookings@belleislestrings.com
Peninsula Event Planning|Planner|Birmingham|248-555-0112|hello@peninsulaevents.com
MetroRide Shuttle|Transportation|Livonia|734-555-0113|dispatch@metrorideshuttle.com
Radiant Detroit Makeup|Makeup Artist|Farmington Hills|248-555-0114|contact@radiantdetroitmakeup.com
Lakeside Bridal and Tux|Attire|Sterling Heights|586-555-0115|style@lakesidebridaltux.com
Northstar Lighting Co|Lighting|Rochester Hills|248-555-0116|info@northstarlightingco.com
Corktown Craft Bar|Bar Service|Detroit|313-555-0117|events@corktowncraftbar.com
Maple Ink Invitations|Invitations|Plymouth|734-555-0118|studio@mapleinkinvites.com
Oakland Manor Events|Venue|Bloomfield Hills|248-555-0119|bookings@oaklandmanorevents.com
Mitten Table Catering|Catering|Canton|734-555-0120|hello@mittentable.com
Detroit Golden Hour Photo|Photography|Ferndale|248-555-0121|contact@detroitgoldenhour.com
Pulse AV and Stage|AV Services|Southfield|248-555-0122|ops@pulseavstage.com
Garden District Floristry|Florist|West Bloomfield|248-555-0123|team@gardendistrictfloristry.com
Pearl Day Coordinators|Planner|Novi|248-555-0124|coordinator@pearldayco.com
Whisk and Frost Detroit|Bakery|Dearborn Heights|313-555-0125|orders@whiskfrostdetroit.com
Ambassador Valet|Transportation|Detroit|313-555-0126|valet@ambassadorvalet.com
Cadillac Live Band|Live Music|Troy|248-555-0127|book@cadillacliveband.com
Mosaic Moment Decor|Decor|Ann Arbor|734-555-0128|hello@mosaicmomentdecor.com
White Canvas Metro Rentals|Event Rentals|Madison Heights|248-555-0129|support@whitecanvasmetro.com
Great Lakes Ceremonies|Officiant|Dearborn|313-555-0130|contact@greatlakesceremonies.com
DATA

echo "Seeding complete. Created: ${created}, Skipped existing: ${skipped}"
