import React from "react";
import { Link } from "react-router-dom";
import "./EditProfilePage.css";

export default function EditProfilePage() {
  return (
    <div className="EditProfilePage">

      {/* Top bar: back button + title */}
      <header className="edit-header">
        <Link to="/profilepage" className="edit-back-button">
          ←
        </Link>

        <h1 className="edit-title">Edit Profile</h1>
      </header>

      {/* Profile Picture block */}
      <div className="edit-photo-section">
        <div className="edit-photo-placeholder">
          Profile Picture
        </div>
      </div>

      <form className="edit-form">
        {/* Username */}
        <div className="edit-field">
          <label className="edit-label">Username</label>
          <input
            className="edit-input"
            placeholder="Enter username"
            defaultValue="BillWilliams123"
          />
        </div>

        {/* Name */}
        <div className="edit-field">
          <label className="edit-label">Name</label>
          <input
            className="edit-input"
            placeholder="Display name"
            defaultValue="Bill Williams"
          />
        </div>

        {/* New Password */}
        <div className="edit-field">
          <label className="edit-label">New Password</label>
          <input
            className="edit-input"
            type="password"
            placeholder="Enter new password"
          />
        </div>

        {/* About Me */}
        <div className="edit-field">
          <label className="edit-label">About Me:</label>
          <div className="aboutme-wrapper">
            <textarea
              className="edit-textarea"
              placeholder="Tell people about yourself (max 500 characters)"
              defaultValue=""
              maxLength={500}
            />
            <div className="char-hint">• max 500 characters</div>
          </div>
        </div>

        {/* Background */}
        <div className="edit-field">
          <label className="edit-label">Background</label>
          <input
            className="edit-input"
            placeholder="Where you're from / what shaped you"
            defaultValue=""
          />
        </div>

        {/* Interest */}
        <div className="edit-field">
          <label className="edit-label">Interest</label>
          <input
            className="edit-input"
            placeholder="Your interests"
            defaultValue=""
          />
        </div>

        {/* Save button */}
        <div className="save-wrapper">
          <button
            type="button"
            className="save-button"
            onClick={() => {
              // For now we just console.log to prove interaction
              console.log("Save clicked (not wired to backend yet)");
              alert("Profile changes saved (mock)");
            }}
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
