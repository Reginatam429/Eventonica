const API_BASE =
    import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, { method = "GET", headers = {}, body } = {}) {
    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
        },
        body,
    });

    let data = null;
    const text = await res.text();
    if (text) {
        try {
        data = JSON.parse(text);
        } catch {
        data = text;
        }
    }

    if (!res.ok) {
        const msg = data && data.error ? data.error : "Request failed";
        const err = new Error(msg);
        err.status = res.status;
        err.payload = data;
        throw err;
    }

    return data;
}

/* Auth ---------------------------------------------------------- */

export async function loginRequest(email, password) {
    return request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
    });
}

export async function registerRequest({ name, email, password, roles }) {
    return request("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password, roles }),
    });
}

// Get the currently logged-in user
export async function getMe() {
    return request("/me");
}

export { loginRequest as login, registerRequest as register };

/* Events -------------------------------------------------------- */

export function listEvents() {
    return request("/events");
}

export function getEvent(id) {
    return request(`/events/${id}`);
}

export function createEvent(payload) {
    // payload: { title, description, type, venue, address, startAt, endAt, capacity }
    return request("/events", {
        method: "POST",
        body: JSON.stringify(payload),
    });
}

export function updateEvent(id, payload) {
    return request(`/events/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
    });
}

export function deleteEvent(id) {
    return request(`/events/${id}`, {
        method: "DELETE",
    });
}

/* Tickets / checkout -------------------------------------------- */

export function checkout(eventId, items) {
    // items: [{ ticketTypeId, quantity }]
    return request(`/events/${eventId}/checkout`, {
        method: "POST",
        body: JSON.stringify({ items }),
    });
}

export function listMyTickets() {
    return request("/me/tickets");
}

export function checkInTicket(token) {
    return request("/checkin", {
        method: "POST",
        body: JSON.stringify({ token }),
    });
}

/* Announcements / notifications -------- */

export function listAnnouncements(eventId) {
    return request(`/events/${eventId}/announcements`);
}

export function createAnnouncement(eventId, message) {
    return request(`/events/${eventId}/announcements`, {
        method: "POST",
        body: JSON.stringify({ message }),
    });
}

export function listNotifications() {
    return request("/me/notifications");
}

export function assignVendor(eventId, vendorId) {
    return request(`/events/${eventId}/vendors`, {
        method: "POST",
        body: JSON.stringify({ vendorId }),
    });
}

export function removeVendor(eventId, vendorId) {
    return request(`/events/${eventId}/vendors/${vendorId}`, {
        method: "DELETE",
    });
}

export function listTicketTypes(eventId) {
    return request(`/events/${eventId}/ticket-types`);
}

export function createTicketType(eventId, ticketType) {
    // ticketType is an object like { name, price, capacity } etc.
    return request(`/events/${eventId}/ticket-types`, {
        method: "POST",
        body: JSON.stringify(ticketType),
    });
}

export function updateTicketType(eventId, ticketTypeId, updates) {
    return request(`/events/${eventId}/ticket-types/${ticketTypeId}`, {
        method: "PUT",
        body: JSON.stringify(updates),
    });
}

export function deleteTicketType(eventId, ticketTypeId) {
    return request(`/events/${eventId}/ticket-types/${ticketTypeId}`, {
        method: "DELETE",
    });
}

export function listAnalytics(eventId) {
    return request(`/events/${eventId}/analytics`);
}

// Aliases for pages using older names
export { checkInTicket as checkinTicket };