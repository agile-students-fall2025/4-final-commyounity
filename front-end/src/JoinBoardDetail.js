import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './JoinBoardDetail.css';
import Header from "./Header";
import Footer from "./Footer";

const JoinBoardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState('');

  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState('');
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('You must be logged in to view this board.');
          setLoading(false);
          return;
        }

        const res = await axios.get(
          `http://178.128.70.142/api/api/boards/${id}`,
          {
            signal: controller.signal,
            headers: {
              Authorization: `JWT ${token}`,
            },
          }
        );

        setBoard(res.data?.data || null);
      } catch (e) {
        if (axios.isCancel(e)) return;
        console.error('GET /api/boards/:id failed:', e);
        setError('Could not load board details.');
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [id]);

  const handleViewMembers = async () => {
    setMembersError('');
    setMembersLoading(true);
  
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMembersError('You must be logged in to view members.');
        setMembersLoading(false);
        return;
      }
  
      const res = await axios.get(
        `http://178.128.70.142/api/api/members/${id}`,   // ✅ note the /:boardId
        {
          headers: {
            Authorization: `JWT ${token}`,          // ✅ matches your backend passport JWT
          },
        }
      );
  
      const members = Array.isArray(res.data?.data) ? res.data.data : [];
  
      navigate(`/boards/${id}/members`, {
        state: {
          boardId: id,
          boardTitle: board?.title,
          members,
          fetchedAt: Date.now(),
        },
      });
    } catch (e) {
      console.error('GET /api/members/:boardId failed:', e);
      setMembersError('Could not load members. Please try again.');
    } finally {
      setMembersLoading(false);
    }
  };

  const handleJoin = async () => {
    if (joinLoading || joined || board?.isJoined) return;

    setJoinError('');
    setJoinLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setJoinError('You must be logged in to join this board.');
        alert('You must be logged in to join this board.');
        navigate('/login');
        return;
      }

      const res = await axios.post(
        `http://178.128.70.142/api/api/boards/${id}/join`,
        {}, 
        {
          headers: {
            Authorization: `JWT ${token}`,
          },
        }
      );

      setBoard((prev) =>
        prev
          ? {
              ...prev,
              isJoined: true,
              memberCount: Math.max(0, Number(prev.memberCount || 0) + 1),
            }
          : prev
      );

      setJoined(true);
      alert(res.data?.message || "You've joined this board!");
      navigate('/browseboards');
    } catch (e) {
      console.error('POST /api/boards/:id/join failed:', e);
      setJoinError('Failed to join the board. Please try again.');
      alert('Failed to join the board. Please try again.');
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header title="Loading board..." />
        <div className="JoinBoardDetail">
          <p>Loading…</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !board) {
    return (
      <>
        <Header title="Board details" />
        <div className="JoinBoardDetail">
          <p className="error">{error || 'Board not found.'}</p>
        </div>
        <Footer />
      </>
    );
  }

  const description = board.descriptionLong;

  return (
    <>
      <Header title={board.title} />
      <div className="JoinBoardDetail">
        <section className="main-content">
          <article className="board" key={board.id || board._id}>
            <img
              alt={board.title}
              src={board.coverPhotoURL}
              className="board-image"
            />
            <div className="details">
              <p className="description">{description}</p>
              <p>
                <strong>Members:</strong> {board.memberCount}
              </p>
              {membersError && (
                <p className="error">{membersError}</p>
              )}
              {joinError && (
                <p className="error">{joinError}</p>
              )}
              <div className="buttons">
                <button
                  className="members-button"
                  onClick={handleViewMembers}
                  disabled={membersLoading}
                  aria-busy={membersLoading ? 'true' : 'false'}
                >
                  {membersLoading ? 'Loading members…' : 'View Members'}
                </button>

                <button
                  className="join-button"
                  onClick={handleJoin}
                  disabled={joinLoading || joined || board.isJoined}
                  aria-busy={joinLoading ? 'true' : 'false'}
                >
                  {joined || board.isJoined
                    ? 'Joined'
                    : joinLoading
                    ? 'Joining…'
                    : 'Join Board'}
                </button>
              </div>
            </div>
          </article>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default JoinBoardDetail;