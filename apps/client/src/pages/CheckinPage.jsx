import React, { useState } from 'react';
import { checkInTicket } from '../api';
import { useAuth } from '../../../client/src/AuthContext.jsx';

export default function CheckinPage() {
    const { user, hasRole } = useAuth();
    const [token, setToken] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const allowed = user && (hasRole('organizer') || hasRole('admin'));

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setResult(null);

        if (!allowed) {
        setError('You must be an organizer or admin to check in tickets.');
        return;
        }
        if (!token.trim()) {
        setError('Paste a ticket token.');
        return;
        }

        try {
        const data = await checkInTicket(token.trim());
        setResult(data);
        } catch (err) {
        setError(err.message || 'Check-in failed');
        }
    }

    return (
        <div className="page">
        <h1>Check-In</h1>
        <p>Paste a ticket token (QR code contents) to check in a guest.</p>
        <form onSubmit={handleSubmit} className="card">
            <label>
            Ticket Token
            <input
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="qr_..."
            />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit">Check In</button>
        </form>

        {result && (
            <div className="card">
            <h3>Check-In Result</h3>
            <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
        )}
        </div>
    );
}
