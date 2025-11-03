// src/pages/DashboardPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../AuthContext.jsx";
import {
    listEvents,
    createEvent,
    updateEvent,
    deleteEvent,
} from "../api.js";

function EventFormModal({ open, onClose, initialEvent, onSaved, onDeleted }) {
    const isEdit = Boolean(initialEvent);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [type, setType] = useState("Meetup");
    const [venue, setVenue] = useState("");
    const [address, setAddress] = useState("");
    const [startAt, setStartAt] = useState("");
    const [endAt, setEndAt] = useState("");
    const [capacity, setCapacity] = useState(100);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) return;

        if (initialEvent) {
        setTitle(initialEvent.title || "");
        setDescription(initialEvent.description || "");
        setType(initialEvent.type || "Meetup");
        setVenue(initialEvent.venue || "");
        setAddress(initialEvent.address || "");
        setCapacity(initialEvent.capacity || 100);

        // convert ISO → datetime-local (strip seconds + Z)
        const toLocal = (iso) =>
            iso ? iso.replace(/:\d{2}\.\d+Z$/, "") : "";

        setStartAt(toLocal(initialEvent.start_at));
        setEndAt(toLocal(initialEvent.end_at));
        } else {
        setTitle("");
        setDescription("");
        setType("Meetup");
        setVenue("");
        setAddress("");
        setCapacity(100);
        setStartAt("");
        setEndAt("");
        }
        setError("");
    }, [open, initialEvent]);

    if (!open) return null;

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);
        setError("");

        const payload = {
        title,
        description,
        type,
        venue,
        address,
        startAt: startAt ? new Date(startAt).toISOString() : null,
        endAt: endAt ? new Date(endAt).toISOString() : null,
        capacity: Number(capacity) || 0,
        };

        try {
        let saved;
        if (isEdit) {
            saved = await updateEvent(initialEvent.id, payload);
        } else {
            saved = await createEvent(payload);
        }
        onSaved && onSaved(saved.event || saved);
        onClose();
        } catch (err) {
        console.error(err);
        setError(err.message || "Unable to save event");
        } finally {
        setSaving(false);
        }
    }

    async function handleDelete() {
        if (!initialEvent) return;
        if (!window.confirm("Delete this event? This cannot be undone.")) return;
        setSaving(true);
        setError("");
        try {
        await deleteEvent(initialEvent.id);
        onDeleted && onDeleted(initialEvent.id);
        onClose();
        } catch (err) {
        console.error(err);
        setError(err.message || "Unable to delete event");
        } finally {
        setSaving(false);
        }
    }

    return (
        <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
            <div className="modal-title">
                {isEdit ? "Edit Event" : "Create Event"}
            </div>
            <button className="btn secondary" onClick={onClose}>
                Close
            </button>
            </div>

            <form onSubmit={handleSubmit}>
            {error && <div className="error-banner">{error}</div>}

            <div className="field">
                <span>Title</span>
                <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                />
            </div>

            <div className="field">
                <span>Description</span>
                <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            <div className="field">
                <span>Type</span>
                <input
                value={type}
                onChange={(e) => setType(e.target.value)}
                placeholder="Meetup, Workshop, Conference..."
                />
            </div>

            <div className="field">
                <span>Venue</span>
                <input
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Venue name"
                />
            </div>

            <div className="field">
                <span>Address</span>
                <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Street, City, State"
                />
            </div>

            <div className="field">
                <span>Start time</span>
                <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                />
            </div>

            <div className="field">
                <span>End time</span>
                <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                />
            </div>

            <div className="field">
                <span>Capacity</span>
                <input
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                />
            </div>

            <div className="modal-actions">
                {isEdit && (
                <button
                    type="button"
                    className="btn danger"
                    onClick={handleDelete}
                    disabled={saving}
                >
                    Delete
                </button>
                )}
                <button
                type="submit"
                className="btn primary"
                disabled={saving}
                >
                {saving ? "Saving..." : isEdit ? "Save changes" : "Create"}
                </button>
            </div>
            </form>
        </div>
        </div>
    );
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    const isOrganizer = user?.roles?.includes("organizer");

    useEffect(() => {
        (async () => {
        try {
            const data = await listEvents();
            setEvents(data.events || data);
        } catch (err) {
            console.error(err);
            setError("Unable to load events");
        } finally {
            setLoading(false);
        }
        })();
    }, []);

    const myOrganizedEvents = useMemo(
        () =>
        isOrganizer
            ? events.filter((e) => e.organizer_id === user.id)
            : [],
        [events, isOrganizer, user?.id]
    );

    const featuredEvent = events[0];

    function handleCreatedOrUpdated(saved) {
        setEvents((prev) => {
        const idx = prev.findIndex((e) => e.id === saved.id);
        if (idx === -1) return [saved, ...prev];
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
        });
    }

    function handleDeleted(id) {
        setEvents((prev) => prev.filter((e) => e.id !== id));
    }

    return (
        <div className="page">
        <div className="page-inner">
            <h1>Dashboard</h1>
            <p className="page-subtitle">
            Browse events, manage your own, and access tools based on your
            roles.
            </p>

            {error && <div className="error-banner">{error}</div>}

            <div className="dashboard-grid">
            {/* Left column: public events */}
            <section className="dashboard-section">
                <h2>Browse Events</h2>
                {loading && <p>Loading events...</p>}
                {!loading && events.length === 0 && (
                <p>No events yet. Organizers can create the first one!</p>
                )}

                {events.map((event) => (
                <article key={event.id} className="card event-card">
                    <h3>{event.title}</h3>
                    {event.description && (
                    <p className="event-meta">{event.description}</p>
                    )}
                    <p className="event-meta">
                    <strong>When:</strong>{" "}
                    {event.start_at
                        ? new Date(event.start_at).toLocaleString()
                        : "TBA"}{" "}
                    {event.end_at && " – "}
                    {event.end_at &&
                        new Date(event.end_at).toLocaleString()}
                    <br />
                    <strong>Where:</strong>{" "}
                    {event.venue && `${event.venue} — `}
                    {event.address}
                    </p>
                    <div className="event-actions">
                    <a className="btn secondary" href={`/events/${event.id}`}>
                        View &amp; Tickets
                    </a>
                    {isOrganizer && event.organizer_id === user.id && (
                        <button
                        className="btn primary"
                        type="button"
                        onClick={() => {
                            setEditingEvent(event);
                            setModalOpen(true);
                        }}
                        >
                        Edit
                        </button>
                    )}
                    </div>
                </article>
                ))}
            </section>

            {/* Right column: organizer tools */}
            {isOrganizer && (
                <section className="dashboard-section">
                <h2>Organizer Tools</h2>
                <div className="card">
                    <h3>My Events</h3>
                    <button
                    className="btn primary"
                    type="button"
                    onClick={() => {
                        setEditingEvent(null);
                        setModalOpen(true);
                    }}
                    >
                    Create Event
                    </button>

                    {myOrganizedEvents.length === 0 ? (
                    <p style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
                        You haven&apos;t created any events yet.
                    </p>
                    ) : (
                    <ul style={{ marginTop: "0.75rem", paddingLeft: "1rem" }}>
                        {myOrganizedEvents.map((e) => (
                        <li key={e.id}>
                            <button
                            type="button"
                            className="link-button"
                            style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                color: "#38bdf8",
                                cursor: "pointer",
                            }}
                            onClick={() => {
                                setEditingEvent(e);
                                setModalOpen(true);
                            }}
                            >
                            {e.title}
                            </button>
                        </li>
                        ))}
                    </ul>
                    )}
                </div>
                </section>
            )}
            </div>
        </div>

        <EventFormModal
            open={modalOpen}
            initialEvent={editingEvent}
            onClose={() => setModalOpen(false)}
            onSaved={handleCreatedOrUpdated}
            onDeleted={handleDeleted}
        />
        </div>
    );
}
