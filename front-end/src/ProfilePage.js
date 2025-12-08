import React, { useState, useEffect } from "react";
import "./ProfilePage.css";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [authError, setAuthError] = useState(false); // New: distinguish auth errors from other errors

  // Fetch user profile data when component mounts or when navigating back
  useEffect(() => {
    fetchProfile();
  }, []); // Empty dependency means it runs on mount
  
  // Also refresh when the page becomes visible again
  useEffect(() => {
    const handleFocus = () => {
      fetchProfile();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // If no token exists, set auth error directly
      if (!token) {
        setAuthError(true);
        setError("You need to log in first to view your profile.");
        setLoading(false);
        return;
      }
      
      const response = await fetch("http://localhost:4000/api/profile", {
        method: "GET",
        headers: {
          "Authorization": `JWT ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setAuthError(false);
      } else if (response.status === 401 || response.status === 403) {
        // 401 Unauthorized or 403 Forbidden - authentication issue
        setAuthError(true);
        setError("You need to log in first to view your profile.");
        // Optional: clear invalid token
        localStorage.removeItem('token');
      } else {
        setError("Failed to load profile");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:4000/logout", {
        method: "GET",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      localStorage.removeItem('token');
      navigate("/"); 
    }
  };

  const handleDeleteProfile = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your profile?\n\nThis action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch("http://localhost:4000/api/profile", {
        method: "DELETE",
        headers: {
          "Authorization": `JWT ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        alert("Profile deleted successfully. You will now be logged out.");
        localStorage.removeItem('token');
        navigate("/");
      } else {
        alert(data.error || "Failed to delete profile. Please try again.");
      }
    } catch (err) {
      console.error("Error deleting profile:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  // Show loading state
  if (loading) {
    return (
      <>
        <Header title="Your Profile" />
        <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
        <Footer />
      </>
    );
  }

  // Auth error - show friendly message with login link
  if (authError) {
    return (
      <>
        <Header title="Your Profile" />
        <div className="ProfilePage">
          <div className="auth-error-container">
            <h2>🔒 Login Required</h2>
            <p>{error}</p>
            <Link to="/login" className="login-link-btn">
              Go to Login
            </Link>
            <p className="signup-hint">
              Don't have an account? <Link to="/signup">Sign up here</Link>
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Show other error state
  if (error) {
    return (
      <>
        <Header title="Your Profile" />
        <div style={{ textAlign: 'center', padding: '50px', color: 'red' }}>
          {error}
        </div>
        <Footer />
      </>
    );
  }

  const randomImage = profile?.profilePhoto || `https://picsum.photos/160/120?random=${Math.floor(Math.random() * 1000)}`;

  // Helper function to safely display name
  const getDisplayName = (name) => {
    if (!name) return "User Name";
    if (typeof name === 'string') return name;
    if (typeof name === 'object') {
      // Handle Google OAuth name object
      return `${name.givenName || ''} ${name.familyName || ''}`.trim() || "User Name";
    }
    return "User Name";
  };

  const displayName = getDisplayName(profile?.name);

  return (
    <>
      <Header title="Your Profile" />
      <div className="ProfilePage">
        {/* User top card: name/handle + profile picture area */}
        <section className="profile-top-card">
          {/* User info block on the left */}
          <div className="user-basic">
            <div className="user-name">{displayName}</div>
            <div className="user-handle">@{profile?.username || "username"}</div>
          </div>

          {/* Profile picture and "Edit Profile" button on the right */}
          <div className="user-photo-block">
            <img
              src={randomImage}
              alt="Profile"
              className="photo-placeholder"
            />
            <button
              className="edit-profile-btn"
              onClick={() => navigate("/edit-profile")}
            >
              Edit Profile
            </button>
          </div>
        </section>

        {/* About Me section */}
        <section className="profile-section">
          <div className="section-label">About Me:</div>
          <div className="section-box multiline-box">
            {profile?.aboutMe || "No information provided"}
          </div>
        </section>

        {/* Background section */}
        <section className="profile-section">
          <div className="section-label">Background</div>
          <input
            className="section-input"
            value={profile?.background || ""}
            readOnly
          />
        </section>

        {/* Interests section */}
        <section className="profile-section">
          <div className="section-label">Interests</div>
          <input
            className="section-input"
            value={profile?.interests || ""}
            readOnly
          />
        </section>

        {/* Buttons */}
        <section className="profile-action-area">
          <button
            className="wide-button settings-btn"
            onClick={() => navigate("/settings")}
          >
            Settings
          </button>

          <button
            className="wide-button delete-btn"
            onClick={handleDeleteProfile}
          >
            Delete Profile
          </button>
        </section>
      </div>
      <Footer />
    </>
  );
}