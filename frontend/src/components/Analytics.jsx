import React from 'react';

const Analytics = ({ students, studentStats, activeTab, onClose }) => {
  // We'll calculate stats here for the charts
  const currentStudents = students.filter(s => s.section === activeTab);
  
  let totalSolved = 0, totalEasy = 0, totalMedium = 0, totalHard = 0;
  currentStudents.forEach(s => {
    const stats = studentStats[s.username];
    if (stats) {
      totalSolved += stats.Total || 0;
      totalEasy += stats.Easy || 0;
      totalMedium += stats.Medium || 0;
      totalHard += stats.Hard || 0;
    }
  });

  return (
    <div className="analytics-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
    }}>
      <div className="analytics-modal" style={{
        background: '#0d1117', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px', padding: '3rem', width: '900px', maxWidth: '95vw',
        maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#fff' }}>Class Analytics</h2>
            <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0' }}>Performance insights for Section {activeTab}</p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#fff', padding: '0.8rem 1.5rem', borderRadius: '12px', cursor: 'pointer', fontWeight: 600
          }}>Close Dashboard</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
          <StatCard label="Total Solved" value={totalSolved} color="var(--brand-orange)" />
          <StatCard label="Easy Problems" value={totalEasy} color="var(--easy-green)" />
          <StatCard label="Medium Problems" value={totalMedium} color="var(--medium-yellow)" />
          <StatCard label="Hard Problems" value={totalHard} color="var(--hard-red)" />
        </div>

        <div style={{ padding: '2rem', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Advanced Graphical Analytics (Charts) loading...</p>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, color }) => (
  <div style={{
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
    padding: '1.5rem', borderRadius: '16px', textAlign: 'center'
  }}>
    <div style={{ fontSize: '2rem', fontWeight: 800, color: color, marginBottom: '0.2rem' }}>{value.toLocaleString()}</div>
    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{label}</div>
  </div>
);

export default Analytics;
