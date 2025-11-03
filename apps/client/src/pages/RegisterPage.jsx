import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
    });
    const [error, setError] = useState('');

    function handleChange(e) {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        try {
        await register(form);
        navigate('/events');
        } catch (err) {
        setError(err.message || 'Registration failed');
        }
    }

    return (
        <div className="page">
        <h1>Create an account</h1>
        <form onSubmit={handleSubmit} className="card">
            <label>
            Name
            <input
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                required
            />
            </label>
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
            <button type="submit">Sign up</button>
            <p className="muted">
            Already have an account?{' '}
            <Link to="/login">Log in</Link>.
            </p>
        </form>
        </div>
    );
}
