import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, showFlash } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      showFlash('error', 'All fields are required.');
      return;
    }
    setSubmitting(true);
    try {
      await login(username, password);
      // Success flash is already shown inside AuthContext.login
      navigate('/listings');
    } catch (err) {
      showFlash('error', err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="form-page" id="login-form">
      <h2>Log In</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            className="form-control"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="form-control"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="btn btn-primary btn-full"
          id="btn-login"
          disabled={submitting}
        >
          {submitting ? 'Logging in…' : 'Log In'}
        </button>
      </form>
      <p style={{ marginTop: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        New to WanderLust? <Link to="/signup" style={{ color: 'var(--brand)', fontWeight: 600 }}>Create an account</Link>
      </p>
    </div>
  );
}
