import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    // Basic search — navigates to listings with query param
    navigate(`/listings?search=${encodeURIComponent(search.trim())}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/listings');
  };

  return (
    <nav className="navbar">
      {/* Brand */}
      <Link to="/listings" className="navbar-brand" id="nav-brand">
        <i className="fa-regular fa-compass"></i>
        <span>HabiTrek</span>
      </Link>

      {/* Search */}
      <div className="navbar-search">
        <form className="search-form" onSubmit={handleSearch} id="search-form">
          <input
            type="search"
            placeholder="Search destinations"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="search-input"
            aria-label="Search destinations"
          />
          <button className="search-btn" type="submit" id="search-btn">
            <i className="fa-solid fa-magnifying-glass"></i>
            Search
          </button>
        </form>
      </div>

      {/* Links */}
      <div className="navbar-links">
        {currentUser && (
          <>
            <Link to="/wishlist" className="nav-link" id="nav-wishlist" style={{ display: 'flex', alignItems: 'center' }}>
              <i className="fa-solid fa-heart" style={{ marginRight: '0.35rem', color: 'var(--brand)' }}></i> Wishlist
            </Link>
            <Link to="/bookings" className="nav-link" id="nav-bookings" style={{ display: 'flex', alignItems: 'center' }}>
              <i className="fa-solid fa-briefcase" style={{ marginRight: '0.35rem' }}></i> Bookings
            </Link>
            <Link to="/listings/new" className="nav-link btn-outline" id="nav-new-listing">
              + List your home
            </Link>
          </>
        )}
        {!currentUser && (
          <Link to="/listings/new" className="nav-link" id="nav-airbnb">
            Airbnb your home
          </Link>
        )}

        {currentUser ? (
          <>
            <Link to="/profile" className="nav-link" id="nav-profile" style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
              <i className="fa-regular fa-circle-user" style={{ marginRight: '0.35rem', fontSize: '1.15rem' }}></i> Profile
            </Link>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleLogout}
              id="nav-logout"
              style={{ fontFamily: 'inherit' }}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/signup" className="nav-link" id="nav-signup">
              <b>Sign up</b>
            </Link>
            <Link to="/login" className="nav-link btn-outline" id="nav-login">
              <b>Log in</b>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
