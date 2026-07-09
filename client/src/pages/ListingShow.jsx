import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const GEOAPIFY_KEY = '6dd4d50fca564a2aa9604fe755ca03f2';
const DEFAULT_CENTER = [28.6139, 77.2090];
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1625505826533-5c80aca7d157?auto=format&fit=crop&w=800&q=60';

function StarRating({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`star ${n <= (hovered || value) ? 'filled' : ''}`}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function parseBold(text) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part);
}

function formatMarkdown(text) {
  if (!text) return '';
  return text.split('\n').map((line, idx) => {
    if (line.startsWith('### ')) return <h3 key={idx}>{line.substring(4)}</h3>;
    if (line.startsWith('## ')) return <h2 key={idx}>{line.substring(3)}</h2>;
    if (line.startsWith('# ')) return <h1 key={idx}>{line.substring(2)}</h1>;
    if (line.startsWith('* ') || line.startsWith('- ')) {
      return <li key={idx} style={{ marginLeft: '1rem', listStyleType: 'disc' }}>{parseBold(line.substring(2))}</li>;
    }
    return <p key={idx} style={{ margin: '0.25rem 0' }}>{parseBold(line)}</p>;
  });
}

function parseItineraryTimeline(text, onSaveItinerary) {
  const lines = text.split('\n');
  const timelineItems = [];
  let currentItem = null;
  let isItineraryFormat = false;

  for (let line of lines) {
    line = line.trim();
    const dayMatch = line.match(/^[\*\-\s]*\*\*Day\s+(\d+)[:\s\-]*([^*]*)\*\*(.*)/i);
    if (dayMatch) {
      isItineraryFormat = true;
      if (currentItem) {
        timelineItems.push(currentItem);
      }
      currentItem = {
        day: dayMatch[1],
        title: dayMatch[2].trim(),
        desc: dayMatch[3].replace(/^[:\-\s]*/, '').trim()
      };
    } else if (currentItem && (line.startsWith('*') || line.startsWith('-'))) {
      currentItem.desc += '\n' + line;
    } else if (currentItem && line.length > 0) {
      currentItem.desc += ' ' + line;
    }
  }
  if (currentItem) {
    timelineItems.push(currentItem);
  }

  if (!isItineraryFormat || timelineItems.length === 0) {
    return null;
  }

  return (
    <div className="itinerary-timeline-wrapper">
      <div className="itinerary-timeline">
        {timelineItems.map((item, i) => (
          <div className="timeline-item" key={i}>
            <div className="timeline-marker">
              <div className="timeline-dot">{item.day}</div>
              <div className="timeline-line"></div>
            </div>
            <div className="timeline-card">
              <h4>{item.title || `Day ${item.day}`}</h4>
              <p>{item.desc || 'Plan details...'}</p>
            </div>
          </div>
        ))}
      </div>
      {onSaveItinerary && (
        <button
          type="button"
          className="save-itinerary-btn"
          onClick={() => onSaveItinerary(text)}
        >
          <i className="fa-regular fa-bookmark"></i> Save Itinerary
        </button>
      )}
    </div>
  );
}

function renderStars(rating) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

