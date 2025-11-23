import { useState, useEffect } from 'react';
import NewsSection from '../../components/Dashboard/NewsSection';
import PricesSection from '../../components/Dashboard/PricesSection';
import AISection from '../../components/Dashboard/AISection';
import MemeSection from '../../components/Dashboard/MemeSection';
import { authService } from '../../utils/auth';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Welcome back, {user?.name || 'User'}!</h1>
          <p className="dashboard-subtitle">Your personalized crypto dashboard</p>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-section">
            <NewsSection />
          </div>

          <div className="dashboard-section">
            <PricesSection userPreferences={user?.preferences} />
          </div>

          <div className="dashboard-section">
            <AISection userPreferences={user?.preferences} />
          </div>

          <div className="dashboard-section">
            <MemeSection />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

