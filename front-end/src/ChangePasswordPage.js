import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./ChangePasswordPage.css";
import Footer from "./Footer";
import Header from "./Header";

export default function ChangePasswordPage() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password requirements check
  const requirements = useMemo(() => {
    return {
      minLength: newPassword.length >= 6,
      hasUppercase: /[A-Z]/.test(newPassword),
      hasLowercase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    };
  }, [newPassword]);

  // Calculate password strength
  const passwordStrength = useMemo(() => {
    const met = Object.values(requirements).filter(Boolean).length;
    if (met === 0) return { level: 0, label: "", color: "#e5e7eb" };
    if (met <= 2) return { level: 1, label: "Weak", color: "#ef4444" };
    if (met <= 3) return { level: 2, label: "Fair", color: "#f59e0b" };
    if (met <= 4) return { level: 3, label: "Good", color: "#22c55e" };
    return { level: 4, label: "Strong", color: "#16a34a" };
  }, [requirements]);

  // Check if passwords match
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleSave = async () => {
    // Validation
    if (!currentPassword) {
      alert("Please enter your current password.");
      return;
    }
    if (!newPassword || !confirmPassword) {
      alert("Please enter your new password twice.");
      return;
    }
    if (newPassword !== confirmPassword) {
      alert("New passwords do not match.");
      return;
    }
    if (!requirements.minLength) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:4000/api/profile/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `JWT ${token}`,
        },
        body: JSON.stringify({
          currentPassword: currentPassword,
          newPassword: newPassword
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
    <>
    <div className="ChangePasswordPage">
    <Header title="Change Password" />
      <div className="change-card">
        {/* Current Password */}
        <div className="change-field">
          <label className="change-label">Current Password</label>
          <div className="password-input-wrapper">
            <input
              className="change-input"
              type={showCurrentPassword ? "text" : "password"}
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            >
              {showCurrentPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="change-field">
          <label className="change-label">New Password</label>
          <div className="password-input-wrapper">
            <input
              className="change-input"
              type={showNewPassword ? "text" : "password"}
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? "🙈" : "👁️"}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {newPassword.length > 0 && (
            <div className="password-strength">
              <div className="strength-bars">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`strength-bar ${passwordStrength.level >= level ? 'active' : ''}`}
                    style={{
                      backgroundColor: passwordStrength.level >= level ? passwordStrength.color : '#e5e7eb'
                    }}
                  />
                ))}
              </div>
              <span className="strength-label" style={{ color: passwordStrength.color }}>
                {passwordStrength.label}
              </span>
            </div>
          )}

          {/* Password Requirements */}
          <div className="requirements-list">
            <div className={`requirement ${requirements.minLength ? 'met' : ''}`}>
              {requirements.minLength ? '✓' : '○'} At least 6 characters
            </div>
            <div className={`requirement ${requirements.hasUppercase ? 'met' : ''}`}>
              {requirements.hasUppercase ? '✓' : '○'} One uppercase letter
            </div>
            <div className={`requirement ${requirements.hasLowercase ? 'met' : ''}`}>
              {requirements.hasLowercase ? '✓' : '○'} One lowercase letter
            </div>
            <div className={`requirement ${requirements.hasNumber ? 'met' : ''}`}>
              {requirements.hasNumber ? '✓' : '○'} One number
            </div>
            <div className={`requirement ${requirements.hasSpecial ? 'met' : ''}`}>
              {requirements.hasSpecial ? '✓' : '○'} One special character (!@#$%^&*)
            </div>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="change-field">
          <label className="change-label">Confirm Password</label>
          <div className="password-input-wrapper">
            <input
              className={`change-input ${passwordsMatch ? 'input-success' : ''} ${passwordsMismatch ? 'input-error' : ''}`}
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? "🙈" : "👁️"}
            </button>
          </div>
          {passwordsMatch && (
            <span className="match-indicator success">✓ Passwords match</span>
          )}
          {passwordsMismatch && (
            <span className="match-indicator error">✗ Passwords do not match</span>
          )}
        </div>

        <button 
          className="change-save-btn" 
          onClick={handleSave}
          disabled={saving || !requirements.minLength || !passwordsMatch}
        >
          {saving ? "Saving..." : "Save Password"}
        </button>
      </div>
    </div>
    <Footer />
    </>
  );
}
