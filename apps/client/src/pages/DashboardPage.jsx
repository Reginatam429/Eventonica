import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import { fetchEvents, fetchMyTickets } from "../api.js";

export default function DashboardPage() {
    const { user, token } = useAuth();
    const [events, setEvents] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [loadingTickets, setLoadingTickets] = useState(true);
    const [error, setError] = useState("");

    const roles = user?.roles || [];

    useEffect(() => {
        let cancelled = false;

        (async () => {
        try {
            const data = await fetchEvents(); // published events
            if (!cancelled) setEvents(data.events || data || []);
        } catch (err) {
            if (!cancelled) setError("Could not load events.");
        } finally {
            if (!cancelled) setLoadingEvents(false);
        }
        })();

        if (token) {
        (async () => {
            try {
            const data = await fetchMyTickets(token);
            if (!cancelled) setTickets(data.tickets || data || []);
            } catch (err) {
            // My tickets are “nice to have” – don’t block the whole page
            } finally {
            if (!cancelled) setLoadingTickets(false);
            }
        })();
        } else {
        setLoadingTickets(false);
        }

        return () => {
        cancelled = true;
        };
    }, [token]);

    return (
        <div className="page">
        <h1>Dashboard</h1>

        {error && <p className="error">{error}</p>}

        {/* UNIVERSAL: browse events */}
        <section className="section">
            <div className="section-header">
            <h2>Browse Events</h2>
            <Link to="/events" className="link-subtle">
                View all
            </Link>
            </div>

            {loadingEvents ? (
            <p>Loading events…</p>
            ) : events.length === 0 ? (
            <p>No published events yet.</p>
            ) : (
            <div className="card-grid">
                {events.map((ev) => (
                <div key={ev.id} className="card card-event">
                    <h3>
                    <Link to={`/events/${ev.id}`}>{ev.title}</Link>
                    </h3>
                    {ev.description && (
                    <p className="muted">{ev.description}</p>
                    )}
                    {ev.start_at || ev.startAt ? (
                    <p className="small">
                        <strong>When:</strong>{" "}
                        {new Date(ev.start_at || ev.startAt).toLocaleString()}{" "}
                        –{" "}
                        {new Date(ev.end_at || ev.endAt).toLocaleString()}
                    </p>
                    ) : null}
                    {ev.venue && (
                    <p className="small">
                        <strong>Where:</strong> {ev.venue}
                    </p>
                    )}
                    <div className="card-actions">
                    <Link
                        to={`/events/${ev.id}`}
                        className="btn btn-primary btn-sm"
                    >
                        View &amp; Tickets
                    </Link>
                    </div>
                </div>
                ))}
            </div>
            )}
        </section>

        {/* ATTENDEE: My tickets */}
        {token && (
            <section className="section">
            <div className="section-header">
                <h2>My Tickets</h2>
                <Link to="/my-tickets" className="link-subtle">
                Open tickets page
                </Link>
            </div>
            {loadingTickets ? (
                <p>Loading your tickets…</p>
            ) : tickets.length === 0 ? (
                <p>You don’t have any tickets yet.</p>
            ) : (
                <div className="card-row">
                {tickets.slice(0, 3).map((t) => (
                    <div key={t.id} className="card card-ticket">
                    <h3 className="small">{t.event_title || "Ticket"}</h3>
                    <p className="small muted">
                        {t.ticket_type_name} • Qty: {t.quantity || 1}
                    </p>
                    {t.qr_code_token && (
                        <p className="tiny code">
                        Token: {t.qr_code_token}
                        </p>
                    )}
                    </div>
                ))}
                </div>
            )}
            </section>
        )}

        {/* ORGANIZER / ADMIN tools */}
        {(roles.includes("organizer") || roles.includes("admin")) && (
            <section className="section">
            <h2>Organizer Tools</h2>
            <ul className="bullets">
                <li>
                Use <Link to="/events">Events</Link> to view and manage
                your events.
                </li>
                <li>
                Use <Link to="/checkin">Check-in</Link> to scan ticket
                tokens at the door.
                </li>
                <li>
                Analytics for each event is available at{" "}
                <code>/api/events/:id/analytics</code> (shown in your
                Postman / admin tools).
                </li>
            </ul>
            </section>
        )}

        {/* VENDOR blurb */}
        {roles.includes("vendor") && (
            <section className="section">
            <h2>Vendor</h2>
            <p className="muted">
                You’ve been assigned as a vendor for one or more events.
                Organizers can manage vendor assignments in the admin tools;
                this dashboard will show more vendor-specific info in a
                future iteration.
            </p>
            </section>
        )}
        </div>
    );
}
