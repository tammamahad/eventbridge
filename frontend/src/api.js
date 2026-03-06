const API_BASE = "http://localhost:9090";

async function http(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            Accept: "application/json",
            ...(options.headers || {}),
        },
    });

    // Try to parse JSON either way (Spring errors also return JSON sometimes)
    const text = await res.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = text;
    }

    if (!res.ok) {
        const msg =
            (data && data.message) ||
            (data && data.error) ||
            (typeof data === "string" ? data : "") ||
            `HTTP ${res.status}`;
        const err = new Error(msg);
        err.status = res.status;
        err.body = data;
        throw err;
    }

    return data;
}

export const api = {
    // vendors
    listVendors: () => http(`/vendors`),
    getVendor: (vendorId) => http(`/vendors/${vendorId}`),

    // bookings
    createBooking: (vendorId, payload) =>
        http(`/bookings?vendorId=${vendorId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }),
    listParties: (customerEmail) =>
        http(`/parties?customerEmail=${encodeURIComponent(customerEmail)}`),
    createParty: (payload) =>
        http(`/parties`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }),

    listAllBookings: () => http(`/bookings`),
    getCustomerBookings: (email) =>
        http(`/bookings/customer?email=${encodeURIComponent(email)}`),

    // vendor-only booking views
    getVendorBookings: (vendorId) => http(`/vendors/${vendorId}/bookings`),
    getVendorRequests: (vendorId) => http(`/vendors/${vendorId}/bookings/requests`),
    getVendorConfirmed: (vendorId) => http(`/vendors/${vendorId}/bookings/confirmed`),
    getVendorUpcoming: (vendorId) => http(`/vendors/${vendorId}/bookings/upcoming`),
    getVendorAnalytics: (vendorId) => http(`/vendors/${vendorId}/analytics`),
    getVendorReviews: (vendorId) => http(`/vendors/${vendorId}/reviews`),
    createVendorReview: (vendorId, payload) =>
        http(`/vendors/${vendorId}/reviews`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }),
    getRatingsSummary: () => http(`/vendors/ratings/summary`),

    // actions
    confirmBooking: (bookingId) =>
        http(`/bookings/${bookingId}/confirm`, { method: "PATCH" }),
    cancelBooking: (bookingId) =>
        http(`/bookings/${bookingId}/cancel`, { method: "PATCH" }),
};
