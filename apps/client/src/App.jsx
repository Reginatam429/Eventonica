// src/App.jsx
import { Routes, Route, NavLink } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

import LandingPage from "./pages/LandingPage.jsx";
import EventsListPage from "./pages/EventsListPage.jsx";
import EventDetailPage from "./pages/EventDetailPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import CheckinPage from "./pages/CheckinPage.jsx";

function App() {
    const { user, logout } = useAuth();

    return (
        <div className="app">
        {/* NAVBAR */}
        <nav className="nav">
            <div className="nav-links">
            <NavLink to="/" className="nav-brand">
                Eventonica
            </NavLink>
            <NavLink
                to="/events"
                className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
                }
            >
                Events
            </NavLink>
            <NavLink
                to="/checkin"
                className={({ isActive }) =>
                "nav-link" + (isActive ? " active" : "")
                }
            >
                Check-in
            </NavLink>
            </div>

            <div className="nav-right">
            {user ? (
                <>
                <span className="user-pill">
                    {user.name || user.email} ({user.roles?.join(", ")})
                </span>
                <button onClick={logout}>Logout</button>
                </>
            ) : (
                <>
                <NavLink
                    to="/login"
                    className={({ isActive }) =>
                    "nav-link" + (isActive ? " active" : "")
                    }
                >
                    Login
                </NavLink>
                <NavLink
                    to="/register"
                    className={({ isActive }) =>
                    "nav-link nav-link-primary" + (isActive ? " active" : "")
                    }
                >
                    Register
                </NavLink>
                </>
            )}
            </div>
        </nav>

        {/* MAIN */}
        <main className="main">
            <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/events" element={<EventsListPage />} />
            <Route path="/events/:id" element={<EventDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/checkin" element={<CheckinPage />} />
            <Route path="*" element={<p>Not found</p>} />
            </Routes>
        </main>
        </div>
    );
}

export default App;
