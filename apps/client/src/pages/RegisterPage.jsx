import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function RegisterPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [wantsOrganizer, setWantsOrganizer] = useState(false);
    const [wantsVendor, setWantsVendor] = useState(false);
    const [error, setError] = useState(null);

    const navigate = useNavigate();
    const { loginWithToken } = useAuth();

    async function handleSubmit(e) {
        e.preventDefault();
        setError(null);

        const extraRoles = [];
        if (wantsOrganizer) extraRoles.push("organizer");
        if (wantsVendor) extraRoles.push("vendor");

        try {
        const { user, token } = await register(
            name,
            email,
            password,
            extraRoles
        );
        // log them in right after register
        loginWithToken(user, token);
        navigate("/dashboard");
        } catch (err) {
        console.error("register error", err);
        setError("Registration failed. Please check your details.");
        }
    }

    return (
        <div className="page page-auth">
        <div className="card card-auth">
            <h1>Create your Eventonica account</h1>
            <p className="muted">
            You’ll always be an attendee. You can optionally add organizer/vendor
            capabilities below.
            </p>

            <form onSubmit={handleSubmit} className="form">
            <label className="form-label">
                Name
                <input
                className="input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                />
            </label>

            <label className="form-label">
                Email
                <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                />
            </label>

            <label className="form-label">
                Password
                <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                />
            </label>

            <fieldset className="form-fieldset">
                <legend>Optional roles</legend>

                <label className="checkbox-label">
                <input
                    type="checkbox"
                    checked={wantsOrganizer}
                    onChange={(e) => setWantsOrganizer(e.target.checked)}
                />
                <span>I want to organize events</span>
                </label>

                <label className="checkbox-label">
                <input
                    type="checkbox"
                    checked={wantsVendor}
                    onChange={(e) => setWantsVendor(e.target.checked)}
                />
                <span>I am a vendor (e.g. food, merch, services)</span>
                </label>

                <p className="muted tiny">
                You cannot self-assign admin. Admins can still adjust your roles
                later.
                </p>
            </fieldset>

            {error && <p className="error">{error}</p>}

            <button type="submit" className="btn btn-primary full-width">
                Create account
            </button>

            <p className="muted small center">
                Already have an account?{" "}
                <Link to="/login" className="link">
                Log in
                </Link>
            </p>
            </form>
        </div>
        </div>
    );
}
