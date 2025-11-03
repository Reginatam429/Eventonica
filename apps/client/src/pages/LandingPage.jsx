import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function LandingPage() {
    const { user } = useAuth();

    return (
        <div className="page">
        <section className="landing-hero">
            <h1>Run your events with Eventonica</h1>
            <p>
            Create events, sell tickets, check in attendees, and keep
            everyone in the loop — all in one place.
            </p>

            <div className="landing-actions">
            {user ? (
                <>
                <Link to="/events" className="button button-primary">
                    View Events
                </Link>
                <Link to="/checkin" className="button button-outline">
                    Check-in Scanner
                </Link>
                </>
            ) : (
                <>
                <Link to="/login" className="button button-primary">
                    Login
                </Link>
                <Link to="/register" className="button button-outline">
                    Create an account
                </Link>
                </>
            )}
            </div>
        </section>

        <section className="landing-grid">
            <div className="card">
            <h2>For organizers</h2>
            <p>
                Create events, manage ticket types, check in attendees,
                and view simple analytics.
            </p>
            </div>
            <div className="card">
            <h2>For attendees</h2>
            <p>
                Browse upcoming events, register, and keep your tickets all
                in one place.
            </p>
            </div>
        </section>
        </div>
    );
}
