import React, { useEffect, useState } from "react";
import "./BoardFeed.css";

const BoardFeed = ({ boardId, isOwner }) => {
  const storageKey = `board:${boardId}:feed`;
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      setPosts(Array.isArray(saved) ? saved : []);
    } catch {
      setPosts([]);
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(posts));
  }, [storageKey, posts]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    const newPost = {
      id: Date.now(),
      author: "You",
      avatar: `https://i.pravatar.cc/64?u=${Date.now()}`,
      message: trimmed,
      ts: new Date().toISOString(),
      likes: 0,
    };
    setPosts([newPost, ...posts]);
    setText("");
  };

  const like = (id) =>
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, likes: p.likes + 1 } : p))
    );

  const remove = (id) =>
    setPosts((prev) => prev.filter((p) => p.id !== id));

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