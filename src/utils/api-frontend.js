/**
 * MANAS Jewellery — Frontend API Helper
 * Place this file at: lib/api.js
 *
 * Usage in any Next.js component or server action:
 *   import api from "@/lib/api";
 *   const { products } = await api.products.getAll({ category: "Ring" });
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/* ── Core fetch wrapper ── */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const config = {
    headers: { "Content-Type": "application/json", ...options.headers },
    credentials: "include",
    ...options,
  };

  if (options.body && typeof options.body === "object") {
    config.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, config);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || `API Error ${res.status}`);
  }
  return data;
}

/* ── Auth header helper ── */
function withAuth(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

/* ════════════════════════════════════════
   API METHODS
════════════════════════════════════════ */
const api = {

  /* ── AUTH ─────────────────────────── */
  auth: {
    register: (body)           => request("/auth/register",   { method: "POST", body }),
    login:    (body)           => request("/auth/login",      { method: "POST", body }),
    sendOtp:  (phone)          => request("/auth/send-otp",   { method: "POST", body: { phone } }),
    verifyOtp:(phone, otp)     => request("/auth/verify-otp", { method: "POST", body: { phone, otp } }),
    logout:   (token)          => request("/auth/logout",     { method: "POST", ...withAuth(token) }),
    getMe:    (token)          => request("/auth/me",         withAuth(token)),
    updateMe: (body, token)    => request("/auth/me",         { method: "PUT",  body, ...withAuth(token) }),
    addAddress:   (body, token)    => request("/auth/addresses",     { method: "POST",   body, ...withAuth(token) }),
    removeAddress:(id,   token)    => request(`/auth/addresses/${id}`,{ method: "DELETE",      ...withAuth(token) }),
  },

  /* ── PRODUCTS ─────────────────────── */
  products: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/products${qs ? `?${qs}` : ""}`);
    },
    getOne:        (slug)          => request(`/products/${slug}`),
    getHomeSections:()             => request("/products/home-sections"),
    getSuggestions:(q)             => request(`/products/search/suggestions?q=${encodeURIComponent(q)}`),
    addReview: (id, body, token)   => request(`/products/${id}/reviews`, { method: "POST", body, ...withAuth(token) }),

    /* Admin */
    create: (body, token)  => request("/products",     { method: "POST",   body, ...withAuth(token) }),
    update: (id, body, token) => request(`/products/${id}`, { method: "PUT", body, ...withAuth(token) }),
    remove: (id, token)    => request(`/products/${id}`, { method: "DELETE",      ...withAuth(token) }),
  },

  /* ── CART ─────────────────────────── */
  cart: {
    get:          (token)          => request("/cart",             withAuth(token)),
    add:          (body, token)    => request("/cart/add",         { method: "POST",   body, ...withAuth(token) }),
    update:       (itemId, qty, token) => request(`/cart/${itemId}`, { method: "PUT", body: { qty }, ...withAuth(token) }),
    remove:       (itemId, token)  => request(`/cart/${itemId}`,   { method: "DELETE",              ...withAuth(token) }),
    clear:        (token)          => request("/cart",             { method: "DELETE",               ...withAuth(token) }),
    applyCoupon:  (code, token)    => request("/cart/coupon",      { method: "POST",   body: { code }, ...withAuth(token) }),
    removeCoupon: (token)          => request("/cart/coupon",      { method: "DELETE",               ...withAuth(token) }),
  },

  /* ── WISHLIST ─────────────────────── */
  wishlist: {
    get:    (token)          => request("/wishlist",               withAuth(token)),
    toggle: (productId, token) => request(`/wishlist/${productId}`, { method: "POST", ...withAuth(token) }),
  },

  /* ── ORDERS ───────────────────────── */
  orders: {
    create:   (body, token)     => request("/orders",              { method: "POST", body, ...withAuth(token) }),
    getAll:   (params = {}, token) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/orders${qs ? `?${qs}` : ""}`, withAuth(token));
    },
    getOne:   (orderNumber, token) => request(`/orders/${orderNumber}`, withAuth(token)),
    cancel:   (id, reason, token) => request(`/orders/${id}/cancel`, { method: "PUT", body: { reason }, ...withAuth(token) }),
  },
};

export default api;
