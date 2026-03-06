import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function Login({ setAuth }) {
    const nav = useNavigate();
    const q = useQuery();
    const next = q.get("next") || "/";

    const [vendors, setVendors] = useState([]);
    const [vendorId, setVendorId] = useState("");
    const [customerName, setCustomerName] = useState("Tammam");
    const [customerEmail, setCustomerEmail] = useState("tammam@test.com");

    useEffect(() => {
        api.listVendors().then(setVendors).catch(console.error);
    }, []);

    return (
        <div className="page login-page">
            <div className="login-head">
                <div className="eyebrow">Demo Access</div>
                <h1 className="h1">Choose Your EventBridge Workspace</h1>
                <p className="muted">Browse as a customer or sign in as a vendor to manage bookings and operations.</p>
            </div>

            <div className="login-shell">
                <div className="login-visual">
                    <div className="login-visual-overlay" />
                    <div className="login-visual-content">
                        <div className="login-title">From first inquiry to confirmed booking in one workflow.</div>
                        <div className="login-points">
                            <span>Vendor discovery</span>
                            <span>Booking lifecycle management</span>
                            <span>Ratings and performance insights</span>
                        </div>
                    </div>
                </div>

                <div className="login-actions">
                    <div className="card login-card">
                        <div className="h2">Customer</div>
                        <p className="muted">Browse vendors, compare pricing, and submit booking requests.</p>
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
                        <button
                            className="btn"
                            onClick={() => {
                                setAuth({
                                    role: "CUSTOMER",
                                    vendorId: null,
                                    customerName: customerName.trim() || "Customer",
                                    customerEmail: customerEmail.trim().toLowerCase(),
                                });
                                nav(next);
                            }}
                        >
                            Continue as Customer
                        </button>
                    </div>

                    <div className="card login-card">
                        <div className="h2">Vendor</div>
                        <p className="muted">View requests, confirm/cancel bookings, and monitor analytics.</p>

                        <label className="label">Select vendor account</label>
                        <select className="select" value={vendorId} onChange={(e) => setVendorId(e.target.value)}>
                            <option value="">Choose vendor…</option>
                            {vendors.map((v) => (
                                <option key={v.id} value={v.id}>
                                    #{v.id} — {v.businessName}
                                </option>
                            ))}
                        </select>

                        <button
                            className="btn"
                            disabled={!vendorId}
                            onClick={() => {
                                setAuth({ role: "VENDOR", vendorId: Number(vendorId) });
                                nav("/vendor/dashboard");
                            }}
                        >
                            Continue as Vendor
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
