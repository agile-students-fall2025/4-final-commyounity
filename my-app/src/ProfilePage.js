import React from "react";
import "./ProfilePage.css";
import { Link } from "react-router-dom";
import logo from "./logo.svg";


export default function ProfilePage() {
  // This component is the Profile Page feature.
  // It matches the wireframe:
  // - Back button + logo + "Login"
  // - User info (name, handle, profile picture + Edit Profile button)
  // - About Me / Background / Interests fields
  // - Settings + Delete Profile buttons

  return (
    <div className="ProfilePage">

      {/* ===== Top bar: back button + logo + "Login" ===== */}
      <header className="profile-header-bar">
        {/* The back button. Right now it just links to /viewboards as a placeholder. */}
        <Link to="/viewboards" className="back-button">
          ←
        </Link>

        <div className="header-right">
          {/* App logo from public/logo192.png */}
          <img
            src={logo}
            alt="App Logo"
            className="app-logo"
          />
          <div className="header-text">Login</div>
        </div>
      </header>

      {/* ===== User top card: name/handle + profile picture area ===== */}
      <section className="profile-top-card">
        {/* User info block on the left */}
        <div className="user-basic">
          <div className="user-name">Bill Williams</div>
          <div className="user-handle">@username</div>
        </div>

        {/* Profile picture and "Edit Profile" button on the right */}
        <div className="user-photo-block">
          <div className="photo-placeholder">
            Profile Picture
          </div>

          <Link to="/edit-profile" className="edit-profile-btn">
            Edit Profile
          </Link>
        </div>
      </section>

      {/* ===== About Me section ===== */}
      <section className="profile-section">
        <div className="section-label">About Me:</div>
        <div className="section-box multiline-box">
          Hi! I'm Bill from Hong Kong. I love connecting with people who
          enjoy exploring different cuisines and cultures!
        </div>
      </section>

      {/* ===== Background section ===== */}
      <section className="profile-section">
        <div className="section-label">Background</div>
        <input
          className="section-input"
          defaultValue="Grew up in USA, born in Hong Kong"
          // Future: make this controlled so user can edit and save.
        />
      </section>

      {/* ===== Interests section ===== */}
      <section className="profile-section">
        <div className="section-label">Interests</div>
        <input
          className="section-input"
          defaultValue="Hiking, Skiing, Reading"
        />
      </section>

      {/* ===== Account actions ===== */}
      <section className="profile-action-area">
        <button className="wide-button settings-btn">
          Settings
        </button>

        <button className="wide-button delete-btn">
          Delete Profile
        </button>
      </section>

    </div>
  );
}
