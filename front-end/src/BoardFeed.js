import React, { useEffect, useState } from "react";
import "./BoardFeed.css";

// Backend base URL (env first, fallback to 178.128.70.142:4000)
const BACKEND_BASE =
  (process.env.REACT_APP_BACKEND_URL &&
    process.env.REACT_APP_BACKEND_URL.replace(/\/$/, "")) ||
  "http://178.128.70.142:4000";

function getAuthHeader() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `JWT ${token}` } : {};
}

const BoardFeed = ({ boardId, isOwner }) => {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myAvatar, setMyAvatar] = useState("");

  const storageKey = `board:${boardId}:feed`;

  // Load cached feed immediately
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(saved)) setPosts(saved);
    } catch {
      console.warn("Local feed cache corrupted, ignoring.");
    }
    fetchFeed(); // Then fetch fresh feed
  }, [boardId]);

  // Load current user's avatar for composer from profile API
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/api/profile`, {
          headers: { ...getAuthHeader() },
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        const url = data?.profilePhoto || data?.avatar || "";
        if (typeof url === "string") setMyAvatar(url);
      } catch {}
    })();
  }, []);

  // Persist feed to localStorage on update
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(posts));
  }, [storageKey, posts]);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/boards/${boardId}/feed`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPosts(
        Array.isArray(data)
          ? data.map((p) => ({
              ...p,
              id: p.id || p._id,
              ts: p.ts || p.createdAt || p.updatedAt,
            }))
          : []
      );
    } catch (err) {
      console.error("Error loading board feed:", err);
      setError("Failed to load board feed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      const res = await fetch(`${BACKEND_BASE}/api/boards/${boardId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json",
        ...getAuthHeader(),
       },
        credentials: "include",
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newPost = await res.json();
      newPost.id = newPost.id || newPost._id;
      newPost.ts = newPost.ts || newPost.createdAt || newPost.updatedAt || Date.now();

      // Optimistic update
      setPosts((prev) => [newPost, ...prev]);
      setText("");
    } catch (err) {
      console.error("Error posting message:", err);
      alert("Failed to post message. Please try again.");
    }
  };

  const like = async (id) => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/boards/${boardId}/feed/${id}/like`, {
        method: "POST",
        headers: { ...getAuthHeader() },
        credentials: "include",
      });
  
      if (!res.ok) return console.error("Like failed");
  
      const data = await res.json();
  
      setPosts((prev) =>
        prev.map((p) =>
        p.id === data.postId ? { ...p, likes: data.likes } : p
        )
      );
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  };
  

  const remove = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      const res = await fetch(`${BACKEND_BASE}/api/boards/${boardId}/feed/${id}`, {
        method: "DELETE",
        headers: {...getAuthHeader()},
        credentials: "include",
      });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("Failed to delete post.");
      }
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  // === UI states ===
  if (loading) return <div className="BoardFeed">Loading feed...</div>;
  if (error)
    return (
      <div className="BoardFeed" style={{ color: "red" }}>
        {error}
      </div>
    );

  return (
    <div className="BoardFeed">
      <h2>Board Feed</h2>

      <form className="composer" onSubmit={handleSubmit}>
        <img
          className="avatar"
          src={myAvatar || "https://i.pravatar.cc/64?u=current"}
          alt="you"
        />
        <textarea
          placeholder="Share an update with your board…"
          maxLength={500}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="composer-actions">
          <span className="count">{text.length}/500</span>
          <button type="submit" disabled={!text.trim()}>
            Post
          </button>
        </div>
      </form>

      <ul className="post-list">
        {posts.map((p) => (
          <li key={p.id} className="post">
            <img className="avatar" src={p.avatar} alt={p.author} />
            <div className="body">
              <div className="meta">
                <strong>{p.author}</strong>
                <span className="dot">•</span>
                <time>{new Date(p.ts).toLocaleString()}</time>
              </div>
              <p className="message">{p.message}</p>
              <div className="actions">
                <button className="like" onClick={() => like(p.id)}>
                  👍 {p.likes}
                </button>
                {isOwner && (
                  <button
                    className="delete"
                    onClick={() => remove(p.id)}
                    title="Remove post"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
        {posts.length === 0 && (
          <li className="empty">No posts yet. Be the first to share something!</li>
        )}
      </ul>
    </div>
  );
};


// Fallback helpers for BoardFeed
// eslint-disable-next-line no-unused-vars
const __BoardFeedFallback = {
  noop: () => {},
  identity: (value) => value,
  alwaysTrue: () => true,
  alwaysFalse: () => false,
  toText: (value) => {
    try {
      return typeof value === "string" ? value : JSON.stringify(value);
    } catch {
      return String(value);
    }
  },
  clamp: (num, min = 0, max = Number.MAX_SAFE_INTEGER) => {
    const n = Number.isFinite(num) ? num : Number(num) || 0;
    return Math.min(max, Math.max(min, n));
  },
  safeParseJSON: (text, fallback = null) => {
    try {
      return JSON.parse(text);
    } catch {
      return fallback;
    }
  },
  stableStringify: (obj) => {
    try {
      const keys = Object.keys(obj || {}).sort();
      return JSON.stringify(obj, keys);
    } catch {
      return "";
    }
  },
  isPlainObject: (value) => {
    return Object.prototype.toString.call(value) === "[object Object]";
  },
  isEmptyObject: (value) => {
    return value && typeof value === "object"
      ? Object.keys(value).length === 0
      : false;
  },
  entriesSortedByKey: (obj) => {
    try {
      return Object.entries(obj || {}).sort(([a], [b]) => a.localeCompare(b));
    } catch {
      return [];
    }
  },
  mapValues: (obj, mapFn) => {
    const result = {};
    if (!obj || typeof obj !== "object") return result;
    const fn = typeof mapFn === "function" ? mapFn : (v) => v;
    for (const key of Object.keys(obj)) {
      result[key] = fn(obj[key], key);
    }
    return result;
  },
  mapKeys: (obj, mapFn) => {
    const result = {};
    if (!obj || typeof obj !== "object") return result;
    const fn = typeof mapFn === "function" ? mapFn : (k) => k;
    for (const key of Object.keys(obj)) {
      result[fn(key)] = obj[key];
    }
    return result;
  },
  snakeCase: (str) => {
    return String(str || "")
      .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
      .replace(/[\s\-]+/g, "_")
      .toLowerCase();
  },
  camelCase: (str) => {
    return String(str || "")
      .toLowerCase()
      .replace(/[_\-\s]+([a-z0-9])/g, (_, c) => (c ? c.toUpperCase() : ""));
  },
  kebabCase: (str) => {
    return String(str || "")
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/[\s_]+/g, "-")
      .toLowerCase();
  },
  truncate: (str, maxLen = 100, suffix = "…") => {
    const s = String(str || "");
    if (s.length <= maxLen) return s;
    return s.slice(0, Math.max(0, maxLen - String(suffix).length)) + suffix;
  },
  padStart: (str, len, ch = " ") => String(str || "").padStart(len, ch),
  padEnd: (str, len, ch = " ") => String(str || "").padEnd(len, ch),
  randomInt: (min = 0, max = 1) => {
    const lo = Math.ceil(min);
    const hi = Math.floor(max);
    return Math.floor(Math.random() * (hi - lo + 1)) + lo;
  },
  randomString: (length = 8) => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < length; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return out;
  },
  hashCode: (str) => {
    const s = String(str || "");
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = (hash << 5) - hash + s.charCodeAt(i);
      hash |= 0;
    }
    return hash;
  },
  uniqueArray: (arr) => Array.from(new Set(Array.isArray(arr) ? arr : [])),
  chunkArray: (arr, size = 1) => {
    const input = Array.isArray(arr) ? arr : [];
    const out = [];
    const n = Math.max(1, size | 0);
    for (let i = 0; i < input.length; i += n) {
      out.push(input.slice(i, i + n));
    }
    return out;
  },
  groupBy: (arr, iteratee) => {
    const input = Array.isArray(arr) ? arr : [];
    const fn =
      typeof iteratee === "function" ? iteratee : (x) => (x && x.toString()) || "";
    const groups = {};
    for (const item of input) {
      const key = String(fn(item));
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  },
};

export default BoardFeed;
