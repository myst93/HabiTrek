import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/api';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1625505826533-5c80aca7d157?auto=format&fit=crop&w=800&q=60';

export default function WishlistList() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/wishlist')
      .then((res) => {
        setWishlist(res.data.wishlist || []);
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
    <div className="wishlist-page">
      <h2 style={{ marginBottom: '1.5rem', fontWeight: 700 }}>My Wishlist</h2>
      {wishlist.length === 0 ? (
        <div className="empty-state" style={{ padding: '3rem 1rem' }}>
          <i className="fa-regular fa-heart" style={{ fontSize: '3.5rem', color: 'var(--brand)', opacity: 0.7 }}></i>
          <p style={{ marginTop: '1rem', fontSize: '1.1rem', fontWeight: 500 }}>Your wishlist is empty</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Browse homes and click the heart icon to save your favorites!
          </p>
          <Link to="/listings" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
            Explore properties
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
                id={`wishlist-card-${listing._id}`}
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
  );
}
