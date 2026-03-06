import React, { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Link, Navigate, NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { api } from "./api";
import "./styles.css";

import Marketplace from "./pages/Marketplace";
import VendorDetail from "./pages/VendorDetail";
import VendorDashboard from "./pages/VendorDashboard";
import Login from "./pages/Login";
import CustomerDashboard from "./pages/CustomerDashboard";
import MyParties from "./pages/MyParties";

function TopNav({ auth, setAuth }) {
    const customerName = (auth.customerName || "").trim();
    const roleLabel =
        auth.role === "VENDOR"
            ? `Vendor #${auth.vendorId}`
            : auth.role === "CUSTOMER"
                ? customerName
                    ? `Hi, ${customerName}`
                    : "Customer"
                : "Not logged in";

    return (
        <div className="nav">
            <div className="nav-left">
                <div className="brand">
                    <span className="brand-dot" />
                    <span>EventBridge</span>
                </div>

                <div className="nav-links">
                    {auth.role !== "VENDOR" && (
                        <NavLink to="/" className={({ isActive }) => (isActive ? "navlink active" : "navlink")}>
                            Marketplace
                        </NavLink>
                    )}

                    {auth.role === "VENDOR" && (
                        <NavLink
                            to="/vendor/dashboard"
                            className={({ isActive }) => (isActive ? "navlink active" : "navlink")}
                        >
                            Vendor Dashboard
                        </NavLink>
                    )}

                    {auth.role === "CUSTOMER" && (
                        <NavLink
                            to="/customer/parties"
                            className={({ isActive }) => (isActive ? "navlink active" : "navlink")}
                        >
                            My Parties
                        </NavLink>
                    )}

                    {auth.role === "CUSTOMER" && (
                        <NavLink
                            to="/customer/dashboard"
                            className={({ isActive }) => (isActive ? "navlink active" : "navlink")}
                        >
                            My Bookings
                        </NavLink>
                    )}
                </div>
            </div>

            <div className="nav-right">
                <span className="pill">{roleLabel}</span>

                {auth.role === "NONE" ? (
                    <Link className="btn ghost" to="/login">
                        Login
                    </Link>
                ) : (
                    <button
                        className="btn ghost"
                        onClick={() => setAuth({ role: "NONE", vendorId: null, customerName: null, customerEmail: null })}
                        title="Clear demo session"
                    >
                        Logout
                    </button>
                )}
            </div>
        </div>
    );
}

export default function App() {
    const [auth, setAuth] = useState(() => {
        try {
            const raw = localStorage.getItem("eventbridge_auth");
            return raw ? JSON.parse(raw) : { role: "NONE", vendorId: null, customerName: null, customerEmail: null };
        } catch {
            return { role: "NONE", vendorId: null, customerName: null, customerEmail: null };
        }
    });

    useEffect(() => {
        localStorage.setItem("eventbridge_auth", JSON.stringify(auth));
    }, [auth]);

    return (
        <BrowserRouter>
            <div className="bg" />
            <TopNav auth={auth} setAuth={setAuth} />

            <div className="container">
                <Routes>
                    <Route
                        path="/"
                        element={auth.role === "VENDOR" ? <Navigate to="/vendor/dashboard" replace /> : <Marketplace auth={auth} />}
                    />
                    <Route path="/vendors/:id" element={<VendorDetail auth={auth} setAuth={setAuth} />} />
                    <Route path="/vendor/dashboard" element={<VendorDashboard auth={auth} />} />
                    <Route path="/customer/parties" element={<MyParties auth={auth} />} />
                    <Route path="/customer/dashboard" element={<CustomerDashboard auth={auth} />} />
                    <Route path="/login" element={<Login setAuth={setAuth} />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}
