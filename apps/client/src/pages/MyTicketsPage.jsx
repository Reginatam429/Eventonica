import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import { fetchMyTickets } from "../api.js";

export default function MyTicketsPage() {
    const { user, token } = useAuth();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        if (!token) {
        setLoading(false);
        return;
        }

        (async () => {
        try {
            const data = await fetchMyTickets(token);
            if (!cancelled) setTickets(data.tickets || data || []);
        } catch (err) {
            if (!cancelled) setError("Could not load your tickets.");
        } finally {
            if (!cancelled) setLoading(false);
        }
        })();

        return () => {
        cancelled = true;
        };
    }, [token]);

    if (!token) {
        return (
        <div className="page">
            <h1>My Tickets</h1>
            <p>You need to log in to see your tickets.</p>
        </div>
        );
    }

    return (
        <div className="page">
        <h1>My Tickets</h1>
        {error && <p className="error">{error}</p>}
        {loading ? (
            <p>Loading…</p>
        ) : tickets.length === 0 ? (
            <p>You don’t have any tickets yet.</p>
        ) : (
            <div className="card-grid">
            {tickets.map((t) => (
                <div key={t.id} className="card card-ticket">
                <h2>{t.event_title || "Ticket"}</h2>
                {t.event_start && (
                    <p className="small muted">
                    {new Date(t.event_start).toLocaleString()}
                    </p>
                )}
                <p className="small">
                    <strong>Type:</strong> {t.ticket_type_name}
                </p>
                <p className="small">
                    <strong>Quantity:</strong> {t.quantity || 1}
                </p>
                {t.qr_code_token && (
                    <>
                    <p className="small">
                        Present this token at check-in:
                    </p>
                    <div className="qr-box">
                        <code>{t.qr_code_token}</code>
                    </div>
                    </>
                )}
                {t.status && (
                    <p className="badge">
                    Status: {t.status.toUpperCase()}
                    </p>
                )}
                </div>
            ))}
            </div>
        )}
        </div>
    );
}
