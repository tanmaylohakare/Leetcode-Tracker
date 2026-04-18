import { useState, useEffect } from 'react';
import './index.css';

const API_BASE = 'http://localhost:8080/api/students';

function App() {
  const [students, setStudents] = useState([]);
  const [studentStats, setStudentStats] = useState({});
  const [activeTab, setActiveTab] = useState('');
  const [sections, setSections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [editStudentId, setEditStudentId] = useState(null);
  const [newStudent, setNewStudent] = useState({ name: '', username: '', univRoll: '', section: '1AF', githubId: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(() => localStorage.getItem('hasEnteredDashboard') === 'true');
  const [isFading, setIsFading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [sectionMetadata, setSectionMetadata] = useState({}); // { sectionName: trainerName }
  const [isEditSectionModalOpen, setEditSectionModalOpen] = useState(false);
  const [editSectionData, setEditSectionData] = useState({ oldName: '', newName: '', trainerName: '' });
  const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);

  useEffect(() => {
    if (!isDarkMode) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [isDarkMode]);

  const startSession = () => {
    setIsFading(true);
    setTimeout(() => {
      setShowDashboard(true);
      localStorage.setItem('hasEnteredDashboard', 'true');
    }, 600);
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      setStudents(data);

      const activeDataSections = Array.from(new Set(data.map(s => s.section).filter(Boolean)));
      setSections(prev => {
        const newSecs = Array.from(new Set([...prev, ...activeDataSections]));
        if (newSecs.length > 0 && !activeTab) {
          setActiveTab(newSecs[0]);
        }
        return newSecs;
      });

      fetchSectionsInfo();
    } catch (err) { console.error("Failed to fetch students", err) }
  };

  const fetchSectionsInfo = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/sections');
      const data = await res.json();
      const meta = {};
      const dbSectionNames = [];
      data.forEach(item => {
        meta[item.sectionName] = item.trainerName;
        dbSectionNames.push(item.sectionName);
      });
      setSectionMetadata(meta);
      // Merge DB section names into state so empty sections persist on refresh
      setSections(prev => {
        const merged = Array.from(new Set([...prev, ...dbSectionNames]));
        return merged;
      });
      setActiveTab(prev => prev || (dbSectionNames.length > 0 ? dbSectionNames[0] : ''));
    } catch (err) { }
  };

  const fetchSectionStats = async (usernames) => {
    const validUsernames = usernames.filter(u => u && !u.startsWith("NO_LC_"));
    if (validUsernames.length === 0) return;
    
    try {
      const res = await fetch(`${API_BASE}/bulk-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validUsernames)
      });
      const data = await res.json();
      
      const newStats = {};
      for (const [username, txt] of Object.entries(data)) {
        if (!txt || txt.includes('"error"')) continue;
        try {
          const parsed = JSON.parse(txt);
          if (parsed?.data?.matchedUser) {
            const stats = parsed.data.matchedUser.submitStats?.acSubmissionNum || [];
            const calendar = parsed.data.matchedUser.userCalendar || { streak: 0, totalActiveDays: 0 };
    
            let counts = { Total: 0, Easy: 0, Medium: 0, Hard: 0, Streak: calendar.streak, ActiveDays: calendar.totalActiveDays };
            stats.forEach(s => {
              if (s.difficulty === "All") counts.Total = s.count;
              if (s.difficulty === "Easy") counts.Easy = s.count;
              if (s.difficulty === "Medium") counts.Medium = s.count;
              if (s.difficulty === "Hard") counts.Hard = s.count;
            });
            newStats[username] = counts;
          }
        } catch (e) {
          console.error("Parse error for username", username, e);
        }
      }
      setStudentStats(prev => ({ ...prev, ...newStats }));
    } catch (err) { console.error("Bulk fetch error:", err); }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (!students.length || !activeTab) return;
    
    // Fetch stats for all students in the active section who are missing them in one network request
    const currentStudents = students.filter(s => s.section === activeTab);
    const missingStats = currentStudents.map(s => s.username).filter(u => !studentStats[u]);
    
    if (missingStats.length > 0) {
      fetchSectionStats(missingStats);
    }
  }, [activeTab, students]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      let payload = { ...newStudent };
      if (!payload.username.trim()) {
        payload.username = "NO_LC_" + Math.random().toString(36).substring(2, 9);
      }
      const url = editStudentId ? `${API_BASE}/${editStudentId}` : API_BASE;
      const method = editStudentId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setAddModalOpen(false);
        setEditStudentId(null);
        setNewStudent({ name: '', username: '', univRoll: '', section: activeTab, githubId: '' });
        fetchStudents();
      } else {
        alert("Failed to save student. Ensure fields are correct.");
      }
    } catch (err) { }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      
      // Robust CSV Parser handling quotes and commas/tabs
      const parseCSV = (txt) => {
        const lines = txt.split(/\r?\n/).filter(line => line.trim());
        return lines.map(line => {
            const row = [];
            let insideQuote = false;
            let currentVal = "";
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    insideQuote = !insideQuote;
                } else if ((char === ',' || char === '\t') && !insideQuote) {
                    row.push(currentVal);
                    currentVal = "";
                } else {
                    currentVal += char;
                }
            }
            row.push(currentVal);
            return row.map(v => v.trim());
        });
      };
      
      const rows = parseCSV(text);
      
      if (rows.length < 2) {
        alert('CSV format error or empty file. Please ensure there is a header row and at least one student row.');
        setIsUploading(false);
        return;
      }

      const headers = rows[0].map(h => h.toLowerCase());

      // Flexible column detection
      const snIdx = headers.findIndex(h =>
        h.includes('sn') || h.includes('s.no') || h.includes('sr') ||
        h.includes('roll') || h.includes('enroll') || h.includes('email') ||
        h.includes('no.') || h.match(/^#$/) || h.match(/^no$/)
      );
      const nameIdx = headers.findIndex(h =>
        h.includes('name') || h.includes('student') || h.includes('full name')
      );
      const lcIdx = headers.findIndex(h =>
        h.includes('leetcode') || h.includes('leet code') ||
        h.includes('lc id') || h.includes('lc username') || h.includes('lc user') ||
        h.includes('username') || h.includes('user name') ||
        h.includes('handle') || h.match(/^lc$/)
      );

      console.log("CSV Headers:", headers);
      console.log("Detected columns → Name:", nameIdx, "| LC:", lcIdx, "| Roll:", snIdx);

      if (nameIdx === -1) {
        alert(`Could not find a 'Name' column.\nDetected headers: ${rows[0].join(', ')}\nExpected a column with 'name' or 'student' in the header.`);
        setIsUploading(false);
        return;
      }
      if (lcIdx === -1) {
        alert(`Could not find a 'LeetCode Username' column.\nDetected headers: ${rows[0].join(', ')}\nExpected a column with 'leetcode', 'lc id', 'username', or 'handle' in the header.`);
        setIsUploading(false);
        return;
      }

      const newStudents = [];
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.length <= nameIdx) continue;

        // --- Name & Roll extraction ---
        const rawName = row[nameIdx]?.trim() || '';

        // Try to extract a roll number embedded in the name column
        // e.g. "ABHI SIKA GLA2025-523050062" → name="ABHI SIKA", roll="GLA2025-523050062"
        const rollPattern = /([A-Z]{2,}[\d]+-[\d]+)/i;
        const rollInName = rawName.match(rollPattern);
        const extractedRoll = rollInName ? rollInName[1] : null;
        const cleanName = extractedRoll
          ? rawName.replace(extractedRoll, '').replace(/\s+/g, ' ').trim()
          : rawName;

        // Use extracted roll first, fallback to dedicated roll column, fallback to row index
        const sn = extractedRoll
          || (snIdx !== -1 ? row[snIdx]?.trim() : null)
          || String(i);

        // --- LeetCode username extraction ---
        let rawLc = (lcIdx !== -1 ? row[lcIdx]?.trim() : '') || '';
        let lcId = '';
        if (rawLc && rawLc.includes('leetcode.com')) {
          // Handles both /username/ and /u/username/ URL formats
          const parts = rawLc.split('/').filter(Boolean);
          // Remove 'u' segment if present (new LeetCode URL format)
          const uIdx = parts.indexOf('u');
          if (uIdx !== -1 && parts[uIdx + 1]) {
            lcId = parts[uIdx + 1];
          } else {
            lcId = parts[parts.length - 1] || '';
          }
        } else if (rawLc) {
          lcId = rawLc;
        }
        // Fallback for students without a LeetCode ID
        if (!lcId) {
          lcId = "NO_LC_" + Math.random().toString(36).substring(2, 9);
        }

        if (cleanName) {
          newStudents.push({
            name: cleanName,
            username: lcId,
            univRoll: sn,
            section: activeTab
          });
        }
      }

      try {
        const res = await fetch(`${API_BASE}/bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newStudents)
        });
        
        if (!res.ok) {
           const errText = await res.text();
           alert(`Upload failed: The server responded with an error.\n${errText}`);
        } else {
           alert(`Successfully added ${newStudents.length} students from the CSV!`);
        }
        fetchStudents();
      } catch (err) { 
        alert(`Upload error: Failed to reach the server.\n${err.message}`);
      }
      setIsUploading(false);
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleDeleteStudent = async (username) => {
    const pwd = prompt("Enter Authentication Password:");
    if (pwd !== "pass@123") {
      if (pwd !== null) alert("Incorrect Password!");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(username)}`, { method: 'DELETE' });
      if (res.ok) {
        alert("Student deleted successfully!");
        fetchStudents();
      } else {
        alert("Failed to delete student. Check backend logs.");
      }
    } catch (err) {
      alert("Error connecting to server.");
    }
  };

  const handleDeleteSection = async (sectionName) => {
    const pwd = prompt("Enter Authentication Password:");
    if (pwd !== "pass@123") {
      if (pwd !== null) alert("Incorrect Password!");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete the ENTIRE section '${sectionName}' and ALL its students?`)) return;

    try {
      const res = await fetch(`http://localhost:8080/api/sections/${encodeURIComponent(sectionName)}`, { method: 'DELETE' });
      if (res.ok) {
        alert("Section deleted successfully!");
        setSections(prev => prev.filter(s => s !== sectionName));
        setActiveTab(prevTab => prevTab === sectionName ? '' : prevTab);
        fetchStudents();
        fetchSectionsInfo();
      } else {
        alert("Failed to delete section.");
      }
    } catch (err) {
      alert("Error connecting to server.");
    }
  };

  const handleExportCSV = () => {
    const headers = ['#', 'Name', 'Univ. Roll', 'LeetCode ID', 'Easy', 'Medium', 'Hard', 'Total Solved', 'Streak', 'Active Days'];
    const csvContent = [
      headers.join(','),
      ...currentStudents.map((s, idx) => {
        const stats = studentStats[s.username] || { Total: 0, Easy: 0, Medium: 0, Hard: 0, Streak: 0, ActiveDays: 0 };
        return [
          idx + 1,
          `"${s.name}"`,
          `"${s.univRoll}"`,
          `"${s.username}"`,
          stats.Easy,
          stats.Medium,
          stats.Hard,
          stats.Total,
          stats.Streak,
          stats.ActiveDays
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `LeetCode_Stats_${activeTab}_${new Date().toLocaleDateString()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSectionUpdate = async (e) => {
    e.preventDefault();
    const { oldName, newName, trainerName } = editSectionData;
    try {
      const url = `http://localhost:8080/api/sections/rename?oldName=${encodeURIComponent(oldName)}&newName=${encodeURIComponent(newName)}&trainerName=${encodeURIComponent(trainerName)}`;
      const res = await fetch(url, { method: 'PUT' });

      if (res.ok) {
        alert("Section settings updated successfully!");
        setEditSectionModalOpen(false);
        if (oldName !== newName) {
          setActiveTab(newName);
        }
        fetchStudents();
        fetchSectionsInfo();
      } else {
        alert("Failed to update section. Check console for details.");
      }
    } catch (err) {
      console.error("Section Update Error:", err);
      alert("Error connecting to server.");
    }
  };

  const handleSaveLastWeek = async () => {
    const studentsToUpdate = currentStudents.map(s => {
      const stats = studentStats[s.username] || { Total: 0, Easy: 0, Medium: 0, Hard: 0, Streak: 0, ActiveDays: 0 };
      return {
        username: s.username,
        easyLastWeek: stats.Easy,
        mediumLastWeek: stats.Medium,
        hardLastWeek: stats.Hard,
        totalLastWeek: stats.Total,
        streakLastWeek: stats.Streak,
        activeDaysLastWeek: stats.ActiveDays
      };
    });

    try {
      const res = await fetch(`${API_BASE}/snapshot`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentsToUpdate)
      });
      if (res.ok) {
        alert("Snapshot saved as Last Week stats!");
        fetchStudents();
      } else {
        alert("Failed to save snapshot.");
      }
    } catch (err) {
      console.error("Snapshot Error:", err);
      alert("Error connecting to server.");
    }
  };

  const currentStudents = students.filter(s => {
    const matchesSection = activeTab === 'All Sections' ? true : s.section === activeTab;
    const lowerQ = searchQuery.toLowerCase();
    const matchesSearch = s.name.toLowerCase().includes(lowerQ) || s.username.toLowerCase().includes(lowerQ) || s.univRoll.toString().includes(lowerQ);
    return matchesSection && matchesSearch;
  });

  let totalSolved = 0, totalEasy = 0, totalMedium = 0, totalHard = 0;
  currentStudents.forEach(s => {
    const stats = studentStats[s.username];
    if (stats) {
      totalSolved += stats.Total;
      totalEasy += stats.Easy;
      totalMedium += stats.Medium;
      totalHard += stats.Hard;
    }
  });

  if (!showDashboard) {
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
          <button className="get-started-btn" onClick={startSession} style={{ display: 'inline-flex', alignItems: 'center', gap: '12px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            Enter Control Center
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <nav className="top-nav">
        <div className="nav-title"><span style={{ color: 'var(--brand-orange)' }}>LeetCode</span> Tracker</div>
        <div className="theme-switch-wrapper">
          <span className="theme-switch-label">{isDarkMode ? 'OFF' : 'ON'}</span>
          <label className="theme-switch">
            <input
              type="checkbox"
              checked={!isDarkMode}
              onChange={() => setIsDarkMode(!isDarkMode)}
            />
            <span className="slider"></span>
          </label>
        </div>
        <div className="nav-tabs" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <div 
              className="sort-dropdown" 
              onClick={() => setIsSectionDropdownOpen(!isSectionDropdownOpen)}
              style={{ padding: '0.5rem 1.0rem 0.5rem 1rem', fontSize: '0.9rem', minWidth: '130px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}
            >
              <span>{activeTab || 'Select Section'}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '10px' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            
            {isSectionDropdownOpen && (
              <>
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} onClick={() => setIsSectionDropdownOpen(false)}></div>
                <div style={{ 
                  position: 'absolute', top: '100%', left: 0, minWidth: '100%', 
                  background: 'var(--card-bg)', border: '1px solid var(--border-color)', 
                  borderRadius: '8px', marginTop: '4px', maxHeight: '250px', overflowY: 'auto', 
                  zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}>
                  <div 
                    className={`dropdown-item ${activeTab === 'All Sections' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('All Sections'); setIsSectionDropdownOpen(false); }}
                  >
                    All Sections
                  </div>
                  {sections.map(sec => (
                    <div 
                      key={sec} 
                      className={`dropdown-item ${activeTab === sec ? 'active' : ''}`}
                      onClick={() => { setActiveTab(sec); setIsSectionDropdownOpen(false); }}
                    >
                      {sec}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          {isAddingSection ? (
            <form onSubmit={async e => {
              e.preventDefault();
              const name = newSectionName.trim().toUpperCase();
              if (name) {
                try {
                  await fetch('http://localhost:8080/api/sections', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sectionName: name, trainerName: '' })
                  });
                } catch (err) {
                  console.error("Failed to save section to backend:", err);
                }
                setSections(prev => Array.from(new Set([...prev, name])));
                setActiveTab(name);
              }
              setIsAddingSection(false);
              setNewSectionName('');
            }}>
              <input
                autoFocus
                placeholder="e.g. CS"
                value={newSectionName}
                onChange={e => setNewSectionName(e.target.value)}
                onBlur={() => setIsAddingSection(false)}
                style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--app-bg)', color: 'var(--text-primary)', width: '100px', fontSize: '0.85rem' }}
              />
            </form>
          ) : (
            <div className="add-section-btn" style={{ background: 'var(--border-color)', padding: '0.5rem 1rem', borderRadius: '8px' }} onClick={() => setIsAddingSection(true)}>+ Add Section</div>
          )}
        </div>
      </nav>

      <div className="content-wrapper">
        <div className="section-header-row">
          <div className="section-title-group">
            <h2>Section — {activeTab}
              <span className="student-count">{currentStudents.length} students</span>
              {activeTab && activeTab !== 'All Sections' && (
                <>
                  <button className="icon-btn" style={{ marginLeft: '1rem' }} title="Edit Section Settings" onClick={() => { setEditSectionData({ oldName: activeTab, newName: activeTab, trainerName: sectionMetadata[activeTab] || '' }); setEditSectionModalOpen(true); }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  </button>
                  <button className="icon-btn danger" title={`Delete Section ${activeTab}`} onClick={() => handleDeleteSection(activeTab)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </>
              )}
            </h2>
            {sectionMetadata[activeTab] && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '0.5rem',
                background: 'rgba(255, 138, 0, 0.1)',
                padding: '4px 10px',
                borderRadius: '100px',
                border: '1px solid rgba(255, 138, 0, 0.2)'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--brand-orange)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  Trainer: <span style={{ color: 'var(--text-primary)' }}>{sectionMetadata[activeTab]}</span>
                </span>
              </div>
            )}
          </div>
          <div className="section-actions-group">
            <button className="secondary-btn" onClick={handleExportCSV}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export CSV
            </button>
            <button className="secondary-btn save-btn" onClick={handleSaveLastWeek}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
              Save Snapshot
            </button>
            <button className="secondary-btn refresh-btn" onClick={fetchStudents}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
              Refresh
            </button>
          </div>
        </div>

        <div className="add-btn-row">
          <button className="primary-btn" onClick={() => { setEditStudentId(null); setNewStudent(prev => ({ ...prev, name: '', username: '', univRoll: '', section: activeTab === 'All Sections' ? '' : activeTab, githubId: '' })); setAddModalOpen(true) }}>
            + Add Student {activeTab !== 'All Sections' ? `to ${activeTab}` : ''}
          </button>
          <label className="secondary-btn" style={{ cursor: 'pointer' }}>
            {isUploading ? 'Uploading...' : '📁 Upload CSV'}
            <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} disabled={isUploading} />
          </label>
        </div>

        <div className="stats-row">
          <div className="stats-group-left">
            <div className="mini-stat-box">
              <div className="val total">{totalSolved.toLocaleString()}</div>
              <div className="lbl">Total Solved</div>
            </div>
            <div className="mini-stat-box">
              <div className="val easy">{totalEasy.toLocaleString()}</div>
              <div className="lbl">Easy</div>
            </div>
            <div className="mini-stat-box">
              <div className="val medium">{totalMedium.toLocaleString()}</div>
              <div className="lbl">Medium</div>
            </div>
            <div className="mini-stat-box">
              <div className="val hard">{totalHard.toLocaleString()}</div>
              <div className="lbl">Hard</div>
            </div>
          </div>
          <div className="mini-stat-box right-box">
            <div className="val">{currentStudents.length}</div>
            <div className="lbl">Students</div>
          </div>
        </div>

        <div className="filter-row">
          <div className="search-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input
              type="text"
              placeholder="Search name, username, roll"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          <select className="sort-dropdown">
            <option>Sort: Roll #</option>
          </select>
          <button className="secondary-btn reset-btn" onClick={() => setSearchQuery('')}>↻ Reset</button>
        </div>

        <div className="table-container">
          <table className="leetcode-table">
            <thead>
              <tr>
                <th rowSpan="2">#</th>
                <th rowSpan="2">NAME</th>
                <th rowSpan="2">UNIV.<br />ROLL</th>
                <th rowSpan="2">LC PROFILE</th>
                <th colSpan="2" className="col-divider">EASY</th>
                <th colSpan="2" className="col-divider">MEDIUM</th>
                <th colSpan="2" className="col-divider">HARD</th>
                <th colSpan="2" className="col-divider">TOTAL SOLVED</th>
                <th colSpan="2" className="col-divider">STREAK</th>
                <th colSpan="2" className="col-divider">ACTIVE DAYS</th>
              </tr>
              <tr>
                <th className="col-divider sub-header">LAST<br />WEEK</th>
                <th className="sub-header">TODAY</th>
                <th className="col-divider sub-header">LAST<br />WEEK</th>
                <th className="sub-header">TODAY</th>
                <th className="col-divider sub-header">LAST<br />WEEK</th>
                <th className="sub-header">TODAY</th>
                <th className="col-divider sub-header">LAST<br />WEEK</th>
                <th className="sub-header">TODAY</th>
                <th className="col-divider sub-header">LAST<br />WEEK</th>
                <th className="sub-header">TODAY</th>
                <th className="col-divider sub-header">LAST<br />WEEK</th>
                <th className="sub-header">TODAY</th>
              </tr>
            </thead>
            <tbody>
              {currentStudents.map((s, idx) => {
                const stats = studentStats[s.username] || { Total: '-', Easy: '-', Medium: '-', Hard: '-', Streak: '-', ActiveDays: '-' };
                return (
                  <tr key={s.id}>
                    <td>{idx + 1}</td>
                    <td>{s.name}</td>
                    <td>{s.univRoll}</td>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: 'none', position: 'relative' }}>
                      {s.username.startsWith("NO_LC_") ? <span className="val-dash">-</span> : <a href={`https://leetcode.com/${s.username}`} target="_blank" rel="noreferrer" className="profile-link" style={{ whiteSpace: 'nowrap' }}>{s.username}</a>}

                      <div style={{ marginLeft: 'auto', display: 'flex', gap: '4px' }}>
                        <button className="icon-btn" style={{ padding: '4px' }} title="Edit Student" onClick={() => { setEditStudentId(s.id); setNewStudent({ name: s.name, username: s.username.startsWith("NO_LC_") ? "" : s.username, univRoll: s.univRoll, section: s.section, githubId: s.githubId || '' }); setAddModalOpen(true); }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                        </button>
                        <button className="icon-btn" style={{ padding: '4px' }} title="Delete Student" onClick={() => handleDeleteStudent(s.username)}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </td>

                    <td className="col-divider val-dash">{s.easyLastWeek || 0}</td>
                    <td style={{ color: 'var(--easy-green)' }}>{stats.Easy}</td>

                    <td className="col-divider val-dash">{s.mediumLastWeek || 0}</td>
                    <td style={{ color: 'var(--medium-yellow)' }}>{stats.Medium}</td>

                    <td className="col-divider val-dash">{s.hardLastWeek || 0}</td>
                    <td style={{ color: 'var(--hard-red)' }}>{stats.Hard}</td>

                    <td className="col-divider val-dash">{s.totalLastWeek || 0}</td>
                    <td style={{ color: 'var(--accent-red)' }}>{stats.Total}</td>

                    <td className="col-divider val-dash">{s.streakLastWeek || 0}</td>
                    <td style={{ color: 'var(--streak-blue)' }}>{stats.Streak}</td>

                    <td className="col-divider val-dash">{s.activeDaysLastWeek || 0}</td>
                    <td style={{ color: 'var(--text-primary)' }}>{stats.ActiveDays}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>


      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>{editStudentId ? "Edit Student" : `Add Student to ${activeTab}`}</h3>
            <form onSubmit={handleAdd}>
              <input placeholder="Full Name" value={newStudent.name} required onChange={e => setNewStudent(prev => ({ ...prev, name: e.target.value }))} />
              <input placeholder="Univ Roll" value={newStudent.univRoll} required onChange={e => setNewStudent(prev => ({ ...prev, univRoll: e.target.value }))} />
              <input placeholder="LeetCode Username (Optional)" value={newStudent.username} onChange={e => {
                let val = e.target.value;
                if (val.includes('leetcode.com')) val = val.split('/').filter(Boolean).pop() || '';
                setNewStudent(prev => ({ ...prev, username: val }));
              }} />
              <div className="modal-actions">
                <button type="button" className="btn-cancel modal-btn" onClick={() => { setAddModalOpen(false); setEditStudentId(null); }}>
                  Cancel
                </button>
                <button type="submit" className="btn-add modal-btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {isEditSectionModalOpen && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '450px' }}>
            <h3>Section Settings — {editSectionData.oldName}</h3>
            <form onSubmit={handleSectionUpdate}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>RENAME SECTION</label>
                <input placeholder="New Section Name" value={editSectionData.newName} required onChange={e => setEditSectionData(prev => ({ ...prev, newName: e.target.value.toUpperCase() }))} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>TRAINER NAME</label>
                <input placeholder="Trainer's Name" value={editSectionData.trainerName} onChange={e => setEditSectionData(prev => ({ ...prev, trainerName: e.target.value }))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel modal-btn" onClick={() => { setEditSectionModalOpen(false); }}>Cancel</button>
                <button type="submit" className="btn-add modal-btn">Update Settings</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
