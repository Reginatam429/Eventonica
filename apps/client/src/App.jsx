import React from 'react';
import { Link, NavLink, Route, Routes, useNavigate } from 'react-router-dom';
import { useAuth } from '../../client/src/AuthContext.jsx';
import EventsListPage from './pages/EventsListPage.jsx';
import EventDetailPage from './pages/EventDetailPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import CheckinPage from './pages/CheckinPage.jsx';

function NavBar() {
    const { user, isLoggedIn, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() {
        logout();
        navigate('/login');
    }

    return (
        <nav className="nav">
        <Link to="/" className="logo">Eventonica</Link>
        <div className="nav-links">
            <NavLink to="/">Events</NavLink>
            <NavLink to="/checkin">Check-In</NavLink>
        </div>
        <div className="nav-right">
            {isLoggedIn && user ? (
            <>
                <span className="user-pill">
                {user.email} ({user.roles.join(', ')})
                </span>
                <button onClick={handleLogout}>Logout</button>
            </>
            ) : (
            <NavLink to="/login">Login</NavLink>
            )}
        </div>
        </nav>
    );
}

export default function App() {
    return (
        <div className="app">
        <NavBar />
        <main className="main">
            <Routes>
            <Route path="/" element={<EventsListPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/events/:eventId" element={<EventDetailPage />} />
            <Route path="/checkin" element={<CheckinPage />} />
            </Routes>
        </main>
        </div>
    );
}
