import { useNavigate } from 'react-router-dom';
import './Home.css';

function Home() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth');
  };

  return (
    <div className="home">
      <div className="home-container">
        <div className="hero-section">
          <h1 className="hero-title">
            Your Personalized
            <span className="gradient-text"> Crypto Investment</span>
            <br />
            Dashboard
          </h1>
          <p className="hero-description">
            Discover AI-curated content tailored to your investment interests.
            Get personalized insights and stay ahead of
            the crypto market.
          </p>
          <button className="cta-button" onClick={handleGetStarted}>
            Get Started
          </button>
        </div>
        <div className="hero-visual">
          <div className="floating-card card-1"></div>
          <div className="floating-card card-2"></div>
          <div className="floating-card card-3"></div>
        </div>
      </div>
    </div>
  );
}

export default Home;

