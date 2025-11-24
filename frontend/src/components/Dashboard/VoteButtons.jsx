import { useState, useEffect } from 'react';
import { authService } from '../../utils/auth';
import './VoteButtons.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function VoteButtons({ contentType, contentId }) {
  const [voteType, setVoteType] = useState(null);
  const [counts, setCounts] = useState({ upvotes: 0, downvotes: 0 });
  const [voters, setVoters] = useState({ up: [], down: [] });
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
        setVoters(data.voters || { up: [], down: [] });
      }
    } catch (error) {
      console.error('Error fetching vote counts:', error);
    }
  };

  const handleVote = async (type) => {
    if (loading) return;

    // If clicking the same button that's already active, remove the vote
    const shouldRemove = voteType === type;

    setLoading(true);
    try {
      const token = authService.getToken();
      
      if (shouldRemove) {
        // Delete the vote
        const response = await fetch(`${API_BASE_URL}/votes/${contentType}/${contentId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setVoteType(data.userVote || null);
          setCounts(data.counts || { upvotes: 0, downvotes: 0 });
          setVoters(data.voters || { up: [], down: [] });
        }
      } else {
        // Create or update vote
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
          setVoteType(data.userVote ?? data.vote?.voteType ?? null);
          setCounts(data.counts || { upvotes: 0, downvotes: 0 });
          setVoters(data.voters || { up: [], down: [] });
        }
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTooltip = (type) => {
    const list = type === 'up' ? voters.up : voters.down;
    if (!list || list.length === 0) {
      return type === 'up' ? 'Be the first to like this' : 'Be the first to dislike this';
    }
    if (list.length === 1) {
      return list[0];
    }
    if (list.length === 2) {
      return `${list[0]}, ${list[1]}`;
    }
    return `${list[0]}, ${list[1]} and ${list.length - 2} more...`;
  };

  return (
    <div className="vote-buttons">
      <button
        className={`vote-button vote-up ${voteType === 'up' ? 'active' : ''}`}
        onClick={() => handleVote('up')}
        disabled={loading}
        title={`Liked by ${formatTooltip('up')}`}
      >
        <span className="vote-icon">👍</span>
        <span className="vote-count">{counts.upvotes}</span>
      </button>
      <button
        className={`vote-button vote-down ${voteType === 'down' ? 'active' : ''}`}
        onClick={() => handleVote('down')}
        disabled={loading}
        title={`Disliked by ${formatTooltip('down')}`}
      >
        <span className="vote-icon">👎</span>
        <span className="vote-count">{counts.downvotes}</span>
      </button>
    </div>
  );
}

export default VoteButtons;

