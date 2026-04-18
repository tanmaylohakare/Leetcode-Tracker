import React from 'react';

const LandingPage = ({ startSession, isFading }) => {
  return (
    <div className={`landing-page ${isFading ? 'fade-out' : ''}`}>
      <div className="mesh-container">
        <div className="glow-orb glow-orb-1"></div>
        <div className="glow-orb glow-orb-2"></div>
      </div>
      <div className="welcome-box">
        <p style={{ textTransform: 'uppercase', letterSpacing: '4px', opacity: 0.6, fontSize: '0.8rem', marginBottom: '1rem' }}>Session Preview</p>
        <h1>Welcome To <br /><span style={{ color: 'var(--brand-orange)' }}>Tanmay Sir's</span> Session</h1>
        <p>Track student progress, LeetCode streaks, and classroom stats in real-time.</p>
        <button className="get-started-btn" onClick={startSession}>
          Enter Workspace
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
