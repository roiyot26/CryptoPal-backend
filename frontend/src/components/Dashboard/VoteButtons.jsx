import { useState, useEffect } from 'react';
import { authService, API_BASE_URL } from '../../utils/auth';
import './VoteButtons.css';

function VoteButtons({ contentType, contentId }) {
  const [voteType, setVoteType] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserVote();
  }, [contentType, contentId]);

  const fetchUserVote = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch(
        `${API_BASE_URL}/votes/${contentType}/${contentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setVoteType(data.userVote || null);
      }
    } catch (error) {
      console.error('Error fetching vote state:', error);
    }
  };

  const handleVote = async (type) => {
    if (loading) return;

    const shouldRemove = voteType === type;

    setLoading(true);
    try {
      const token = authService.getToken();

      if (shouldRemove) {
        const response = await fetch(
          `${API_BASE_URL}/votes/${contentType}/${contentId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setVoteType(data.userVote || null);
        }
      } else {
        const response = await fetch(`${API_BASE_URL}/votes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            contentType,
            contentId,
            voteType: type,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setVoteType(data.userVote ?? data.vote?.voteType ?? null);
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="vote-buttons">
      <button
        className={`vote-button vote-up ${voteType === 'up' ? 'active' : ''}`}
        onClick={() => handleVote('up')}
        disabled={loading}
        aria-label="Thumbs up"
      >
        <span className="vote-icon">👍</span>
      </button>
      <button
        className={`vote-button vote-down ${voteType === 'down' ? 'active' : ''}`}
        onClick={() => handleVote('down')}
        disabled={loading}
        aria-label="Thumbs down"
      >
        <span className="vote-icon">👎</span>
      </button>
    </div>
  );
}

export default VoteButtons;

