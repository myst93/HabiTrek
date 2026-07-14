import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';

const DEFAULT_IMG = 'https://images.unsplash.com/photo-1625505826533-5c80aca7d157?auto=format&fit=crop&w=800&q=60';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Payment() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { currentUser, showFlash } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'upi', 'netbanking'
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Card form states
  const [cardNum, setCardNum] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');

  // UPI states
  const [upiId, setUpiId] = useState('');

  // Net banking states
  const [selectedBank, setSelectedBank] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    api.get(`/bookings/${bookingId}`)
      .then((res) => {
        setBooking(res.data.booking);
        setError(null);
      })
      .catch((err) => {
        console.error('Error fetching booking for payment:', err);
        setError(err.message || 'Failed to load booking details.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [bookingId, currentUser, navigate]);

  const handleCardNumChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 16);
    const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    setCardNum(formatted);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (paymentMethod === 'card') {
      const cleanNum = cardNum.replace(/\s/g, '');
      if (cleanNum.length < 16) {
        showFlash('error', 'Please enter a valid 16-digit card number.');
        return;
      }
      if (!cardExpiry || !cardCvv || !cardName.trim()) {
        showFlash('error', 'Please fill out all card details.');
        return;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        showFlash('error', 'Please enter a valid UPI ID (e.g. user@okhdfcbank).');
        return;
      }
    } else if (paymentMethod === 'netbanking') {
      if (!selectedBank) {
        showFlash('error', 'Please select your bank for Net Banking.');
        return;
      }
    }

    setPaying(true);

    // Simulate network latency for payment gateway integration
    setTimeout(async () => {
      try {
        await api.post(`/bookings/${bookingId}/pay`);
        setPaymentSuccess(true);
        showFlash('success', 'Payment successful! Your stay is confirmed.');
      } catch (err) {
        showFlash('error', 'Payment failed: ' + err.message);
      } finally {
        setPaying(false);
      }
    }, 1800);
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state" style={{ padding: '4rem 1rem' }}>
        <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '3rem', color: 'red' }}></i>
        <p style={{ marginTop: '1rem', fontSize: '1.2rem', fontWeight: 600 }}>{error}</p>
        <Link to="/profile" className="btn btn-outline" style={{ marginTop: '1.5rem', display: 'inline-block', textDecoration: 'none' }}>
          Back to Profile
        </Link>
      </div>
    );
  }

  if (!booking) return null;

  const listing = booking.listing || {};
  const imgSrc = listing.image?.url || listing.image || DEFAULT_IMG;
  const nights = Math.max(1, Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24)));
  const basePrice = listing.price ? listing.price * nights : 0;
  const cleaningFee = Math.round(basePrice * 0.15);
  const serviceFee = Math.round(basePrice * 0.08);

  return (
    <div className="payment-page-container" style={{ padding: '2.5rem 0', maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/profile" style={{ textDecoration: 'none', color: 'var(--brand)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.95rem' }}>
          <i className="fa-solid fa-arrow-left"></i> Back to Profile
        </Link>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <i className="fa-solid fa-shield-halved" style={{ color: 'var(--brand)' }}></i> Confirm and Pay
        </h1>
      </div>

      {paymentSuccess ? (
        <div className="payment-completed-card" style={{
          backgroundColor: 'white',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '3rem 2rem',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)',
          maxWidth: '600px',
          margin: '2rem auto'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#d4edda',
            color: '#155724',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            margin: '0 auto 1.5rem'
          }}>
            <i className="fa-solid fa-check"></i>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>Stay Booked Successfully! 🎉</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6', marginBottom: '2rem' }}>
            Thank you for booking with HabiTrek. Your payment of <strong>&#8377; {booking.totalPrice?.toLocaleString('en-IN')}</strong> has been processed successfully. Your booking is highlighted and verified under your profile bookings.
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            <Link to="/profile" className="btn btn-primary" style={{ padding: '0.75rem', textDecoration: 'none', textAlign: 'center' }}>
              View in Profile
            </Link>
            <Link to={`/listings/${listing._id}`} className="btn btn-outline" style={{ padding: '0.75rem', textDecoration: 'none', textAlign: 'center' }}>
              Back to Stay
            </Link>
          </div>
        </div>
      ) : (
        <div className="payment-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '3rem' }}>
          
          {/* Left Column - Payment Details */}
          <div>
            <div style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'white',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
              marginBottom: '2rem'
            }}>
              <div style={{
                backgroundColor: 'var(--bg-light)',
                borderBottom: '1px solid var(--border)',
                padding: '1.25rem 1.5rem',
                display: 'flex',
                gap: '1rem'
              }}>
                <button
                  onClick={() => setPaymentMethod('card')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid ' + (paymentMethod === 'card' ? 'var(--brand)' : 'var(--border)'),
                    backgroundColor: paymentMethod === 'card' ? '#eaf5f0' : 'white',
                    color: paymentMethod === 'card' ? 'var(--brand)' : 'var(--text-primary)',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <i className="fa-solid fa-credit-card"></i> Card
                </button>
                <button
                  onClick={() => setPaymentMethod('upi')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid ' + (paymentMethod === 'upi' ? 'var(--brand)' : 'var(--border)'),
                    backgroundColor: paymentMethod === 'upi' ? '#eaf5f0' : 'white',
                    color: paymentMethod === 'upi' ? 'var(--brand)' : 'var(--text-primary)',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <i className="fa-solid fa-mobile-screen-button"></i> UPI
                </button>
                <button
                  onClick={() => setPaymentMethod('netbanking')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    border: '1px solid ' + (paymentMethod === 'netbanking' ? 'var(--brand)' : 'var(--border)'),
                    backgroundColor: paymentMethod === 'netbanking' ? '#eaf5f0' : 'white',
                    color: paymentMethod === 'netbanking' ? 'var(--brand)' : 'var(--text-primary)',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <i className="fa-solid fa-building-columns"></i> Net Banking
                </button>
              </div>

              <form onSubmit={handlePaymentSubmit} style={{ padding: '2rem' }}>
                {/* Card Payment Form */}
                {paymentMethod === 'card' && (
                  <div>
                    {/* Live Graphical Credit Card */}
                    <div className="credit-card-graphic" style={{
                      margin: '0 auto 2rem',
                      background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-dark) 100%)',
                      color: 'white',
                      padding: '1.5rem',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-md)',
                      maxWidth: '360px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      height: '200px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className="card-chip" style={{ width: '40px', height: '30px', backgroundColor: '#e5c158', borderRadius: '4px' }}></div>
                        <i className="fa-brands fa-cc-visa" style={{ fontSize: '2.5rem' }}></i>
                      </div>
                      <div className="card-number-display" style={{ fontSize: '1.35rem', letterSpacing: '2.5px', margin: '1.5rem 0 0.75rem', fontFamily: 'monospace', textAlign: 'center' }}>
                        {cardNum || '•••• •••• •••• ••••'}
                      </div>
                      <div className="card-meta-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.6rem', opacity: 0.8, textTransform: 'uppercase' }}>Card Holder</span>
                          <strong style={{ fontSize: '0.9rem', letterSpacing: '0.5px' }}>{cardName || 'YOUR NAME'}</strong>
                        </div>
                        <div>
                          <span style={{ display: 'block', fontSize: '0.6rem', opacity: 0.8, textTransform: 'uppercase' }}>Expires</span>
                          <strong style={{ fontSize: '0.9rem' }}>{cardExpiry || 'MM/YY'}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                      <label htmlFor="checkout-card-name" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>Cardholder Name</label>
                      <input
                        type="text"
                        id="checkout-card-name"
                        className="form-control"
                        placeholder="Enter cardholder name"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        required={paymentMethod === 'card'}
                        disabled={paying}
                        style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                      <label htmlFor="checkout-card-num" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>Card Number</label>
                      <input
                        type="text"
                        id="checkout-card-num"
                        className="form-control"
                        placeholder="0000 0000 0000 0000"
                        value={cardNum}
                        onChange={handleCardNumChange}
                        required={paymentMethod === 'card'}
                        disabled={paying}
                        style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                      />
                    </div>

                    <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div className="form-group">
                        <label htmlFor="checkout-card-expiry" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>Expiration</label>
                        <input
                          type="text"
                          id="checkout-card-expiry"
                          className="form-control"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => {
                            let value = e.target.value.replace(/\D/g, '').substring(0, 4);
                            if (value.length > 2) value = value.substring(0, 2) + '/' + value.substring(2);
                            setCardExpiry(value);
                          }}
                          required={paymentMethod === 'card'}
                          disabled={paying}
                          style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="checkout-card-cvv" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>CVV</label>
                        <input
                          type="password"
                          id="checkout-card-cvv"
                          className="form-control"
                          placeholder="***"
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          required={paymentMethod === 'card'}
                          disabled={paying}
                          style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* UPI Payment Form */}
                {paymentMethod === 'upi' && (
                  <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{
                      backgroundColor: 'var(--bg-light)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.5rem',
                      display: 'inline-block',
                      marginBottom: '1.5rem'
                    }}>
                      {/* Interactive mock QR Code */}
                      <div style={{ width: '150px', height: '150px', backgroundColor: 'white', border: '2px solid #333', padding: '10px', display: 'flex', flexWrap: 'wrap', gap: '3px', margin: '0 auto 0.75rem', position: 'relative' }}>
                        {/* Mock QR corners */}
                        <div style={{ position: 'absolute', top: '10px', left: '10px', width: '30px', height: '30px', border: '6px solid black' }}></div>
                        <div style={{ position: 'absolute', top: '10px', right: '10px', width: '30px', height: '30px', border: '6px solid black' }}></div>
                        <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '30px', height: '30px', border: '6px solid black' }}></div>
                        {/* Dummy noise patterns */}
                        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: '8px', padding: '35px 5px 5px 35px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}><div style={{ width: '10px', height: '10px', background: 'black' }}></div><div style={{ width: '15px', height: '10px', background: 'black' }}></div></div>
                          <div style={{ display: 'flex', gap: '6px' }}><div style={{ width: '25px', height: '8px', background: 'black' }}></div></div>
                          <div style={{ display: 'flex', gap: '6px' }}><div style={{ width: '8px', height: '10px', background: 'black' }}></div><div style={{ width: '12px', height: '10px', background: 'black' }}></div></div>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Scan QR using BHIM UPI App</span>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border)', padding: '1.5rem 0 0', textAlign: 'left' }}>
                      <label htmlFor="checkout-upi-id" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>Enter UPI ID</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                          type="text"
                          id="checkout-upi-id"
                          className="form-control"
                          placeholder="e.g. mobile@paytm"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          required={paymentMethod === 'upi'}
                          disabled={paying}
                          style={{ flex: 1, padding: '0.65rem 0.85rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Net Banking Form */}
                {paymentMethod === 'netbanking' && (
                  <div style={{ padding: '0.5rem 0' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>Select from popular banks or search for your bank:</p>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '1rem',
                      marginBottom: '1.5rem'
                    }}>
                      {[
                        { id: 'sbi', name: 'State Bank of India', code: 'SBI' },
                        { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC' },
                        { id: 'icici', name: 'ICICI Bank', code: 'ICICI' },
                        { id: 'axis', name: 'Axis Bank', code: 'AXIS' }
                      ].map((bank) => (
                        <div
                          key={bank.id}
                          onClick={() => !paying && setSelectedBank(bank.id)}
                          style={{
                            padding: '1rem',
                            border: '2px solid ' + (selectedBank === bank.id ? 'var(--brand)' : 'var(--border)'),
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            textAlign: 'center',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            backgroundColor: selectedBank === bank.id ? '#eaf5f0' : 'white',
                            color: selectedBank === bank.id ? 'var(--brand)' : 'var(--text-primary)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <i className="fa-solid fa-building-columns" style={{ marginRight: '0.5rem', opacity: 0.8 }}></i>
                          {bank.code}
                        </div>
                      ))}
                    </div>

                    <div className="form-group">
                      <label htmlFor="checkout-bank-select" style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem', color: 'var(--text-primary)' }}>Or Select Other Bank</label>
                      <select
                        id="checkout-bank-select"
                        value={selectedBank}
                        onChange={(e) => setSelectedBank(e.target.value)}
                        disabled={paying}
                        style={{ width: '100%', padding: '0.65rem 0.85rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'white' }}
                      >
                        <option value="">-- Choose Bank --</option>
                        <option value="pnb">Punjab National Bank</option>
                        <option value="bob">Bank of Baroda</option>
                        <option value="canara">Canara Bank</option>
                        <option value="kotak">Kotak Mahindra Bank</option>
                        <option value="indusind">IndusInd Bank</option>
                      </select>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={paying}
                  style={{
                    padding: '0.85rem',
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    marginTop: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {paying ? (
                    <>
                      <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '3px', borderColor: 'white transparent white transparent' }}></div>
                      <span>Verifying details...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-lock"></i>
                      <span>Pay Securely ₹{booking.totalPrice?.toLocaleString('en-IN')}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column - Booking Summary Details */}
          <div>
            <div style={{
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'white',
              padding: '1.5rem',
              boxShadow: 'var(--shadow-sm)',
              position: 'sticky',
              top: '6.5rem'
            }}>
              <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                <img
                  src={imgSrc}
                  alt={listing.title}
                  style={{ width: '110px', height: '80px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                  onError={(e) => { e.target.src = DEFAULT_IMG; }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0 }}>{listing.title || 'Stay'}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      {listing.location}, {listing.country}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                    <i className="fa-solid fa-star" style={{ color: 'var(--brand)', fontSize: '0.75rem' }}></i>
                    <strong>{listing.review?.length > 0 ? (listing.review.reduce((acc, r) => acc + r.rating, 0) / listing.review.length).toFixed(1) : 'New'}</strong>
                    <span style={{ color: 'var(--text-muted)' }}>({listing.review?.length || 0} reviews)</span>
                  </div>
                </div>
              </div>

              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Price Details</h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>&#8377; {listing.price?.toLocaleString('en-IN')} x {nights} night{nights > 1 ? 's' : ''}</span>
                  <strong>&#8377; {basePrice.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cleaning fee (15%)</span>
                  <strong>&#8377; {cleaningFee.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Service fee (8%)</span>
                  <strong>&#8377; {serviceFee.toLocaleString('en-IN')}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.15rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
                <strong>Total (INR)</strong>
                <strong style={{ color: 'var(--brand)' }}>&#8377; {booking.totalPrice?.toLocaleString('en-IN')}</strong>
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <i className="fa-solid fa-calendar-days" style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}></i>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', display: 'block' }}>Dates</strong>
                    {formatDate(booking.startDate)} – {formatDate(booking.endDate)}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <i className="fa-solid fa-user-group" style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}></i>
                  <div>
                    <strong style={{ color: 'var(--text-primary)', display: 'block' }}>Guests</strong>
                    {booking.guests} guest{booking.guests > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
