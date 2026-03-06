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

    useEffect(() => {
        let alive = true;
        setLoading(true);
        api
            .listVendors()
            .then((data) => {
                if (!alive) return;
                setVendors(Array.isArray(data) ? data : []);
            })
            .catch(console.error)
            .finally(() => alive && setLoading(false));

        api
            .getRatingsSummary()
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

        return () => (alive = false);
    }, []);

    const categories = useMemo(() => {
        const set = new Set(vendors.map((v) => v.category).filter(Boolean));
        return ["ALL", ...Array.from(set).sort()];
    }, [vendors]);

    const cities = useMemo(() => {
        const set = new Set(vendors.map((v) => v.city).filter(Boolean));
        return ["ALL", ...Array.from(set).sort()];
    }, [vendors]);

    const filtered = useMemo(() => {
        const rawNeedle = q.trim().toLowerCase();
        const inferredCity = inferCityFromQuery(rawNeedle);
        const center = inferredCity ? CITY_CENTERS[inferredCity] : null;
        const radius = Number(distanceRadius);
        const effectiveNeedle =
            inferredCity
                ? rawNeedle.replace(inferredCity.toLowerCase(), "").trim()
                : rawNeedle;

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
                `${v.businessName || ""} ${v.category || ""}`
                    .toLowerCase()
                    .includes(effectiveNeedle);

            const matchCat = category === "ALL" || v.category === category;
            const matchDistance =
                !center ||
                distanceRadius === "ANY" ||
                (Number.isFinite(v._distanceMiles) && v._distanceMiles <= radius);

            return matchQ && matchCat && matchDistance;
        });

        return results.sort((a, b) => {
            const da = Number.isFinite(a._distanceMiles) ? a._distanceMiles : Number.POSITIVE_INFINITY;
            const db = Number.isFinite(b._distanceMiles) ? b._distanceMiles : Number.POSITIVE_INFINITY;
            return da - db;
        });
    }, [vendors, q, category, distanceRadius]);

    const totalCategories = categories.filter((c) => c !== "ALL").length;
    const totalCities = cities.filter((c) => c !== "ALL").length;

    function formatPricing(vendor) {
        const amount = Number(vendor?.startingPrice);
        const type = String(vendor?.pricingType || "PER_EVENT");
        if (!Number.isFinite(amount) || amount <= 0) return "Contact for pricing";
        const suffix = type === "PER_HOUR" ? "/hour" : type === "PACKAGE" ? " package" : " per event";
        return `Starting at $${amount.toLocaleString()}${suffix}`;
    }

    function formatRating(vendorId) {
        const data = ratingsByVendor[vendorId];
        const avg = Number(data?.averageRating);
        const count = Number(data?.reviewCount || 0);
        if (!Number.isFinite(avg) || count <= 0) return "New";
        return `${avg.toFixed(1)} (${count})`;
    }

    function formatDistance(vendor) {
        if (!Number.isFinite(vendor._distanceMiles)) return null;
        const inferredCity = inferCityFromQuery(q);
        if (!inferredCity) return null;
        return `${vendor._distanceMiles.toFixed(1)} mi from ${inferredCity}`;
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
            <div className="hero hero-shell">
                <div className="hero-copy">
                    <div className="eyebrow">Global Event Marketplace</div>
                    <h1 className="h1">Plan Better Events With Trusted Local Vendors</h1>
                    <p className="muted">
                        Search businesses by name, category, or city. Compare pricing, availability, and book confidently.
                    </p>
                </div>

                <div className="hero-stats">
                    <div className="stat-card">
                        <div className="stat-value">{vendors.length}</div>
                        <div className="stat-label">Active Vendors</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{totalCategories}</div>
                        <div className="stat-label">Service Types</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{totalCities}</div>
                        <div className="stat-label">Active Cities</div>
                    </div>
                </div>
            </div>

            <div className="card filter-shell">
                <div className="filters">
                    <div className="filter-control">
                        <label className="filter-label">What are you looking for?</label>
                        <input
                            className="input"
                            placeholder="Try: photographer in Detroit"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </div>

                    <div className="filter-control">
                        <label className="filter-label">Category</label>
                        <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
                            {categories.map((c) => (
                                <option key={c} value={c}>
                                    {c === "ALL" ? "All categories" : c}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-control">
                        <label className="filter-label">Distance</label>
                        <select
                            className="select"
                            value={distanceRadius}
                            onChange={(e) => setDistanceRadius(e.target.value)}
                        >
                            <option value="ANY">Any distance</option>
                            <option value="10">Within 10 mi</option>
                            <option value="25">Within 25 mi</option>
                            <option value="40">Within 40 mi</option>
                            <option value="60">Within 60 mi</option>
                        </select>
                    </div>
                </div>

                <div className="filter-meta">
                    <div className="muted small">Showing {filtered.length} of {vendors.length} vendors</div>
                    <div className="chip-row">
                        {inferCityFromQuery(q) ? (
                            <span className="chip">Distance anchor: {inferCityFromQuery(q)}</span>
                        ) : (
                            <span className="chip">Type a city to activate distance filtering</span>
                        )}
                        <span className="chip">Verified local businesses</span>
                        <span className="chip">Transparent starting prices</span>
                        <span className="chip">Direct request workflow</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="muted">Loading vendors…</div>
            ) : (
                <>
                    <div className="grid">
                        {filtered.map((v, idx) => (
                            <button
                                key={v.id}
                                className="card vendor-card"
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
                                    <div className="vendor-name">{v.businessName}</div>
                                    <div className="vendor-sub">
                                        {v.category} • {v.city}
                                    </div>
                                    {formatDistance(v) && <div className="vendor-distance">{formatDistance(v)}</div>}
                                    <div className="vendor-rating">Rating: {formatRating(v.id)}</div>
                                    <div className="vendor-price">{formatPricing(v)}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </>
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
