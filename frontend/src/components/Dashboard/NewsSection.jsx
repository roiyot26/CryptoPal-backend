import { useState, useEffect } from 'react';
import VoteButtons from './VoteButtons';
import { authService } from '../../utils/auth';
import './SectionStyles.css';
import './NewsSection.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function NewsSection() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/news`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }

      const data = await response.json();
      setNews(data.data?.results || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-section-content">
        <h3 className="section-title">Market News</h3>
        <div className="loading-state">Loading news...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-section-content">
        <h3 className="section-title">Market News</h3>
        <div className="error-state">
          <p>Error loading news</p>
          <button onClick={fetchNews} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-section-content">
      <h3 className="section-title">Market News</h3>
      <div className="section-content">
        {news.length === 0 ? (
          <div className="empty-state">No news available at the moment.</div>
        ) : (
          <div className="news-list">
            {news.map((item, index) => (
              <div key={item.id || index} className="news-item">
                <div className="news-content">
                  <h4 className="news-title">{item.title}</h4>
                  <div className="news-meta">
                    {item.formatted_date && (
                      <span className="news-date">
                        {item.formatted_date}
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="news-description">{item.description}</p>
                  )}
                </div>
                <div className="news-footer">
                  <div className="news-footer-actions">
                    <VoteButtons contentType="news" contentId={item.id || `news_${index}`} />
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(item.title)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="news-more-button"
                    >
                      More
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NewsSection;

