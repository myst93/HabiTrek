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

  return (
    <div className="bookings-page">
      <h2 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>My Bookings</h2>
      {bookings.length === 0 ? (
        <div className="empty-state" style={{ padding: '3rem 1rem' }}>
          <i className="fa-solid fa-briefcase" style={{ fontSize: '3.5rem', color: 'var(--text-muted)', opacity: 0.7 }}></i>
          <p style={{ marginTop: '1rem', fontSize: '1.1rem', fontWeight: 500 }}>No bookings made yet</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Book your next getaway and experience WanderLust hospitality!
          </p>
          <Link to="/listings" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
            Search stays
          </Link>
        </div>
      ) : (
        <div className="bookings-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {bookings.map((booking) => {
            const listing = booking.listing || {};
            const imgSrc = listing.image?.url || listing.image || DEFAULT_IMG;
            const checkIn = formatDate(booking.startDate);
            const checkOut = formatDate(booking.endDate);
            const nights = Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24));

            return (
              <div key={booking._id} className="booking-list-card" style={{
                display: 'flex',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                backgroundColor: 'white',
                boxShadow: 'var(--shadow-sm)'
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
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        padding: '0.25rem 0.6rem',
                        borderRadius: 'var(--radius-sm)'
                      }}>
                        {booking.status}
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
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Amount Paid</span>
                    <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>&#8377; {booking.totalPrice?.toLocaleString('en-IN')}</strong>
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
