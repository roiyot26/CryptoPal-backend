import VoteButtons from './VoteButtons';
import './SectionStyles.css';

function MemeSection() {
  return (
    <div className="dashboard-section-content">
      <h3 className="section-title">Fun Crypto Meme</h3>
      <div className="meme-placeholder">
        <div className="placeholder-icon">🎭</div>
        <p className="placeholder-text">Meme content coming soon!</p>
        <p className="placeholder-subtext">We're working on bringing you the best crypto memes.</p>
      </div>
      <div className="section-footer">
        <VoteButtons contentType="meme" contentId="placeholder" />
      </div>
    </div>
  );
}

export default MemeSection;

