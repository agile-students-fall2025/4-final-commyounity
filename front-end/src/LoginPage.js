import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './LoginPage.css';
import Header from "./Header";

const LoginPage = () => {
  const [username, setUsername] = useState('');     
  const [password, setPassword] = useState('');     
  const [checking, setChecking] = useState(true);   
  const [error, setError] = useState('');          
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('http://localhost:4000/api/auth/me', {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.ok) {
            navigate('/home');
            return;
          }
        }
      } catch (e) {
        console.warn('Session check failed:', e);
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:4000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Login failed');
      }
      navigate('/home');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="login-page">
        <Header title="Welcome back!" />
        <header className="login-header">
          <h1>CommYOUnity</h1>
          <p>Checking your session…</p>
        </header>
      </div>
    );
  }

  // -------- RETURN UPDATED BELOW --------
  return (
    <div className="login-page">
      <Header title="Welcome back!" />
      <header className="login-header">
        <h1>CommYOUnity</h1>
        <p>Connect Culture & Community</p>
      </header>

      <form className="login-form" onSubmit={handleSubmit}>
        {/* show any login error inside the card */}
        {error && <div className="login-error" role="alert">{error}</div>}

        <div className="form-group">
          <label htmlFor="username">Username or Email</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username or email"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
          />
        </div>

        <button type="submit" className="login-button" disabled={loading}>
          {loading ? 'Logging in…' : 'Login'}
        </button>

        {/* Divider inside the card */}
        <div className="login-divider">
          <span>or</span>
        </div>

        {/* Inline text link for Google OAuth inside the card */}
        <p className="oauth-inline">
          Continue with{' '}
          <a
            className="oauth-link"
            href="http://localhost:4000/auth/google"
            onClick={(e) => {
              // allow normal navigation; keep for SPA analytics if needed
            }}
          >
            <img
              className="oauth-icon"
              src="https://developers.google.com/identity/images/g-logo.png"
              alt=""
              aria-hidden="true"
            />
            Google
          </a>
        </p>
      </form>

      <div className="login-footer">
        <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
      </div>
    </div>
  );
};

export default LoginPage;