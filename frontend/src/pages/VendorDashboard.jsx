import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api";

const TABS = ["REQUESTED", "CONFIRMED", "CANCELLED", "UPCOMING"];

export default function VendorDashboard({ auth }) {
    const vendorId = auth.vendorId;
    const [tab, setTab] = useState("REQUESTED");
    const [rows, setRows] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [msg, setMsg] = useState("");

    const lockedOut = auth.role !== "VENDOR" || !vendorId;

    async function load() {
        if (lockedOut) return;
        setMsg("");

        try {
            const fetchRows = async () => {
                if (tab === "REQUESTED") return api.getVendorRequests(vendorId);
                if (tab === "CONFIRMED") return api.getVendorConfirmed(vendorId);
                if (tab === "CANCELLED") {
                    const all = await api.getVendorBookings(vendorId);
                    return (all || []).filter((b) => b.status === "CANCELLED");
                }
                if (tab === "UPCOMING") return api.getVendorUpcoming(vendorId);
                return [];
            };

            const [data, metrics] = await Promise.all([
                fetchRows(),
                api.getVendorAnalytics(vendorId),
            ]);

            setRows(Array.isArray(data) ? data : []);
            setAnalytics(metrics || null);
        } catch (e) {
            setMsg(`❌ ${e.message}`);
            setRows([]);
            setAnalytics(null);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, vendorId, auth.role]);

    async function confirm(id) {
        setMsg("");
        try {
            await api.confirmBooking(id);
            setMsg("✅ Confirmed");
            await load();
        } catch (e) {
            setMsg(`❌ ${e.message}`);
        }
    }

    async function cancel(booking) {
        const ok = window.confirm(
            `Are you sure you want to cancel this booking for ${booking.customerName} on ${booking.eventDate}?`
        );
        if (!ok) return;

        setMsg("");
        try {
            await api.cancelBooking(booking.id);
            setMsg("✅ Cancelled");
            await load();
        } catch (e) {
            setMsg(`❌ ${e.message}`);
        }
    }

    function formatMonth(month) {
        const [year, mm] = String(month || "").split("-");
        if (!year || !mm) return month || "";
        const d = new Date(Number(year), Number(mm) - 1, 1);
        return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
    }

    function barWidth(value, maxValue) {
        if (!maxValue || maxValue <= 0) return 8;
        return Math.max(8, Math.round((value / maxValue) * 100));
    }

    if (lockedOut) {
        return (
            <div className="page">
                <div className="hero">
                    <h1 className="h1">Vendor Dashboard</h1>
                    <p className="muted">You must be logged in as a vendor to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="hero">
                <h1 className="h1">Vendor Dashboard</h1>
                <p className="muted">Vendor #{vendorId} — manage requests, confirm/cancel, see upcoming.</p>
            </div>

            {analytics && (
                <div className="analytics-grid">
                    <div className="card metric-card">
                        <div className="metric-label">Total Bookings</div>
                        <div className="metric-value">{analytics.totalBookings}</div>
                    </div>
                    <div className="card metric-card">
                        <div className="metric-label">Conversion</div>
                        <div className="metric-value">{analytics.conversionRate}%</div>
                    </div>
                    <div className="card metric-card">
                        <div className="metric-label">Upcoming</div>
                        <div className="metric-value">{analytics.upcomingBookings}</div>
                    </div>
                    <div className="card metric-card">
                        <div className="metric-label">Requested / Confirmed / Cancelled</div>
                        <div className="metric-value small-metrics">
                            {analytics.requestedBookings} / {analytics.confirmedBookings} / {analytics.cancelledBookings}
                        </div>
                    </div>
                </div>
            )}

            {analytics && (
                <div className="card analytics-trend">
                    <div className="h3">Monthly Booking Trend (Last 6 Months)</div>
                    <div className="trend-list">
                        {analytics.monthlyTrend.map((m) => {
                            const max = Math.max(...analytics.monthlyTrend.map((p) => p.total), 1);
                            return (
                                <div key={m.month} className="trend-row">
                                    <div className="trend-month">{formatMonth(m.month)}</div>
                                    <div className="trend-bar-wrap">
                                        <div
                                            className="trend-bar"
                                            style={{ width: `${barWidth(m.total, max)}%` }}
                                        />
                                    </div>
                                    <div className="trend-meta">
                                        {m.total} total • {m.confirmed} confirmed • {m.cancelled} cancelled
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="tabs">
                {TABS.map((t) => (
                    <button
                        key={t}
                        className={t === tab ? "tab active" : "tab"}
                        onClick={() => setTab(t)}
                    >
                        {t}
                    </button>
                ))}
            </div>

            {msg && <div className="status">{msg}</div>}

            <div className="card">
                <div className="table">
                    <div className="row head">
                        <div>Date</div>
                        <div>Customer</div>
                        <div>Email</div>
                        <div>Status</div>
                        <div>Actions</div>
                    </div>

                    {rows.map((b) => (
                        <div key={b.id} className="row">
                            <div className="mono">{b.eventDate}</div>
                            <div>{b.customerName}</div>
                            <div className="mono">{b.customerEmail}</div>
                            <div>
                                <span className={`badge ${String(b.status || "").toLowerCase()}`}>{b.status}</span>
                            </div>
                            <div className="actions">
                                {(b.status === "REQUESTED" || b.status === "CONFIRMED") && (
                                    <button className="btn ghost small" onClick={() => cancel(b)}>
                                        Cancel
                                    </button>
                                )}
                                {b.status === "REQUESTED" && (
                                    <button className="btn small" onClick={() => confirm(b.id)}>
                                        Confirm
                                    </button>
                                )}
                                {b.status !== "REQUESTED" && b.status !== "CONFIRMED" && (
                                    <span className="muted small">—</span>
                                )}
                            </div>
                        </div>
                    ))}

                    {rows.length === 0 && <div className="muted small">No records for this tab.</div>}
                </div>
            </div>
        </div>
    );
}
