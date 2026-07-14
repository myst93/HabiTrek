import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1625505826533-5c80aca7d157?auto=format&fit=crop&w=800&q=60';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BookingsList() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    api.get('/bookings')
      .then((res) => {
        setBookings(res.data.bookings || []);
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <i className="fa-solid fa-triangle-exclamation"></i>
        <p>{error}</p>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingBookings = bookings.filter((booking) => {
    const end = new Date(booking.endDate);
    return end >= today;
  });

  const pastBookings = bookings.filter((booking) => {
    const end = new Date(booking.endDate);
    return end < today;
  });

  const currentList = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <div className="bookings-page">
      <h2 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>My Bookings</h2>

      {/* Tabs */}
      <div className="bookings-tabs" style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        <button
          className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
          style={{
            padding: '0.75rem 1rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'upcoming' ? '2px solid var(--brand)' : '2px solid transparent',
            color: activeTab === 'upcoming' ? 'var(--brand)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.2s ease'
          }}
        >
          Upcoming Bookings ({upcomingBookings.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
          style={{
            padding: '0.75rem 1rem',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'past' ? '2px solid var(--brand)' : '2px solid transparent',
            color: activeTab === 'past' ? 'var(--brand)' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'all 0.2s ease'
          }}
        >
          Past Bookings ({pastBookings.length})
        </button>
      </div>

      {currentList.length === 0 ? (
        <div className="empty-state" style={{ padding: '3rem 1rem' }}>
          <i className="fa-solid fa-briefcase" style={{ fontSize: '3.5rem', color: 'var(--text-muted)', opacity: 0.7 }}></i>
          <p style={{ marginTop: '1rem', fontSize: '1.1rem', fontWeight: 500 }}>
            {activeTab === 'upcoming' ? 'No upcoming bookings' : 'No past bookings'}
          </p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            {activeTab === 'upcoming'
              ? 'Book your next getaway and experience HabiTrek hospitality!'
              : 'Keep wandering! Your completed trips will show up here.'}
          </p>
          {activeTab === 'upcoming' && (
            <Link to="/listings" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
              Search stays
            </Link>
          )}
        </div>
      ) : (
        <div className="bookings-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {currentList.map((booking) => {
            const listing = booking.listing || {};
            const imgSrc = listing.image?.url || listing.image || DEFAULT_IMG;
            const checkIn = formatDate(booking.startDate);
            const checkOut = formatDate(booking.endDate);
            const nights = Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24));

            const isConfirmed = booking.status === 'Confirmed';
            const isPending = booking.status === 'Pending';

            return (
              <div key={booking._id} className="booking-list-card" style={{
                display: 'flex',
                border: '1px solid var(--border)',
                borderLeft: isConfirmed ? '6px solid var(--brand)' : isPending ? '6px solid #e07a5f' : '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                backgroundColor: isConfirmed ? '#f4f9f6' : 'white',
                boxShadow: isConfirmed ? '0 4px 18px rgba(45, 106, 79, 0.12)' : 'var(--shadow-sm)',
                transition: 'all 0.3s ease'
              }}>
                <img
                  src={imgSrc}
                  alt={listing.title || 'Stay'}
                  style={{ width: '220px', height: '160px', objectFit: 'cover' }}
                  onError={(e) => { e.target.src = DEFAULT_IMG; }}
                />
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                        <Link to={`/listings/${listing._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {listing.title || 'Stay'}
                        </Link>
                      </h3>
                      <span style={{
                        backgroundColor: isConfirmed ? '#d4edda' : isPending ? '#fff3cd' : '#e2e3e5',
                        color: isConfirmed ? '#155724' : isPending ? '#856404' : '#383d41',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}>
                        {isConfirmed ? (
                          <>
                            <i className="fa-solid fa-circle-check"></i> Paid & Confirmed
                          </>
                        ) : isPending ? (
                          <>
                            <i className="fa-solid fa-circle-exclamation"></i> Payment Pending
                          </>
                        ) : (
                          'Completed'
                        )}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      {listing.location}, {listing.country}
                    </p>

                    <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Check-in</span>
                        <strong style={{ fontSize: '0.9rem' }}>{checkIn}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Check-out</span>
                        <strong style={{ fontSize: '0.9rem' }}>{checkOut}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Guests & stay</span>
                        <strong style={{ fontSize: '0.9rem' }}>{booking.guests} guest{booking.guests > 1 ? 's' : ''} • {nights} night{nights > 1 ? 's' : ''}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {isPending ? 'Amount Due' : 'Amount Paid'}
                      </span>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)', display: 'block', marginTop: '0.1rem' }}>
                        &#8377; {booking.totalPrice?.toLocaleString('en-IN')}
                      </strong>
                    </div>
                    {isPending && (
                      <Link to={`/payment/${booking._id}`} className="btn btn-primary btn-sm" style={{ padding: '0.4rem 1rem', fontSize: '0.82rem', borderRadius: 'var(--radius-sm)', textDecoration: 'none' }}>
                        <i className="fa-solid fa-credit-card" style={{ marginRight: '0.4rem' }}></i> Pay Now
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
