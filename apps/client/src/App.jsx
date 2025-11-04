import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

import Navbar from "./components/Navbar.jsx";

import LandingPage from "./pages/LandingPage.jsx";
import EventsListPage from "./pages/EventsListPage.jsx";
import EventDetailPage from "./pages/EventDetailPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import CheckinPage from "./pages/CheckinPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import MyTicketsPage from "./pages/MyTicketsPage.jsx";

function PrivateRoute({ children }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="page">
            <div className="page-inner">
                <p>Loading...</p>
            </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default function App() {
    const { user } = useAuth();

    return (
        <div className="app-shell">
            <Navbar />
            <main className="app-main">
            <Routes>
                {/* Landing or redirect to dashboard if already logged in */}
                <Route
                path="/"
                element={
                    user ? <Navigate to="/dashboard" replace /> : <LandingPage />
                }
                />
    
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
    
                {/* Private routes */}
                <Route
                path="/dashboard"
                element={
                    <PrivateRoute>
                    <DashboardPage />
                    </PrivateRoute>
                }
                />
                <Route
                path="/events"
                element={
                    <PrivateRoute>
                    <EventsListPage />
                    </PrivateRoute>
                }
                />
                <Route
                path="/events/:id"
                element={
                    <PrivateRoute>
                    <EventDetailPage />
                    </PrivateRoute>
                }
                />
                <Route
                path="/my-tickets"
                element={
                    <PrivateRoute>
                    <MyTicketsPage />
                    </PrivateRoute>
                }
                />
                <Route
                path="/checkin"
                element={
                    <PrivateRoute>
                    <CheckinPage />
                    </PrivateRoute>
                }
                />
        
                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </main>
        </div>
    );
}