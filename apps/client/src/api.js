const API_BASE =
    import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function authHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
        ...(options.headers || {}),
        },
        ...options,
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
        const msg = data?.error || data?.message || res.statusText;
        throw new Error(msg);
    }
    return data;
}

// ---------- AUTH ----------
export function register({ name, email, password }) {
    return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
    });
}

export function login(email, password) {
    return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
}

export function getMe() {
    return request('/auth/me', { method: 'GET' });
}

// ---------- EVENTS ----------
export function fetchEvents() {
    return request('/events', { method: 'GET' });
}

export function fetchEvent(id) {
    return request(`/events/${id}`, { method: 'GET' });
}

export function createEvent(data) {
    return request('/events', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export function updateEvent(id, data) {
    return request(`/events/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export function deleteEvent(id) {
    return request(`/events/${id}`, { method: 'DELETE' });
}

// ---------- TICKETS ----------
export function fetchTicketTypes(eventId) {
    return request(`/events/${eventId}/ticket-types`, { method: 'GET' });
}

export function createTicketType(eventId, data) {
    return request(`/events/${eventId}/ticket-types`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

export async function checkout(eventId, items, token) {
    // items: [{ ticketTypeId, quantity }]
    return request(`/events/${eventId}/checkout`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: JSON.stringify({ items }),
    });
}

export function checkinTicket(token) {
    return request('/checkin', {
        method: 'POST',
        body: JSON.stringify({ token }),
    });
}

// ---------- ANNOUNCEMENTS ----------
export function fetchAnnouncements(eventId) {
    return request(`/events/${eventId}/announcements`, { method: 'GET' });
}

export function createAnnouncement(eventId, message) {
    return request(`/events/${eventId}/announcements`, {
        method: 'POST',
        body: JSON.stringify({ message }),
    });
}

// ---------- VENDORS ----------
export function fetchVendors(eventId) {
    return request(`/events/${eventId}/vendors`, { method: 'GET' });
}

export function assignVendor(eventId, email) {
    return request(`/events/${eventId}/vendors`, {
        method: 'POST',
        body: JSON.stringify({ email }),
    });
}

// ---------- ANALYTICS ----------
export function fetchAnalytics(eventId) {
    return request(`/events/${eventId}/analytics`, { method: 'GET' });
}

// ---------- NOTIFICATIONS ----------
export function fetchNotifications() {
    return request('/me/notifications', { method: 'GET' });
}

// ---------- GENERIC ----------
export async function fetchMyTickets(token) {
    return request("/me/tickets", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
}

export { request };