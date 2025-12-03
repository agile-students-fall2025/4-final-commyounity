import React, { useEffect, useState } from "react";
import "./BoardFeed.css";

const BoardFeed = ({ boardId, isOwner }) => {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const storageKey = `board:${boardId}:feed`;

  // Load cached feed immediately
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      if (Array.isArray(saved)) setPosts(saved);
    } catch {
      console.warn("Local feed cache corrupted, ignoring.");
    }
    const fetchFeed = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:4000/api/boards/${boardId}/feed`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setPosts(
          Array.isArray(data)
            ? data.map(p => ({ ...p, id: p._id }))
            : []
        );
      } catch (err) {
        console.error("Error loading board feed:", err);
        setError("Failed to load board feed.");
      } finally {
        setLoading(false);
      }
    };


    fetchFeed(); // Then fetch fresh feed
  }, [boardId, storageKey]);

  // Persist feed to localStorage on update
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(posts));
  }, [storageKey, posts]);

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    try {
      const res = await fetch(`http://localhost:4000/api/boards/${boardId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newPost = await res.json();

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
      await fetch(`http://localhost:4000/api/boards/${boardId}/feed/${id}/like`, {
        method: "POST",
        credentials: "include",
      });
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
      );
    } catch (err) {
      console.error("Failed to like post:", err);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      const res = await fetch(`http://localhost:4000/api/boards/${boardId}/feed/${id}`, {
        method: "DELETE",
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
          src="https://i.pravatar.cc/64?u=current"
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

export default BoardFeed;
