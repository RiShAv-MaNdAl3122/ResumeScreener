import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const getScoreColorClass = (score) => {
    if (score >= 90) return 'text-primary';
    if (score >= 70) return 'text-tertiary';
    return 'text-danger';
  };

  useEffect(() => {
    let active = true;
    const fetchStats = async () => {
      try {
        const res = await dashboardService.getStats();
        if (active && res.success) {
          setStats(res.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchStats();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-lg animate-pulse p-4">
        {/* Row 1: Metrics Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md mb-gap-lg">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-surface p-card-padding rounded-[14px] border border-border-subtle h-32">
              <div className="h-6 bg-surface-container rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-surface-container rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-surface-container rounded w-1/4"></div>
            </div>
          ))}
        </div>
        {/* Row 2 Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-md mb-gap-lg">
          <div className="lg:col-span-1 bg-surface rounded-[14px] border border-border-subtle h-[400px] p-5">
            <div className="h-6 bg-surface-container rounded w-1/2 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-container"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-surface-container rounded w-3/4"></div>
                    <div className="h-3 bg-surface-container rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 bg-surface rounded-[14px] border border-border-subtle h-[400px] p-5 flex flex-col justify-between">
            <div className="h-6 bg-surface-container rounded w-1/3 mb-8"></div>
            <div className="flex items-end justify-between h-48 border-b border-border-subtle mb-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-12 bg-surface-container rounded-t" style={{ height: `${i * 20}%` }}></div>
                  <div className="h-4 bg-surface-container rounded w-10 mt-1"></div>
                </div>
              ))}
            </div>
            <div className="h-4 bg-surface-container rounded w-1/4"></div>
          </div>
        </div>
        {/* Row 3 Skeletons */}
        <div className="bg-surface rounded-[14px] border border-border-subtle h-[300px] p-5">
          <div className="h-6 bg-surface-container rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-10 bg-surface-container rounded"></div>
            <div className="h-12 bg-surface-container rounded"></div>
            <div className="h-12 bg-surface-container rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const metrics = stats?.metrics || { activeJobs: 0, resumesProcessed: 0, avgMatchScore: 0, shortlisted: 0 };
  const recentActivity = stats?.recentActivity || [];
  
  const distUnder70 = stats?.scoreDistribution?.under70 || 0;
  const dist70to79 = stats?.scoreDistribution?.between70and79 || 0;
  const dist80to89 = stats?.scoreDistribution?.between80and89 || 0;
  const distAbove90 = stats?.scoreDistribution?.above90 || 0;
  const totalScreenedCount = metrics.resumesProcessed || (distUnder70 + dist70to79 + dist80to89 + distAbove90);
  
  const pctUnder70 = totalScreenedCount > 0 ? Math.round((distUnder70 / totalScreenedCount) * 100) : 0;
  const pct70to79 = totalScreenedCount > 0 ? Math.round((dist70to79 / totalScreenedCount) * 100) : 0;
  const pct80to89 = totalScreenedCount > 0 ? Math.round((dist80to89 / totalScreenedCount) * 100) : 0;
  const pctAbove90 = totalScreenedCount > 0 ? Math.round((distAbove90 / totalScreenedCount) * 100) : 0;

  const topCandidates = stats?.topCandidates || [];

  return (
    <div className="flex flex-col gap-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Row 1: Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
        {/* Metric Card 1 */}
        <div className="bg-surface p-card-padding rounded-[14px] border border-border-subtle hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-accent-soft rounded-lg">
              <span className="material-symbols-outlined text-primary text-[20px]">work</span>
            </div>
          </div>
          <p className="text-text-secondary font-label-caps uppercase mb-1">Active Jobs</p>
          <p className="font-display-metric text-display-metric">{metrics.activeJobs}</p>
        </div>

        {/* Metric Card 2 */}
        <div className="bg-surface p-card-padding rounded-[14px] border border-border-subtle hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-surface-container rounded-lg">
              <span className="material-symbols-outlined text-secondary text-[20px]">description</span>
            </div>
          </div>
          <p className="text-text-secondary font-label-caps uppercase mb-1">Resumes Processed</p>
          <p className="font-display-metric text-display-metric">{metrics.resumesProcessed}</p>
        </div>

        {/* Metric Card 3 */}
        <div className="bg-surface p-card-padding rounded-[14px] border border-border-subtle hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-warning-soft rounded-lg">
              <span className="material-symbols-outlined text-warning text-[20px]">insights</span>
            </div>
          </div>
          <p className="text-text-secondary font-label-caps uppercase mb-1">Avg Match Score</p>
          <p className={`font-display-metric text-display-metric ${getScoreColorClass(metrics.avgMatchScore)}`}>{metrics.avgMatchScore}%</p>
        </div>

        {/* Metric Card 4 */}
        <div className="bg-surface p-card-padding rounded-[14px] border border-border-subtle hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-primary-container/10 rounded-lg">
              <span className="material-symbols-outlined text-primary text-[20px]">verified</span>
            </div>
          </div>
          <p className="text-text-secondary font-label-caps uppercase mb-1">Shortlisted</p>
          <p className="font-display-metric text-display-metric">{metrics.shortlisted}</p>
        </div>
      </div>

      {/* Row 2: Activity & Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-md">
        {/* Recent Activity */}
        <div className="lg:col-span-1 bg-surface rounded-[14px] border border-border-subtle flex flex-col h-[400px]">
          <div className="px-5 py-4 border-b border-border-subtle flex justify-between items-center">
            <h2 className="font-title-page text-title-page">Recent Activity</h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-5">
            {recentActivity.length > 0 ? (
              recentActivity.map((act, index) => (
                <div key={index} className="flex gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">notifications</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-body-standard">{act.message}</p>
                    <p className="text-[11px] text-text-muted mt-1 font-data-mono">
                      {new Date(act.timestamp).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-text-muted text-center py-8">No recent activity</p>
            )}
          </div>
        </div>

        {/* Score Distribution */}
        <div className="lg:col-span-2 bg-surface rounded-[14px] border border-border-subtle p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-title-page text-title-page">Score Distribution</h2>
              <div className="px-3 py-1 bg-surface-container text-[11px] font-label-caps rounded-full text-text-secondary border border-border-subtle">
                {totalScreenedCount} Resumes Processed
              </div>
            </div>
            {/* SVG/Tailwind Vertical Bar Chart */}
            <div className="flex items-end justify-between h-48 px-6 pt-4 border-b border-border-subtle mb-4">
              {[
                { label: '<70%', count: distUnder70, percent: pctUnder70, color: 'bg-gradient-to-t from-rose-500 to-rose-400' },
                { label: '70-79%', count: dist70to79, percent: pct70to79, color: 'bg-gradient-to-t from-amber-500 to-amber-400' },
                { label: '80-89%', count: dist80to89, percent: pct80to89, color: 'bg-gradient-to-t from-blue-600 to-sky-400' },
                { label: '90%+', count: distAbove90, percent: pctAbove90, color: 'bg-gradient-to-t from-emerald-600 to-teal-400' },
              ].map((bar, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 group flex-1">
                  <div className="relative w-full flex justify-center items-end h-36">
                    {/* Tooltip on hover */}
                    <span className="absolute -top-7 scale-0 group-hover:scale-100 transition-all bg-text-primary text-white text-[10px] px-2 py-0.5 rounded font-data-mono-sm z-10 whitespace-nowrap shadow-md">
                      {bar.count} candidates ({bar.percent}%)
                    </span>
                    <div 
                      className={`w-12 rounded-t transition-all duration-500 ease-out group-hover:opacity-90 ${bar.color}`}
                      style={{ height: totalScreenedCount > 0 ? `${bar.percent}%` : '0%' }}
                    ></div>
                  </div>
                  <span className="text-[11px] font-body-bold text-text-secondary mt-1">{bar.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-[12px] text-text-muted mt-2">
            <span>Average Screening Score</span>
            <span className="font-body-bold text-primary text-[14px]">{metrics.avgMatchScore}%</span>
          </div>
        </div>
      </div>

      {/* Row 3: Top Candidates Table */}
      <div className="bg-surface rounded-[14px] border border-border-subtle overflow-hidden">
        <div className="px-5 py-4 border-b border-border-subtle flex justify-between items-center bg-surface">
          <h2 className="font-title-page text-title-page">Top Candidates</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-border-subtle">
                <th className="px-6 py-4 font-label-caps text-text-muted uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4 font-label-caps text-text-muted uppercase tracking-wider">Candidate</th>
                <th className="px-6 py-4 font-label-caps text-text-muted uppercase tracking-wider">Applied Roles</th>
                <th className="px-6 py-4 font-label-caps text-text-muted uppercase tracking-wider text-center">Avg Score</th>
                <th className="px-6 py-4 font-label-caps text-text-muted uppercase tracking-wider">Skill Match</th>
                <th className="px-6 py-4 font-label-caps text-text-muted uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {topCandidates.length > 0 ? (
                topCandidates.map((cand, idx) => {
                  const rank = `#${String(idx + 1).padStart(2, '0')}`;
                  const score = Math.round(cand.score || 0);
                  const dashOffset = 100 - score;
                  return (
                    <tr key={cand.id} className="hover:bg-surface-container-low transition-colors group">
                      <td className="px-6 py-4 font-data-mono text-primary font-bold">{rank}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center text-primary font-bold text-[10px] uppercase">
                            {cand.photoUrl ? (
                              <img alt={cand.name} className="w-full h-full object-cover" src={cand.photoUrl} />
                            ) : (
                              <span>{cand.avatar || cand.name.split(' ').map(n => n[0]).join('').toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-body-bold text-[13px]">{cand.name}</p>
                            <p className="text-[11px] text-text-muted">{cand.strength || 'Good'} Match</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {(() => {
                            const roles = cand.jobTitle ? cand.jobTitle.split(', ') : [];
                            const displayedRoles = roles.slice(0, 3);
                            const remaining = roles.length - 3;
                            return (
                              <>
                                {displayedRoles.map((role, rIdx) => (
                                  <span key={rIdx} className="bg-accent-soft text-primary text-[11px] px-2 py-1 rounded-md font-body-bold whitespace-nowrap">
                                    {role}
                                  </span>
                                ))}
                                {remaining > 0 && (
                                  <span className="bg-surface-container-high text-text-secondary text-[11px] px-2 py-1 rounded-md font-body-bold whitespace-nowrap">
                                    +{remaining}
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center justify-center relative w-10 h-10">
                          <svg className="w-full h-full -rotate-90">
                            <circle className="text-surface-container" cx="20" cy="20" fill="transparent" r="16" stroke="currentColor" strokeWidth="3"></circle>
                            <circle className={getScoreColorClass(score)} cx="20" cy="20" fill="transparent" r="16" stroke="currentColor" strokeDasharray="100" strokeDashoffset={dashOffset} strokeWidth="3"></circle>
                          </svg>
                          <span className={`absolute text-[11px] font-data-mono font-bold ${getScoreColorClass(score)}`}>{score}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 min-w-[200px]">
                        <div className="flex flex-wrap gap-1 max-w-[300px]">
                          {cand.matchedSkills && cand.matchedSkills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 bg-accent-soft text-primary-container text-[11px] font-body-bold rounded-full whitespace-nowrap"
                            >
                              {skill}
                            </span>
                          ))}
                          {cand.matchedSkills && cand.matchedSkills.length > 3 && (
                            <span className="px-2 py-0.5 bg-surface-container-high text-text-secondary text-[11px] font-body-bold rounded-full whitespace-nowrap">
                              +{cand.matchedSkills.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link to={`/candidate/${cand.id}`} className="px-3 py-1.5 bg-primary text-on-primary text-[12px] font-body-bold rounded-lg hover:bg-accent-hover transition-colors inline-block">
                          Review
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-text-muted">No candidates screened yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Floating Action Button */}
      <Link to="/jobs" className="fixed bottom-8 right-8 bg-primary text-on-primary flex items-center gap-2 px-6 py-4 rounded-full shadow-[0_12px_32px_rgba(0,105,76,0.25)] hover:bg-accent-hover hover:scale-105 transition-all z-50">
        <span className="material-symbols-outlined">add</span>
        <span className="font-body-bold text-body-standard">Create New JD</span>
      </Link>
    </div>
  );
};

export default Dashboard;
