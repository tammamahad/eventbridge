import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function CustomerDashboard({ auth }) {
    const customerEmail = auth?.customerEmail || "";
    const customerName = auth?.customerName || "Customer";
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState("");
    const [payingBookingId, setPayingBookingId] = useState(null);
    const [cardholderName, setCardholderName] = useState(customerName);
    const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
    const [paymentSubmitting, setPaymentSubmitting] = useState(false);

    const lockedOut = auth.role !== "CUSTOMER";

    async function loadBookings() {
        const data = await api.getCustomerBookings(customerEmail);
        setRows(Array.isArray(data) ? data : []);
    }

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

    useEffect(() => {
        setCardholderName(customerName);
    }, [customerName]);

    async function submitPayment() {
        if (!payingBookingId) return;
        setPaymentSubmitting(true);
        setMsg("");
        try {
            await api.payBooking(payingBookingId, {
                cardholderName,
                cardNumber,
            });
            await loadBookings();
            setMsg("Payment completed. Booking is now marked as paid.");
            setPayingBookingId(null);
        } catch (e) {
            setMsg(e.message);
        } finally {
            setPaymentSubmitting(false);
        }
    }

    function money(value) {
        const amount = Number(value);
        return Number.isFinite(amount) && amount > 0 ? `$${amount.toLocaleString()}` : "Quote pending";
    }

    function paymentBadgeClass(booking) {
        if (booking.status === "REQUESTED" || booking.status === "CANCELLED") return "neutral";
        const paymentStatus = String(booking.paymentStatus || "");
        if (paymentStatus === "PAID") return "confirmed";
        if (paymentStatus === "UNPAID") return "requested";
        return "neutral";
    }

    function bookingBadgeClass(booking) {
        const status = String(booking.status || "");
        if (status === "CONFIRMED") return "confirmed";
        if (status === "APPROVED") return "approved";
        if (status === "CANCELLED") return "cancelled";
        return "requested";
    }

    function bookingBadgeLabel(booking) {
        if (booking.status === "APPROVED") return "Approved";
        return booking.status || "REQUESTED";
    }

    function paymentBadgeLabel(booking) {
        if (booking.status === "REQUESTED") return "Awaiting approval";
        if (booking.status === "CANCELLED") return "Closed";
        if (booking.paymentStatus === "PAID") return "Paid";
        if (booking.paymentStatus === "UNPAID") return "Payment due";
        return "Pending";
    }

    const payingBooking = rows.find((b) => b.id === payingBookingId) || null;

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
                <p className="muted">Track booking requests, approvals, and payment progress in one place.</p>
            </div>

            {msg && <div className="status">{msg}</div>}

            <div className="card">
                {loading ? (
                    <div className="muted">Loading your bookings…</div>
                ) : (
                    <div className="table">
                        <div className="row head customer-row customer-row-payments">
                            <div>Date</div>
                            <div>Vendor</div>
                            <div>City</div>
                            <div>Status</div>
                            <div>Payment</div>
                            <div>Notes</div>
                            <div>Actions</div>
                        </div>

                        {rows.map((b) => (
                            <div key={b.id} className="row customer-row customer-row-payments">
                                <div className="mono">{b.eventDate}</div>
                                <div>{b.vendor?.businessName || `Vendor #${b.vendor?.id || "?"}`}</div>
                                <div>{b.vendor?.city || "—"}</div>
                                <div>
                                    <span className={`badge ${bookingBadgeClass(b)}`}>{bookingBadgeLabel(b)}</span>
                                </div>
                                <div>
                                    <span className={`badge ${paymentBadgeClass(b)}`}>{paymentBadgeLabel(b)}</span>
                                    <div className="muted small payment-meta">{money(b.paymentAmount)}</div>
                                </div>
                                <div>{b.notes || "—"}</div>
                                <div className="actions">
                                    {b.status === "APPROVED" && b.paymentStatus !== "PAID" && (
                                        <button
                                            className="btn small"
                                            onClick={() => {
                                                setPayingBookingId(b.id);
                                                setCardholderName(customerName);
                                                setCardNumber("4242 4242 4242 4242");
                                            }}
                                        >
                                            Pay now
                                        </button>
                                    )}
                                    <button
                                        className="btn ghost small"
                                        onClick={() => navigate(`/messages?bookingId=${b.id}`)}
                                    >
                                        Messages
                                    </button>
                                </div>
                            </div>
                        ))}

                        {rows.length === 0 && (
                            <div className="muted small">No bookings found yet for {customerEmail}.</div>
                        )}
                    </div>
                )}
            </div>

            {payingBookingId && (
                <div className="modal-backdrop" onClick={() => !paymentSubmitting && setPayingBookingId(null)}>
                    <div
                        className="card payment-card payment-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="payment-modal-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="payment-modal-head">
                            <div>
                                <div id="payment-modal-title" className="h3">Complete payment</div>
                                <div className="muted small">
                                    This is a mock checkout for demo purposes. No real charge will be made.
                                </div>
                            </div>
                            <button
                                className="btn ghost small"
                                onClick={() => setPayingBookingId(null)}
                                disabled={paymentSubmitting}
                            >
                                Close
                            </button>
                        </div>
                        <div className="payment-summary">
                            <div className="payment-summary-row">
                                <span className="muted small">Vendor</span>
                                <strong>{payingBooking?.vendor?.businessName || `Booking #${payingBookingId}`}</strong>
                            </div>
                            <div className="payment-summary-row">
                                <span className="muted small">Event date</span>
                                <strong>{payingBooking?.eventDate || "—"}</strong>
                            </div>
                            <div className="payment-summary-row">
                                <span className="muted small">Amount</span>
                                <strong>{money(payingBooking?.paymentAmount)}</strong>
                            </div>
                        </div>
                        <div className="row2">
                            <div>
                                <label className="label">Cardholder name</label>
                                <input
                                    className="input"
                                    value={cardholderName}
                                    onChange={(e) => setCardholderName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="label">Mock card number</label>
                                <input
                                    className="input"
                                    value={cardNumber}
                                    onChange={(e) => setCardNumber(e.target.value)}
                                    placeholder="4242 4242 4242 4242"
                                />
                            </div>
                        </div>
                        <div className="payment-actions">
                            <button className="btn" disabled={paymentSubmitting} onClick={submitPayment}>
                                {paymentSubmitting ? "Processing..." : "Confirm payment"}
                            </button>
                            <button
                                className="btn ghost"
                                onClick={() => setPayingBookingId(null)}
                                disabled={paymentSubmitting}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
