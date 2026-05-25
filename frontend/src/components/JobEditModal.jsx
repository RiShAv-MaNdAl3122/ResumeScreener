import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobsService } from '../services/api';
import toast from 'react-hot-toast';

export const JobEditModal = ({ job, isOpen, onClose, onSave, onRescreenComplete }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    status: 'Active',
    description: '',
  });
  const [showConfirmRescreen, setShowConfirmRescreen] = useState(false);

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title,
        department: job.department,
        status: job.status,
        description: job.description,
      });
    }
    setShowConfirmRescreen(false);
  }, [job, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error('Job title is required');
      return;
    }
    if (!formData.department.trim()) {
      toast.error('Department is required');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Job description is required');
      return;
    }

    // Check if description was actually changed
    const wasDescriptionChanged = job && job.description !== formData.description;

    if (wasDescriptionChanged && job) {
      setShowConfirmRescreen(true);
    } else {
      onSave({
        ...formData,
        updatedAt: new Date(),
      });
      toast.success(job ? 'Job updated successfully!' : 'Job created successfully!');
      onClose();
    }
  };

  const handleVerifyProfiles = () => {
    setShowConfirmRescreen(false);
    onClose();
    navigate(`/candidates?search=${encodeURIComponent(job.title)}`);
  };

  const handleProceedAndRescreen = async () => {
    setShowConfirmRescreen(false);
    
    // Save job first
    onSave({
      ...formData,
      updatedAt: new Date(),
    });
    
    onClose();
    
    // Trigger rescreening process on backend
    const rescreenPromise = jobsService.rescreenJob(job.id);
    
    toast.promise(
      rescreenPromise,
      {
        loading: 'Screening all the old candidates with the old jd...',
        success: (res) => {
          if (onRescreenComplete) onRescreenComplete();
          return `Screening complete! Rescreened ${res.rescreenedCount || 0} candidate(s).`;
        },
        error: 'Failed to re-screen candidates.',
      },
      {
        style: {
          minWidth: '350px',
        },
        success: {
          duration: 5000,
        }
      }
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-150"
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-surface rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-border-subtle w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle">
            <h2 className="font-headline-auth text-headline-auth text-text-primary">
              {job ? 'Edit Job Description' : 'Create New Job'}
            </h2>
            <button
              onClick={onClose}
              className="text-text-muted hover:text-text-primary transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Job Title */}
            <div className="flex flex-col">
              <label className="font-label-caps text-label-caps text-text-muted mb-2 block uppercase font-bold">
                Job Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="px-4 py-3 bg-surface border border-border-strong rounded-lg font-body-standard text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                placeholder="e.g., Senior ML Engineer"
              />
            </div>

            {/* Department */}
            <div className="flex flex-col">
              <label className="font-label-caps text-label-caps text-text-muted mb-2 block uppercase font-bold">
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="px-4 py-3 bg-surface border border-border-strong rounded-lg font-body-standard text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                placeholder="e.g., Engineering"
              />
            </div>

            {/* Status */}
            <div className="flex flex-col">
              <label className="font-label-caps text-label-caps text-text-muted mb-2 block uppercase font-bold">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="px-4 py-3 bg-surface border border-border-strong rounded-lg font-body-standard text-text-primary focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            {/* Job Description */}
            <div className="flex flex-col">
              <label className="font-label-caps text-label-caps text-text-muted mb-2 block uppercase font-bold">
                Job Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-4 min-h-[280px] bg-surface border border-border-strong rounded-lg font-body-standard text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all resize-none"
                placeholder="Paste or write the job description here..."
              />
              <p className="text-[11px] text-text-muted mt-2">
                Include required skills, responsibilities, experience level, and any other relevant details.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-border-subtle px-6 py-4 flex items-center justify-end gap-3 bg-surface-container-lowest">
            <button
              onClick={onClose}
              className="px-5 py-2.5 border border-border-strong rounded-lg font-body-bold text-body-standard text-text-secondary hover:bg-surface-container transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 bg-primary hover:bg-accent-hover text-on-primary rounded-lg font-body-bold text-body-standard transition-all shadow-sm"
            >
              {job ? 'Save Changes' : 'Create Job'}
            </button>
          </div>
        </div>
      </div>

      {showConfirmRescreen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Sub-overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md"></div>
          
          {/* Card */}
          <div className="relative bg-surface rounded-2xl border border-border-subtle p-6 max-w-md w-full shadow-[0_24px_64px_rgba(0,0,0,0.25)] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex flex-col gap-4 text-center items-center">
              <div className="w-12 h-12 bg-warning/10 text-warning rounded-full flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl font-bold">warning</span>
              </div>
              <h3 className="font-headline-auth text-[18px] font-bold text-text-primary">
                Job Description Changed
              </h3>
              <p className="text-text-secondary text-sm leading-relaxed">
                Old candidates with the old JD will be screened again. Would you like to review their profiles before saving the change?
              </p>
              
              <div className="flex flex-col gap-2 w-full mt-4">
                <button
                  onClick={handleVerifyProfiles}
                  className="w-full py-2.5 bg-surface border border-primary text-primary font-body-bold text-[13px] rounded-xl hover:bg-primary/5 transition-all"
                >
                  Verify Profiles Before Change
                </button>
                <button
                  onClick={handleProceedAndRescreen}
                  className="w-full py-2.5 bg-primary text-on-primary font-body-bold text-[13px] rounded-xl hover:bg-accent-hover transition-all"
                >
                  Recheck All Candidates
                </button>
                <button
                  onClick={() => setShowConfirmRescreen(false)}
                  className="w-full py-2.5 bg-surface border border-border-strong text-text-secondary font-body-bold text-[13px] rounded-xl hover:bg-surface-container-low transition-all"
                >
                  Cancel Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JobEditModal;
