import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './LoginPage.css';
import logo from './logo.svg';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login:', { username, password });
    navigate('/home');
  };

  return (
    <div className="login-page">
      <header className="login-header">
        <img
          src={logo}
          alt="App Logo"
          className="login-logo"
        />
        <h1>CommYOUnity</h1>
        <p>Connect Culture & Community</p>
      </header>

      <form className="login-form" onSubmit={handleSubmit}>
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

        <button type="submit" className="login-button">
          Login
        </button>
      </form>

      <div className="login-footer">
        <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
      </div>
    </div>
  );
};

export default LoginPage;
