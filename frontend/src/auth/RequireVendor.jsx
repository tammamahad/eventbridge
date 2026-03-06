import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireVendor({ children }) {
    const { auth } = useAuth();
    const location = useLocation();

    if (auth.role !== "VENDOR") {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    return children;
}