export default function ListingShow() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, showFlash } = useAuth();
  const mapRef = useRef(null);
  const leafletMap = useRef(null);

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Review form state
  const [rating, setRating] = useState(3);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // AI Concierge state
  const [chatHistory, setChatHistory] = useState([]);
  const [aiMessage, setAiMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Wishlist, Bookings, & Saved Itineraries states
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [savedItineraries, setSavedItineraries] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guests, setGuests] = useState(1);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paying, setPaying] = useState(false);

  // Credit Card Form States
  const [cardNum, setCardNum] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // Fetch listing
  useEffect(() => {
    setLoading(true);
    api.get(`/listings/${id}`)
      .then((res) => { setListing(res.data.listing); setError(null); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Init Leaflet map after listing loads
  useEffect(() => {
    if (!listing || !mapRef.current) return;
    if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; }

    const L = window.L;
    if (!L) return;

    const query = `${listing.location}, ${listing.country}`;
    const geocodeUrl = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(query)}&apiKey=${GEOAPIFY_KEY}`;

    fetch(geocodeUrl)
      .then((res) => res.json())
      .then((data) => {
        let coords = DEFAULT_CENTER;
        if (data.features && data.features.length > 0) {
          const geometry = data.features[0].geometry;
          if (geometry && geometry.coordinates) {
            // Geoapify returns [lon, lat], Leaflet wants [lat, lon]
            coords = [geometry.coordinates[1], geometry.coordinates[0]];
          }
        }

        const map = L.map(mapRef.current).setView(coords, 12);
        leafletMap.current = map;

        L.tileLayer(
          `https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_KEY}`,
          { tileSize: 512, zoomOffset: -1, attribution: '© OpenStreetMap, © Geoapify', maxZoom: 20 }
        ).addTo(map);

        L.marker(coords)
          .addTo(map)
          .bindPopup(`<strong>${listing.title}</strong><br/>${listing.location}`)
          .openPopup();
      })
      .catch((err) => {
        console.error("Geocoding failed, using fallback center:", err);
        const map = L.map(mapRef.current).setView(DEFAULT_CENTER, 12);
        leafletMap.current = map;

        L.tileLayer(
          `https://maps.geoapify.com/v1/tile/osm-carto/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_KEY}`,
          { tileSize: 512, zoomOffset: -1, attribution: '© OpenStreetMap, © Geoapify', maxZoom: 20 }
        ).addTo(map);

        L.marker(DEFAULT_CENTER)
          .addTo(map)
          .bindPopup(`<strong>${listing.location}</strong>`)
          .openPopup();
      });

    return () => { if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null; } };
  }, [listing]);

  // Set initial welcome chat history when listing is fetched
  useEffect(() => {
    if (listing) {
      setChatHistory([
        {
          role: 'model',
          content: `Hi! I'm your HabiTrek AI Concierge. 🌟 Ask me anything about staying at **${listing.title}** in **${listing.location}**! Can I help you with an itinerary, packing tips, or local dining recommendations?`,
        },
      ]);
    }
  }, [listing]);

  // Set default check-in and check-out dates
  useEffect(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkout = new Date(tomorrow);
    checkout.setDate(checkout.getDate() + 3);

    setStartDate(tomorrow.toISOString().split('T')[0]);
    setEndDate(checkout.toISOString().split('T')[0]);
  }, []);

  // Check if current property is wishlisted
  useEffect(() => {
    if (currentUser && id) {
      api.get('/wishlist')
        .then((res) => {
          const items = res.data.wishlist || [];
          setIsWishlisted(items.some((item) => item._id === id));
        })
        .catch((err) => console.error('Wishlist check error:', err));
    }
  }, [id, currentUser]);

  // Load saved itineraries
  useEffect(() => {
    if (listing) {
      const stored = localStorage.getItem(`saved_itineraries_${id}`);
      if (stored) {
        setSavedItineraries(JSON.parse(stored));
      }
    }
  }, [id, listing]);

  const handleWishlistToggle = async () => {
    if (!currentUser) {
      showFlash('error', 'You must be logged in to save properties.');
      navigate('/login');
      return;
    }
    try {
      const res = await api.post(`/wishlist/toggle/${id}`);
      setIsWishlisted(res.data.added);
      showFlash('success', res.data.message);
    } catch (err) {
      showFlash('error', err.message);
    }
  };

  const handleSaveItinerary = (itineraryText) => {
    if (savedItineraries.includes(itineraryText)) {
      showFlash('error', 'This itinerary is already saved!');
      return;
    }
    const updated = [...savedItineraries, itineraryText];
    setSavedItineraries(updated);
    localStorage.setItem(`saved_itineraries_${id}`, JSON.stringify(updated));
    showFlash('success', 'Itinerary saved to your guide tab!');
  };

  const handleRemoveSavedItinerary = (index) => {
    const updated = savedItineraries.filter((_, idx) => idx !== index);
    setSavedItineraries(updated);
    localStorage.setItem(`saved_itineraries_${id}`, JSON.stringify(updated));
    showFlash('success', 'Itinerary removed!');
  };

  const getNightsCount = () => {
    if (!startDate || !endDate) return 0;
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = e - s;
    if (diff <= 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const nights = getNightsCount();
  const basePrice = listing ? listing.price * nights : 0;
  const cleaningFee = listing ? Math.round(listing.price * nights * 0.15) : 0;
  const serviceFee = listing ? Math.round(listing.price * nights * 0.08) : 0;
  const totalPrice = basePrice + cleaningFee + serviceFee;

  const handleReserveClick = (e) => {
    e.preventDefault();
    if (!currentUser) {
      showFlash('error', 'You must be logged in to book a stay.');
      navigate('/login');
      return;
    }
    if (getNightsCount() <= 0) {
      showFlash('error', 'Please select valid check-in and check-out dates.');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const cleanNum = cardNum.replace(/\s/g, '');
    if (cleanNum.length < 16) {
      showFlash('error', 'Please enter a valid 16-digit card number.');
      return;
    }
    if (!cardExpiry || !cardCvv || !cardName.trim()) {
      showFlash('error', 'Please fill out all card details.');
      return;
    }

    setPaying(true);
    setTimeout(async () => {
      try {
        await api.post('/bookings', {
          listingId: id,
          startDate,
          endDate,
          guests,
          totalPrice
        });
        setPaymentSuccess(true);
        showFlash('success', 'Stay booked successfully!');
      } catch (err) {
        showFlash('error', 'Booking failed: ' + err.message);
        setShowPaymentModal(false);
      } finally {
        setPaying(false);
      }
    }, 1500);
  };

  const handleCardNumChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    setCardNum(formatted);
  };

  // Scroll AI chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, aiLoading]);

  const handleSendAiMessage = async (queryText) => {
    const textToSend = typeof queryText === 'string' ? queryText : aiMessage;
    if (!textToSend.trim() || aiLoading) return;

    const userMsg = { role: 'user', content: textToSend };
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    if (!queryText) setAiMessage('');
    setAiLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        listing,
        messages: updatedHistory,
        query: textToSend,
      });
      setChatHistory([...updatedHistory, { role: 'model', content: res.data.response }]);
    } catch (err) {
      showFlash('error', err.message || 'AI error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      showFlash('success', 'Listing deleted!');
      navigate('/listings');
    } catch (err) {
      showFlash('error', err.message);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) { showFlash('error', 'Please add a comment!'); return; }
    setSubmitting(true);
    try {
      const res = await api.post(`/listings/${id}/reviews`, { review: { rating, comment } });
      setListing((prev) => ({ ...prev, review: [...prev.review, res.data.review] }));
      setRating(3); setComment('');
      showFlash('success', 'Review added!');
    } catch (err) {
      showFlash('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewDelete = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await api.delete(`/listings/${id}/reviews/${reviewId}`);
      setListing((prev) => ({ ...prev, review: prev.review.filter((r) => r._id !== reviewId) }));
      showFlash('success', 'Review deleted!');
    } catch (err) {
      showFlash('error', err.message);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
  if (error) return <div className="empty-state"><i className="fa-solid fa-triangle-exclamation"></i><p>{error}</p></div>;
  if (!listing) return null;

  const imgSrc = listing.image?.url || listing.image || DEFAULT_IMG;
  const isOwner = currentUser && listing.owner && listing.owner._id === currentUser._id;

  return (
    <div className="show-page">
      <h1 className="show-title">{listing.title}</h1>
      
      {/* Sub-headline / Meta Details under Title */}
      <div className="show-meta" style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
        <span><i className="fa-solid fa-star" style={{ color: '#ffb700' }}></i> {listing.review?.length > 0 ? (listing.review.reduce((sum, r) => sum + r.rating, 0) / listing.review.length).toFixed(1) : 'No reviews'}</span>
        <span>•</span>
        <span><i className="fa-solid fa-location-dot"></i> {listing.location}, {listing.country}</span>
        {listing.category && (
          <>
            <span>•</span>
            <span style={{ backgroundColor: 'var(--bg-light)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', fontWeight: 600, color: 'var(--brand)', fontSize: '0.8rem' }}>{listing.category}</span>
          </>
        )}
      </div>

      <img
        src={imgSrc}
        alt={listing.title}
        className="show-img"
        onError={(e) => { e.target.src = DEFAULT_IMG; }}
        id="listing-main-img"
        style={{ width: '100%', maxHeight: '520px', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}
      />

      {/* Main Two-Column Layout */}
      <div className="show-main-layout">
        <div className="show-left-column">
          
          {/* Host / Heading Section */}
          <div className="host-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>Entire home hosted by {listing.owner?.username || 'Unknown'}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0.25rem 0 0' }}>Self check-in • Dedicated workspace • Superhost hospitality</p>
            </div>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              backgroundColor: '#6c429d',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '1.25rem',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {(listing.owner?.username || 'U')[0].toUpperCase()}
            </div>
          </div>

          {/* Description Section */}
          <div className="description-section" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>About this space</h3>
            <p style={{ fontSize: '1.02rem', lineHeight: '1.6', color: 'var(--text-primary)', whiteSpace: 'pre-line' }}>
              {listing.description}
            </p>
          </div>

          <hr className="divider" style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.5rem 0' }} />

          {/* Spec details row */}
          <div className="listing-specs-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
            <div className="spec-card" style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <i className="fa-solid fa-indian-rupee-sign" style={{ fontSize: '1.3rem', color: 'var(--brand)' }}></i>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Price per night</span>
                <strong style={{ fontSize: '0.95rem' }}>₹{listing.price?.toLocaleString('en-IN')}</strong>
              </div>
            </div>
            <div className="spec-card" style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <i className="fa-solid fa-map-location-dot" style={{ fontSize: '1.3rem', color: 'var(--brand)' }}></i>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Location</span>
                <strong style={{ fontSize: '0.95rem' }}>{listing.location}</strong>
              </div>
            </div>
            <div className="spec-card" style={{ border: '1px solid var(--border)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <i className="fa-solid fa-globe" style={{ fontSize: '1.3rem', color: 'var(--brand)' }}></i>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Country</span>
                <strong style={{ fontSize: '0.95rem' }}>{listing.country}</strong>
              </div>
            </div>
          </div>

          {/* Owner actions */}
          {isOwner && (
            <div className="owner-actions" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
              <Link to={`/listings/${id}/edit`} className="btn btn-dark" id="btn-edit-listing">
                <i className="fa-solid fa-pen"></i> Edit listing
              </Link>
              <button className="btn btn-danger" onClick={handleDelete} id="btn-delete-listing">
                <i className="fa-solid fa-trash"></i> Delete listing
              </button>
            </div>
          )}

          <hr className="divider" style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '1.5rem 0' }} />

          {/* Map and AI Concierge */}
          <div className="map-and-ai-container">
            <div className="map-section">
              <h3>Where you&apos;ll be</h3>
              <div id="map" ref={mapRef}></div>
            </div>

            <div className="ai-concierge-card" id="ai-concierge">
              <div className="ai-card-header">
                <h3>
                  <i className="fa-solid fa-wand-magic-sparkles"></i> AI Concierge
                </h3>
                <span className="ai-badge">Gemini 1.5</span>
              </div>

              <div className="ai-chat-body">
                {chatHistory.map((msg, index) => (
                  <div
                    key={index}
                    className={`ai-message ${msg.role === 'user' ? 'user' : 'assistant'}`}
                  >
                    {msg.role === 'model'
                      ? parseItineraryTimeline(msg.content, handleSaveItinerary) || formatMarkdown(msg.content)
                      : formatMarkdown(msg.content)
                    }
                  </div>
                ))}
                {aiLoading && (
                  <div className="ai-loading-container">
                    <div className="ai-loading-dots">
                      <div className="ai-dot"></div>
                      <div className="ai-dot"></div>
                      <div className="ai-dot"></div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="ai-suggestions">
                <button
                  type="button"
                  className="suggestion-pill"
                  onClick={() => handleSendAiMessage('Suggest a 3-day itinerary')}
                  disabled={aiLoading}
                >
                  📅 Itinerary
                </button>
                <button
                  type="button"
                  className="suggestion-pill"
                  onClick={() => handleSendAiMessage('Where can I eat nearby?')}
                  disabled={aiLoading}
                >
                  🍽️ Dining
                </button>
                <button
                  type="button"
                  className="suggestion-pill"
                  onClick={() => handleSendAiMessage('What should I pack?')}
                  disabled={aiLoading}
                >
                  🎒 Packing
                </button>
              </div>

              <form
                className="ai-chat-input-area"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendAiMessage();
                }}
              >
                <input
                  type="text"
                  placeholder="Ask about local spots, travel plan..."
                  value={aiMessage}
                  onChange={(e) => setAiMessage(e.target.value)}
                  disabled={aiLoading}
                  id="ai-concierge-input"
                />
                <button
                  type="submit"
                  className="ai-send-btn"
                  disabled={aiLoading || !aiMessage.trim()}
                  id="ai-concierge-send"
                >
                  Send
                </button>
              </form>
            </div>
          </div>

          {/* Saved Itineraries Tab */}
          {savedItineraries.length > 0 && (
            <div className="saved-itineraries-tab" id="saved-itineraries-section">
              <h3><i className="fa-solid fa-bookmark" style={{ color: '#6c429d' }}></i> Saved Itineraries</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {savedItineraries.map((itinerary, idx) => (
                  <div key={idx} style={{
                    border: '1px solid #e1d6eb',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    position: 'relative',
                    backgroundColor: '#faf8fc'
                  }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveSavedItinerary(idx)}
                      style={{
                        position: 'absolute',
                        top: '0.75rem',
                        right: '0.75rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                      title="Remove Itinerary"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                    <div style={{ marginRight: '1.5rem' }}>
                      {parseItineraryTimeline(itinerary) || formatMarkdown(itinerary)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <hr className="divider" />

          {/* ── Reviews ─────────────────────────────── */}
          <div className="reviews-section">
            <h3>Reviews {listing.review?.length > 0 && `(${listing.review.length})`}</h3>

            {currentUser && (
              <form className="review-form" onSubmit={handleReviewSubmit} id="review-form">
                <h4>Leave a review</h4>
                <StarRating value={rating} onChange={setRating} />
                <div className="form-group">
                  <label htmlFor="review-comment">Your comment</label>
                  <textarea
                    id="review-comment"
                    className="form-control"
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience..."
                    required
                  />
                </div>
                <button className="btn btn-primary" type="submit" disabled={submitting} id="btn-submit-review">
                  {submitting ? 'Submitting…' : 'Submit review'}
                </button>
              </form>
            )}

            {!currentUser && (
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 600 }}>Log in</Link> to leave a review.
              </p>
            )}

            {listing.review?.length === 0 && (
              <p style={{ color: 'var(--text-muted)' }}>No reviews yet. Be the first!</p>
            )}

            <div className="reviews-grid">
              {listing.review?.map((review) => (
                <div className="review-card" key={review._id} id={`review-${review._id}`}>
                  <div className="review-card-header">
                    <span className="review-author">{review.author?.username || 'Anonymous'}</span>
                    <span className="review-stars">{renderStars(review.rating)}</span>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                  {currentUser && review.author?._id === currentUser._id && (
                    <button
                      className="review-delete-btn"
                      onClick={() => handleReviewDelete(review._id)}
                      id={`btn-delete-review-${review._id}`}
                    >
                      Delete review
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Sticky Booking Card Column */}
        <div className="show-right-column">
          <div className="booking-card">
            <div className="booking-card-header">
              <div className="booking-card-price">
                &#8377; {listing.price?.toLocaleString('en-IN')} <span>/ night</span>
              </div>
              <div className="booking-card-rating">
                <i className="fa-solid fa-star" style={{ color: 'var(--brand)' }}></i>
                <span>{listing.review?.length > 0 ? (listing.review.reduce((acc, r) => acc + r.rating, 0) / listing.review.length).toFixed(1) : 'New'}</span>
              </div>
            </div>

            <form onSubmit={handleReserveClick}>
              <div className="booking-dates-container">
                <div className="booking-date-fields">
                  <div className="booking-date-input">
                    <label htmlFor="booking-checkin">Check-in</label>
                    <input
                      type="date"
                      id="booking-checkin"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="booking-date-input">
                    <label htmlFor="booking-checkout">Check-out</label>
                    <input
                      type="date"
                      id="booking-checkout"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="booking-guests-input">
                  <label htmlFor="booking-guests">Guests</label>
                  <select
                    id="booking-guests"
                    value={guests}
                    onChange={(e) => setGuests(parseInt(e.target.value))}
                  >
                    <option value={1}>1 guest</option>
                    <option value={2}>2 guests</option>
                    <option value={3}>3 guests</option>
                    <option value={4}>4 guests</option>
                  </select>
                </div>
              </div>

              {nights > 0 && (
                <div className="booking-price-breakdown">
                  <div className="breakdown-row">
                    <span>&#8377; {listing.price?.toLocaleString('en-IN')} x {nights} nights</span>
                    <span>&#8377; {basePrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="breakdown-row">
                    <span>Cleaning fee (15%)</span>
                    <span>&#8377; {cleaningFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="breakdown-row">
                    <span>Service fee (8%)</span>
                    <span>&#8377; {serviceFee.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="breakdown-row total">
                    <span>Total cost</span>
                    <span>&#8377; {totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              <button type="submit" className="btn btn-primary btn-full" id="btn-reserve-stay" style={{ padding: '0.75rem' }}>
                Reserve Stay
              </button>
            </form>

            <button
              type="button"
              className={`booking-card-wishlist ${isWishlisted ? 'active' : ''}`}
              onClick={handleWishlistToggle}
              id="btn-wishlist-toggle"
            >
              <i className={isWishlisted ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
              <span>{isWishlisted ? 'Wishlisted' : 'Add to Wishlist'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Credit Card Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={() => !paying && setShowPaymentModal(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal-header">
              <h3>
                <i className="fa-solid fa-credit-card" style={{ color: '#6c429d' }}></i> Secure Payment
              </h3>
              {!paying && (
                <button className="close-modal-btn" onClick={() => setShowPaymentModal(false)}>
                  &times;
                </button>
              )}
            </div>

            {paymentSuccess ? (
              <div className="payment-success-screen">
                <div className="success-icon-wrap">
                  <i className="fa-solid fa-check"></i>
                </div>
                <h3>Stay Booked! 🎉</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Your reservation is confirmed. You can view details in your Bookings list.
                </p>
                <button
                  type="button"
                  className="btn btn-dark btn-full"
                  onClick={() => {
                    setShowPaymentModal(false);
                    setPaymentSuccess(false);
                    navigate('/bookings');
                  }}
                  style={{ marginTop: '1rem', padding: '0.65rem' }}
                >
                  Go to Bookings
                </button>
              </div>
            ) : (
              <form onSubmit={handlePaymentSubmit} className="payment-modal-body">
                {/* Credit Card mockup graphic */}
                <div className="credit-card-graphic">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div className="card-chip"></div>
                    <i className="fa-brands fa-cc-visa" style={{ fontSize: '2rem' }}></i>
                  </div>
                  <div className="card-number-display">
                    {cardNum || '•••• •••• •••• ••••'}
                  </div>
                  <div className="card-meta-row">
                    <div>
                      <span style={{ display: 'block', fontSize: '0.6rem', opacity: 0.8 }}>Card Holder</span>
                      <strong>{cardName || 'YOUR NAME'}</strong>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: '0.6rem', opacity: 0.8 }}>Expires</span>
                      <strong>{cardExpiry || 'MM/YY'}</strong>
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label htmlFor="card-name-input" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>Cardholder Name</label>
                  <input
                    type="text"
                    id="card-name-input"
                    className="form-control"
                    placeholder="Enter cardholder name"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    required
                    disabled={paying}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label htmlFor="card-number-input" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>Card Number</label>
                  <input
                    type="text"
                    id="card-number-input"
                    className="form-control"
                    placeholder="0000 0000 0000 0000"
                    value={cardNum}
                    onChange={handleCardNumChange}
                    required
                    disabled={paying}
                  />
                </div>

                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label htmlFor="card-expiry-input" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>Expiration</label>
                    <input
                      type="text"
                      id="card-expiry-input"
                      className="form-control"
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '').substring(0, 4);
                        if (value.length > 2) value = value.substring(0, 2) + '/' + value.substring(2);
                        setCardExpiry(value);
                      }}
                      required
                      disabled={paying}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="card-cvv-input" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-primary)', display: 'block', marginBottom: '0.25rem' }}>CVV</label>
                    <input
                      type="password"
                      id="card-cvv-input"
                      className="form-control"
                      placeholder="***"
                      maxLength={3}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                      required
                      disabled={paying}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={paying}
                  style={{ padding: '0.75rem' }}
                >
                  {paying ? 'Processing payment…' : `Pay ₹${totalPrice?.toLocaleString('en-IN')}`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
