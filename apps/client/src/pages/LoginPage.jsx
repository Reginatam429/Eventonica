import React, { useState } from 'react';
import { useAuth } from '../../../client/src/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    function handleChange(e) {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        try {
        await login(form.email, form.password);
        navigate('/');
        } catch (err) {
        setError(err.message || 'Login failed');
        }
    }

    return (
        <div className="page">
        <h1>Login</h1>
        <form onSubmit={handleSubmit} className="card">
            <label>
            Email
            <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
            />
            </label>
            <label>
            Password
            <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required
            />
            </label>
            {error && <p className="error">{error}</p>}
            <button type="submit">Login</button>
        </form>
        </div>
    );
}
