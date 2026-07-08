import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/api';

const FILTERS = [
  { icon: 'fa-solid fa-fire',           label: 'Trending' },
  { icon: 'fa-solid fa-bed',            label: 'Rooms' },
  { icon: 'fa-solid fa-mountain-city',  label: 'Iconic Cities' },
  { icon: 'fa-solid fa-mountain',       label: 'Mountains' },
  { icon: 'fa-brands fa-fort-awesome',  label: 'Castles' },
  { icon: 'fa-solid fa-person-swimming',label: 'Amazing Pools' },
  { icon: 'fa-solid fa-campground',     label: 'Camping' },
  { icon: 'fa-solid fa-cow',            label: 'Farms' },
  { icon: 'fa-solid fa-snowflake',      label: 'Arctic' },
  { icon: 'fa-solid fa-landmark-dome',  label: 'Domes' },
  { icon: 'fa-solid fa-sailboat',       label: 'Boats' },
];

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1625505826533-5c80aca7d157?auto=format&fit=crop&w=800&q=60';

export default function ListingsIndex() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTax, setShowTax] = useState(false);
  const [activeFilter, setActiveFilter] = useState(null);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    setLoading(true);
    api
      .get('/listings')
      .then((res) => {
        setListings(res.data.listings || []);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Client-side search and category filter
  const filtered = listings.filter((l) => {
    // 1. Search Query Filter
    const q = searchQuery.toLowerCase();
    if (q) {
      const matchSearch =
        l.title?.toLowerCase().includes(q) ||
        l.location?.toLowerCase().includes(q) ||
        l.country?.toLowerCase().includes(q) ||
        l.description?.toLowerCase().includes(q);
      if (!matchSearch) return false;
    }

    // 2. Category Filter
    if (activeFilter) {
      if (l.category && l.category.toLowerCase() === activeFilter.toLowerCase()) {
        return true;
      }
      
      const titleLower = (l.title || '').toLowerCase();
      const descLower = (l.description || '').toLowerCase();
      const textToSearch = `${titleLower} ${descLower}`;

      switch (activeFilter) {
        case 'Trending':
          return true;
        case 'Rooms':
          return /\b(room|bed|bedroom|studio|apartment|flat|suite)\b/i.test(textToSearch);
        case 'Iconic Cities':
          return /\b(city|town|downtown|urban|metro|penthouse|plaza)\b/i.test(textToSearch);
        case 'Mountains':
          return /\b(mountain|hill|cabin|slope|alpine|peak|cliff|chalet)\b/i.test(textToSearch);
        case 'Castles':
          return /\b(castle|palace|manor|chateau|fort|estate|villa)\b/i.test(textToSearch);
        case 'Amazing Pools':
          return /\b(pool|swim|jacuzzi|spa|infinity)\b/i.test(textToSearch);
        case 'Camping':
          return /\b(camp|tent|yurt|outdoor|forest|nature|glamping)\b/i.test(textToSearch);
        case 'Farms':
          return /\b(farm|barn|ranch|countryside|cottage|pasture|meadow)\b/i.test(textToSearch);
        case 'Arctic':
          return /\b(arctic|snow|ice|glacier|winter|cold|tundra|nordic)\b/i.test(textToSearch);
        case 'Domes':
          return /\b(dome|yurt|igloo|unique|pod|sphere)\b/i.test(textToSearch);
        case 'Boats':
          return /\b(boat|houseboat|yacht|cruise|floating|dock|port|lake|sea)\b/i.test(textToSearch);
        default:
          return true;
      }
    }

    return true;
  });

  return (
    <div>
      {/* ── Filters Bar ─────────────────────────────── */}
      <div className="filters-bar" id="filters-bar">
        {FILTERS.map((f) => (
          <div
            key={f.label}
            className={`filter-item${activeFilter === f.label ? ' active' : ''}`}
            onClick={() => setActiveFilter(activeFilter === f.label ? null : f.label)}
            title={f.label}
            role="button"
            tabIndex={0}
            id={`filter-${f.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <i className={f.icon}></i>
            <p>{f.label}</p>
          </div>
        ))}

        {/* Tax toggle */}
        <div className="tax-toggle-wrap" id="tax-toggle">
          <label className="toggle-switch" htmlFor="tax-switch">
            <input
              type="checkbox"
              id="tax-switch"
              checked={showTax}
              onChange={() => setShowTax(!showTax)}
            />
            <span className="toggle-slider"></span>
          </label>
          Display total after taxes
        </div>
      </div>

      {/* ── Grid ────────────────────────────────────── */}
      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      )}

      {error && !loading && (
        <div className="empty-state">
          <i className="fa-solid fa-triangle-exclamation"></i>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="empty-state">
          <i className="fa-solid fa-compass"></i>
          <p>No listings found{searchQuery ? ` for "${searchQuery}"` : ''}.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="listings-grid" id="listings-grid">
          {filtered.map((listing) => {
            const imgSrc =
              listing.image?.url || listing.image || DEFAULT_IMG;
            const price = listing.price
              ? listing.price.toLocaleString('en-IN')
              : 'N/A';
            const taxPrice = listing.price
              ? Math.round(listing.price * 1.18).toLocaleString('en-IN')
              : 'N/A';

            return (
              <Link
                to={`/listings/${listing._id}`}
                key={listing._id}
                className="listing-card-link"
                id={`listing-card-${listing._id}`}
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
                      <strong>&#8377; {showTax ? taxPrice : price}</strong> /night
                      {showTax && (
                        <span className="gst visible">&nbsp;(incl. 18% GST)</span>
                      )}
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
