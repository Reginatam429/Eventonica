import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    fetchEvent,
    fetchTicketTypes,
    fetchAnnouncements,
    createAnnouncement,
    fetchVendors,
    assignVendor,
    createTicketType,
    checkout,
    fetchAnalytics,
    fetchNotifications,
} from '../api';
import { useAuth } from '../../../client/src/AuthContext.jsx';

export default function EventDetailPage() {
    const { eventId } = useParams();
    const { user, isLoggedIn, hasRole } = useAuth();

    const [event, setEvent] = useState(null);
    const [ticketTypes, setTicketTypes] = useState([]);
    const [announcements, setAnnouncements] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [error, setError] = useState('');

    // Checkout state
    const [selectedTicketTypeId, setSelectedTicketTypeId] = useState('');
    const [ticketQty, setTicketQty] = useState(1);
    const [checkoutResult, setCheckoutResult] = useState(null);
    const [checkoutError, setCheckoutError] = useState('');

    // Announcement state
    const [newAnnouncement, setNewAnnouncement] = useState('');
    const [announceError, setAnnounceError] = useState('');

    // Vendor assignment
    const [vendorEmail, setVendorEmail] = useState('');
    const [vendorError, setVendorError] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
        try {
            const [eventData, ttData, annData, vendData] = await Promise.all([
            fetchEvent(eventId),
            fetchTicketTypes(eventId),
            fetchAnnouncements(eventId),
            fetchVendors(eventId),
            ]);
            if (cancelled) return;
            setEvent(eventData.event);
            setTicketTypes(ttData.ticketTypes || ttData.ticket_types || []);
            setAnnouncements(annData.announcements || []);
            setVendors(vendData.vendors || []);
        } catch (err) {
            if (!cancelled) setError(err.message || 'Failed to load event');
        }
        })();
        return () => {
        cancelled = true;
        };
    }, [eventId]);

    const isOrganizerOwner =
        user && event && hasRole('organizer') && event.organizer_id === user.id;

    async function handleCheckout(e) {
        e.preventDefault();
        setCheckoutError('');
        setCheckoutResult(null);

        if (!isLoggedIn) {
        setCheckoutError('Please log in as an attendee first.');
        return;
        }
        if (!selectedTicketTypeId) {
        setCheckoutError('Select a ticket type.');
        return;
        }
        try {
        const data = await checkout(eventId, [
            { ticketTypeId: selectedTicketTypeId, quantity: Number(ticketQty) || 1 },
        ]);
        setCheckoutResult(data); // { order, tickets }
        } catch (err) {
        setCheckoutError(err.message || 'Checkout failed');
        }
    }

    async function handleCreateAnnouncement(e) {
        e.preventDefault();
        setAnnounceError('');
        if (!newAnnouncement || newAnnouncement.trim().length < 5) {
        setAnnounceError('Message is too short.');
        return;
        }
        try {
        await createAnnouncement(eventId, newAnnouncement.trim());
        setNewAnnouncement('');
        const annData = await fetchAnnouncements(eventId);
        setAnnouncements(annData.announcements || []);
        if (isLoggedIn) {
            const notif = await fetchNotifications();
            setNotifications(notif.notifications || []);
        }
        } catch (err) {
        setAnnounceError(err.message || 'Failed to post announcement');
        }
    }

    async function handleAssignVendor(e) {
        e.preventDefault();
        setVendorError('');
        if (!vendorEmail.trim()) {
        setVendorError('Enter vendor email.');
        return;
        }
        try {
        await assignVendor(eventId, vendorEmail.trim());
        setVendorEmail('');
        const vendData = await fetchVendors(eventId);
        setVendors(vendData.vendors || []);
        } catch (err) {
        setVendorError(err.message || 'Failed to assign vendor');
        }
    }

    async function handleCreateTicketType(e) {
        e.preventDefault();
        const name = prompt('Ticket name (e.g., General Admission)');
        if (!name) return;
        const priceInput = prompt('Price in dollars (e.g., 50)');
        const quantityInput = prompt('Quantity (e.g., 100)');
        const price = Math.round(Number(priceInput || '0') * 100);
        const quantity = Number(quantityInput || '0');

        if (!price || !quantity) {
        alert('Invalid price or quantity.');
        return;
        }

        try {
        await createTicketType(eventId, {
            name,
            priceCents: price,
            quantity,
        });
        const ttData = await fetchTicketTypes(eventId);
        setTicketTypes(ttData.ticketTypes || ttData.ticket_types || []);
        } catch (err) {
        alert(err.message || 'Failed to create ticket type');
        }
    }

    async function handleLoadAnalytics() {
        try {
        const data = await fetchAnalytics(eventId);
        setAnalytics(data.analytics || data);
        } catch (err) {
        alert(err.message || 'Failed to load analytics');
        }
    }

    if (error) {
        return (
        <div className="page">
            <h1>Event</h1>
            <p className="error">{error}</p>
        </div>
        );
    }
    if (!event) {
        return (
        <div className="page">
            <h1>Event</h1>
            <p>Loading...</p>
        </div>
        );
    }

    const eventStart = new Date(event.start_at || event.startAt).toLocaleString();
    const eventEnd = new Date(event.end_at || event.endAt).toLocaleString();

    return (
        <div className="page">
        <h1>{event.title}</h1>
        <p>{event.description}</p>
        <p>
            <strong>When:</strong> {eventStart} – {eventEnd}
        </p>
        <p>
            <strong>Where:</strong> {event.venue} ({event.address})
        </p>
        <p>
            <strong>Status:</strong> {event.status} |{' '}
            <strong>Published:</strong> {String(event.published)}
        </p>

        {/* Ticket purchase */}
        <section className="section">
            <h2>Tickets</h2>
            {ticketTypes.length === 0 ? (
            <p>No ticket types defined yet.</p>
            ) : (
            <form onSubmit={handleCheckout} className="card">
                <label>
                Ticket Type
                <select
                    value={selectedTicketTypeId}
                    onChange={e => setSelectedTicketTypeId(e.target.value)}
                >
                    <option value="">Select...</option>
                    {ticketTypes.map(tt => (
                    <option key={tt.id} value={tt.id}>
                        {tt.name} — ${(tt.price_cents || tt.priceCents) / 100} (
                        {tt.quantity} available)
                    </option>
                    ))}
                </select>
                </label>
                <label>
                Quantity
                <input
                    type="number"
                    min="1"
                    value={ticketQty}
                    onChange={e => setTicketQty(e.target.value)}
                />
                </label>
                {checkoutError && <p className="error">{checkoutError}</p>}
                <button type="submit">Register / Purchase</button>
            </form>
            )}

            {checkoutResult && (
            <div className="card">
                <h3>Order Confirmed</h3>
                <p>Order ID: {checkoutResult.order.id}</p>
                <p>
                Total:{' '}
                ${(checkoutResult.order.total_amount || 0) / 100}
                </p>
                <h4>Your Tickets</h4>
                <ul>
                {checkoutResult.tickets.map(t => (
                    <li key={t.id}>
                    Token: <code>{t.qr_code}</code>
                    {t.ticket_type_name && <> — {t.ticket_type_name}</>}
                    </li>
                ))}
                </ul>
            </div>
            )}
        </section>

        {/* Announcements */}
        <section className="section">
            <h2>Announcements</h2>
            {announcements.length === 0 ? (
            <p>No announcements yet.</p>
            ) : (
            <ul>
                {announcements.map(a => (
                <li key={a.id}>
                    <strong>{new Date(a.created_at).toLocaleString()}:</strong>{' '}
                    {a.message}
                </li>
                ))}
            </ul>
            )}
        </section>

        {/* Vendors */}
        <section className="section">
            <h2>Vendors</h2>
            {vendors.length === 0 ? (
            <p>No vendors assigned.</p>
            ) : (
            <ul>
                {vendors.map(v => (
                <li key={v.id}>
                    {v.name} — {v.email}
                </li>
                ))}
            </ul>
            )}
        </section>

        {/* Organizer-only tools */}
        {isOrganizerOwner && (
            <section className="section">
            <h2>Organizer Tools</h2>

            <button onClick={handleCreateTicketType}>
                + Add Ticket Type
            </button>

            <button onClick={handleLoadAnalytics} style={{ marginLeft: '1rem' }}>
                Load Analytics
            </button>

            {analytics && (
                <div className="card" style={{ marginTop: '1rem' }}>
                <h3>Analytics</h3>
                <p>Total tickets: {analytics.totalTickets}</p>
                <p>Checked-in: {analytics.checkedInCount}</p>
                <p>Remaining capacity: {analytics.remainingCapacity}</p>
                <p>
                    Revenue: $
                    {(analytics.revenueCents || analytics.revenue || 0) / 100}
                </p>
                </div>
            )}

            <div className="card" style={{ marginTop: '1rem' }}>
                <h3>Post Announcement</h3>
                <form onSubmit={handleCreateAnnouncement}>
                <textarea
                    value={newAnnouncement}
                    onChange={e => setNewAnnouncement(e.target.value)}
                    placeholder="Schedule change, venue update, etc."
                />
                {announceError && (
                    <p className="error">{announceError}</p>
                )}
                <button type="submit">Post</button>
                </form>
            </div>

            <div className="card" style={{ marginTop: '1rem' }}>
                <h3>Assign Vendor</h3>
                <form onSubmit={handleAssignVendor}>
                <label>
                    Vendor Email
                    <input
                    type="email"
                    value={vendorEmail}
                    onChange={e => setVendorEmail(e.target.value)}
                    placeholder="vendor@example.com"
                    />
                </label>
                {vendorError && <p className="error">{vendorError}</p>}
                <button type="submit">Assign Vendor</button>
                </form>
            </div>
            </section>
        )}

        {/* (Optional) show latest notifications if loaded */}
        {notifications.length > 0 && (
            <section className="section">
            <h2>Your Latest Notifications</h2>
            <ul>
                {notifications.map(n => (
                <li key={n.id}>
                    [{n.type}] {n.payload?.message || n.message || ''}
                </li>
                ))}
            </ul>
            </section>
        )}
        </div>
    );
}
