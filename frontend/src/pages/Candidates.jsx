import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { candidatesService, jobsService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Candidates = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef(null);

  // Client-side Filters State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  useEffect(() => {
    const searchVal = searchParams.get('search');
    if (searchVal !== null) {
      setSearchQuery(searchVal);
    }
  }, [searchParams]);

  const [selectedDept, setSelectedDept] = useState('All');
  const [minScore, setMinScore] = useState(70);
  const [statusFilter, setStatusFilter] = useState('All');
  const [strengthFilter, setStrengthFilter] = useState('All');
  const [departments, setDepartments] = useState(['All']);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const res = await jobsService.listJobs();
        if (res.success && res.data) {
          const depts = ['All', ...new Set(res.data.map(j => j.department).filter(Boolean))];
          setDepartments(depts);
        }
      } catch (err) {
        console.error('Error fetching jobs for departments:', err);
      }
    };
    loadDepartments();
  }, []);

  useEffect(() => {
    let active = true;
    const loadCandidates = async () => {
      try {
        setLoading(true);
        const res = await candidatesService.listCandidates(searchQuery);
        if (active && res.success) {
          const rawList = res.data || [];
          const grouped = {};
          for (const item of rawList) {
            const cid = item.candidate_id;
            if (!grouped[cid]) {
              grouped[cid] = {
                ...item,
                scores: [item.score],
              };
            } else {
              grouped[cid].scores.push(item.score);
            }
          }
          const processed = Object.values(grouped).map(item => {
            const avgScore = item.scores.reduce((sum, s) => sum + s, 0) / item.scores.length;
            return {
              ...item,
              score: avgScore
            };
          });
          setCandidates(processed);
        }
      } catch (err) {
        console.error('Error fetching candidates:', err);
        toast.error('Failed to load candidates data');
      } finally {
        if (active) setLoading(false);
      }
    };
    
    const delayDebounceFn = setTimeout(() => {
      loadCandidates();
    }, 400);

    return () => {
      active = false;
      clearTimeout(delayDebounceFn);
    };
  }, [searchQuery]);

  // Filter Candidates
  const filteredCandidates = candidates.filter(c => {
    const matchesDept = selectedDept === 'All' || c.department === selectedDept;
    const matchesScore = c.score >= minScore;
    const matchesStatus = statusFilter === 'All' || 
      (statusFilter === 'Shortlisted' && c.status === 'Shortlisted') ||
      (statusFilter === 'Reviewing' && (c.status === 'Reviewing' || c.status === 'Under Review'));
    const matchesStrength = strengthFilter === 'All' || c.strength === strengthFilter;

    return matchesDept && matchesScore && matchesStatus && matchesStrength;
  });

  // Score styles helper
  const getScoreColorClass = (score) => {
    if (score >= 90) return 'text-primary';
    if (score >= 70) return 'text-tertiary';
    return 'text-danger';
  };

  // Strength badge helper
  const getStrengthBadge = (strength) => {
    return (
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${strength === 'High' ? 'bg-primary' : strength === 'Med' ? 'bg-warning' : 'bg-danger'}`}></span>
        <span className={`text-[12px] font-body-bold uppercase tracking-tight ${getScoreColorClass(strength === 'High' ? 95 : strength === 'Med' ? 75 : 50)}`}>
          {strength}
        </span>
      </div>
    );
  };

  // Status badge style helper
  const getStatusBadgeClass = (status) => {
    if (status === 'Shortlisted') return 'bg-primary/10 text-primary border-primary/20';
    if (status === 'Reviewing' || status === 'Under Review') return 'bg-surface-container-high text-text-secondary border-border-subtle';
    return 'bg-danger-soft text-danger border-danger/10';
  };

  // Actions
  const handleViewDetails = (cand) => {
    navigate(`/candidate/${cand.id}`);
  };

  const handleDownloadResume = async (cand, e) => {
    if (e) e.stopPropagation();
    if (cand.resumeFile) {
      const originalName = cand.resumeFile.file_name || cand.resumeFile.stored_file_name || '';
      const extension = originalName.substring(originalName.lastIndexOf('.')) || '.pdf';
      const cleanName = cand.name.trim().toLowerCase().replace(/\s+/g, '-');
      const downloadName = `${cleanName}-cv${extension}`;

      try {
        let fileUrl = `http://localhost:5000/uploads/CVs/${cand.resumeFile.stored_file_name || cand.resumeFile.file_name}`;
        let response = await fetch(fileUrl);
        if (!response.ok) {
          // Fallback to the root uploads folder for older files
          const fallbackUrl = `http://localhost:5000/uploads/${cand.resumeFile.stored_file_name || cand.resumeFile.file_name}`;
          response = await fetch(fallbackUrl);
          if (!response.ok) throw new Error('File download failed');
        }
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', downloadName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        toast.success(`Downloading resume as ${downloadName}...`);
      } catch (err) {
        console.error('Failed to download resume:', err);
        toast.error('Failed to download resume file');
      }
    } else {
      toast.error('No resume file found for this candidate');
    }
  };

  const handleDeleteCandidate = async (candidateId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this candidate? This will remove all their screenings and files permanently.")) {
      return;
    }

    try {
      const res = await candidatesService.deleteCandidate(candidateId);
      if (res.success) {
        toast.success("Candidate deleted successfully!");
        setCandidates(prev => prev.filter(c => c.candidate_id !== candidateId));
      }
    } catch (err) {
      console.error("Failed to delete candidate:", err);
      toast.error("Failed to delete candidate");
    }
  };

  const handleExportCSV = () => {
    if (filteredCandidates.length === 0) {
      toast.error('No candidates available to export');
      return;
    }
    const headers = ['Rank', 'Name', 'Email', 'Applied Role', 'Department', 'Score', 'Strength', 'Matched Skills', 'Status'];
    const csvRows = [
      headers.join(','),
      ...filteredCandidates.map((cand, idx) => {
        const row = [
          idx + 1,
          `"${cand.name}"`,
          `"${cand.email || 'N/A'}"`,
          `"${cand.jobTitle || 'N/A'}"`,
          `"${cand.department || 'N/A'}"`,
          Math.round(cand.score || 0),
          `"${cand.strength || 'N/A'}"`,
          `"${cand.matchedSkills ? cand.matchedSkills.join('; ') : ''}"`,
          `"${cand.status || 'N/A'}"`
        ];
        return row.join(',');
      })
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `candidates_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Candidates exported to CSV successfully!');
  };

  const handleShareReport = () => {
    if (filteredCandidates.length === 0) {
      toast.error('No candidates to generate a report for');
      return;
    }
    const dateStr = new Date().toISOString().slice(0, 10);
    const originalTitle = document.title;
    document.title = `RecruitAI_Candidate_Report_${dateStr}`;
    setIsPrinting(true);
    // Give React one tick to render the print region before print dialog
    setTimeout(() => {
      window.print();
      document.title = originalTitle;
      // Hide the print region after the dialog closes
      setTimeout(() => setIsPrinting(false), 500);
    }, 150);
  };

  return (
    <>
      <div className="flex flex-col gap-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <nav className="flex items-center gap-2 text-text-muted mb-2">
            <span className="text-[12px] font-label-caps text-primary uppercase font-bold">Candidates</span>
          </nav>
          <h2 className="font-display-metric text-display-metric text-text-primary">Candidate Intelligence Ranking</h2>
          <p className="text-body-standard text-text-secondary">
            AI-driven analysis of {filteredCandidates.length} applicants across your active job descriptions
          </p>
        </div>

      </div>

      {/* Bento Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
        {/* Department filter */}
        <div className="bg-surface border border-border-subtle rounded-xl p-4 flex flex-col gap-2 shadow-sm">
          <label className="text-[11px] font-label-caps text-text-muted uppercase font-bold">Department</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-surface-container-low border border-border-subtle rounded-lg py-2 px-3 text-body-standard focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer text-text-primary"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'All' ? 'All Departments' : dept}
              </option>
            ))}
          </select>
        </div>

        {/* Min Score filter */}
        <div className="bg-surface border border-border-subtle rounded-xl p-4 flex flex-col gap-2 shadow-sm">
          <label className="text-[11px] font-label-caps text-text-muted uppercase font-bold">Minimum Score</label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="flex-1 accent-primary h-1.5 cursor-pointer"
            />
            <span className="font-data-mono text-data-mono text-primary bg-accent-soft px-2 py-0.5 rounded">
              {minScore}+
            </span>
          </div>
        </div>

        {/* Status filter */}
        <div className="bg-surface border border-border-subtle rounded-xl p-4 flex flex-col gap-2 shadow-sm">
          <label className="text-[11px] font-label-caps text-text-muted uppercase font-bold">Status Filter</label>
          <div className="flex flex-wrap gap-2">
            {['All', 'Shortlisted', 'Reviewing'].map((status) => (
              <span
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-2 py-1 rounded-md text-[11px] font-body-bold cursor-pointer transition-colors ${
                  statusFilter === status
                    ? 'bg-primary text-white'
                    : 'bg-surface-container-high text-text-secondary hover:bg-surface-container-highest'
                }`}
              >
                {status}
              </span>
            ))}
          </div>
        </div>

        {/* Strength Filter */}
        <div className="bg-surface border border-border-subtle rounded-xl p-4 flex flex-col gap-2 shadow-sm">
          <label className="text-[11px] font-label-caps text-text-muted uppercase font-bold">Strength Indicator</label>
          <div className="flex gap-2">
            {['All', 'High', 'Med', 'Low'].map((strength) => (
              <button
                key={strength}
                onClick={() => setStrengthFilter(strength)}
                className={`flex-1 py-1 px-2 border rounded-md text-[11px] font-body-bold transition-all ${
                  strengthFilter === strength
                    ? 'border-primary bg-accent-soft text-primary'
                    : 'border-border-strong text-text-secondary hover:border-primary'
                }`}
              >
                {strength}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Global Search box in filter bar */}
      <div className="bg-surface border border-border-subtle rounded-xl p-4 shadow-sm flex items-center gap-md">
        <span className="material-symbols-outlined text-text-muted text-[18px]">search</span>
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-transparent border-none py-1 text-body-standard focus:ring-0 focus:outline-none placeholder:text-text-muted"
          placeholder="Search candidates by name or specific skills (e.g. Figma, React)..."
          type="text"
        />
      </div>

      {/* Candidate Ranking Table */}
      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle">
                <th className="px-6 py-4 text-[11px] font-label-caps text-text-muted tracking-widest uppercase">Rank</th>
                <th className="px-6 py-4 text-[11px] font-label-caps text-text-muted tracking-widest uppercase">Candidate</th>
                <th className="px-6 py-4 text-[11px] font-label-caps text-text-muted tracking-widest uppercase">Overall Score</th>
                <th className="px-6 py-4 text-[11px] font-label-caps text-text-muted tracking-widest uppercase">Strength</th>
                <th className="px-6 py-4 text-[11px] font-label-caps text-text-muted tracking-widest uppercase">Matched Skills</th>
                <th className="px-6 py-4 text-[11px] font-label-caps text-text-muted tracking-widest uppercase">Status</th>
                <th className="px-6 py-4 text-[11px] font-label-caps text-text-muted tracking-widest uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                // Table loading skeleton rows
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-5"><div className="w-8 h-8 bg-surface-container rounded-full"></div></td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-surface-container rounded w-24"></div>
                          <div className="h-3 bg-surface-container rounded w-32"></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-container"></div>
                        <div className="h-4 bg-surface-container rounded w-16"></div>
                      </div>
                    </td>
                    <td className="px-6 py-5"><div className="w-12 h-4 bg-surface-container rounded"></div></td>
                    <td className="px-6 py-5">
                      <div className="flex gap-1">
                        <div className="w-12 h-5 bg-surface-container rounded-full"></div>
                        <div className="w-12 h-5 bg-surface-container rounded-full"></div>
                      </div>
                    </td>
                    <td className="px-6 py-5"><div className="w-20 h-6 bg-surface-container rounded-full"></div></td>
                    <td className="px-6 py-5"><div className="w-16 h-8 bg-surface-container rounded-lg"></div></td>
                  </tr>
                ))
              ) : filteredCandidates.map((cand, index) => {
                const circumference = 2 * Math.PI * 18;
                const score = Math.round(cand.score || 0);
                const dashOffset = circumference - (score / 100) * circumference;
                const matchQuality = score >= 85 ? 'Exceptional' : (score >= 70 ? 'Strong Match' : 'Compatible');

                return (
                  <tr
                    key={cand.id}
                    className="hover:bg-background transition-colors group cursor-pointer"
                    onClick={() => handleViewDetails(cand)}
                  >
                    {/* Rank */}
                    <td className="px-6 py-5">
                      <div className="w-8 h-8 flex items-center justify-center bg-warning-soft text-warning font-data-mono rounded-full border border-warning/10">
                        #{index + 1}
                      </div>
                    </td>

                    {/* Candidate Identity */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center text-primary font-bold text-sm">
                          {cand.photoUrl ? (
                            <img alt={cand.name} className="w-full h-full object-cover" src={cand.photoUrl} />
                          ) : (
                            <span>{cand.avatar || cand.name.split(' ').map(n => n[0]).join('').toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-body-bold text-text-primary group-hover:text-primary transition-colors">
                            {cand.name}
                          </p>
                          <p className="text-[12px] text-text-muted">{cand.email || (cand.name.toLowerCase().replace(/\s+/g, '.') + '@example.com')}</p>
                        </div>
                      </div>
                    </td>

                    {/* Overall Score */}
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              className="text-surface-container-highest"
                              cx="20"
                              cy="20"
                              fill="transparent"
                              r="18"
                              stroke="currentColor"
                              strokeWidth="3"
                            ></circle>
                            <circle
                              className={getScoreColorClass(score)}
                              cx="20"
                              cy="20"
                              fill="transparent"
                              r="18"
                              stroke="currentColor"
                              strokeDasharray={circumference}
                              strokeDashoffset={dashOffset}
                              strokeWidth="3"
                            ></circle>
                          </svg>
                          <span className={`absolute inset-0 flex items-center justify-center font-data-mono-sm text-[10px] font-bold ${getScoreColorClass(score)}`}>
                            {score}
                          </span>
                        </div>
                        <span className={`font-data-mono text-data-mono ${getScoreColorClass(score)}`}>
                          {matchQuality}
                        </span>
                      </div>
                    </td>

                    {/* Strength */}
                    <td className="px-6 py-5">{getStrengthBadge(cand.strength)}</td>

                    {/* Matched Skills */}
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1.5">
                        {cand.matchedSkills && cand.matchedSkills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 bg-accent-soft text-primary-container text-[11px] font-body-bold rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {cand.matchedSkills && cand.matchedSkills.length > 3 && (
                          <span className="px-2 py-0.5 bg-surface-container-high text-text-secondary text-[11px] font-body-bold rounded-full">
                            +{cand.matchedSkills.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1 border text-[11px] font-label-caps rounded-full ${getStatusBadgeClass(cand.status)}`}>
                        {cand.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(cand)}
                          className="p-2 hover:bg-surface-container-high rounded-lg text-text-secondary hover:text-primary transition-all"
                          title="View Details"
                        >
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </button>
                        <button
                          onClick={(e) => handleDownloadResume(cand, e)}
                          className="p-2 hover:bg-surface-container-high rounded-lg text-text-secondary hover:text-primary transition-all"
                          title="Download Resume"
                        >
                          <span className="material-symbols-outlined text-[18px]">download</span>
                        </button>
                        <button
                          onClick={(e) => handleDeleteCandidate(cand.candidate_id, e)}
                          className="p-2 hover:bg-red-500/10 rounded-lg text-text-secondary hover:text-red-500 transition-all"
                          title="Delete Candidate"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!loading && filteredCandidates.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-text-muted text-sm bg-surface">
                    No candidates found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table pagination */}
        <div className="bg-surface-container-low px-6 py-4 flex items-center justify-between border-t border-border-subtle">
          <p className="text-[12px] text-text-secondary">
            Showing <span className="font-body-bold text-text-primary">1-{filteredCandidates.length}</span> of <span className="font-body-bold text-text-primary">{filteredCandidates.length}</span> candidates
          </p>
          <div className="flex items-center gap-1">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-subtle text-text-muted hover:bg-surface-container transition-all">
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-white text-[12px] font-body-bold">
              1
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-border-subtle text-text-muted hover:bg-surface-container transition-all">
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

    </div>

    {/* ================================================================
        PRINT-ONLY REPORT REGION — hidden on screen, visible only via @media print
    ================================================================ */}
    {isPrinting && createPortal(
      <div ref={printRef} className="report-print-region">
        <div style={{
          fontFamily: "'DM Sans', 'Inter', Arial, sans-serif",
          color: '#1A1917',
          background: '#ffffff',
          width: '100%'
        }}>

          {/* ── COVER HEADER ── */}
          <div style={{
            background: 'linear-gradient(135deg, #00694c 0%, #00513a 60%, #003d2b 100%)',
            padding: '40px 48px 36px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '44px', height: '44px',
                background: 'rgba(255,255,255,0.18)',
                borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1.5px solid rgba(255,255,255,0.3)'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <div style={{ color: '#ffffff', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.3px', lineHeight: 1.2 }}>RecruitAI</div>
                <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: '2px' }}>Intelligence in Hiring</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>Candidate Intelligence Report</div>
              <div style={{ color: '#ffffff', fontSize: '13px', fontWeight: 500 }}>Exported: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              {user && (
                <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', marginTop: '4px' }}>Recruiter: {user.full_name || user.name || 'N/A'}</div>
              )}
            </div>
          </div>

          {/* ── ACCENT STRIPE ── */}
          <div style={{ height: '4px', background: 'linear-gradient(90deg, #68dbae 0%, #00694c 40%, #145da3 100%)' }} />

          {/* ── TITLE + FILTER SUMMARY ── */}
          <div style={{ padding: '28px 48px 20px', borderBottom: '1px solid #e9e8e4' }}>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#1A1917', letterSpacing: '-0.3px' }}>Candidate Intelligence Ranking</h1>
            <p style={{ margin: '5px 0 16px', fontSize: '13px', color: '#6B6960' }}>AI-driven analysis of {filteredCandidates.length} applicants across active job descriptions</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[
                { label: 'Department', value: selectedDept },
                { label: 'Min Score', value: `${minScore}+` },
                { label: 'Status', value: statusFilter },
                { label: 'Strength', value: strengthFilter }
              ].map(f => (
                <div key={f.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', background: '#f5f4f0', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.08)' }}>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: '#A8A69E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}:</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#1A1917' }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RANKINGS TABLE ── */}
          <div style={{ padding: '0 48px 32px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '24px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e9e8e4', background: '#f5f4f0' }}>
                  {['Rank', 'Candidate', 'Score', 'Strength', 'Role / Dept', 'Key Matched Skills', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#A8A69E', textAlign: h === 'Score' ? 'center' : 'left', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.map((cand, idx) => {
                  const score = Math.round(cand.score || 0);
                  const isTop = idx === 0;
                  const scoreColor = score >= 85 ? '#00694c' : score >= 70 ? '#145da3' : '#C0392B';
                  const strengthColor = cand.strength === 'High' ? '#00694c' : cand.strength === 'Med' ? '#BA7517' : '#C0392B';
                  const strengthBg = cand.strength === 'High' ? '#E1F5EE' : cand.strength === 'Med' ? '#FAEEDA' : '#FDECEA';
                  const statusColor = cand.status === 'Shortlisted' ? '#00694c' : '#6B6960';
                  const statusBg = cand.status === 'Shortlisted' ? '#E1F5EE' : '#f5f4f0';
                  return (
                    <tr key={cand.id} style={{ borderBottom: '1px solid #e9e8e4', background: isTop ? 'rgba(0,105,76,0.04)' : (idx % 2 === 0 ? '#ffffff' : '#faf9f5') }}>
                      <td style={{ padding: '14px', verticalAlign: 'middle' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: isTop ? '#00694c' : idx === 1 ? '#145da3' : '#f5f4f0', color: isTop || idx === 1 ? '#ffffff' : '#6B6960', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>#{idx + 1}</div>
                      </td>
                      <td style={{ padding: '14px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', color: '#1A1917' }}>{cand.name}</div>
                        <div style={{ fontSize: '11px', color: '#A8A69E', marginTop: '2px' }}>{cand.email || '—'}</div>
                      </td>
                      <td style={{ padding: '14px', verticalAlign: 'middle', textAlign: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: scoreColor }}>{score}%</span>
                      </td>
                      <td style={{ padding: '14px', verticalAlign: 'middle' }}>
                        <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: strengthColor, background: strengthBg }}>{cand.strength || '—'}</span>
                      </td>
                      <td style={{ padding: '14px', verticalAlign: 'middle' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#1A1917' }}>{cand.jobTitle || '—'}</div>
                        <div style={{ fontSize: '11px', color: '#A8A69E', marginTop: '2px' }}>{cand.department || '—'}</div>
                      </td>
                      <td style={{ padding: '14px', verticalAlign: 'middle', maxWidth: '160px' }}>
                        <div style={{ fontSize: '11px', color: '#006c4e' }}>{(cand.matchedSkills || []).join(', ') || '—'}</div>
                      </td>
                      <td style={{ padding: '14px', verticalAlign: 'middle' }}>
                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: statusColor, background: statusBg, border: `1px solid ${cand.status === 'Shortlisted' ? 'rgba(0,105,76,0.2)' : 'rgba(0,0,0,0.08)'}` }}>{cand.status || 'Pending'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── STATS SUMMARY STRIP ── */}
          <div style={{ margin: '0 48px 32px', padding: '18px 24px', background: '#f5f4f0', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.07)', display: 'flex', gap: '0' }}>
            {[
              { label: 'Total Candidates', value: filteredCandidates.length },
              { label: 'Shortlisted', value: filteredCandidates.filter(c => c.status === 'Shortlisted').length, color: '#00694c' },
              { label: 'Avg Score', value: filteredCandidates.length > 0 ? Math.round(filteredCandidates.reduce((s, c) => s + (c.score || 0), 0) / filteredCandidates.length) + '%' : 'N/A', color: '#145da3' },
              { label: 'High Strength', value: filteredCandidates.filter(c => c.strength === 'High').length, color: '#00694c' },
              { label: 'Report Date', value: new Date().toLocaleDateString('en-GB') }
            ].map((stat, i, arr) => (
              <div key={stat.label} style={{ flex: '1', minWidth: '80px', padding: '0 20px', borderRight: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.09)' : 'none' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, color: '#A8A69E', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{stat.label}</div>
                <div style={{ fontSize: '20px', fontWeight: 700, color: stat.color || '#1A1917', letterSpacing: '-0.5px' }}>{stat.value}</div>
              </div>
            ))}
          </div>

          {/* ── FOOTER ── */}
          <div style={{ padding: '18px 48px', borderTop: '1px solid #e9e8e4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '20px', height: '20px', background: '#00694c', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B6960' }}>© {new Date().getFullYear()} RecruitAI · Intelligence in Hiring</span>
            </div>
            <div style={{ fontSize: '11px', color: '#A8A69E' }}>Confidential — For internal use only · Page 1 of 1</div>
          </div>

        </div>
      </div>
    , document.body)}

    </>
  );
};

export default Candidates;
