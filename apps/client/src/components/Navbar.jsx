import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Navbar() {
    const { user, logout } = useAuth();

    return (
        <header className="nav">
        <div className="nav-left">
            <Link to="/" className="nav-brand">
            Eventonica
            </Link>
            <NavLink to="/events" className="nav-link">
            Events
            </NavLink>
            <NavLink to="/checkin" className="nav-link">
            Check-in
            </NavLink>
        </div>
        <div className="nav-right">
            {user ? (
            <>
                <span className="nav-user">
                Hi, {user.name || user.email}
                </span>
                <button
                type="button"
                className="nav-button"
                onClick={logout}
                >
                Logout
                </button>
            </>
            ) : (
            <>
                <NavLink to="/login" className="nav-link">
                Login
                </NavLink>
                <NavLink
                to="/register"
                className="nav-link nav-link-primary"
                >
                Register
                </NavLink>
            </>
            )}
        </div>
        </header>
    );
}
