import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

export default function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const hasRole = (role) => user?.roles?.includes(role);

    return (
        <nav className="navbar">
        <div className="navbar-left">
            <NavLink to="/" className="navbar-brand">
            Eventonica
            </NavLink>

            {user && (
            <>
                <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                    "nav-link" + (isActive ? " nav-link-active" : "")
                }
                >
                Dashboard
                </NavLink>
                <NavLink
                to="/events"
                className={({ isActive }) =>
                    "nav-link" + (isActive ? " nav-link-active" : "")
                }
                >
                Events
                </NavLink>
                <NavLink
                to="/my-tickets"
                className={({ isActive }) =>
                    "nav-link" + (isActive ? " nav-link-active" : "")
                }
                >
                My Tickets
                </NavLink>
                {(hasRole("organizer") || hasRole("admin")) && (
                <NavLink
                    to="/checkin"      // ✅ all lowercase, matches route
                    className={({ isActive }) =>
                    "nav-link" + (isActive ? " nav-link-active" : "")
                    }
                >
                    Check-in
                </NavLink>
                )}
            </>
            )}
        </div>

        <div className="navbar-right">
            {user ? (
            <>
                <span className="user-pill">
                {user.name || user.email}{" "}
                {user.roles?.length ? (
                    <span className="user-roles">
                    ({user.roles.join(", ")})
                    </span>
                ) : null}
                </span>
                <button className="btn btn-secondary" onClick={handleLogout}>
                Logout
                </button>
            </>
            ) : (
            <>
                <NavLink to="/login" className="btn btn-primary">
                Login
                </NavLink>
                <NavLink to="/register" className="btn btn-secondary">
                Register
                </NavLink>
            </>
            )}
        </div>
        </nav>
    );
}
