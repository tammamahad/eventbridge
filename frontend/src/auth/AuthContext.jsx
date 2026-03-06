import React, { createContext, useContext, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // role: null | "CUSTOMER" | "VENDOR"
    // vendorId only set if role === "VENDOR"
    const [auth, setAuth] = useState({ role: null, vendorId: null });

    const value = useMemo(() => {
        return {
            auth,
            loginCustomer: () => setAuth({ role: "CUSTOMER", vendorId: null }),
            loginVendor: (vendorId) =>
                setAuth({ role: "VENDOR", vendorId: Number(vendorId) }),
            logout: () => setAuth({ role: null, vendorId: null })
        };
    }, [auth]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}