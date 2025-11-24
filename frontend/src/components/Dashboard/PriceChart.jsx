import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { authService } from '../../utils/auth';
import './PriceChart.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const TIME_PERIODS = [
  { label: 'D', fullLabel: 'Daily', days: '1' },
  { label: '1W', fullLabel: 'Weekly', days: '7' },
  { label: '1M', fullLabel: 'Monthly', days: '30' },
  { label: '1Y', fullLabel: 'Yearly', days: '365' },
];

function PriceChart({ coinId, coinName, onPercentageChange }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('7');
  const [error, setError] = useState(null);
  const [lineColor, setLineColor] = useState('var(--primary-color)');

  useEffect(() => {
    if (coinId) {
      fetchChartData(selectedPeriod);
    }
  }, [coinId, selectedPeriod]);

  const fetchChartData = async (days) => {
    try {
      setLoading(true);
      setError(null);
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/prices/${coinId}/history?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch price history');
      }

      const data = await response.json();
      const prices = data.data?.prices || [];

      // Calculate percentage change for the period
      if (prices.length > 0 && onPercentageChange) {
        const oldestPrice = prices[0].price;
        const newestPrice = prices[prices.length - 1].price;
        const percentageChange = ((newestPrice - oldestPrice) / oldestPrice) * 100;
        onPercentageChange(percentageChange);
        
        // Set line color based on percentage
        if (percentageChange >= 0) {
          setLineColor('var(--success-color)'); // Green for positive
        } else {
          setLineColor('var(--error-color)'); // Red for negative
        }
      }

      // Format data for chart - sample data points for better performance
      const formattedData = prices
        .filter((_, index) => {
          // Sample data based on period to avoid too many points
          const sampleRate = days === '1' ? 1 : days === '7' ? 2 : days === '30' ? 4 : 8;
          return index % sampleRate === 0;
        })
        .map((item) => {
          const date = new Date(item.timestamp);
          let timeLabel;
          
          if (days === '1') {
            // Daily view: show only hours (HH:MM format)
            timeLabel = date.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            });
          } else {
            // Weekly, Monthly, Yearly: show date
            timeLabel = date.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
          }
          
          return {
            time: timeLabel,
            price: parseFloat(item.price.toFixed(2)),
            fullDate: date.toISOString(),
          };
        });

      setChartData(formattedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTooltip = (value) => {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading && chartData.length === 0) {
    return (
      <div className="price-chart-loading">
        <p>Loading chart data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="price-chart-error">
        <p>Error loading chart</p>
        <button onClick={() => fetchChartData(selectedPeriod)} className="retry-button">Retry</button>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="price-chart-empty">
        <p>No chart data available</p>
      </div>
    );
  }

  return (
    <div className="price-chart-container">
      <div className="chart-header">
        <h4 className="chart-title">{coinName} Price History</h4>
        <div className="period-selector">
          {TIME_PERIODS.map((period) => (
            <button
              key={period.days}
              className={`period-button ${selectedPeriod === period.days ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(period.days)}
              aria-label={period.fullLabel}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.3} />
            <XAxis
              dataKey="time"
              stroke="var(--text-secondary)"
              style={{ fontSize: '0.75rem' }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="var(--text-secondary)"
              style={{ fontSize: '0.75rem' }}
              tickFormatter={(value) => `$${value.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--background-light)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
              }}
              formatter={formatTooltip}
              labelStyle={{ color: 'var(--text-primary)' }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke={lineColor}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default PriceChart;

