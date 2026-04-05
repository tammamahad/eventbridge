import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { getVendorImageCandidates, getVendorImageFallback, getVendorImageUrl } from "../vendorImages";

const CITY_CENTERS = {
    Detroit: { lat: 42.3314, lng: -83.0458 },
    Dearborn: { lat: 42.3223, lng: -83.1763 },
    "Dearborn Heights": { lat: 42.3369, lng: -83.2733 },
    "Royal Oak": { lat: 42.4895, lng: -83.1446 },
    Southfield: { lat: 42.4734, lng: -83.2219 },
    Novi: { lat: 42.4806, lng: -83.4755 },
    Warren: { lat: 42.5145, lng: -83.0147 },
    Troy: { lat: 42.6064, lng: -83.1498 },
    Ferndale: { lat: 42.4606, lng: -83.1346 },
    Livonia: { lat: 42.3684, lng: -83.3527 },
    Canton: { lat: 42.3086, lng: -83.4822 },
    Birmingham: { lat: 42.5467, lng: -83.2113 },
    "Rochester Hills": { lat: 42.6584, lng: -83.1499 },
    "West Bloomfield": { lat: 42.5684, lng: -83.3830 },
    "Grosse Pointe": { lat: 42.3861, lng: -82.9119 },
    "Ann Arbor": { lat: 42.2808, lng: -83.7430 },
    "Madison Heights": { lat: 42.4859, lng: -83.1052 },
    Plymouth: { lat: 42.3714, lng: -83.4702 },
    "Bloomfield Hills": { lat: 42.5836, lng: -83.2455 },
    "Farmington Hills": { lat: 42.4989, lng: -83.3677 },
    "Sterling Heights": { lat: 42.5803, lng: -83.0302 },
};

