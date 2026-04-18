import React from 'react';

const NeobrutalistLanding = ({ onEnter }) => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#0a0a0f', 
      color: '#fff', 
      fontFamily: "'Space Grotesk', sans-serif",
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      {/* SCANLINES & GRID OVERLAY */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(181, 255, 57, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(181, 255, 57, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(0, 245, 255, 0.05) 50%, transparent 50%)', backgroundSize: '100% 4px', pointerEvents: 'none' }}></div>

      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', maxWidth: '1200px' }}>
        <p style={{ color: '#b5ff39', fontWeight: 800, letterSpacing: '4px', marginBottom: '1.5rem', textTransform: 'uppercase', fontSize: '1rem' }}>
          [ LIVESTREAM_ANALYTICS_V2.0 ]
        </p>

        <h1 style={{ 
          fontSize: 'clamp(3rem, 10vw, 8rem)', 
          fontWeight: 900, 
          lineHeight: 0.9, 
          letterSpacing: '-0.05em',
          marginBottom: '2rem',
          textTransform: 'uppercase',
          fontFamily: "'Syncopate', sans-serif"
        }}>
          TANMAY <br />
          <span style={{ 
            color: 'transparent', 
            WebkitTextStroke: '2px #00f5ff',
            filter: 'drop-shadow(0 0 10px #00f5ff)'
          }}>WORKSPACE</span>
        </h1>

        <p style={{ 
          fontSize: 'clamp(1rem, 2vw, 1.5rem)', 
          maxWidth: '800px', 
          margin: '0 auto 3rem',
          color: '#8b949e',
          lineHeight: 1.5
        }}>
          Track student coding progress, attendance, LeetCode streaks, and classroom performance in real time.
        </p>

        <button 
          onClick={onEnter}
          style={{ 
            background: '#b5ff39', 
            color: '#000', 
            border: '4px solid #000', 
            padding: '1.5rem 4rem', 
            fontSize: '1.5rem', 
            fontWeight: 900, 
            textTransform: 'uppercase', 
            cursor: 'pointer',
            boxShadow: '10px 10px 0px #00f5ff',
            transition: 'all 0.2s',
            fontFamily: "'Bungee', cursive"
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translate(-4px, -4px)';
            e.target.style.boxShadow = '14px 14px 0px #ff4d6d';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translate(0, 0)';
            e.target.style.boxShadow = '10px 10px 0px #00f5ff';
          }}
        >
          Enter Dashboard
        </button>
      </div>

      <div style={{ 
        position: 'absolute', 
        bottom: '2rem', 
        width: '100%', 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '4rem',
        opacity: 0.5,
        fontSize: '0.8rem',
        fontWeight: 700,
        letterSpacing: '2px',
        textTransform: 'uppercase'
      }}>
        <span>120+ Active Students</span>
        <span>15.4k Total Solved</span>
        <span>12 Days Avg. Streak</span>
      </div>
    </div>
  );
};

export default NeobrutalistLanding;
