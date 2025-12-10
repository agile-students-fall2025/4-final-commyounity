import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './LoginPage.css';
import Header from "./Header";
import API_BASE from "./utils/apiBase";

const LoginPage = () => {
  const [username, setUsername] = useState('');     
  const [password, setPassword] = useState('');     
  const [checking, setChecking] = useState(true);   // checking if already logged in
  const [error, setError] = useState('');          
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🔐 On mount: if we already have a JWT token, go straight to /home
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/home');
    } else {
      setChecking(false);
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // credentials: 'include', // not needed if you're using JWT in body, not cookies
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      // backend sends: { success: true, token, username, email, name, ... }
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login failed');
      }

      // 🔥 store JWT so Protected.js can use it
      localStorage.setItem('token', data.token);

      // (optional) store username etc if you want:
      // localStorage.setItem('username', data.username);

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

  return (
    <div className="login-page">
      <Header title="Welcome back!" />
      <header className="login-header">
        <h1>CommYOUnity</h1>
        <p>Connect Culture & Community</p>
      </header>

      <form className="login-form" onSubmit={handleSubmit}>
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

        <div className="login-divider">
          <span>or</span>
        </div>

        <p className="oauth-inline">
          Continue with{' '}
          <a
          className="oauth-link"
          href={`${API_BASE}/auth/google`}
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
