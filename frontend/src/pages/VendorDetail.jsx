import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { api } from "../api";
import { getVendorGalleryUrls, getVendorImageCandidates, getVendorImageFallback, getVendorImageUrl } from "../vendorImages";

function isoDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

function formatPricing(vendor) {
    const amount = Number(vendor?.startingPrice);
    const type = String(vendor?.pricingType || "PER_EVENT");
    if (!Number.isFinite(amount) || amount <= 0) return "Contact for pricing";
    const suffix = type === "PER_HOUR" ? "/hour" : type === "PACKAGE" ? " package" : " per event";
    return `$${amount.toLocaleString()}${suffix}`;
}

function fallbackDescription(vendor) {
    return `Trusted ${vendor.category?.toLowerCase() || "event"} partner serving ${vendor.city || "your area"} with reliable coordination and professional execution.`;
}

export default function VendorDetail({ auth, setAuth }) {
    const { id } = useParams();
    const vendorId = Number(id);
    const nav = useNavigate();

    const [vendor, setVendor] = useState(null);

    // privacy-safe calendar: only confirmed dates are blocked
    const [confirmed, setConfirmed] = useState([]);

    // vendor-only panel
    const [upcoming, setUpcoming] = useState([]);

    // booking form
    const [selected, setSelected] = useState(null);
    const [customerName, setCustomerName] = useState("Tammam");
    const [customerEmail, setCustomerEmail] = useState("tammam@test.com");
    const [notes, setNotes] = useState("Evening event");
    const [parties, setParties] = useState([]);
    const [partyId, setPartyId] = useState("");
    const [statusMsg, setStatusMsg] = useState("");
    const [reviews, setReviews] = useState([]);
    const [reviewName, setReviewName] = useState("Tammam");
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [reviewMsg, setReviewMsg] = useState("");

    const isVendorViewer = auth.role === "VENDOR" && auth.vendorId === vendorId;

    useEffect(() => {
        if (auth.role !== "CUSTOMER") return;
        if (auth.customerName) setCustomerName(auth.customerName);
        if (auth.customerEmail) setCustomerEmail(auth.customerEmail);
    }, [auth]);

    useEffect(() => {
        let alive = true;
        if (auth.role !== "CUSTOMER" || !auth.customerEmail) {
            setParties([]);
            return () => (alive = false);
        }

        api
            .listParties(auth.customerEmail)
            .then((data) => {
                if (!alive) return;
                const active = (Array.isArray(data) ? data : []).filter((p) => p.status !== "COMPLETED");
                setParties(active);
            })
            .catch(() => alive && setParties([]));

        return () => (alive = false);
    }, [auth.role, auth.customerEmail]);

    useEffect(() => {
        let alive = true;

        api.getVendor(vendorId).then((v) => alive && setVendor(v)).catch(console.error);
        api
            .getVendorReviews(vendorId)
            .then((rows) => alive && setReviews(Array.isArray(rows) ? rows : []))
            .catch(() => alive && setReviews([]));

        // confirmed list for calendar blocking (safe for customers)
        api
            .getVendorConfirmed(vendorId)
            .then((rows) => alive && setConfirmed(Array.isArray(rows) ? rows : []))
            .catch(() => alive && setConfirmed([]));

        // vendor-only panel fetch
        if (isVendorViewer) {
            api
                .getVendorUpcoming(vendorId)
                .then((rows) => alive && setUpcoming(Array.isArray(rows) ? rows : []))
                .catch(() => alive && setUpcoming([]));
        } else {
            setUpcoming([]);
        }

        return () => (alive = false);
    }, [vendorId, isVendorViewer]);

    const reviewSummary = useMemo(() => {
        if (reviews.length === 0) {
            return { average: null, count: 0 };
        }
        const total = reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0);
        return { average: total / reviews.length, count: reviews.length };
    }, [reviews]);

    const blockedDates = useMemo(() => {
        // Convert confirmed booking ISO strings into Date objects
        return confirmed
            .map((b) => b.eventDate)
            .filter(Boolean)
            .map((s) => new Date(`${s}T00:00:00`));
    }, [confirmed]);

    async function submitBooking() {
        setStatusMsg("");
        const linkedParty = parties.find((p) => String(p.id) === String(partyId));

        // Airbnb-style: allow browsing without login; require login to book
        if (auth.role === "NONE") {
            nav(`/login?next=/vendors/${vendorId}`);
            return;
        }

        if (!selected && !linkedParty) {
            setStatusMsg("Pick a date from the calendar first.");
            return;
        }

        const payload = {
            eventDate: linkedParty ? linkedParty.eventDate : isoDate(selected),
            customerName,
            customerEmail,
            notes,
            partyId: linkedParty ? linkedParty.id : null,
        };

        try {
            await api.createBooking(vendorId, payload);
            setStatusMsg("✅ Request submitted! Status: REQUESTED");

            // optional: if vendor is viewing, refresh requests/upcoming via dashboard route
            // For customers: nothing to show (privacy)
        } catch (e) {
            setStatusMsg(`❌ ${e.message}`);
        }
    }

    async function submitReview() {
        setReviewMsg("");
        const rating = Number(reviewRating);
        if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
            setReviewMsg("Choose a rating between 1 and 5.");
            return;
        }

        try {
            const created = await api.createVendorReview(vendorId, {
                customerName: reviewName,
                rating,
                comment: reviewComment,
            });
            setReviews((prev) => [created, ...prev]);
            setReviewComment("");
            setReviewRating(5);
            setReviewMsg("Review submitted.");
        } catch (e) {
            setReviewMsg(e.message);
        }
    }

    function formatReviewDate(value) {
        if (!value) return "";
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return "";
        return d.toLocaleDateString();
    }

    function stars(value) {
        const n = Math.max(1, Math.min(5, Number(value) || 0));
        return "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
    }

    function onVendorImageError(event, vendorRef) {
        const img = event.currentTarget;
        const candidates = getVendorImageCandidates(vendorRef, 6);
        const attempt = Number(img.dataset.attempt || "0");
        const nextAttempt = attempt + 1;

        if (nextAttempt < candidates.length) {
            img.dataset.attempt = String(nextAttempt);
            img.src = candidates[nextAttempt];
            return;
        }

        img.onerror = null;
        img.src = getVendorImageFallback(vendorRef);
    }

    return (
        <div className="page">
            {!vendor ? (
                <div className="muted">Loading vendor…</div>
            ) : (
                <div className={isVendorViewer ? "detail" : "detail single-column"}>
                    {/* LEFT: public customer view */}
                    <div className="detail-left">
                        <div className="card">
                            <img
                                className="vendor-hero-image"
                                src={getVendorImageUrl(vendor)}
                                alt={`${vendor.businessName} cover`}
                                data-attempt="0"
                                onError={(e) => onVendorImageError(e, vendor)}
                            />
                            <div className="vendor-top">
                                <div>
                                    <div className="h2">{vendor.businessName}</div>
                                    <div className="muted">
                                        {vendor.category} • {vendor.city}
                                    </div>
                                    <div className="vendor-price-detail">{formatPricing(vendor)}</div>
                                    {vendor.priceNote && <div className="muted small">{vendor.priceNote}</div>}
                                </div>
                                <div className="pill subtle">#{vendor.id}</div>
                            </div>

                            <div className="kv">
                                <div className="kv-row">
                                    <div className="muted small">About</div>
                                    <div>{vendor.shortDescription || fallbackDescription(vendor)}</div>
                                </div>
                                <div className="kv-row">
                                    <div className="muted small">Address</div>
                                    <div>{vendor.address || `${vendor.city}, MI`}</div>
                                </div>
                                <div className="kv-row">
                                    <div className="muted small">Phone</div>
                                    <div className="mono">{vendor.phone || "—"}</div>
                                </div>
                                <div className="kv-row">
                                    <div className="muted small">Email</div>
                                    <div className="mono">{vendor.email || "—"}</div>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <div className="h3">Portfolio</div>
                            <div className="muted small">Recent work samples from this vendor category.</div>
                            <div className="portfolio-grid">
                                {getVendorGalleryUrls(vendor, 4).map((url, idx) => (
                                    <div key={`${vendor.id}-portfolio-${idx}`} className="portfolio-item">
                                        <img
                                            src={url}
                                            alt={`${vendor.businessName} portfolio sample ${idx + 1}`}
                                            loading="lazy"
                                            data-attempt="0"
                                            onError={(e) => onVendorImageError(e, vendor)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <div className="reviews-head">
                                <div>
                                    <div className="h3">Reviews</div>
                                    <div className="muted small">
                                        {reviewSummary.count > 0
                                            ? `${reviewSummary.average.toFixed(1)} average from ${reviewSummary.count} review${reviewSummary.count === 1 ? "" : "s"}`
                                            : "No reviews yet. Be the first to share feedback."}
                                    </div>
                                </div>
                            </div>

                            <div className="review-form">
                                <div className="row2">
                                    <div>
                                        <label className="label">Your Name</label>
                                        <input
                                            className="input"
                                            value={reviewName}
                                            onChange={(e) => setReviewName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Rating</label>
                                        <select
                                            className="select"
                                            value={reviewRating}
                                            onChange={(e) => setReviewRating(Number(e.target.value))}
                                        >
                                            <option value={5}>5 - Excellent</option>
                                            <option value={4}>4 - Great</option>
                                            <option value={3}>3 - Good</option>
                                            <option value={2}>2 - Fair</option>
                                            <option value={1}>1 - Poor</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="label">Comment</label>
                                    <textarea
                                        className="input review-input"
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        placeholder="Share your experience with this vendor..."
                                    />
                                </div>
                                <button className="btn" onClick={submitReview}>
                                    Submit review
                                </button>
                                {reviewMsg && <div className="status">{reviewMsg}</div>}
                            </div>

                            <div className="review-list">
                                {reviews.map((r) => (
                                    <div key={r.id} className="review-item">
                                        <div className="review-top">
                                            <strong>{r.customerName}</strong>
                                            <span className="review-stars">{stars(r.rating)}</span>
                                        </div>
                                        <div className="muted small">{formatReviewDate(r.createdAt)}</div>
                                        {r.comment && <p className="review-comment">{r.comment}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card">
                            <div className="section-head">
                                <div>
                                    <div className="h3">Availability</div>
                                    <div className="muted small">
                                        Confirmed dates are blocked. Pick any available date to request.
                                    </div>
                                </div>

                                <div className="availability-legend">
                                    <span className="legend-dot open" />
                                    <span className="small muted">Open dates</span>
                                    <span className="legend-dot blocked" />
                                    <span className="small muted">Booked dates</span>
                                </div>
                            </div>

                            <div className="availability-layout">
                                <div className="calendar-wrap">
                                    <DayPicker
                                        mode="single"
                                        selected={selected}
                                        onSelect={setSelected}
                                        disabled={blockedDates}
                                        fromDate={new Date()}
                                    />
                                </div>

                                <div className="booking-panel">
                                    <div className="booking-panel-title">Booking Snapshot</div>
                                    <div className="booking-panel-item">
                                        <span className="muted small">Selected date</span>
                                        <strong>{selected ? isoDate(selected) : "No date selected yet"}</strong>
                                    </div>
                                    <div className="booking-panel-item">
                                        <span className="muted small">Pricing starts at</span>
                                        <strong>{formatPricing(vendor)}</strong>
                                    </div>
                                    <div className="booking-panel-item">
                                        <span className="muted small">Response expectation</span>
                                        <strong>Usually within 24-48 hours</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="divider" />

                            <div className="h3">Request booking</div>
                            <div className="form">
                                {auth.role === "CUSTOMER" && parties.length > 0 && (
                                    <div>
                                        <label className="label">Is this booking for a party?</label>
                                        <select
                                            className="select"
                                            value={partyId}
                                            onChange={(e) => {
                                                const next = e.target.value;
                                                setPartyId(next);
                                                const selectedParty = parties.find((p) => String(p.id) === String(next));
                                                if (selectedParty) {
                                                    setSelected(new Date(`${selectedParty.eventDate}T00:00:00`));
                                                }
                                            }}
                                        >
                                            <option value="">No party (standalone booking)</option>
                                            {parties.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                    {p.name} — {p.eventDate}
                                                </option>
                                            ))}
                                        </select>
                                        <div className="muted small">
                                            Only active parties are shown. Completed parties are hidden.
                                        </div>
                                    </div>
                                )}

                                <div className="row2">
                                    <div>
                                        <label className="label">Customer Name</label>
                                        <input
                                            className="input"
                                            value={customerName}
                                            onChange={(e) => setCustomerName(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="label">Customer Email</label>
                                        <input
                                            className="input"
                                            value={customerEmail}
                                            onChange={(e) => setCustomerEmail(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="label">Notes</label>
                                    <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
                                </div>

                                <button className="btn" onClick={submitBooking}>
                                    Submit booking request
                                </button>

                                <div className="muted small">
                                    If you’re not logged in, this will redirect you to Login
                                </div>

                                {statusMsg && <div className="status">{statusMsg}</div>}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: vendor-only private view */}
                    {isVendorViewer && (
                        <div className="detail-right">
                            <div className="card">
                                <div className="h3">Upcoming (Vendor-only)</div>
                                <div className="muted small">
                                    Private view: upcoming confirmed bookings.
                                </div>

                                <div className="table">
                                    <div className="row head">
                                        <div>Date</div>
                                        <div>Customer</div>
                                        <div>Status</div>
                                    </div>

                                    {upcoming.map((b) => (
                                        <div key={b.id} className="row">
                                            <div className="mono">{b.eventDate}</div>
                                            <div>{b.customerName}</div>
                                            <div>
                        <span className={`badge ${String(b.status || "").toLowerCase()}`}>
                          {b.status}
                        </span>
                                            </div>
                                        </div>
                                    ))}

                                    {upcoming.length === 0 && <div className="muted small">No upcoming bookings.</div>}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
