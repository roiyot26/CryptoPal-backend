import { useState, useEffect } from 'react';
import { voteService } from '../../services/voteService';
import './VoteButtons.css';

function VoteButtons({ contentType, contentId }) {
  const [voteType, setVoteType] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserVote();
  }, [contentType, contentId]);

  const fetchUserVote = async () => {
    try {
      const data = await voteService.getVoteState(contentType, contentId);
      setVoteType(data.userVote || null);
    } catch (error) {
      console.error('Error fetching vote state:', error);
    }
  };

  const handleVote = async (type) => {
    if (loading) return;

    const shouldRemove = voteType === type;

    setLoading(true);
    try {
      if (shouldRemove) {
        const data = await voteService.removeVote(contentType, contentId);
        setVoteType(data.userVote || null);
      } else {
        const data = await voteService.submitVote({
          contentType,
          contentId,
          voteType: type,
        });
        setVoteType(data.userVote ?? data.vote?.voteType ?? null);
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

