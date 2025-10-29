import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ChangePasswordPage.css";

export default function ChangePasswordPage() {
  const navigate = useNavigate();

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");

  function handleSave() {
    if (!pw1 || !pw2) {
      alert("Please enter your new password twice.");
      return;
    }
    if (pw1 !== pw2) {
      alert("Passwords do not match.");
      return;
    }

    // In the future:
    // - call backend API to update password
    // - handle auth / re-login if needed
    console.log("Password updated (mock). New password:", pw1);
    alert("Your password has been updated (placeholder).");
    navigate("/settings"); // go back to settings after success
  }

  return (
    <div className="ChangePasswordPage">

      {/* header with back button + title */}
      <header className="change-header">
        <button
          className="change-back"
          onClick={() => navigate("/settings")}
        >
          ←
        </button>

        <h1 className="change-title">Change Password</h1>
      </header>

      <div className="change-card">
        {/* New Password */}
        <div className="change-field">
          <label className="change-label">New Password</label>
          <input
            className="change-input"
            type="password"
            placeholder="Enter new password"
            value={pw1}
            onChange={(e) => setPw1(e.target.value)}
          />
        </div>

        {/* Confirm Password */}
        <div className="change-field">
          <label className="change-label">Confirm Password</label>
          <input
            className="change-input"
            type="password"
            placeholder="Re-enter new password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
          />
        </div>

        <button className="change-save-btn" onClick={handleSave}>
          Save Password
        </button>
      </div>
    </div>
  );
}
