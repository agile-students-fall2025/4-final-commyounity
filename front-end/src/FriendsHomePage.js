import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./FriendsHomePage.css";
import Header from "./Header";
import Footer from "./Footer";
import { fetchWithAuth, getStoredToken } from "./utils/authFetch";

const BACKEND_BASE =
  (process.env.REACT_APP_BACKEND_URL &&
    process.env.REACT_APP_BACKEND_URL.replace(/\/$/, "")) ||
  "http://178.128.70.142/api";
const FRIENDS_ENDPOINT = `${BACKEND_BASE}/api/friends`;
const FRIEND_REQUESTS_ENDPOINT = `${BACKEND_BASE}/api/friend-requests`;

const FriendsHomePage = () => {
  const [activeTab, setActiveTab] = useState("friends");
  const [friendsCount, setFriendsCount] = useState(0);
  const [requestsCount, setRequestsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        const token = getStoredToken();
        if (!token) {
          throw Object.assign(new Error("Authentication required"), {
            code: "AUTH_REQUIRED",
          });
        }

        const [friendsRes, requestsRes] = await Promise.all([
          fetchWithAuth(FRIENDS_ENDPOINT),
          fetchWithAuth(FRIEND_REQUESTS_ENDPOINT),
        ]);

        if (isMounted) {
          if (friendsRes.ok) {
            const friendsData = await friendsRes.json();
            setFriendsCount(friendsData?.meta?.total || friendsData?.data?.length || 0);
          }

          if (requestsRes.ok) {
            const requestsData = await requestsRes.json();
            setRequestsCount(requestsData?.meta?.count || requestsData?.data?.length || 0);
          }
        }
      } catch (error) {
        console.warn("Unable to load friends stats:", error);
        if (isMounted) {
          setAuthError(
            error?.code === "AUTH_REQUIRED" || error?.code === "AUTH_FORBIDDEN"
              ? "Please sign in to view your friends and requests."
              : "Unable to load friends data right now."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  const renderContent = () => {
    if (loading) {
      return <p>Loading your friends information...</p>;
    }

    if (authError) {
      return <p className="error">{authError}</p>;
    }

    switch (activeTab) {
      case "friends":
        return (
          <p>
            You have <strong>{friendsCount}</strong> friend{friendsCount !== 1 ? "s" : ""} in your network.
          </p>
        );
      case "requests":
        return (
          <p>
            You have <strong>{requestsCount}</strong> pending friend request{requestsCount !== 1 ? "s" : ""}.
          </p>
        );
      case "find":
        return <p>Discover new friends and expand your commYOUnity.</p>;
      default:
        return null;
    }
  };

  return (
    <>
    <Header title="Friends" />
    <div className="back-btn-row">
    </div>
    <div className="FriendsHomePage">

      <div className="friends-homepage">
        <h1>Welcome to the Friends Page</h1>
        <p>
          <i>Manage your friends, requests, and suggestions below.</i>
        </p>

        <div className="button-container">
          <button
            className={`friends-btn ${activeTab === "friends" ? "active" : ""}`}
            onMouseEnter={() => setActiveTab("friends")}
            onFocus={() => setActiveTab("friends")}
            onClick={() => navigate("/friends/list")}
          >
            View Friends
          </button>
          <button
            className={`friends-btn ${activeTab === "requests" ? "active" : ""}`}
            onMouseEnter={() => setActiveTab("requests")}
            onFocus={() => setActiveTab("requests")}
            onClick={() => navigate("/friends/requests")}
          >
            Friend Requests
          </button>
          <button
            className={`friends-btn ${activeTab === "find" ? "active" : ""}`}
            onMouseEnter={() => setActiveTab("find")}
            onFocus={() => setActiveTab("find")}
            onClick={() => navigate("/friends/find")}
          >
            Find Friends
          </button>
        </div>

        <div className="friends-content">{renderContent()}</div>
      </div>
    </div>
    <Footer backToHome />
    </>
  );
};

export default FriendsHomePage;
