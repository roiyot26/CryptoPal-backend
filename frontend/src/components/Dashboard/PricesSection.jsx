import { useState, useEffect } from 'react';
import VoteButtons from './VoteButtons';
import PriceChart from './PriceChart';
import { priceService } from '../../services/priceService';
import { getCachedData, setCachedData, clearCachedData } from '../../services/dataCache';
import './SectionStyles.css';
import './PricesSection.css';

function PricesSection({ userPreferences }) {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [percentageChanges, setPercentageChanges] = useState({}); // Track percentage changes per coin
  const [currentPage, setCurrentPage] = useState(0);
  
  const ITEMS_PER_PAGE = 2;

  useEffect(() => {
    fetchPrices({ useCache: true });
  }, []);

  const fetchPrices = async ({ useCache = false } = {}) => {
    try {
      setLoading(true);
      if (useCache) {
        const cached = getCachedData('dashboard_prices');
        if (cached) {
          setPrices(cached);
          setError(null);
          setLoading(false);
          return;
        }
      }

      const data = await priceService.getPrices();
      const priceList = data?.prices || [];
      setPrices(priceList);
      setCachedData('dashboard_prices', priceList);
      setError(null);
    } catch (err) {
      setError(err.message);
      if (!useCache) {
        clearCachedData('dashboard_prices');
      }
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
          <button onClick={() => fetchPrices({ useCache: false })} className="retry-button">Retry</button>
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

  // Calculate pagination
  const totalPages = Math.ceil(prices.length / ITEMS_PER_PAGE);
  const startIndex = currentPage * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentPrices = prices.slice(startIndex, endIndex);

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages - 1, prev + 1));
  };

  return (
    <div className="dashboard-section-content">
      <h3 className="section-title">Coin Prices</h3>
      <div className="section-content">
        {prices.length === 0 ? (
          <div className="empty-state">No price data available.</div>
        ) : (
          <>
            <div className="prices-list">
              {currentPrices.map((coin, index) => {
                const originalIndex = startIndex + index;
                return (
                  <div key={coin.id || originalIndex} className="price-item">
                    <div className="price-header">
                      <div>
                        <h4 className="coin-name">{coin.name}</h4>
                      </div>
                      <div className="price-info">
                        <div className="price-value">{formatPrice(coin.price)}</div>
                        {formatChange(percentageChanges[coin.id] !== undefined ? percentageChanges[coin.id] : coin.change24h)}
                      </div>
                    </div>
                    <PriceChart 
                      coinId={coin.id} 
                      coinName={coin.name}
                      onPercentageChange={(percentage) => {
                        setPercentageChanges(prev => ({
                          ...prev,
                          [coin.id]: percentage
                        }));
                      }}
                    />
                    <div className="price-footer">
                      <VoteButtons contentType="price" contentId={coin.id || `price_${originalIndex}`} />
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

export default PricesSection;

