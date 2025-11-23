import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../utils/auth';
import ProgressBar from '../../components/Onboarding/ProgressBar';
import './Onboarding.css';

const CRYPTO_ASSETS = [
  'Bitcoin',
  'Ethereum',
  'Altcoins',
  'DeFi',
  'NFTs',
  'Stablecoins',
  'Layer 2',
  'Meme Coins',
];

const INVESTOR_TYPES = [
  { id: 'hodler', label: 'HODLer', description: 'Long-term holder' },
  { id: 'day-trader', label: 'Day Trader', description: 'Active daily trading' },
  { id: 'nft-collector', label: 'NFT Collector', description: 'Digital art enthusiast' },
  { id: 'swing-trader', label: 'Swing Trader', description: 'Medium-term positions' },
  { id: 'defi-enthusiast', label: 'DeFi Enthusiast', description: 'Decentralized finance' },
  { id: 'crypto-newbie', label: 'Crypto Newbie', description: 'Just getting started' },
];

const CONTENT_TYPES = [
  'Market News',
  'Charts/Analysis',
  'Social Media',
  'Fun/Memes',
  'Educational',
  'Trading Signals',
  'Project Updates',
  'Market Trends',
];

function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [cryptoAssets, setCryptoAssets] = useState([]);
  const [investorType, setInvestorType] = useState('');
  const [contentTypes, setContentTypes] = useState([]);
  const navigate = useNavigate();

  const totalSteps = 3;

  const handleCryptoAssetToggle = (asset) => {
    setCryptoAssets(prev =>
      prev.includes(asset)
        ? prev.filter(a => a !== asset)
        : [...prev, asset]
    );
  };

  const handleInvestorTypeSelect = (type) => {
    setInvestorType(type);
  };

  const handleContentTypeToggle = (type) => {
    setContentTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return cryptoAssets.length > 0;
      case 2:
        return investorType !== '';
      case 3:
        return contentTypes.length > 0;
      default:
        return false;
    }
  };

  const handleComplete = () => {
    const preferences = {
      cryptoAssets,
      investorType,
      contentTypes,
    };

    authService.savePreferences(preferences);
    navigate('/');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="onboarding-step">
            <h2>What crypto assets are you interested in?</h2>
            <p className="step-description">Select all that apply</p>
            <div className="options-grid">
              {CRYPTO_ASSETS.map(asset => (
                <button
                  key={asset}
                  type="button"
                  className={`option-chip ${cryptoAssets.includes(asset) ? 'selected' : ''}`}
                  onClick={() => handleCryptoAssetToggle(asset)}
                >
                  {asset}
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="onboarding-step">
            <h2>What type of investor are you?</h2>
            <p className="step-description">Choose the one that best describes you</p>
            <div className="options-grid investor-grid">
              {INVESTOR_TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  className={`option-card ${investorType === type.id ? 'selected' : ''}`}
                  onClick={() => handleInvestorTypeSelect(type.id)}
                >
                  <div className="card-label">{type.label}</div>
                  <div className="card-description">{type.description}</div>
                </button>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="onboarding-step">
            <h2>What kind of content would you like to see?</h2>
            <p className="step-description">Select all that interest you</p>
            <div className="options-grid">
              {CONTENT_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  className={`option-chip ${contentTypes.includes(type) ? 'selected' : ''}`}
                  onClick={() => handleContentTypeToggle(type)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="onboarding">
      <div className="onboarding-container">
        <ProgressBar currentStep={currentStep} totalSteps={totalSteps} />
        
        <div className="onboarding-content">
          {renderStep()}
        </div>

        <div className="onboarding-navigation">
          {currentStep > 1 && (
            <button
              type="button"
              className="nav-button back-button"
              onClick={handleBack}
            >
              Back
            </button>
          )}
          <button
            type="button"
            className="nav-button next-button"
            onClick={handleNext}
            disabled={!canProceed()}
          >
            {currentStep === totalSteps ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Onboarding;

