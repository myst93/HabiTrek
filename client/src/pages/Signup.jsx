import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, showFlash } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      showFlash('error', 'All fields are required.');
      return;
    }
    setSubmitting(true);
    try {
      await signup(username, email, password);
      // Success flash is already shown inside AuthContext.signup
      navigate('/listings');
    } catch (err) {
      showFlash('error', err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="form-page" id="signup-form">
      <h2>Sign Up</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            className="form-control"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="form-control"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="form-control"
            placeholder="Choose a strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-full"
          id="btn-signup"
          disabled={submitting}
        >
          {submitting ? 'Creating account…' : 'Sign Up'}
        </button>
      </form>
      <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--brand)', fontWeight: 600 }}>Log in</Link>
      </p>
    </div>
  );
}
