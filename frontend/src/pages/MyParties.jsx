import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

function money(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";
    return `$${n.toLocaleString()}`;
}

export default function MyParties({ auth }) {
    const email = auth.customerEmail || "";
    const customerName = auth.customerName || "Customer";
    const lockedOut = auth.role !== "CUSTOMER" || !email;

    const [rows, setRows] = useState([]);
    const [showCompleted, setShowCompleted] = useState(false);
    const [msg, setMsg] = useState("");
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState("Birthday Party");
    const [eventDate, setEventDate] = useState("");
    const [city, setCity] = useState("Detroit");
    const [venue, setVenue] = useState("");
    const [budget, setBudget] = useState("5000");
    const [notes, setNotes] = useState("");

    async function load() {
        if (lockedOut) return;
        setLoading(true);
        setMsg("");
        try {
            const data = await api.listParties(email);
            setRows(Array.isArray(data) ? data : []);
        } catch (e) {
            setRows([]);
            setMsg(`❌ ${e.message}`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [email, lockedOut]);

    const visible = useMemo(() => {
        return rows.filter((p) => showCompleted || p.status !== "COMPLETED");
    }, [rows, showCompleted]);

    async function createParty() {
        setMsg("");
        if (!name.trim()) {
            setMsg("Party name is required.");
            return;
        }
        if (!eventDate) {
            setMsg("Choose a party date.");
            return;
        }
        if (!city.trim()) {
            setMsg("City is required.");
            return;
        }

        try {
            await api.createParty({
                customerName,
                customerEmail: email,
                name: name.trim(),
                eventDate,
                city: city.trim(),
                venue: venue.trim(),
                budget: budget ? Number(budget) : null,
                notes: notes.trim(),
            });
            setMsg("✅ Party created.");
            setVenue("");
            setNotes("");
            await load();
        } catch (e) {
            setMsg(`❌ ${e.message}`);
        }
    }

    if (lockedOut) {
        return (
            <div className="page">
                <div className="hero">
                    <h1 className="h1">My Parties</h1>
                    <p className="muted">Login as a customer to create and manage parties.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="hero">
                <h1 className="h1">My Parties</h1>
                <p className="muted">Create party plans, track booked vendors, and monitor spend against your budget.</p>
            </div>

            <div className="card create-party-card">
                <div className="h3">Create a Party</div>
                <div className="muted small">Set the basics now, then attach vendor bookings as you plan.</div>

                <div className="my-parties-form">
                <div className="row2">
                    <div>
                        <label className="label">Party Name</label>
                        <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div>
                        <label className="label">Event Date</label>
                        <input
                            className="input"
                            type="date"
                            value={eventDate}
                            onChange={(e) => setEventDate(e.target.value)}
                        />
                    </div>
                </div>

                <div className="row2">
                    <div>
                        <label className="label">City</label>
                        <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    <div>
                        <label className="label">Venue</label>
                        <input className="input" value={venue} onChange={(e) => setVenue(e.target.value)} />
                    </div>
                </div>

                <div className="row2">
                    <div>
                        <label className="label">Budget (USD)</label>
                        <input
                            className="input"
                            type="number"
                            min="0"
                            value={budget}
                            onChange={(e) => setBudget(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="label">Notes</label>
                        <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                </div>

                <div className="party-form-actions">
                    <button className="btn" onClick={createParty}>
                        Create party
                    </button>
                </div>
                </div>
                {msg && <div className="status">{msg}</div>}
            </div>

            <div className="parties-head">
                <div className="h3">Party Plans</div>
                <button className="tab" onClick={() => setShowCompleted((v) => !v)}>
                    {showCompleted ? "Hide completed" : "Show completed"}
                </button>
            </div>

            {loading ? (
                <div className="muted">Loading parties…</div>
            ) : (
                <div className="parties-grid">
                    {visible.map((p) => (
                        <div key={p.id} className="card party-card">
                            <div className="party-top">
                                <div>
                                    <div className="h3">{p.name}</div>
                                    <div className="muted small">
                                        {p.eventDate} • {p.city}
                                        {p.venue ? ` • ${p.venue}` : ""}
                                    </div>
                                </div>
                                <span className={`badge ${p.status === "COMPLETED" ? "cancelled" : "confirmed"}`}>
                                    {p.status}
                                </span>
                            </div>

                            <div className="party-metrics">
                                <div className="party-metric">
                                    <span className="muted small">Budget</span>
                                    <strong>{money(p.budget)}</strong>
                                </div>
                                <div className="party-metric">
                                    <span className="muted small">Requested</span>
                                    <strong>{money(p.requestedTotal)}</strong>
                                </div>
                                <div className="party-metric">
                                    <span className="muted small">Confirmed</span>
                                    <strong>{money(p.confirmedTotal)}</strong>
                                </div>
                                <div className="party-metric">
                                    <span className="muted small">Remaining</span>
                                    <strong>{money(p.remainingBudget)}</strong>
                                </div>
                            </div>

                            <div className="divider" />
                            <div className="h3">Vendors in this party</div>
                            <div className="party-bookings">
                                {(p.bookings || []).map((b) => (
                                    <div key={b.bookingId} className="party-booking-row">
                                        <div>{b.vendorName}</div>
                                        <div className="muted small">{money(b.estimatedCost)}</div>
                                        <span className={`badge ${String(b.status || "").toLowerCase()}`}>{b.status}</span>
                                    </div>
                                ))}
                                {(p.bookings || []).length === 0 && (
                                    <div className="muted small">
                                        No vendors linked yet. <Link to="/">Browse vendors</Link> and book for this party.
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {visible.length === 0 && (
                        <div className="card">
                            <div className="h3">No parties found</div>
                            <div className="muted small">Create your first party plan to start tracking bookings and costs.</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