export default function Marketplace() {
    const nav = useNavigate();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ratingsByVendor, setRatingsByVendor] = useState({});

    const [q, setQ] = useState("");
    const [category, setCategory] = useState("ALL");
    const [distanceRadius, setDistanceRadius] = useState("ANY");
    const [sortBy, setSortBy] = useState("CURATED");

    useEffect(() => {
        let alive = true;
        setLoading(true);

        api.listVendors()
            .then((data) => {
                if (!alive) return;
                setVendors(Array.isArray(data) ? data : []);
            })
            .catch(console.error)
            .finally(() => alive && setLoading(false));

        api.getRatingsSummary()
            .then((rows) => {
                if (!alive) return;
                const map = {};
                (Array.isArray(rows) ? rows : []).forEach((row) => {
                    map[row.vendorId] = {
                        averageRating: row.averageRating,
                        reviewCount: row.reviewCount,
                    };
                });
                setRatingsByVendor(map);
            })
            .catch(() => alive && setRatingsByVendor({}));

        return () => {
            alive = false;
        };
    }, []);

    const categories = useMemo(() => {
        const set = new Set(vendors.map((v) => v.category).filter(Boolean));
        return ["ALL", ...Array.from(set).sort()];
    }, [vendors]);

    const filtered = useMemo(() => {
        const rawNeedle = q.trim().toLowerCase();
        const inferredCity = inferCityFromQuery(rawNeedle);
        const center = inferredCity ? CITY_CENTERS[inferredCity] : null;
        const radius = Number(distanceRadius);
        const effectiveNeedle = inferredCity ? rawNeedle.replace(inferredCity.toLowerCase(), "").trim() : rawNeedle;

        const results = vendors
            .map((v) => {
                const vendorLat = Number(v.latitude);
                const vendorLng = Number(v.longitude);
                let distanceMiles = null;
                if (center && Number.isFinite(vendorLat) && Number.isFinite(vendorLng)) {
                    distanceMiles = haversineMiles(center.lat, center.lng, vendorLat, vendorLng);
                }
                return { ...v, _distanceMiles: distanceMiles };
            })
            .filter((v) => {
                const matchQ =
                    !effectiveNeedle ||
                    `${v.businessName || ""} ${v.category || ""}`.toLowerCase().includes(effectiveNeedle);

                const matchCat = category === "ALL" || v.category === category;
                const matchDistance =
                    !center ||
                    distanceRadius === "ANY" ||
                    (Number.isFinite(v._distanceMiles) && v._distanceMiles <= radius);

                return matchQ && matchCat && matchDistance;
            });

        return results.sort((a, b) => {
            const ratingA = Number(ratingsByVendor[a.id]?.averageRating || 0);
            const ratingB = Number(ratingsByVendor[b.id]?.averageRating || 0);
            const countA = Number(ratingsByVendor[a.id]?.reviewCount || 0);
            const countB = Number(ratingsByVendor[b.id]?.reviewCount || 0);
            const priceA = Number(a.startingPrice || Number.POSITIVE_INFINITY);
            const priceB = Number(b.startingPrice || Number.POSITIVE_INFINITY);
            const distA = Number.isFinite(a._distanceMiles) ? a._distanceMiles : Number.POSITIVE_INFINITY;
            const distB = Number.isFinite(b._distanceMiles) ? b._distanceMiles : Number.POSITIVE_INFINITY;

            if (sortBy === "PRICE_LOW") return priceA - priceB;
            if (sortBy === "PRICE_HIGH") return priceB - priceA;
            if (sortBy === "TOP_RATED") {
                if (ratingB !== ratingA) return ratingB - ratingA;
                return countB - countA;
            }
            if (sortBy === "NEAREST") return distA - distB;

            const scoreA =
                ratingA * 12 +
                Math.min(countA, 5) * 1.8 +
                (Number.isFinite(a._distanceMiles) ? Math.max(0, 18 - distA) : 0) +
                (priceA <= 400 ? 1.25 : 0);
            const scoreB =
                ratingB * 12 +
                Math.min(countB, 5) * 1.8 +
                (Number.isFinite(b._distanceMiles) ? Math.max(0, 18 - distB) : 0) +
                (priceB <= 400 ? 1.25 : 0);
            return scoreB - scoreA;
        });
    }, [vendors, q, category, distanceRadius, sortBy, ratingsByVendor]);

    function formatPricing(vendor) {
        const amount = Number(vendor?.startingPrice);
        const type = String(vendor?.pricingType || "PER_EVENT");
        if (!Number.isFinite(amount) || amount <= 0) return "Contact for pricing";
        const suffix = type === "PER_HOUR" ? "/hour" : type === "PACKAGE" ? " package" : " per event";
        return `From $${amount.toLocaleString()}${suffix}`;
    }

    function formatRating(vendorId) {
        const data = ratingsByVendor[vendorId];
        const avg = Number(data?.averageRating);
        const count = Number(data?.reviewCount || 0);
        if (!Number.isFinite(avg) || count <= 0) return "New";
        return `${avg.toFixed(1)} · ${count} review${count === 1 ? "" : "s"}`;
    }

    function formatDistance(vendor) {
        if (!Number.isFinite(vendor._distanceMiles)) return null;
        const inferredCity = inferCityFromQuery(q);
        if (!inferredCity) return null;
        return `${vendor._distanceMiles.toFixed(1)} mi from ${inferredCity}`;
    }

    function vendorMeta(vendor) {
        const rating = Number(ratingsByVendor[vendor.id]?.averageRating || 0);
        const count = Number(ratingsByVendor[vendor.id]?.reviewCount || 0);
        const price = Number(vendor.startingPrice || 0);

        if (count >= 6 && rating >= 4.7) return "Most loved";
        if (count >= 4 && rating >= 4.4) return "Books often";
        if (price > 0 && price <= 300) return "Budget-friendly";
        if (vendor.category === "Venue" || vendor.category === "Catering") return "Group favorite";
        return "Popular pick";
    }

    function vendorSupportLine(vendor) {
        const count = Number(ratingsByVendor[vendor.id]?.reviewCount || 0);
        if (count > 0) return `${count} recent review${count === 1 ? "" : "s"}`;
        if (vendor.priceNote) return vendor.priceNote;
        return `Serving ${vendor.city} events`;
    }

    function onVendorImageError(event, vendor) {
        const img = event.currentTarget;
        const candidates = getVendorImageCandidates(vendor, 6);
        const attempt = Number(img.dataset.attempt || "0");
        const nextAttempt = attempt + 1;

        if (nextAttempt < candidates.length) {
            img.dataset.attempt = String(nextAttempt);
            img.src = candidates[nextAttempt];
            return;
        }

        img.onerror = null;
        img.src = getVendorImageFallback(vendor);
    }

    return (
        <div className="page">
            <div className="hero marketplace-hero">
                <div className="hero-copy">
                    <div className="editorial-kicker">Marketplace</div>
                    <h1 className="h1">Find vendors that match the style and scale of the event you are planning.</h1>
                    <p className="muted">
                        Search by service, city, and distance. Sort by price, rating, or proximity before you send a request.
                    </p>
                </div>
            </div>

            <div className="card marketplace-filter-shell">
                <div className="marketplace-topbar">
                    <div className="filter-control">
                        <label className="filter-label">Search</label>
                        <input
                            className="input marketplace-search-input"
                            placeholder="Try: photographer in Detroit"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </div>

                    <div className="filter-control">
                        <label className="filter-label">Distance</label>
                        <select className="select" value={distanceRadius} onChange={(e) => setDistanceRadius(e.target.value)}>
                            <option value="ANY">Any distance</option>
                            <option value="10">Within 10 mi</option>
                            <option value="25">Within 25 mi</option>
                            <option value="40">Within 40 mi</option>
                            <option value="60">Within 60 mi</option>
                        </select>
                    </div>

                    <div className="filter-control">
                        <label className="filter-label">Sort</label>
                        <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                            <option value="CURATED">Curated</option>
                            <option value="TOP_RATED">Top rated</option>
                            <option value="PRICE_LOW">Price: low to high</option>
                            <option value="PRICE_HIGH">Price: high to low</option>
                            <option value="NEAREST">Nearest first</option>
                        </select>
                    </div>
                </div>

                <div className="marketplace-chipbar">
                    {categories.slice(0, 8).map((c) => (
                        <button
                            key={c}
                            type="button"
                            className={c === category ? "market-chip active" : "market-chip"}
                            onClick={() => setCategory(c)}
                        >
                            {c === "ALL" ? "All" : c}
                        </button>
                    ))}
                </div>

                <div className="marketplace-meta">
                    <div className="muted small">Showing {filtered.length} of {vendors.length} vendors</div>
                    <div className="muted small">
                        {inferCityFromQuery(q)
                            ? `Browsing around ${inferCityFromQuery(q)}`
                            : "Add a city to compare vendors by distance"}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="muted">Loading vendors…</div>
            ) : (
                <div className="grid marketplace-grid">
                    {filtered.map((v, idx) => (
                        <button
                            key={v.id}
                            className="card vendor-card marketplace-card"
                            style={{ "--card-index": idx }}
                            onClick={() => nav(`/vendors/${v.id}`)}
                            aria-label={`Open ${v.businessName} profile`}
                        >
                            <div className="thumb">
                                <img
                                    className="thumb-img"
                                    src={getVendorImageUrl(v)}
                                    alt={`${v.businessName} preview`}
                                    loading="lazy"
                                    data-attempt="0"
                                    onError={(e) => onVendorImageError(e, v)}
                                />
                            </div>
                            <div className="vendor-meta">
                                <div className="marketplace-card-head">
                                    <div className="vendor-name">{v.businessName}</div>
                                    <div className="marketplace-card-tag">{vendorMeta(v)}</div>
                                </div>
                                <div className="vendor-sub">{v.category} in {v.city}</div>
                                {formatDistance(v) && <div className="vendor-distance">{formatDistance(v)}</div>}
                                <div className="vendor-rating">{formatRating(v.id)}</div>
                                <div className="marketplace-card-support muted small">{vendorSupportLine(v)}</div>
                                <div className="vendor-price">{formatPricing(v)}</div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

function haversineMiles(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 3958.8;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function inferCityFromQuery(query) {
    const q = String(query || "").toLowerCase();
    const cities = Object.keys(CITY_CENTERS).sort((a, b) => b.length - a.length);
    return cities.find((city) => q.includes(city.toLowerCase())) || null;
}
