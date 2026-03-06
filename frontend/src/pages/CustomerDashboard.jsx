import React, { useEffect, useState } from "react";
import { api } from "../api";

export default function CustomerDashboard({ auth }) {
    const customerEmail = auth?.customerEmail || "";
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");

    const lockedOut = auth.role !== "CUSTOMER";

    useEffect(() => {
        let alive = true;
        if (lockedOut || !customerEmail) {
            setLoading(false);
            return () => (alive = false);
        }

        setLoading(true);
        setMsg("");
        api
            .getCustomerBookings(customerEmail)
            .then((data) => {
                if (!alive) return;
                setRows(Array.isArray(data) ? data : []);
            })
            .catch((e) => alive && setMsg(e.message))
            .finally(() => alive && setLoading(false));

        return () => (alive = false);
    }, [lockedOut, customerEmail]);

    if (lockedOut) {
        return (
            <div className="page">
                <div className="hero">
                    <h1 className="h1">My Bookings</h1>
                    <p className="muted">You must be logged in as a customer to view this page.</p>
                </div>
            </div>
        );
    }

    if (!customerEmail) {
        return (
            <div className="page">
                <div className="hero">
                    <h1 className="h1">My Bookings</h1>
                    <p className="muted">Customer email is missing. Login again as customer to sync bookings.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="hero">
                <h1 className="h1">My Bookings</h1>
                <p className="muted">Track booking requests and status updates in one place.</p>
            </div>

            {msg && <div className="status">❌ {msg}</div>}

            <div className="card">
                {loading ? (
                    <div className="muted">Loading your bookings…</div>
                ) : (
                    <div className="table">
                        <div className="row head">
                            <div>Date</div>
                            <div>Vendor</div>
                            <div>City</div>
                            <div>Status</div>
                            <div>Notes</div>
                        </div>

                        {rows.map((b) => (
                            <div key={b.id} className="row">
                                <div className="mono">{b.eventDate}</div>
                                <div>{b.vendor?.businessName || `Vendor #${b.vendor?.id || "?"}`}</div>
                                <div>{b.vendor?.city || "—"}</div>
                                <div>
                                    <span className={`badge ${String(b.status || "").toLowerCase()}`}>{b.status}</span>
                                </div>
                                <div>{b.notes || "—"}</div>
                            </div>
                        ))}

                        {rows.length === 0 && (
                            <div className="muted small">No bookings found yet for {customerEmail}.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
