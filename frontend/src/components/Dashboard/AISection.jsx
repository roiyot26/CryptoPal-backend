import { useState, useEffect } from 'react';
import VoteButtons from './VoteButtons';
import { aiService } from '../../services/aiService';
import './SectionStyles.css';
import './AISection.css';

function AISection() {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInsight();
  }, []);

  const fetchInsight = async () => {
    try {
      setLoading(true);
      const data = await aiService.getInsight();
      setInsight(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-section-content">
        <h3 className="section-title">AI Insight of the Day</h3>
        <div className="loading-state">Generating insight...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-section-content">
        <h3 className="section-title">AI Insight of the Day</h3>
        <div className="error-state">
          <p>Error loading insight</p>
          <button onClick={fetchInsight} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-section-content">
      <h3 className="section-title">AI Insight of the Day</h3>
      <div className="section-content">
        {insight ? (
          <div className="ai-insight">
            <div className="insight-content">
              <p>{insight.insight}</p>
            </div>
            {insight.date && (
              <div className="insight-meta">
                <span className="insight-date">{new Date(insight.date).toLocaleDateString()}</span>
                {insight.investorType && (
                  <span className="insight-type">For {insight.investorType}</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">No insight available.</div>
        )}
      </div>
      <div className="section-footer">
        <VoteButtons contentType="ai" contentId={insight?.date || 'daily_insight'} />
      </div>
    </div>
  );
}

export default AISection;

