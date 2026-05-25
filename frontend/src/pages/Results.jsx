import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { candidatesService, jobsService } from '../services/api';

const Results = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const jobIdParam = searchParams.get('jobId');

  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState(jobIdParam || 'All Jobs');

  useEffect(() => {
    const jobId = searchParams.get('jobId');
    if (jobId) {
      setSelectedJob(jobId);
    } else {
      setSelectedJob('All Jobs');
    }
  }, [searchParams]);

  const handleJobSelectChange = (e) => {
    const value = e.target.value;
    setSelectedJob(value);
    if (value === 'All Jobs') {
      setSearchParams({});
    } else {
      setSearchParams({ jobId: value });
    }
  };
  const [minScore, setMinScore] = useState(70);
  const [statusFilter, setStatusFilter] = useState('All');
  const [strengthFilter, setStrengthFilter] = useState('All');

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      try {
        const [candRes, jobsRes] = await Promise.all([
          candidatesService.listCandidates(searchQuery),
          jobsService.listJobs()
        ]);
        if (active) {
          if (candRes.success) setCandidates(candRes.data);
          if (jobsRes.success) setJobs(jobsRes.data);
        }
      } catch (err) {
        console.error('Error loading results data:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    
    const delayDebounceFn = setTimeout(() => {
      loadData();
    }, 400);

    return () => {
      active = false;
      clearTimeout(delayDebounceFn);
    };
  }, [searchQuery]);

  const handleStatusChange = async (id, status) => {
    try {
      const res = await candidatesService.updateCandidateStatus(id, status);
      if (res.success) {
        toast.success(`Status updated to ${status}`);
        setCandidates(prev => prev.map(c => c.id === id ? { ...c, status } : c));
      }
    } catch (err) {
      console.error('Error changing candidate status:', err);
    }
  };

  const handleDownloadResume = async (candidate) => {
    if (candidate.resumeFile) {
      const originalName = candidate.resumeFile.file_name || candidate.resumeFile.stored_file_name || '';
      const extension = originalName.substring(originalName.lastIndexOf('.')) || '.pdf';
      const cleanName = candidate.name.trim().toLowerCase().replace(/\s+/g, '-');
      const downloadName = `${cleanName}-cv${extension}`;

      try {
        let fileUrl = `http://localhost:5000/uploads/CVs/${candidate.resumeFile.stored_file_name || candidate.resumeFile.file_name}`;
        let response = await fetch(fileUrl);
        if (!response.ok) {
          // Fallback to the root uploads folder for older files
          const fallbackUrl = `http://localhost:5000/uploads/${candidate.resumeFile.stored_file_name || candidate.resumeFile.file_name}`;
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
      toast.error('Resume file not available for this candidate');
    }
  };

  // Filter logic
  const filteredCandidates = candidates.filter(c => {
    const matchesScore = c.score >= minScore;
    const matchesStatus = statusFilter === 'All' || 
      c.status === statusFilter || 
      (statusFilter === 'Reviewing' && c.status === 'Under Review');
    const matchesStrength = strengthFilter === 'All' || c.strength === strengthFilter;
    const matchesJob = selectedJob === 'All Jobs' || String(c.jobId) === String(selectedJob);
    return matchesScore && matchesStatus && matchesStrength && matchesJob;
  });

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-primary';
    if (score >= 70) return 'text-tertiary';
    return 'text-danger';
  };

  const getScoreCircleClass = (score) => {
    if (score >= 90) return 'text-primary';
    if (score >= 70) return 'text-tertiary';
    return 'text-danger';
  };

  // Filter candidates for analytics based on job filter
  const analyticsCandidates = selectedJob === 'All Jobs' 
    ? candidates 
    : candidates.filter(c => String(c.jobId) === String(selectedJob));

  const totalCount = analyticsCandidates.length;
  const procTime = totalCount > 0 ? `${(totalCount * 1.2).toFixed(1)}s` : '--';
  const shortlistedCount = analyticsCandidates.filter(c => c.status === 'Shortlisted').length;
  const shortlistRate = totalCount > 0 ? Math.round((shortlistedCount / totalCount) * 100) : 0;
  const topScore = totalCount > 0 ? Math.max(...analyticsCandidates.map(c => c.score)).toFixed(2) : '0.00';
  const avgScore = totalCount > 0 ? Math.round(analyticsCandidates.reduce((sum, c) => sum + c.score, 0) / totalCount) : 0;
  const rejectedCount = analyticsCandidates.filter(c => c.status === 'Rejected').length;

  // Calculate score distribution
  const distUnder70 = analyticsCandidates.filter(c => c.score < 70).length;
  const dist70to79 = analyticsCandidates.filter(c => c.score >= 70 && c.score < 80).length;
  const dist80to89 = analyticsCandidates.filter(c => c.score >= 80 && c.score < 90).length;
  const distAbove90 = analyticsCandidates.filter(c => c.score >= 90).length;

  const pctUnder70 = totalCount > 0 ? Math.round((distUnder70 / totalCount) * 100) : 0;
  const pct70to79 = totalCount > 0 ? Math.round((dist70to79 / totalCount) * 100) : 0;
  const pct80to89 = totalCount > 0 ? Math.round((dist80to89 / totalCount) * 100) : 0;
  const pctAbove90 = totalCount > 0 ? Math.round((distAbove90 / totalCount) * 100) : 0;

  // Skill possession counts (for Common Skill Gaps)
  const skillPossessionCounts = {};
  analyticsCandidates.forEach(c => {
    if (c.matchedSkills && Array.isArray(c.matchedSkills)) {
      c.matchedSkills.forEach(s => {
        if (!skillPossessionCounts[s]) {
          skillPossessionCounts[s] = { possessed: 0, totalRequired: 0 };
        }
        skillPossessionCounts[s].possessed += 1;
        skillPossessionCounts[s].totalRequired += 1;
      });
    }
    if (c.missingSkills && Array.isArray(c.missingSkills)) {
      c.missingSkills.forEach(s => {
        if (!skillPossessionCounts[s]) {
          skillPossessionCounts[s] = { possessed: 0, totalRequired: 0 };
        }
        skillPossessionCounts[s].totalRequired += 1;
      });
    }
  });

  const skillGapsList = Object.keys(skillPossessionCounts).map(skill => {
    const { possessed, totalRequired } = skillPossessionCounts[skill];
    const percentage = totalRequired > 0 ? Math.round((possessed / totalRequired) * 100) : 0;
    return { skill, percentage };
  });

  // Sort ascending (lowest percentage first, meaning biggest gaps first)
  skillGapsList.sort((a, b) => a.percentage - b.percentage);

  return (
    <div className="flex flex-col gap-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header & Global Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md">
        <div>
          <nav className="flex items-center gap-2 text-text-muted mb-2">
            <span className="text-[12px] font-label-caps uppercase font-bold">Analytics</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[12px] font-label-caps text-primary uppercase font-bold">Match Performance</span>
          </nav>
          <h2 className="font-display-metric text-display-metric text-text-primary">Match Performance Analytics</h2>
          <p className="text-body-standard text-text-secondary">
            Match scoring and skill alignment analytics for{' '}
            <span className="font-body-bold text-primary">
              {selectedJob === 'All Jobs' ? 'All Active Jobs' : (jobs.find(j => String(j.id) === selectedJob)?.title || 'Selected Job')}
            </span>
          </p>
        </div>
      </div>

      {/* Sleek Filter Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-surface border border-border-subtle rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-text-muted">filter_alt</span>
          <span className="text-body-standard font-body-bold text-text-primary">Filter Analytics by Job Description:</span>
        </div>
        <div className="relative w-full sm:w-72">
          <select 
            value={selectedJob}
            onChange={handleJobSelectChange}
            className="w-full bg-surface-container-low border border-border-subtle rounded-lg py-2 pl-3 pr-8 text-body-standard focus:ring-2 focus:ring-primary/20 appearance-none outline-none cursor-pointer text-text-primary font-body-medium"
          >
            <option value="All Jobs">All Jobs</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted text-[18px]">
            expand_more
          </span>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-md">
        {[
          { label: 'Total Resumes', value: totalCount, icon: 'description', color: 'text-primary' },
          { label: 'Avg Proc. Time', value: procTime, icon: 'schedule', color: 'text-secondary' },
          { label: 'Shortlist Rate', value: `${shortlistRate}%`, icon: 'verified', color: 'text-primary' },
          { label: 'Top Score', value: `${topScore}%`, icon: 'star', color: 'text-warning' },
          { 
            label: 'Avg Score', 
            value: `${avgScore}%`, 
            icon: 'insights', 
            color: getScoreColor(avgScore),
            isAvgScore: true
          },
          { label: 'Rejected', value: rejectedCount, icon: 'cancel', color: 'text-danger' }
        ].map((kpi, idx) => (
          <div key={idx} className="bg-surface border border-border-subtle rounded-xl p-4 shadow-sm flex flex-col justify-between hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] transition-all">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-label-caps text-text-muted uppercase font-bold tracking-wider">{kpi.label}</span>
              <span className={`material-symbols-outlined text-[18px] ${kpi.color}`}>{kpi.icon}</span>
            </div>
            <p className={`font-display-metric text-[22px] font-bold leading-none mt-1 ${kpi.isAvgScore ? kpi.color : 'text-text-primary'}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Analytics Footer Charts / Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {/* Match Score Distribution */}
        <div className="bg-surface border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-body-bold text-text-primary">Match Score Distribution</h3>
                <p className="text-[12px] text-text-muted">Distribution of match scores across screened candidates</p>
              </div>
              <span className="material-symbols-outlined text-text-muted">analytics</span>
            </div>

            {/* SVG Vertical Bar Chart */}
            <div className="flex items-end justify-between h-44 px-4 pt-4 border-b border-border-subtle">
              {[
                { label: '<70%', count: distUnder70, percent: pctUnder70, color: 'bg-gradient-to-t from-rose-500 to-rose-400' },
                { label: '70-79%', count: dist70to79, percent: pct70to79, color: 'bg-gradient-to-t from-amber-500 to-amber-400' },
                { label: '80-89%', count: dist80to89, percent: pct80to89, color: 'bg-gradient-to-t from-blue-600 to-sky-400' },
                { label: '90%+', count: distAbove90, percent: pctAbove90, color: 'bg-gradient-to-t from-emerald-600 to-teal-400' },
              ].map((bar, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 group flex-1">
                  <div className="relative w-full flex justify-center items-end h-32">
                    {/* Tooltip on hover */}
                    <span className="absolute -top-7 scale-0 group-hover:scale-100 transition-all bg-text-primary text-white text-[10px] px-2 py-0.5 rounded font-data-mono-sm z-10 whitespace-nowrap shadow-md">
                      {bar.count} candidates ({bar.percent}%)
                    </span>
                    <div 
                      className={`w-10 rounded-t transition-all duration-500 ease-out group-hover:opacity-90 ${bar.color}`}
                      style={{ height: totalCount > 0 ? `${bar.percent}%` : '0%' }}
                    ></div>
                  </div>
                  <span className="text-[11px] font-body-bold text-text-secondary mt-1">{bar.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[12px] text-text-muted">
            <span>Total Screened: {totalCount} Candidates</span>
            <span className={`font-body-bold ${getScoreColor(avgScore)}`}>Avg Score: {avgScore}%</span>
          </div>
        </div>

        {/* Common Skill Gaps */}
        <div className="bg-surface border border-border-subtle rounded-xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-body-bold text-text-primary">Common Skill Gaps</h3>
                <p className="text-[12px] text-text-muted">% of candidates who possess this skill</p>
              </div>
              <span className="material-symbols-outlined text-text-muted">warning</span>
            </div>

            <div className="flex flex-col gap-4 py-2">
              {skillGapsList.slice(0, 6).map((item, idx) => {
                let barColor = 'bg-gradient-to-r from-emerald-500 to-teal-400';
                if (item.percentage < 50) barColor = 'bg-gradient-to-r from-rose-500 to-red-400';
                else if (item.percentage < 75) barColor = 'bg-gradient-to-r from-amber-500 to-orange-400';
                
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-[12px] font-body-bold text-text-secondary mb-1">
                      <span>{item.skill}</span>
                      <span className="font-data-mono">{item.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                      <div className={`h-full ${barColor} rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                    </div>
                  </div>
                );
              })}
              {skillGapsList.length === 0 && (
                <p className="text-text-muted text-center py-8">No skills data available</p>
              )}
            </div>
          </div>
          <div className="mt-4 border-t border-border-subtle pt-4 flex items-center gap-2 text-[12px] text-text-secondary">
            <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
            <span>Skills extracted from candidate CVs relative to job description requirements.</span>
          </div>
        </div>
      </div>

      {/* Job Description Performance Table */}
      <div className="bg-surface border border-border-subtle rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border-subtle bg-surface">
          <h3 className="font-body-bold text-text-primary text-[15px]">Job Description Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-border-subtle">
                <th className="px-6 py-4 text-[11px] font-label-caps text-text-muted tracking-widest uppercase">Job Description</th>
                <th className="px-6 py-4 text-[11px] font-label-caps text-text-muted tracking-widest uppercase">Dept</th>
                <th className="px-6 py-4 text-[11px] font-label-caps text-text-muted tracking-widest uppercase text-center">Resumes</th>
                <th className="px-6 py-4 text-[11px] font-label-caps text-text-muted tracking-widest uppercase text-center">Avg Score</th>
                <th className="px-6 py-4 text-[11px] font-label-caps text-text-muted tracking-widest uppercase text-center">Shortlisted</th>
                <th className="px-6 py-4 text-[11px] font-label-caps text-text-muted tracking-widest uppercase text-center">Conversion</th>
                <th className="px-6 py-4 text-[11px] font-label-caps text-text-muted tracking-widest uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {jobs.map((job) => {
                const jobCandidates = candidates.filter(c => String(c.jobId) === String(job.id));
                const resumes = jobCandidates.length;
                const avgScore = resumes > 0
                  ? Math.round(jobCandidates.reduce((sum, c) => sum + (c.score || 0), 0) / resumes)
                  : 0;
                const shortlisted = jobCandidates.filter(c => c.status === 'Shortlisted').length;
                const conversion = resumes > 0
                  ? `${Math.round((shortlisted / resumes) * 100)}%`
                  : '0%';
                
                return (
                  <tr key={job.id} className="hover:bg-background transition-colors">
                    <td className="px-6 py-4 font-body-bold text-text-primary">{job.title}</td>
                    <td className="px-6 py-4 text-text-muted text-sm">{job.department}</td>
                    <td className="px-6 py-4 text-center font-data-mono">{resumes}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-data-mono font-bold ${getScoreColor(avgScore)}`}>
                        {resumes > 0 ? `${avgScore}%` : '--'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-data-mono">{shortlisted}</td>
                    <td className="px-6 py-4 text-center font-data-mono text-text-secondary">{resumes > 0 ? conversion : '--'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 border text-[11px] font-label-caps rounded-full ${
                        job.status === 'Active'
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : 'bg-surface-container-high text-text-secondary border-border-subtle'
                      }`}>
                        {job.status || 'Active'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-text-muted text-sm bg-surface">
                    No jobs found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Results;
