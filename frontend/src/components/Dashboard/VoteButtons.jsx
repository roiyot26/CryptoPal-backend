import { useState, useEffect } from 'react';
import { authService } from '../../utils/auth';
import './VoteButtons.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function VoteButtons({ contentType, contentId }) {
  const [voteType, setVoteType] = useState(null);
  const [counts, setCounts] = useState({ upvotes: 0, downvotes: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchVoteCounts();
  }, [contentType, contentId]);

  const fetchVoteCounts = async () => {
    try {
      const token = authService.getToken();
      const response = await fetch(
        `${API_BASE_URL}/votes/${contentType}/${contentId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCounts(data.counts || { upvotes: 0, downvotes: 0 });
        setVoteType(data.userVote || null);
      }
    } catch (error) {
      console.error('Error fetching vote counts:', error);
    }
  };

  const handleVote = async (type) => {
    if (loading) return;

    setLoading(true);
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          contentType,
          contentId,
          voteType: type,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setVoteType(data.vote.voteType);
        setCounts(data.counts);
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
        title="Thumbs up"
      >
        <span className="vote-icon">👍</span>
        <span className="vote-count">{counts.upvotes}</span>
      </button>
      <button
        className={`vote-button vote-down ${voteType === 'down' ? 'active' : ''}`}
        onClick={() => handleVote('down')}
        disabled={loading}
        title="Thumbs down"
      >
        <span className="vote-icon">👎</span>
        <span className="vote-count">{counts.downvotes}</span>
      </button>
    </div>
  );
}

export default VoteButtons;

