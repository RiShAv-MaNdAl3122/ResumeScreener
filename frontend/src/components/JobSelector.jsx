import { useState, useRef, useEffect } from 'react';

export const JobSelector = ({ jobs, selectedJob, onJobSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSelectJob = (job) => {
    onJobSelect(job);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-surface border border-border-strong rounded-lg font-body-standard text-text-primary text-left flex items-center justify-between hover:border-primary transition-all focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none"
      >
        <span className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-text-muted">work</span>
          {selectedJob ? (
            <span>{selectedJob.title}</span>
          ) : (
            <span className="text-text-muted">Select a job description...</span>
          )}
        </span>
        <span className={`material-symbols-outlined transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-border-subtle z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Search Input */}
          <div className="px-3 py-2.5 border-b border-border-subtle bg-surface-container-lowest">
            <input
              type="text"
              placeholder="Search jobs..."
              className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-[13px] text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
            />
          </div>

          {/* Job Options */}
          <div className="max-h-[300px] overflow-y-auto">
            {jobs.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-text-muted text-[13px]">No jobs available</p>
              </div>
            ) : (
              jobs.map((job) => (
                <button
                  key={job.id}
                  onClick={() => handleSelectJob(job)}
                  className={`w-full px-4 py-3 text-left border-b border-border-subtle hover:bg-surface-container-low transition-colors flex items-start gap-3 last:border-b-0 ${
                    selectedJob?.id === job.id ? 'bg-accent-soft' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-body-bold text-[13px] text-text-primary truncate">
                      {job.title}
                    </p>
                    <p className="text-[11px] text-text-secondary truncate">
                      {job.department}
                    </p>
                    <p className={`text-[10px] mt-1 font-label-caps uppercase font-bold ${
                      job.status === 'Active' ? 'text-primary' : 'text-text-muted'
                    }`}>
                      {job.status}
                    </p>
                  </div>
                  {selectedJob?.id === job.id && (
                    <span className="material-symbols-outlined text-primary flex-shrink-0 mt-0.5">
                      check_circle
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Selected Job Description Display */}
      {selectedJob && (
        <div className="mt-4 p-4 bg-surface-container-low border border-border-subtle rounded-lg">
          <p className="text-[10px] font-label-caps uppercase mb-2 font-bold text-text-muted">
            Selected Job Description
          </p>
          <div className="max-h-[200px] overflow-y-auto">
            <p className="text-[12px] text-text-secondary leading-relaxed whitespace-pre-wrap">
              {selectedJob.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobSelector;
