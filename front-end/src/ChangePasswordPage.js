import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ChangePasswordPage.css";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    // Validation
    if (!pw1 || !pw2) {
      alert("Please enter your new password twice.");
      return;
    }
    if (pw1 !== pw2) {
      alert("Passwords do not match.");
      return;
    }
    if (pw1.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("http://localhost:4000/api/profile/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          newPassword: pw1,
          confirmPassword: pw2
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Your password has been updated successfully!");
        navigate("/settings");
      } else {
        alert(data.error || "Failed to update password. Please try again.");
      }
    } catch (err) {
      console.error("Error updating password:", err);
      alert("Failed to update password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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

        <button 
          className="change-save-btn" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Password"}
        </button>
      </div>
    </div>
  );
}