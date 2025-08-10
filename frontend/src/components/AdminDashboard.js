import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchAllBookings();
  }, []);

  const fetchAllBookings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/all-bookings");
      setBookings(response.data);
    } catch (error) {
      setError("Failed to fetch bookings");
      console.error("Fetch all bookings error:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTodaysBookings = () => {
    return bookings.filter((booking) => {
      const bookingDate = new Date(booking.slot.startAt).toDateString();
      const today = new Date().toDateString();
      return bookingDate === today;
    });
  };

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="container">
          <div className="header-content">
            <div className="header-left">
              <h1>Admin Dashboard</h1>
              <p>Welcome back, {user?.name}</p>
            </div>
            <button onClick={handleLogout} className="btn btn-outline">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>Total Bookings</h3>
                <div className="stat-number">{bookings.length}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <h3>Today's Bookings</h3>
                <div className="stat-number">{getTodaysBookings().length}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>Confirmed</h3>
                <div className="stat-number">
                  {bookings.filter((b) => b.status === "confirmed").length}
                </div>
              </div>
            </div>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="bookings-section">
            <div className="section-header">
              <h2>All Appointments</h2>
              <p>Manage all patient appointments</p>
            </div>

            {loading && (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading bookings...</p>
              </div>
            )}

            {!loading && bookings.length === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <h3>No Bookings Found</h3>
                <p>No appointments have been scheduled yet.</p>
              </div>
            )}

            {!loading && bookings.length > 0 && (
              <div className="admin-table">
                <div className="table-header">
                  <div className="col">Patient</div>
                  <div className="col">Contact</div>
                  <div className="col">Date & Time</div>
                  <div className="col">Status</div>
                  <div className="col">Booked On</div>
                </div>

                <div className="table-body">
                  {bookings.map((booking) => (
                    <div key={booking._id} className="table-row">
                      <div className="col">
                        <div className="patient-info">
                          <div className="patient-name">
                            {booking.user.name}
                          </div>
                          <div className="patient-role">
                            {booking.user.role}
                          </div>
                        </div>
                      </div>
                      <div className="col">
                        <div className="contact-info">{booking.user.email}</div>
                      </div>
                      <div className="col">
                        <div className="appointment-time">
                          {formatDateTime(booking.slot.startAt)}
                        </div>
                      </div>
                      <div className="col">
                        <span className={`status status-${booking.status}`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="col">
                        <div className="booked-date">
                          {new Date(booking.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
