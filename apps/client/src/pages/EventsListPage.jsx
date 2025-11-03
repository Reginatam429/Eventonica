import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchEvents } from '../api';

export default function EventsListPage() {
    const [events, setEvents] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
        try {
            const data = await fetchEvents();
            if (!cancelled) setEvents(data.events || []);
        } catch (err) {
            if (!cancelled) setError(err.message || 'Failed to load events');
        }
        })();
        return () => {
        cancelled = true;
        };
    }, []);

    return (
        <div className="page">
        <h1>Events</h1>
        {error && <p className="error">{error}</p>}
        {events.length === 0 && !error && <p>No events yet.</p>}
        <div className="list">
            {events.map(ev => (
            <Link key={ev.id} to={`/events/${ev.id}`} className="card">
                <h2>{ev.title}</h2>
                <p>{ev.description}</p>
                <p>
                <strong>When:</strong>{' '}
                {new Date(ev.start_at || ev.startAt).toLocaleString()} –{' '}
                {new Date(ev.end_at || ev.endAt).toLocaleString()}
                </p>
                <p>
                <strong>Where:</strong> {ev.venue} ({ev.address})
                </p>
            </Link>
            ))}
        </div>
        </div>
    );
}
