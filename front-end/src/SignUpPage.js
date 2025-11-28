import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './SignUpPage.css';
import Header from "./Header";

const SignUpPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- Manual signup handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
  
    if (password !== confirmPassword) {
      setError("Passwords don't match!");
      return;
    }
  
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password, confirmPassword }),
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.ok) {
        setError(data.error || 'Signup failed.');
        setLoading(false);
        return;
      }
  
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
  
      // now Protected will see the token and allow /home
      navigate('/home');
    } catch (err) {
      console.error('Signup error:', err);
      setError('Unexpected error — please try again.');
    } finally {
      setLoading(false);
    }
  };
//goole auth disabled for now!!!
  // --- Google signup redirect ---
  const handleGoogleSignup = () => {
    window.location.href = 'http://localhost:4000/auth/google';
  };

  return (
    <div className="signup-page">
      <Header title="Create Your Account" />
      <header className="signup-header">
        <h1>CommYOUnity</h1>
        <p>Connect Culture & Community</p>
      </header>

      {/* Signup Form */}
      <form className="signup-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a username"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
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
            placeholder="Create a password"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter password"
            required
          />
        </div>

        {error && <p className="error-msg" role="alert">{error}</p>}

        <button type="submit" className="signup-button" disabled={loading}>
          {loading ? 'Signing up…' : 'Sign Up'}
        </button>

        {/* Divider */}
        <div className="login-divider">
          <span>or</span>
        </div>

        {/* Google Signup */}
        <div className="oauth-actions">
          <p className="google-signup-text" onClick={handleGoogleSignup}>
            Continue with Google
          </p>
        </div>
      </form>

      <div className="signup-footer">
        <p>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
};

export default SignUpPage;