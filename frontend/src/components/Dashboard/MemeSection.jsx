import { useState, useEffect } from 'react';
import VoteButtons from './VoteButtons';
import { memeService } from '../../services/memeService';
import './SectionStyles.css';

function MemeSection() {
  const [meme, setMeme] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMeme = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await memeService.getMemes();
      setKeyword(data?.keyword || '');
      const memeResult = data?.results?.[0] || null;
      setMeme(memeResult);
    } catch (err) {
      setError(err.message || 'Unable to load memes');
      setMeme(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeme();
  }, []);

  const renderContent = () => {
    if (loading) {
      return <div className="loading-state">Loading meme...</div>;
    }

    if (error) {
      return (
        <div className="error-state">
          <p>{error}</p>
          <button type="button" className="retry-button" onClick={fetchMeme}>
            Try Again
          </button>
        </div>
      );
    }

    if (!meme) {
      return (
        <div className="meme-placeholder">
          <div className="placeholder-icon">🐸</div>
          <p className="placeholder-text">No memes available right now</p>
          <p className="placeholder-subtext">
            Check back later for fresh jokes about {keyword || 'crypto'}.
          </p>
        </div>
      );
    }

    return (
      <div className="meme-card">
        <div className="meme-image-wrapper">
          <img src={meme.image} alt={meme.title} className="meme-image" loading="lazy" />
        </div>
        <div className="meme-meta">
          <h4 className="meme-title">{meme.title}</h4>
          {keyword && <span className="meme-keyword">Keyword: {keyword}</span>}
          {meme.description && <p className="meme-description">{meme.description}</p>}
          {meme.url && (
            <a
              href={meme.url}
              target="_blank"
              rel="noopener noreferrer"
              className="meme-link"
            >
              View Source
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-section-content meme-section">
      <h3 className="section-title">Fun Crypto Meme</h3>
      <div className="section-content meme-content">
        {renderContent()}
      </div>
      <div className="section-footer">
        <VoteButtons
          contentType="meme"
          contentId={meme?.id ? encodeURIComponent(meme.id) : 'meme_placeholder'}
        />
      </div>
    </div>
  );
}

export default MemeSection;

