import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./FindFriendsPage.css";
import Logo from "./logo.svg";
import mockFriends from "./mockFriends";
import Header from "./Header";


const FindFriendsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [requestedUsernames, setRequestedUsernames] = useState(() => new Set());

  const lookup = useMemo(() => {
    return mockFriends.reduce((acc, friend) => {
      acc[friend.username.toLowerCase()] = friend;
      return acc;
    }, {});
  }, []);

  const trimmedTerm = searchTerm.trim().toLowerCase();
  const matchingFriend = trimmedTerm ? lookup[trimmedTerm] : null;

  const isAlreadySent = matchingFriend
    ? requestedUsernames.has(matchingFriend.username.toLowerCase())
    : false;

  const messageDetails = useMemo(() => {
    if (!trimmedTerm) {
      return {
        type: "neutral",
        text: "Search results will appear here as the feature evolves.",
      };
    }

    if (matchingFriend) {
      return {
        type: isAlreadySent ? "info" : "success",
        text: isAlreadySent
          ? `Invite already sent to ${matchingFriend.first_name}.`
          : `We found ${matchingFriend.first_name}! Send them an invite below.`,
      };
    }

    return {
      type: "error",
      text: `No profile found for “${searchTerm}”. Try another username.`,
    };
  }, [matchingFriend, searchTerm, trimmedTerm]);

  return (
    <><Header title="Find Friends" />
    <Link to="/friends" className="back-btn">
          ← Back
    </Link>
    <div className="FindFriendsPage">
      <p>
        <i>Search for new connections and send an invite once you find a match.</i>
      </p>

      <div className="findfriends-search">
        <input
          type="search"
          placeholder="Search by name or username"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
        <button
          type="button"
          disabled={!matchingFriend}
          onClick={() => {
            if (!matchingFriend) {
              return;
            }

            setRequestedUsernames((prev) => {
              const next = new Set(prev);
              next.add(matchingFriend.username.toLowerCase());
              return next;
            });
          }}
        >
          {matchingFriend
            ? isAlreadySent
              ? "Requested"
              : "Send Invite"
            : "Search"}
        </button>
      </div>

      <section className={`findfriends-demo-card ${messageDetails.type}`} aria-live="polite">
        <p>{messageDetails.text}</p>
      </section>
    </div>
    </>
  );
};

export default FindFriendsPage;
