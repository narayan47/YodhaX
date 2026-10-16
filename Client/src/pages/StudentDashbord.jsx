import React, { useState } from 'react';

const INITIAL_DATA = {
  students: [
    {
      _id: 'stu1',
      name: 'Alex Kumar',
      rollNo: 'MCA-2026-01',
      email: 'alex.kumar@verifhire.edu',
      credits: 450,
      level: 5,
      xp: 2850,
      skills: [
        { name: 'React', progress: 85 },
        { name: 'Node.js', progress: 70 },
        { name: 'Python', progress: 75 },
        { name: 'Machine Learning', progress: 60 }
      ],
      recentApplications: [
        { role: 'Full Stack Developer Intern', company: 'TechCorp Solutions', dateApplied: 'Oct 12, 2026', status: 'Shortlisted', match: '92%' },
        { role: 'Data Science Intern', company: 'DataFlow Analytics', dateApplied: 'Oct 10, 2026', status: 'Under Review', match: '85%' },
        { role: 'UI/UX Design Intern', company: 'Design Studio', dateApplied: 'Oct 08, 2026', status: 'Applied', match: '78%' }
      ]
    }
  ],
  jobs: [
    {
      _id: 'job1',
      company: 'NexaPay FinTech',
      role: 'Full Stack Developer',
      ctc: '12 LPA',
      sources: ['WhatsApp Forward (TPO)', 'Partner Portal'],
      requiredSkills: ['React', 'Node.js', 'SQL'],
      rankings: [
        { studentName: 'Alex Kumar', rollNo: 'MCA-2026-01', fitScore: 80, explanation: 'Verified required skills with hard proof.' }
      ]
    }
  ],
  applications: [
    { _id: 'app1', studentName: 'Alex Kumar', company: 'NexaPay FinTech', role: 'Full Stack Developer', stage: 'Applied' }
  ]
};

const SKILL_MAP = {
  'reactjs': 'React', 'react.js': 'React', 'react': 'React',
  'nodejs': 'Node.js', 'node.js': 'Node.js', 'node': 'Node.js',
  'sql': 'SQL', 'postgresql': 'SQL', 'python': 'Python'
};

const normalizeLocal = (raw) => SKILL_MAP[raw?.trim().toLowerCase()] || raw?.trim();

