import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { JobEditModal } from '../components/JobEditModal';
import { jobsService } from '../services/api';

const getScoreColorClass = (avgScore) => {
  if (!avgScore || avgScore === '--') return 'text-text-muted';
  const score = parseFloat(avgScore);
  if (isNaN(score)) return 'text-text-muted';
  if (score >= 90) return 'text-primary';
  if (score >= 70) return 'text-tertiary';
  return 'text-danger';
};

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [selectedJobForView, setSelectedJobForView] = useState(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await jobsService.listJobs();
      if (res.success && res.data) {
        setJobs(res.data);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesFilter = filter === 'All' || job.status === filter;
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (job.department && job.department.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleSaveJob = async (jobData) => {
    try {
      if (editingJob) {
        const res = await jobsService.updateJob(editingJob.id, jobData);
        if (res.success) {
          setJobs(jobs.map(job => job.id === editingJob.id ? res.data : job));
        }
      } else {
        const res = await jobsService.createJob(jobData);
        if (res.success) {
          setJobs([res.data, ...jobs]);
        }
      }
      setEditingJob(null);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to save job:', err);
    }
  };

  const handleDeleteJob = async (id) => {
    if (window.confirm('Are you sure you want to delete this job description and all its candidate results? This action cannot be undone.')) {
      try {
        const res = await jobsService.deleteJob(id);
        if (res.success) {
          setJobs(jobs.filter(job => job.id !== id));
          toast.success('Job deleted successfully!');
        }
      } catch (err) {
        console.error('Failed to delete job:', err);
      }
    }
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setShowCreateModal(true);
  };

  const handleCreateNewJob = () => {
    setEditingJob(null);
    setShowCreateModal(true);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-md mb-8">
        <div>
          <h2 className="font-headline-auth text-headline-auth text-text-primary tracking-tight">Job Descriptions</h2>
          <p className="text-text-secondary text-body-standard mt-1">Manage and optimize your organization's hiring criteria.</p>
        </div>
        <button 
          onClick={handleCreateNewJob}
          className="bg-primary hover:bg-accent-hover text-on-primary px-6 py-2.5 rounded-lg flex items-center gap-xs transition-all shadow-sm font-body-bold"
        >
          <span className="material-symbols-outlined font-bold">add</span>
          <span>Create New JD</span>
        </button>
      </div>

      {/* Filters Bar & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-6">
        <div className="flex items-center gap-2 p-1 bg-surface-container-low rounded-xl border border-border-subtle w-fit">
          <button 
            onClick={() => setFilter('All')}
            className={`px-6 py-2 rounded-lg text-body-standard transition-all ${
              filter === 'All' ? 'bg-surface text-primary shadow-sm font-body-bold' : 'text-text-secondary hover:text-primary'
            }`}
          >
            All Descriptions
          </button>
          <button 
            onClick={() => setFilter('Active')}
            className={`px-6 py-2 rounded-lg text-body-standard transition-all ${
              filter === 'Active' ? 'bg-surface text-primary shadow-sm font-body-bold' : 'text-text-secondary hover:text-primary'
            }`}
          >
            Active
          </button>
          <button 
            onClick={() => setFilter('Draft')}
            className={`px-6 py-2 rounded-lg text-body-standard transition-all ${
              filter === 'Draft' ? 'bg-surface text-primary shadow-sm font-body-bold' : 'text-text-secondary hover:text-primary'
            }`}
          >
            Drafts
          </button>
        </div>

        <div className="relative w-full sm:max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">search</span>
          <input 
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border-strong rounded-lg text-body-standard focus:outline-none focus:border-primary transition-all" 
            placeholder="Search jobs..." 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Job Cards Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : filteredJobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gap-lg">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-surface border border-border-subtle rounded-[14px] p-card-padding hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all group flex flex-col justify-between min-h-[300px]">
              <div>
                {/* Header with Status & Menu */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-label-caps uppercase tracking-wider font-bold ${
                    job.status === 'Active' ? 'bg-accent-soft text-primary' : 'bg-surface-container-highest text-text-secondary'
                  }`}>
                    {job.status}
                  </span>
                </div>

                {/* Job Title & Department */}
                <h3 className="font-title-page text-title-page text-text-primary mb-1 group-hover:text-primary transition-colors leading-tight">
                  {job.title}
                </h3>
                <p className="text-text-secondary text-body-standard mb-4">{job.department}</p>

                {/* Description Preview */}
                <div className="mb-6 p-3 bg-surface-container-low rounded-lg border border-border-subtle">
                  <p className="text-text-muted text-[10px] font-label-caps uppercase mb-2 font-bold">Description</p>
                  <p className="text-text-secondary text-[12px] line-clamp-3 leading-snug">
                    {job.description}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-md">
                  <div className="bg-surface-container-low p-3 rounded-lg border border-border-subtle">
                    <p className="text-text-muted text-[10px] font-label-caps uppercase mb-1 font-bold">Candidates</p>
                    <p className="font-display-metric text-display-metric text-text-primary leading-none">
                      {job.candidates}
                    </p>
                  </div>
                  <div className="bg-surface-container-low p-3 rounded-lg border border-border-subtle">
                    <p className="text-text-muted text-[10px] font-label-caps uppercase mb-1 font-bold">Avg Score</p>
                    <p className={`font-data-mono text-display-metric leading-none ${getScoreColorClass(job.avgScore)}`}>
                      {job.avgScore}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-2 text-[11px] text-text-muted">
                  <div>
                    <p className="font-label-caps uppercase font-bold text-[9px] mb-0.5">Created</p>
                    <p>{new Date(job.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="font-label-caps uppercase font-bold text-[9px] mb-0.5">Updated</p>
                    <p>{new Date(job.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button 
                    onClick={() => handleEditJob(job)}
                    className="flex-1 bg-surface border border-border-strong text-text-primary py-2 px-3 rounded-md font-body-bold text-[13px] hover:bg-surface-container transition-all flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    <span>Edit</span>
                  </button>
                  <Link 
                    to={`/results?jobId=${job.id}`} 
                    className="flex-1 bg-primary text-on-primary py-2 px-3 rounded-md font-body-bold text-[13px] hover:bg-accent-hover transition-all flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    <span>Results</span>
                  </Link>
                  <button 
                    onClick={() => handleDeleteJob(job.id)}
                    className="bg-surface border border-danger/30 text-danger p-2 rounded-md hover:bg-danger-soft transition-all flex items-center justify-center"
                    title="Delete Job"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="mt-12 flex flex-col items-center justify-center py-20 bg-surface border border-dashed border-border-strong rounded-3xl text-center">
          <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-text-muted text-4xl">description</span>
          </div>
          <h4 className="font-headline-auth text-headline-auth text-text-primary mb-2">No Job Descriptions Found</h4>
          <p className="text-text-secondary max-w-sm mb-8">
            It looks like you haven't created any job descriptions yet. Start by creating one to begin screening candidates with AI.
          </p>
          <button 
            onClick={handleCreateNewJob}
            className="bg-primary hover:bg-accent-hover text-on-primary px-8 py-3 rounded-lg flex items-center gap-xs transition-all shadow-md font-body-bold"
          >
            <span className="material-symbols-outlined font-bold">add</span>
            <span>Create Your First JD</span>
          </button>
        </div>
      )}

      {/* Job Edit Modal */}
      <JobEditModal 
        job={editingJob}
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setEditingJob(null);
        }}
        onSave={handleSaveJob}
        onRescreenComplete={fetchJobs}
      />
    </div>
  );
};

export default Jobs;
