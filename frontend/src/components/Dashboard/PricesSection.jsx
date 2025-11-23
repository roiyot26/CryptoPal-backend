import { useState, useEffect } from 'react';
import VoteButtons from './VoteButtons';
import PriceChart from './PriceChart';
import { authService } from '../../utils/auth';
import './SectionStyles.css';
import './PricesSection.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function PricesSection({ userPreferences }) {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/prices`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }

      const data = await response.json();
      setPrices(data.data?.prices || []);
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching prices:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-section-content">
        <h3 className="section-title">Coin Prices</h3>
        <div className="loading-state">Loading prices...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-section-content">
        <h3 className="section-title">Coin Prices</h3>
        <div className="error-state">
          <p>Error loading prices</p>
          <button onClick={fetchPrices} className="retry-button">Retry</button>
        </div>
      </div>
    );
  }

  const formatPrice = (price) => {
    if (price >= 1) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${price.toFixed(6)}`;
  };

  const formatChange = (change) => {
    if (change === null || change === undefined) return 'N/A';
    const sign = change >= 0 ? '+' : '';
    const color = change >= 0 ? 'positive' : 'negative';
    return (
      <span className={`price-change ${color}`}>
        {sign}{change.toFixed(2)}%
      </span>
    );
  };

  return (
    <div className="dashboard-section-content">
      <h3 className="section-title">Coin Prices</h3>
      <div className="section-content">
        {prices.length === 0 ? (
          <div className="empty-state">No price data available.</div>
        ) : (
          <div className="prices-list">
            {prices.map((coin, index) => (
              <div key={coin.id || index} className="price-item">
                <div className="price-header">
                  <div>
                    <h4 className="coin-name">{coin.name}</h4>
                    <p className="coin-symbol">{coin.symbol}</p>
                  </div>
                  <div className="price-info">
                    <div className="price-value">{formatPrice(coin.price)}</div>
                    {formatChange(coin.change24h)}
                  </div>
                </div>
                <PriceChart coinId={coin.id} coinName={coin.name} />
                <div className="price-footer">
                  <VoteButtons contentType="price" contentId={coin.id || `price_${index}`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PricesSection;

