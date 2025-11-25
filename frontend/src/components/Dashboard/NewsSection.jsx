import { useState, useEffect } from 'react';
import VoteButtons from './VoteButtons';
import { newsService } from '../../services/newsService';
import { getCachedData, setCachedData, clearCachedData } from '../../services/dataCache';
import './SectionStyles.css';
import './NewsSection.css';

function NewsSection() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  
  const ITEMS_PER_PAGE = 2;

  useEffect(() => {
    fetchNews({ useCache: true });
  }, []);

  const fetchNews = async ({ useCache = false } = {}) => {
    try {
      setLoading(true);
      if (useCache) {
        const cached = getCachedData('dashboard_news');
        if (cached) {
          setNews(cached);
          setError(null);
          setLoading(false);
          return;
        }
      }

      const data = await newsService.getNews();
      const results = data?.results || data?.data?.results || [];
      setNews(results);
      setCachedData('dashboard_news', results);
      setError(null);
    } catch (err) {
      setError(err.message);
      if (!useCache) {
        clearCachedData('dashboard_news');
      }
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
          <button onClick={() => fetchNews({ useCache: false })} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  // Calculate pagination
  const totalPages = Math.ceil(news.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentNews = news.slice(startIndex, endIndex);

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <div className="dashboard-section-content">
      <h3 className="section-title">Market News</h3>
      <div className="section-content">
        {news.length === 0 ? (
          <div className="empty-state">No news available at the moment.</div>
        ) : (
          <>
            <div className="news-list">
              {currentNews.map((item, index) => {
                const originalIndex = startIndex + index;
                return (
                  <div key={item.id || originalIndex} className="news-item">
                    <div className="news-content">
                      <h4 className="news-title">{item.title}</h4>
                      {item.description && (
                        <p className="news-subheader">{item.description}</p>
                      )}
                      <div className="news-meta">
                        {item.formatted_published_date && (
                          <span className="news-published-date">
                            Published: {item.formatted_published_date}
                          </span>
                        )}
                        {!item.formatted_published_date && item.formatted_date && (
                          <span className="news-date">
                            {item.formatted_date}
                          </span>
                        )}
                        {item.kind && item.kind !== 'news' && (
                          <span className="news-kind">
                            {item.kind}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="news-footer">
                      <div className="news-footer-actions">
                        <VoteButtons contentType="news" contentId={item.id || `news_${originalIndex}`} />
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
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="pagination-controls">
                <button 
                  className="pagination-button"
                  onClick={handlePrevious}
                  disabled={currentPage === 0}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button 
                  className="pagination-button"
                  onClick={handleNext}
                  disabled={currentPage === totalPages - 1}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default NewsSection;