export default function StudentDashbord() {
  // Navigation states: 'home', 'student-login', 'student-portal', 'placement-login', 'placement-portal', 'recruiter'
  const [currentView, setCurrentView] = useState('home');
  
  // Student Login states
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentOtpSent, setStudentOtpSent] = useState(false);
  const [studentOtpInput, setStudentOtpInput] = useState('');
  const [studentGeneratedOtp, setStudentGeneratedOtp] = useState('');

  // Placement Cell Login states
  const [facultyName, setFacultyName] = useState('');
  const [facultyEmail, setFacultyEmail] = useState('');
  const [placementOtpSent, setPlacementOtpSent] = useState(false);
  const [placementOtpInput, setPlacementOtpInput] = useState('');
  const [placementGeneratedOtp, setPlacementGeneratedOtp] = useState('');

  const [loginError, setLoginError] = useState('');

  // Dashboard & Interactive states
  const [student, setStudent] = useState(INITIAL_DATA.students[0]);
  const [data, setData] = useState(INITIAL_DATA);
  const [customBullet, setCustomBullet] = useState('Built scalable microservices using Node.js and Kubernetes.');
  const [auditResult, setAuditResult] = useState(null);

  // Placement Cell Job Ingestion states
  const [jobForm, setJobForm] = useState({ company: 'NexaPay FinTech', role: 'Full Stack Developer', source: 'WhatsApp Forward (TPO)', rawRequired: 'ReactJS, Node, PostgreSQL' });
  const [ingestBanner, setIngestBanner] = useState('');
  const [batchReq, setBatchReq] = useState('React.js, SQL');
  const [batchResults, setBatchResults] = useState(INITIAL_DATA.jobs[0].rankings);

  // --- Student OTP Handlers ---
  const handleSendStudentOtp = (e) => {
    e.preventDefault();
    if (!studentName.trim() || !studentEmail.includes('@')) {
      setLoginError('Please enter a valid name and email address.');
      return;
    }
    const mockOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setStudentGeneratedOtp(mockOtp);
    setStudentOtpSent(true);
    setLoginError('');
    alert(`[VerifHire Student OTP] Verification code sent to ${studentEmail}: ${mockOtp}`);
  };

  const handleVerifyStudentOtp = (e) => {
    e.preventDefault();
    if (studentOtpInput.trim() === studentGeneratedOtp.trim()) {
      setStudent(prev => ({ ...prev, name: studentName, email: studentEmail }));
      setCurrentView('student-portal');
    } else {
      setLoginError('Invalid verification code. Please try again.');
    }
  };

  // --- Placement Cell OTP Handlers ---
  const handleSendPlacementOtp = (e) => {
    e.preventDefault();
    if (!facultyName.trim() || !facultyEmail.includes('@')) {
      setLoginError('Please enter valid faculty name and official email.');
      return;
    }
    const mockOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setPlacementGeneratedOtp(mockOtp);
    setPlacementOtpSent(true);
    setLoginError('');
    alert(`[VerifHire Placement Cell OTP] Verification code sent to ${facultyEmail}: ${mockOtp}`);
  };

  const handleVerifyPlacementOtp = (e) => {
    e.preventDefault();
    if (placementOtpInput.trim() === placementGeneratedOtp.trim()) {
      setCurrentView('placement-portal');
    } else {
      setLoginError('Invalid verification code. Please try again.');
    }
  };

  const handleAuditResume = () => {
    const hasKubernetes = customBullet.toLowerCase().includes('kubernetes');
    setAuditResult({
      isTruthful: !hasKubernetes,
      verdict: !hasKubernetes 
        ? 'APPROVED: Every skill mentioned is backed by your Evidence Vault.' 
        : 'BLOCKED: You claimed [Kubernetes], which has ZERO proof in your Evidence Vault!'
    });
  };

  const handleIngestJob = (e) => {
    e.preventDefault();
    const reqNorm = [...new Set(jobForm.rawRequired.split(',').map(normalizeLocal).filter(Boolean))];
    setIngestBanner(`Deduplicated & Normalized! Parsed skills into standard: [${reqNorm.join(', ')}] from ${jobForm.source}.`);
  };

  const handleRankBatch = () => {
    const ranked = data.students.map(stu => ({
      studentName: stu.name,
      rollNo: stu.rollNo,
      fitScore: 85,
      explanation: 'Matched required skills verified by evidence vault.'
    }));
    setBatchResults(ranked);
  };

  return (
    <div style={{ backgroundColor: '#F8F9FD', color: '#1E293B', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* ========================================================= */}
      {/* 1. HOME / LANDING PAGE (Alumni button removed)            */}
      {/* ========================================================= */}
      {currentView === 'home' && (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '60px 24px', textAlign: 'center' }}>
          <span style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', fontSize: '12px', fontWeight: '800', padding: '6px 16px', borderRadius: '99px', textTransform: 'uppercase' }}>
            VerifHire Truth-Backed Platform
          </span>
          <h1 style={{ fontSize: '42px', fontWeight: '900', margin: '20px 0 16px 0', color: '#0F172A', lineHeight: '1.2' }}>
            We Eliminate Fake Resumes & Connect Companies to Verified Talent
          </h1>
          <p style={{ fontSize: '16px', color: '#64748B', maxWidth: '750px', margin: '0 auto 40px auto', lineHeight: '1.6' }}>
            Freshers send generic resumes full of unverified claims, placement teams forward WhatsApp messages by hand, and companies want shortlists they can trust. Select your role to enter:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', textAlign: 'left', maxWidth: '800px', margin: '0 auto' }}>
            
            {/* Student Card -> Redirects to Student Login Page */}
            <div
              onClick={() => { setLoginError(''); setStudentOtpSent(false); setCurrentView('student-login'); }}
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px 20px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>🎓</div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0', color: '#0F172A' }}>Student / Job Seeker</h3>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px 0', lineHeight: '1.4' }}>Login with Email & OTP verification.</p>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#4F46E5' }}>Proceed to Login →</span>
            </div>

            {/* Placement Cell Card -> Redirects to Placement Cell Login Page */}
            <div
              onClick={() => { setLoginError(''); setPlacementOtpSent(false); setCurrentView('placement-login'); }}
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px 20px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>📊</div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0', color: '#0F172A' }}>Placement Cell</h3>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px 0', lineHeight: '1.4' }}>Faculty login with email verification & name.</p>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#4F46E5' }}>Proceed to Login →</span>
            </div>

            {/* Recruiter Card */}
            <div
              onClick={() => setCurrentView('recruiter')}
              style={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px 20px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', transition: 'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '28px', marginBottom: '12px' }}>🏢</div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 8px 0', color: '#0F172A' }}>Recruiter</h3>
              <p style={{ fontSize: '13px', color: '#64748B', margin: '0 0 16px 0', lineHeight: '1.4' }}>Access trusted candidate shortlists.</p>
              <span style={{ fontSize: '12px', fontWeight: '800', color: '#4F46E5' }}>Enter Portal →</span>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. STUDENT LOGIN & OTP PAGE                               */}
      {/* ========================================================= */}
      {currentView === 'student-login' && (
        <div style={{ maxWidth: '440px', margin: '80px auto', padding: '32px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <button onClick={() => setCurrentView('home')} style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: '700', fontSize: '12px', cursor: 'pointer', marginBottom: '16px' }}>
            ← Back to Home
          </button>
          <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A', margin: '0 0 6px 0' }}>Student Portal Login</h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '24px' }}>Secure access via name, email, and OTP code.</p>

          {loginError && (
            <div style={{ padding: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '8px', fontSize: '12px', fontWeight: '700', marginBottom: '16px' }}>
              {loginError}
            </div>
          )}

          {!studentOtpSent ? (
            <form onSubmit={handleSendStudentOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px', color: '#334155' }}>Full Name</label>
                <input type="text" placeholder="Alex Kumar" value={studentName} onChange={e => setStudentName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px', color: '#334155' }}>Email Address</label>
                <input type="email" placeholder="alex@verifhire.edu" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }} />
              </div>
              <button type="submit" style={{ backgroundColor: '#4F46E5', color: '#FFFFFF', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', marginTop: '6px' }}>
                Send Verification Code (OTP)
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyStudentOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', color: '#059669', backgroundColor: '#ECFDF5', padding: '10px', borderRadius: '8px', fontWeight: '700' }}>
                ✓ Code sent to <b>{studentEmail}</b>.<br />
                <span style={{ color: '#475569', fontWeight: 'normal' }}>(Simulated OTP code: <b>{studentGeneratedOtp}</b>)</span>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px', color: '#334155' }}>Enter 4-Digit Code</label>
                <input type="text" placeholder="1234" value={studentOtpInput} onChange={e => setStudentOtpInput(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box', letterSpacing: '6px', textAlign: 'center', fontSize: '18px', fontWeight: '800' }} />
              </div>
              <button type="submit" style={{ backgroundColor: '#059669', color: '#FFFFFF', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>
                Verify & Enter Student Dashboard
              </button>
            </form>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. PLACEMENT CELL LOGIN & OTP PAGE                        */}
      {/* ========================================================= */}
      {currentView === 'placement-login' && (
        <div style={{ maxWidth: '440px', margin: '80px auto', padding: '32px', backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <button onClick={() => setCurrentView('home')} style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: '700', fontSize: '12px', cursor: 'pointer', marginBottom: '16px' }}>
            ← Back to Home
          </button>
          <h2 style={{ fontSize: '22px', fontWeight: '900', color: '#0F172A', margin: '0 0 6px 0' }}>Placement Cell Login</h2>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '24px' }}>Faculty access via Name, Official Email, and OTP verification.</p>

          {loginError && (
            <div style={{ padding: '10px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: '8px', fontSize: '12px', fontWeight: '700', marginBottom: '16px' }}>
              {loginError}
            </div>
          )}

          {!placementOtpSent ? (
            <form onSubmit={handleSendPlacementOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px', color: '#334155' }}>Faculty Name</label>
                <input type="text" placeholder="Dr. R. Sharma (Placement Head)" value={facultyName} onChange={e => setFacultyName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px', color: '#334155' }}>Official Faculty Email</label>
                <input type="email" placeholder="placement@verifhire.edu" value={facultyEmail} onChange={e => setFacultyEmail(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }} />
              </div>
              <button type="submit" style={{ backgroundColor: '#2B1E16', color: '#FFFFFF', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', marginTop: '6px' }}>
                Send Faculty OTP Code
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyPlacementOtp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '12px', color: '#059669', backgroundColor: '#ECFDF5', padding: '10px', borderRadius: '8px', fontWeight: '700' }}>
                ✓ Code sent to <b>{facultyEmail}</b>.<br />
                <span style={{ color: '#475569', fontWeight: 'normal' }}>(Simulated Placement OTP: <b>{placementGeneratedOtp}</b>)</span>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', display: 'block', marginBottom: '6px', color: '#334155' }}>Enter 4-Digit Code</label>
                <input type="text" placeholder="1234" value={placementOtpInput} onChange={e => setPlacementOtpInput(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box', letterSpacing: '6px', textAlign: 'center', fontSize: '18px', fontWeight: '800' }} />
              </div>
              <button type="submit" style={{ backgroundColor: '#8C6239', color: '#FFFFFF', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '800', cursor: 'pointer' }}>
                Verify & Enter Placement Cell
              </button>
            </form>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. STUDENT PORTAL DASHBOARD                               */}
      {/* ========================================================= */}
      {currentView === 'student-portal' && (
        <div>
          <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ backgroundColor: '#4F46E5', color: '#FFF', padding: '6px 10px', borderRadius: '8px', fontWeight: '900', fontSize: '14px' }}>🎓</div>
                <div>
                  <h1 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: '#0F172A' }}>Placement Hub</h1>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Job Seeker Portal</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ backgroundColor: '#EEF2FF', color: '#4F46E5', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px' }}>
                {student.name.substring(0, 2).toUpperCase()}
              </div>
              <span style={{ fontSize: '13px', fontWeight: '700', color: '#0F172A' }}>{student.name} <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 'normal' }}>({student.email})</span></span>
              <button onClick={() => setCurrentView('home')} style={{ backgroundColor: '#F1F5F9', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Log Out</button>
            </div>
          </header>

          <main style={{ maxWidth: '1200px', margin: '24px auto', padding: '0 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)', borderRadius: '20px', padding: '28px', border: '1px solid #C7D2FE', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', fontWeight: '800', color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Student Portal</span>
                <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#1E1B4B', margin: '6px 0 4px 0' }}>Welcome back, {student.name}!</h2>
                <p style={{ fontSize: '13px', color: '#4338CA', margin: 0 }}>Ready to level up your career? Better skills. More opportunities. A brighter future.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ backgroundColor: '#FFFFFF', padding: '10px 16px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#4F46E5' }}>⚡ {student.credits} Credits</div>
                </div>
                <div style={{ backgroundColor: '#FFFFFF', padding: '10px 16px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '15px', fontWeight: '900', color: '#059669' }}>📈 Level {student.level}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              {[
                { title: 'Total Applications', count: '12', subtitle: 'Jobs applied for', bg: '#EEF2FF', icon: '📋' },
                { title: 'Shortlisted', count: '4', subtitle: 'Great progress!', bg: '#ECFDF5', icon: '✅' },
                { title: 'In Progress', count: '5', subtitle: 'Awaiting response', bg: '#FFFBEB', icon: '⏳' },
                { title: 'Offers Received', count: '1', subtitle: 'New opportunity', bg: '#EFF6FF', icon: '⭐' }
              ].map((stat, i) => (
                <div key={i} style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '18px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', color: '#64748B' }}>{stat.title}</div>
                    <div style={{ fontSize: '26px', fontWeight: '900', color: '#0F172A', margin: '4px 0' }}>{stat.count}</div>
                    <div style={{ fontSize: '11px', color: '#94A3B8' }}>{stat.subtitle}</div>
                  </div>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    {stat.icon}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 16px 0', color: '#0F172A' }}>Recent Applications</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {student.recentApplications.map((app, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: '#0F172A' }}>{app.role}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>{app.company} • {app.dateApplied}</div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px', backgroundColor: app.status === 'Shortlisted' ? '#ECFDF5' : '#FFFBEB', color: app.status === 'Shortlisted' ? '#059669' : '#D97706' }}>
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', margin: '0 0 16px 0', color: '#0F172A' }}>Skills Overview</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {student.skills.map((s, i) => (
                      <div key={i}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '700', marginBottom: '6px', color: '#334155' }}>
                          <span>{s.name}</span>
                          <span>{s.progress}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${s.progress}%`, height: '100%', backgroundColor: '#4F46E5', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#4F46E5', marginBottom: '4px' }}>🛡️ RESUME TRUTH AUDITOR</div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input value={customBullet} onChange={e => setCustomBullet(e.target.value)} style={{ flex: 1, padding: '6px 8px', fontSize: '11px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
                    <button onClick={handleAuditResume} style={{ backgroundColor: '#0F172A', color: '#FFF', border: 'none', padding: '6px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>Audit</button>
                  </div>
                  {auditResult && (
                    <div style={{ marginTop: '8px', fontSize: '10px', fontWeight: '700', color: auditResult.isTruthful ? '#059669' : '#DC2626' }}>
                      {auditResult.verdict}
                    </div>
                  )}
                </div>
              </div>
            </div>

          </main>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. PLACEMENT CELL PORTAL DASHBOARD                          */}
      {/* ========================================================= */}
      {currentView === 'placement-portal' && (
        <div>
          <header style={{ backgroundColor: '#2B1E16', color: '#FDFBF7', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: '#8C6239', color: '#FFF', padding: '6px 10px', borderRadius: '8px', fontWeight: '900', fontSize: '14px' }}>📊</div>
              <div>
                <h1 style={{ fontSize: '15px', fontWeight: '800', margin: 0, color: '#FFFFFF' }}>Placement Cell Command Center</h1>
                <span style={{ fontSize: '11px', color: '#E5DCCB' }}>Verified Batch Ranking & Multi-Source Ingestion</span>
              </div>
            </div>
            <button onClick={() => setCurrentView('home')} style={{ backgroundColor: '#8C6239', color: '#FFF', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Log Out</button>
          </header>

          <main style={{ maxWidth: '1200px', margin: '28px auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
            
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5DCCB', borderRadius: '16px', padding: '22px' }}>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: '800' }}>Multi-Source Opening Collector</h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#5C4638' }}>Ingest openings from WhatsApp, Partner APIs, or Alumni channels with skill normalization.</p>

              <form onSubmit={handleIngestJob} style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                <div>
                  <label style={{ fontWeight: '700', display: 'block', marginBottom: '4px' }}>Company Name</label>
                  <input value={jobForm.company} onChange={e => setJobForm({...jobForm, company: e.target.value})} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #E5DCCB', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontWeight: '700', display: 'block', marginBottom: '4px' }}>Role Title</label>
                  <input value={jobForm.role} onChange={e => setJobForm({...jobForm, role: e.target.value})} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #E5DCCB', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontWeight: '700', display: 'block', marginBottom: '4px' }}>Arrival Source</label>
                  <select value={jobForm.source} onChange={e => setJobForm({...jobForm, source: e.target.value})} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #E5DCCB', boxSizing: 'border-box' }}>
                    <option>WhatsApp Forward (TPO)</option>
                    <option>Alumni Referral</option>
                    <option>Partner Company Portal</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: '700', display: 'block', marginBottom: '4px' }}>Raw Required Skills</label>
                  <input value={jobForm.rawRequired} onChange={e => setJobForm({...jobForm, rawRequired: e.target.value})} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #E5DCCB', boxSizing: 'border-box' }} />
                </div>
                <button type="submit" style={{ backgroundColor: '#2B1E16', color: '#FFFFFF', border: 'none', padding: '11px', borderRadius: '10px', fontWeight: '800', cursor: 'pointer' }}>
                  Ingest & Deduplicate Opening
                </button>
              </form>

              {ingestBanner && (
                <div style={{ marginTop: '14px', padding: '12px', borderRadius: '10px', backgroundColor: '#F4EFE6', border: '1px solid #8C6239', fontSize: '12px', fontWeight: '700' }}>
                  {ingestBanner}
                </div>
              )}
            </div>

            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5DCCB', borderRadius: '16px', padding: '22px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '800' }}>Batch Evidence Ranker</h3>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <input value={batchReq} onChange={e => setBatchReq(e.target.value)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #E5DCCB', fontSize: '12px' }} />
                <button onClick={handleRankBatch} style={{ backgroundColor: '#8C6239', color: '#FFFFFF', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>Rank</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {batchResults.map((r, i) => (
                  <div key={i} style={{ backgroundColor: '#FDFBF7', padding: '10px', borderRadius: '8px', border: '1px solid #E5DCCB', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span><b>{r.studentName}</b> ({r.rollNo})</span>
                    <span style={{ fontWeight: '800', color: '#8C6239' }}>{r.fitScore}% Fit</span>
                  </div>
                ))}
              </div>
            </div>

          </main>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. RECRUITER PORTAL                                       */}
      {/* ========================================================= */}
      {currentView === 'recruiter' && (
        <div style={{ maxWidth: '1100px', margin: '40px auto', padding: '0 24px' }}>
          <button onClick={() => setCurrentView('home')} style={{ backgroundColor: '#2B1E16', color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', marginBottom: '20px' }}>← Back to Home</button>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '30px', border: '1px solid #E2E8F0' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '8px' }}>Trusted Recruiter Shortlists</h2>
            <p style={{ fontSize: '14px', color: '#64748B' }}>Access verified GitHub commits and proctored assessment scores for candidates.</p>
          </div>
        </div>
      )}

    </div>
  );
}