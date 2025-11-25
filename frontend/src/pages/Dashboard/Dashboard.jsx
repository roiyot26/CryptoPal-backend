import { useState, useEffect } from 'react';
import NewsSection from '../../components/Dashboard/NewsSection';
import PricesSection from '../../components/Dashboard/PricesSection';
import AISection from '../../components/Dashboard/AISection';
import MemeSection from '../../components/Dashboard/MemeSection';
import { authService } from '../../services/authService';
import { CONTENT_TYPE_OPTIONS, DEFAULT_CONTENT_TYPES } from '../../constants/contentTypes';
import './Dashboard.css';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeContentTypes, setActiveContentTypes] = useState(DEFAULT_CONTENT_TYPES);
  const [savingContentTypes, setSavingContentTypes] = useState(false);
  const [filterError, setFilterError] = useState('');

  useEffect(() => {
    const currentUser = authService.getUser();
    setUser(currentUser);
    const userContentTypes =
      currentUser?.preferences?.contentTypes?.length > 0
        ? currentUser.preferences.contentTypes
        : DEFAULT_CONTENT_TYPES;
    setActiveContentTypes(userContentTypes);
    setLoading(false);
  }, []);

  const isContentTypeActive = (type) => activeContentTypes.includes(type);

  const saveContentTypePreferences = async (updatedTypes) => {
    if (!user) return;
    setSavingContentTypes(true);
    try {
      const preferencesPayload = {
        ...(user?.preferences || {}),
        contentTypes: updatedTypes,
      };
      const response = await authService.savePreferences(preferencesPayload);
      const updatedPreferences = response?.preferences || preferencesPayload;
      const updatedUser = {
        ...(user || {}),
        preferences: updatedPreferences,
      };
      setUser(updatedUser);
    } catch (error) {
      const fallbackTypes =
        user?.preferences?.contentTypes?.length > 0
          ? user.preferences.contentTypes
          : DEFAULT_CONTENT_TYPES;
      setActiveContentTypes(fallbackTypes);
      setFilterError(error.message || 'Failed to update content preferences. Please try again.');
    } finally {
      setSavingContentTypes(false);
    }
  };

  const handleToggleContentType = async (type) => {
    if (!user) return;
    const isActive = isContentTypeActive(type);

    if (isActive && activeContentTypes.length === 1) {
      setFilterError('Select at least one content type.');
      return;
    }

    const updatedTypes = isActive
      ? activeContentTypes.filter((t) => t !== type)
      : [...activeContentTypes, type];

    setActiveContentTypes(updatedTypes);
    setFilterError('');
    await saveContentTypePreferences(updatedTypes);
  };

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

        <div className="content-filters">
          {CONTENT_TYPE_OPTIONS.map((option) => {
            const isActive = isContentTypeActive(option.id);
            const disableToggle = savingContentTypes || (isActive && activeContentTypes.length === 1);
            return (
              <button
                key={option.id}
                type="button"
                className={`content-filter-button ${isActive ? 'active' : ''}`}
                onClick={() => handleToggleContentType(option.id)}
                disabled={disableToggle}
              >
                {option.label}
              </button>
            );
          })}
        </div>
        {filterError && <p className="content-filters-error">{filterError}</p>}

        <div className="dashboard-grid">
          {/* Charts / Prices */}
          {isContentTypeActive('Charts') && (
            <div className="dashboard-section dashboard-section-full">
              <PricesSection userPreferences={user?.preferences} />
            </div>
          )}

          {/* Market News */}
          {isContentTypeActive('Market News') && (
            <div className="dashboard-section dashboard-section-full">
              <NewsSection />
            </div>
          )}

          {/* Fun & Social */}
          {isContentTypeActive('Fun') && isContentTypeActive('Social') && (
            <div className="dashboard-section-row two-columns">
              <div className="dashboard-section dashboard-section-half">
                <MemeSection />
              </div>
              <div className="dashboard-section dashboard-section-half">
                <AISection userPreferences={user?.preferences} />
              </div>
            </div>
          )}

          {isContentTypeActive('Fun') && !isContentTypeActive('Social') && (
            <div className="dashboard-section dashboard-section-full meme-only">
              <MemeSection />
            </div>
          )}

          {!isContentTypeActive('Fun') && isContentTypeActive('Social') && (
            <div className="dashboard-section dashboard-section-full">
              <AISection userPreferences={user?.preferences} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

