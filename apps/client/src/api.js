const API_BASE = '/api';

function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleJson(res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const message = data.error || data.message || res.statusText;
        throw new Error(message);
    }
    return data;
}

export async function loginRequest(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    return handleJson(res); // { user, token }
}

export async function fetchEvents() {
    const res = await fetch(`${API_BASE}/events`);
    return handleJson(res); // { events: [...] }
}

export async function fetchEvent(eventId) {
    const res = await fetch(`${API_BASE}/events/${eventId}`);
    return handleJson(res); // { event }
}

export async function fetchTicketTypes(eventId) {
    const res = await fetch(`${API_BASE}/events/${eventId}/ticket-types`);
    return handleJson(res); // { ticketTypes: [...] } (whatever your backend sends)
}

export async function checkout(eventId, items) {
    const res = await fetch(`${API_BASE}/events/${eventId}/checkout`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        },
        body: JSON.stringify({ items }),
    });
    return handleJson(res); // { order, tickets }
}

export async function fetchAnnouncements(eventId) {
    const res = await fetch(`${API_BASE}/events/${eventId}/announcements`);
    return handleJson(res); // { announcements: [...] }
}

export async function createAnnouncement(eventId, message) {
    const res = await fetch(`${API_BASE}/events/${eventId}/announcements`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        },
        body: JSON.stringify({ message }),
    });
    return handleJson(res);
}

export async function fetchVendors(eventId) {
    const res = await fetch(`${API_BASE}/events/${eventId}/vendors`);
    return handleJson(res); // { vendors: [...] }
}

export async function assignVendor(eventId, email) {
    const res = await fetch(`${API_BASE}/events/${eventId}/vendors`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        },
        body: JSON.stringify({ email }),
    });
    return handleJson(res);
}

export async function createTicketType(eventId, payload) {
    const res = await fetch(`${API_BASE}/events/${eventId}/ticket-types`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
    });
    return handleJson(res);
}

export async function fetchAnalytics(eventId) {
    const res = await fetch(`${API_BASE}/events/${eventId}/analytics`, {
        headers: getAuthHeaders(),
    });
    return handleJson(res);
}

export async function checkInTicket(token) {
    const res = await fetch(`${API_BASE}/checkin`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        },
        body: JSON.stringify({ token }),
    });
    return handleJson(res);
}

export async function fetchNotifications() {
    const res = await fetch(`${API_BASE}/me/notifications`, {
        headers: getAuthHeaders(),
    });
    return handleJson(res);
}
