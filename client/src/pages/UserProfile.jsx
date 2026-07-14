import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1625505826533-5c80aca7d157?auto=format&fit=crop&w=800&q=60';
const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80';

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function UserProfile() {
  const { currentUser, refreshUser, showFlash } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tabs
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' or 'wishlist'
  const [bookingSubTab, setBookingSubTab] = useState('upcoming'); // 'upcoming' or 'past'

  // Edit Profile Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [avatar, setAvatar] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    // Set edit form values
    setBio(currentUser.bio || '');
    setPhone(currentUser.phone || '');
    setLocation(currentUser.location || 'Earth');
    setAvatar(currentUser.avatar || '');

    // Fetch Bookings & Wishlist
    Promise.all([api.get('/bookings'), api.get('/wishlist')])
      .then(([bookingsRes, wishlistRes]) => {
        setBookings(bookingsRes.data.bookings || []);
        setWishlist(wishlistRes.data.wishlist || []);
        setError(null);
      })
      .catch((err) => {
        console.error('Error fetching profile data:', err);
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="empty-state" style={{ padding: '4rem 1rem' }}>
        <i className="fa-solid fa-user-slash" style={{ fontSize: '3.5rem', color: 'var(--text-muted)' }}></i>
        <p style={{ marginTop: '1rem', fontSize: '1.2rem', fontWeight: 600 }}>Please log in to view your profile</p>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: '1.5rem', display: 'inline-block', textDecoration: 'none' }}>
          Log In
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      await api.put('/profile', { bio, phone, location, avatar });
      await refreshUser();
      showFlash('success', 'Profile updated successfully!');
      setShowEditModal(false);
    } catch (err) {
      showFlash('error', err.message || 'Failed to update profile.');
    } finally {
      setUpdating(false);
    }
  };

  // Date categorizations for bookings
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

  const displayedBookings = bookingSubTab === 'upcoming' ? upcomingBookings : pastBookings;
  const joinDate = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : 'Recently';

  return (
    <div className="profile-page-wrapper" style={{ padding: '2rem 0' }}>
      <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '3rem' }}>

        {/* Left column: User Info Card */}
        <div className="profile-sidebar">
          <div className="profile-card-details" style={{
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '2rem',
            backgroundColor: 'white',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center'
          }}>
            <div className="profile-avatar-container" style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <img
                src={currentUser.avatar || DEFAULT_AVATAR}
                alt={currentUser.username}
                style={{
                  width: '130px',
                  height: '130px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid var(--brand)',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onError={(e) => { e.target.src = DEFAULT_AVATAR; }}
              />
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>{currentUser.username}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Guest</p>

            <button
              onClick={() => {
                setBio(currentUser.bio || '');
                setPhone(currentUser.phone || '');
                setLocation(currentUser.location || 'Earth');
                setAvatar(currentUser.avatar || '');
                setShowEditModal(true);
              }}
              className="btn btn-outline btn-full"
              style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}
            >
              Edit Profile
            </button>

            <div className="profile-quick-stats" style={{ width: '100%', borderTop: '1px solid var(--border)', paddingTop: '1.5rem', textAlign: 'left' }}>
              <div className="stat-item" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <i className="fa-solid fa-envelope" style={{ color: 'var(--text-muted)', width: '1.25rem' }}></i>
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Email</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{currentUser.email}</span>
                </div>
              </div>
              <div className="stat-item" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <i className="fa-solid fa-phone" style={{ color: 'var(--text-muted)', width: '1.25rem' }}></i>
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Phone</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{currentUser.phone || 'Not provided'}</span>
                </div>
              </div>
              <div className="stat-item" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <i className="fa-solid fa-location-dot" style={{ color: 'var(--text-muted)', width: '1.25rem' }}></i>
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Location</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{currentUser.location || 'Earth'}</span>
                </div>
              </div>
              <div className="stat-item" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <i className="fa-solid fa-calendar-days" style={{ color: 'var(--text-muted)', width: '1.25rem' }}></i>
                <div>
                  <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Member Since</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{joinDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Details and Tabs */}
        <div className="profile-content">
          <div className="profile-header-bio" style={{ marginBottom: '2.5rem' }}>
            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.75rem' }}>About me</h1>
            <p style={{ fontSize: '1.05rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
              {currentUser.bio || 'Hello! I am a passionate traveler and love exploring new stays on HabiTrek.'}
            </p>
          </div>

          {/* Main Navigation Tabs */}
          <div className="profile-tabs" style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
            <button
              className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
              style={{
                padding: '0.75rem 0',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'bookings' ? '3px solid var(--brand)' : '3px solid transparent',
                color: activeTab === 'bookings' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '1.1rem',
                marginRight: '1rem',
                transition: 'all 0.2s ease'
              }}
            >
              My Bookings
            </button>
            <button
              className={`tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
              onClick={() => setActiveTab('wishlist')}
              style={{
                padding: '0.75rem 0',
                border: 'none',
                background: 'none',
                borderBottom: activeTab === 'wishlist' ? '3px solid var(--brand)' : '3px solid transparent',
                color: activeTab === 'wishlist' ? 'var(--text-primary)' : 'var(--text-muted)',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '1.1rem',
                transition: 'all 0.2s ease'
              }}
            >
              My Wishlist ({wishlist.length})
            </button>
          </div>

          {/* Bookings Tab View */}
          {activeTab === 'bookings' && (
            <div>
              {/* Sub-tabs for Upcoming/Past Bookings */}
              <div className="bookings-sub-tabs" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                  onClick={() => setBookingSubTab('upcoming')}
                  className={`btn btn-sm ${bookingSubTab === 'upcoming' ? 'btn-dark' : 'btn-outline'}`}
                  style={{ borderRadius: 'var(--radius-full)' }}
                >
                  Upcoming ({upcomingBookings.length})
                </button>
                <button
                  onClick={() => setBookingSubTab('past')}
                  className={`btn btn-sm ${bookingSubTab === 'past' ? 'btn-dark' : 'btn-outline'}`}
                  style={{ borderRadius: 'var(--radius-full)' }}
                >
                  Past completed ({pastBookings.length})
                </button>
              </div>

              {displayedBookings.length === 0 ? (
                <div className="empty-state" style={{ padding: '3rem 1rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <i className="fa-solid fa-briefcase" style={{ fontSize: '3rem', color: 'var(--text-muted)', opacity: 0.6 }}></i>
                  <p style={{ marginTop: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>
                    {bookingSubTab === 'upcoming' ? 'No upcoming trips booked' : 'No past trips completed'}
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    {bookingSubTab === 'upcoming'
                      ? 'HabiTrek is waiting! Book your next getaway today.'
                      : 'Completed trips will appear here.'}
                  </p>
                  {bookingSubTab === 'upcoming' && (
                    <Link to="/listings" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                      Explore Stays
                    </Link>
                  )}
                </div>
              ) : (
                <div className="bookings-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {displayedBookings.map((booking) => {
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
          )}

          {/* Wishlist Tab View */}
          {activeTab === 'wishlist' && (
            <div>
              {wishlist.length === 0 ? (
                <div className="empty-state" style={{ padding: '3rem 1rem', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <i className="fa-regular fa-heart" style={{ fontSize: '3rem', color: 'var(--brand)', opacity: 0.6 }}></i>
                  <p style={{ marginTop: '1rem', fontSize: '1.1rem', fontWeight: 600 }}>Your wishlist is empty</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Click the heart icon on properties to save them for later!
                  </p>
                  <Link to="/listings" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                    Browse Listings
                  </Link>
                </div>
              ) : (
                <div className="listings-grid">
                  {wishlist.map((listing) => {
                    const imgSrc = listing.image?.url || listing.image || DEFAULT_IMG;
                    const price = listing.price ? listing.price.toLocaleString('en-IN') : 'N/A';

                    return (
                      <Link
                        to={`/listings/${listing._id}`}
                        key={listing._id}
                        className="listing-card-link"
                        id={`profile-wishlist-${listing._id}`}
                      >
                        <div className="listing-card">
                          <div className="listing-card-img-wrap">
                            <img
                              src={imgSrc}
                              alt={listing.title}
                              className="listing-card-img"
                              onError={(e) => { e.target.src = DEFAULT_IMG; }}
                            />
                          </div>
                          <div className="listing-card-body">
                            <p className="listing-card-title">{listing.title}</p>
                            <p className="listing-card-location">
                              {listing.location}, {listing.country}
                            </p>
                            <p className="listing-card-price">
                              <strong>&#8377; {price}</strong> /night
                            </p>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => !updating && setShowEditModal(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="payment-modal-header">
              <h3>Edit Profile Details</h3>
              {!updating && (
                <button className="close-modal-btn" onClick={() => setShowEditModal(false)}>
                  &times;
                </button>
              )}
            </div>

            <form onSubmit={handleEditSubmit} className="payment-modal-body" style={{ padding: '1rem 0' }}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="edit-avatar" style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Avatar Image URL</label>
                <input
                  type="url"
                  id="edit-avatar"
                  className="form-control"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  disabled={updating}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="edit-location" style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Location</label>
                <input
                  type="text"
                  id="edit-location"
                  className="form-control"
                  placeholder="e.g. Kyoto, Japan"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={updating}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label htmlFor="edit-phone" style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Phone Number</label>
                <input
                  type="tel"
                  id="edit-phone"
                  className="form-control"
                  placeholder="e.g. +91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={updating}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label htmlFor="edit-bio" style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>Bio</label>
                <textarea
                  id="edit-bio"
                  className="form-control"
                  placeholder="Tell us about yourself..."
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  disabled={updating}
                  style={{ resize: 'vertical', fontFamily: 'inherit', padding: '0.5rem' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowEditModal(false)}
                  disabled={updating}
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={updating}
                  style={{ flex: 1 }}
                >
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
