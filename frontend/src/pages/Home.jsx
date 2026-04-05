import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { getVendorImageFallback, getVendorImageUrl } from "../vendorImages";

const CATEGORY_DESCRIPTIONS = {
    Photography: "Browse local photographers, compare packages, and request your date.",
    Videography: "Find videographers for highlight reels, full-length coverage, or both.",
    "Event Rentals": "Tables, tents, lighting, and decor - compare rental inventories by city.",
    "Photo Booth": "Add an interactive moment to your event. Browse booth styles and pricing.",
};

function formatPricing(vendor) {
    const amount = Number(vendor?.startingPrice);
    const type = String(vendor?.pricingType || "PER_EVENT");
    if (!Number.isFinite(amount) || amount <= 0) return "Custom quotes available";
    const suffix = type === "PER_HOUR" ? "/hour" : type === "PACKAGE" ? " package" : " per event";
    return `From $${amount.toLocaleString()}${suffix}`;
}

export default function Home() {
    const [vendors, setVendors] = useState([]);
    const [ratingsByVendor, setRatingsByVendor] = useState({});

    useEffect(() => {
        let alive = true;

        api.listVendors()
            .then((rows) => {
                if (!alive) return;
                setVendors(Array.isArray(rows) ? rows : []);
            })
            .catch(() => alive && setVendors([]));

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

    const featured = useMemo(() => vendors.slice(0, 4), [vendors]);
    const categories = useMemo(() => Array.from(new Set(vendors.map((v) => v.category).filter(Boolean))).slice(0, 4), [vendors]);

    function ratingText(vendorId) {
        const info = ratingsByVendor[vendorId];
        const avg = Number(info?.averageRating);
        const count = Number(info?.reviewCount || 0);
        if (!Number.isFinite(avg) || count <= 0) return "New";
        return `${avg.toFixed(1)} · ${count} reviews`;
    }

    function onImageError(event, vendor) {
        event.currentTarget.onerror = null;
        event.currentTarget.src = getVendorImageFallback(vendor);
    }

    return (
        <div className="page home-page">
            <section className="editorial-hero">
                <div className="editorial-copy">
                    <div className="editorial-kicker">EventBridge</div>
                    <h1 className="h1">Planning a party should feel curated, not chaotic.</h1>
                    <p className="muted editorial-sub">
                        EventBridge helps customers discover vendors, request bookings, manage party plans, message
                        providers, and keep spend visible from inquiry to final payment.
                    </p>
                    <div className="editorial-actions">
                        <Link className="btn" to="/marketplace">
                            Browse marketplace
                        </Link>
                        <Link className="btn ghost" to="/login">
                            Sign in
                        </Link>
                    </div>
                </div>

                <div className="editorial-rail">
                    <div className="editorial-note">
                        <strong>Customer flow</strong>
                        <div className="muted">Request vendors, connect bookings to parties, then track approvals and payment status.</div>
                    </div>
                    <div className="editorial-note">
                        <strong>Vendor flow</strong>
                        <div className="muted">Confirm requests, message customers, and monitor bookings inside one dashboard.</div>
                    </div>
                </div>
            </section>

            <section className="editorial-visual">
                <div className="editorial-overlay" />
                <div className="editorial-panel">
                    <div className="editorial-kicker">Designed Around Real Planning Workflows</div>
                    <h2 className="h2">Book vendors, keep the conversation going, and organize everything around the event itself.</h2>
                    <div className="editorial-tags">
                        <span>Marketplace search</span>
                        <span>Vendor messaging</span>
                        <span>Party budgeting</span>
                        <span>Approval tracking</span>
                    </div>
                </div>
            </section>

            <section className="home-section">
                <div className="story-strip">
                    <div className="card story-card story-lead">
                        <div className="story-number">Why it exists</div>
                        <div className="h2">A cleaner way to book and manage event vendors.</div>
                    </div>
                    <div className="card story-card">
                        <div className="story-number">01</div>
                        <div className="h3">Discover services</div>
                        <div className="muted">Search vendors by city, category, and distance with image-first browsing.</div>
                    </div>
                    <div className="card story-card">
                        <div className="story-number">02</div>
                        <div className="h3">Track the work</div>
                        <div className="muted">Messaging, booking status, party plans, and payments all stay connected.</div>
                    </div>
                </div>
            </section>

            <section className="home-section">
                <div className="section-title-wrap">
                    <div>
                        <div className="editorial-kicker">Popular Services</div>
                        <h2 className="h2">Built for the mix of vendors a real event actually needs.</h2>
                    </div>
                </div>

                <div className="category-strip">
                    {categories.map((category, idx) => (
                        <div key={category} className="card category-card" style={{ "--card-index": idx }}>
                            <div className="category-mark">{String(idx + 1).padStart(2, "0")}</div>
                            <div className="h3">{category}</div>
                            <div className="muted small">
                                {CATEGORY_DESCRIPTIONS[category] || "Explore local vendors, compare options, and request availability."}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="home-section">
                <div className="section-title-wrap">
                    <div>
                        <div className="editorial-kicker">Featured Vendors</div>
                        <h2 className="h2">The marketplace should speak for itself.</h2>
                    </div>
                    <Link className="btn ghost" to="/marketplace">
                        View all vendors
                    </Link>
                </div>

                <div className="airbnb-grid">
                    {featured.map((vendor, idx) => (
                        <Link
                            key={vendor.id}
                            className="airbnb-card"
                            style={{ "--card-index": idx }}
                            to={`/vendors/${vendor.id}`}
                        >
                            <div className="airbnb-thumb">
                                <img
                                    className="airbnb-thumb-img"
                                    src={getVendorImageUrl(vendor)}
                                    alt={`${vendor.businessName} preview`}
                                    loading="lazy"
                                    onError={(e) => onImageError(e, vendor)}
                                />
                            </div>
                            <div className="airbnb-card-meta">
                                <div className="airbnb-card-top">
                                    <strong>{vendor.businessName}</strong>
                                    <span>{ratingText(vendor.id)}</span>
                                </div>
                                <div className="muted small">{vendor.category} in {vendor.city}</div>
                                <div className="airbnb-price">{formatPricing(vendor)}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
