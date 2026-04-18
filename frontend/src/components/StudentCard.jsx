import React from 'react';

const StudentCard = ({ student, stats }) => {
  return (
    <div className="student-card" style={{
      background: 'var(--panel-bg)',
      border: '1px solid var(--border-color)',
      padding: '1rem',
      borderRadius: '8px',
      marginBottom: '1rem'
    }}>
      <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{student.name}</div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>@{student.username}</div>
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
        <span style={{ color: 'var(--easy-green)' }}>E: {stats.Easy}</span>
        <span style={{ color: 'var(--medium-yellow)' }}>M: {stats.Medium}</span>
        <span style={{ color: 'var(--hard-red)' }}>H: {stats.Hard}</span>
      </div>
    </div>
  );
};

export default StudentCard;
