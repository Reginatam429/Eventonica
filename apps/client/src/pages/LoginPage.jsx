import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        try {
        const user = await login(email, password);
        if (user) {
            // 👇 go to dashboard after login
            navigate("/dashboard");
        }
        } catch (err) {
        console.error(err);
        setError("Invalid email or password");
        }
    }

    return (
        <div className="page">
        <div className="page-inner auth-page">
            <h1>Login</h1>
            <form className="card auth-card" onSubmit={handleSubmit}>
            {error && <div className="error-banner">{error}</div>}
            <label className="field">
                <span>Email</span>
                <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                />
            </label>
            <label className="field">
                <span>Password</span>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                />
            </label>
            <button type="submit" className="btn primary">
                Login
            </button>
            <p className="auth-switch">
                Don&apos;t have an account?{" "}
                <Link to="/register">Register</Link>
            </p>
            </form>
        </div>
        </div>
    );
}
