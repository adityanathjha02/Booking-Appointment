import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../utils/api";

const PatientDashboard = () => {
  const [activeTab, setActiveTab] = useState("book");
  const [slots, setSlots] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (activeTab === "book") {
      fetchAvailableSlots();
    } else if (activeTab === "bookings") {
      fetchMyBookings();
    }
  }, [activeTab]);

  const fetchAvailableSlots = async () => {
    setLoading(true);
    setError(null);

    try {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const response = await api.get(
        `/slots?from=${today.toISOString().split("T")[0]}&to=${
          nextWeek.toISOString().split("T")[0]
        }`
      );
      setSlots(response.data);
    } catch (error) {
      setError("Failed to fetch available slots");
      console.error("Fetch slots error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyBookings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/my-bookings");
      setMyBookings(response.data);
    } catch (error) {
      setError("Failed to fetch your bookings");
      console.error("Fetch bookings error:", error);
    } finally {
      setLoading(false);
    }
  };

  const bookSlot = async (slotId) => {
    try {
      setError(null);
      const response = await api.post("/book", { slotId });
      alert("Appointment booked successfully!");
      fetchAvailableSlots(); // Refresh slots
      setActiveTab("bookings"); // Switch to bookings tab
    } catch (error) {
      const errorMessage =
        error.response?.data?.error?.message || "Failed to book appointment";
      setError(errorMessage);
      alert(errorMessage);
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

  const groupSlotsByDate = (slots) => {
    const grouped = {};
    slots.forEach((slot) => {
      const date = new Date(slot.startAt).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(slot);
    });
    return grouped;
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
              <h1>Patient Dashboard</h1>
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
          <div className="tabs">
            <button
              className={`tab ${activeTab === "book" ? "active" : ""}`}
              onClick={() => setActiveTab("book")}
            >
              📅 Book Appointment
            </button>
            <button
              className={`tab ${activeTab === "bookings" ? "active" : ""}`}
              onClick={() => setActiveTab("bookings")}
            >
              📋 My Bookings
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="tab-content">
            {activeTab === "book" && (
              <div className="book-section">
                <div className="section-header">
                  <h2>Available Slots</h2>
                  <p>Next 7 days</p>
                </div>

                {loading && (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading slots...</p>
                  </div>
                )}

                {!loading && slots.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">📅</div>
                    <h3>No Available Slots</h3>
                    <p>
                      There are no available appointments in the next 7 days.
                    </p>
                  </div>
                )}

                {!loading && slots.length > 0 && (
                  <div className="slots-grid">
                    {Object.entries(groupSlotsByDate(slots)).map(
                      ([date, daySlots]) => (
                        <div key={date} className="date-section">
                          <div className="date-header">
                            <h3>
                              {new Date(date).toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                              })}
                            </h3>
                          </div>
                          <div className="time-slots">
                            {daySlots.map((slot) => (
                              <div key={slot._id} className="time-slot">
                                <div className="slot-time">
                                  {new Date(slot.startAt).toLocaleTimeString(
                                    "en-US",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}{" "}
                                  -{" "}
                                  {new Date(slot.endAt).toLocaleTimeString(
                                    "en-US",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </div>
                                <button
                                  onClick={() => bookSlot(slot._id)}
                                  className="btn btn-primary btn-sm"
                                >
                                  Book
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "bookings" && (
              <div className="bookings-section">
                <div className="section-header">
                  <h2>My Appointments</h2>
                  <p>Your scheduled appointments</p>
                </div>

                {loading && (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading bookings...</p>
                  </div>
                )}

                {!loading && myBookings.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">📋</div>
                    <h3>No Appointments</h3>
                    <p>You haven't booked any appointments yet.</p>
                    <button
                      className="btn btn-primary"
                      onClick={() => setActiveTab("book")}
                    >
                      Book Your First Appointment
                    </button>
                  </div>
                )}

                {!loading && myBookings.length > 0 && (
                  <div className="bookings-list">
                    {myBookings.map((booking) => (
                      <div key={booking._id} className="booking-card">
                        <div className="booking-header">
                          <div className="booking-date">
                            {formatDateTime(booking.slot.startAt)}
                          </div>
                          <div className={`status status-${booking.status}`}>
                            {booking.status}
                          </div>
                        </div>
                        <div className="booking-details">
                          <div className="detail">
                            <span className="label">Duration:</span>
                            <span className="value">30 minutes</span>
                          </div>
                          <div className="detail">
                            <span className="label">Booked on:</span>
                            <span className="value">
                              {new Date(booking.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
