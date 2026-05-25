import { useState, useEffect, useRef } from 'react';
import { screeningService, jobsService } from '../services/api';
import { JobSelector } from '../components/JobSelector';
import NameConflictModal from '../components/NameConflictModal';
import toast from 'react-hot-toast';

const getInitials = (name) => {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const Screening = () => {
  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isScreening, setIsScreening] = useState(false);
  const [screeningProgress, setScreeningProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [isApplying, setIsApplying] = useState(false);
  // Name-conflict modal state
  const [conflictModal, setConflictModal] = useState(null); // { oldName, newName, email, candidateId }
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoadingJobs(true);
        const res = await jobsService.listJobs();
        if (res.success && res.data) {
          // Only list active jobs for resume screening
          setJobs(res.data.filter(j => j.status === 'Active'));
        }
      } catch (err) {
        console.error('Failed to fetch jobs for selector:', err);
      } finally {
        setLoadingJobs(false);
      }
    };
    fetchJobs();
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleScreen = async () => {
    if (!file) {
      toast.error('Please upload a resume first');
      return;
    }
    if (!selectedJob) {
      toast.error('Please select a job description');
      return;
    }

    const jobToScreen = selectedJob;
    const fileToScreen = file;

    // Reset input fields immediately
    setFile(null);
    setSelectedJob(null);

    setIsScreening(true);
    setScreeningProgress(10);
    setResult(null);

    // Simulate analysis progress steps
    const interval = setInterval(() => {
      setScreeningProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 300);

    try {
      const apiResponse = await screeningService.screenResume(jobToScreen.id, fileToScreen);
      
      clearInterval(interval);
      setScreeningProgress(100);
      
      setTimeout(() => {
        setResult(apiResponse.data);
        setIsScreening(false);
        toast.success('Resume analyzed successfully!');
      }, 400);

    } catch (error) {
      clearInterval(interval);
      setIsScreening(false);
      console.error(error);
    }
  };

  const handleSubmitToDatabase = async (overrides = {}) => {
    if (!result) return;
    setIsApplying(true);
    try {
      // 1. Check for duplicate before persisting
      const dupCheck = await screeningService.checkDuplicate({
        candidateEmail: result.candidate_email,
        candidateName: result.candidate_name,
      });

      if (dupCheck.status === 'name_conflict' && !overrides.resolved) {
        // Show blocking modal — stop applying until user resolves
        setIsApplying(false);
        setConflictModal({
          oldName: dupCheck.old_name,
          newName: dupCheck.new_name,
          email: result.candidate_email,
          candidateId: dupCheck.candidate_id,
        });
        return;
      }

      // Build submit payload
      const submitData = {
        jobId: result.job_id,
        candidateName: result.candidate_name,
        candidateEmail: result.candidate_email,
        photoPath: result.photo_path || null,
        fileName: result.file_name,
        filePath: result.file_path,
        fileGuid: result.file_guid,
        storedFileName: result.stored_file_name,
        score: result.score,
        semanticScore: result.semantic_score,
        skillScore: result.skill_score,
        keywordBonus: result.keyword_bonus,
        matchedSkills: result.matched_skills,
        missingSkills: result.missing_skills,
        strength: result.strength,
        similarity: result.similarity,
        skillMatchPercentage: result.skill_match_percentage,
        explanation: result.explanation,
        // Duplicate resolution fields
        ...(dupCheck.status !== 'new' && { candidateId: overrides.candidateId || dupCheck.candidate_id }),
        ...(overrides.resolvedName && { resolvedName: overrides.resolvedName }),
      };

      const res = await screeningService.submitScreening(submitData);
      if (res.success) {
        toast.success(
          dupCheck.status === 'new'
            ? 'Candidate saved to database!'
            : 'Candidate record updated successfully!'
        );
        setResult(null);
      }
    } catch (err) {
      console.error('Failed to apply screening result to database:', err);
    } finally {
      setIsApplying(false);
    }
  };

  // Called by NameConflictModal once the user makes a decision
  const handleConflictResolved = ({ resolvedName, keepOld }) => {
    const { candidateId } = conflictModal;
    setConflictModal(null);
    handleSubmitToDatabase({ resolved: true, resolvedName, candidateId });
  };


  // SVG parameters for progress circle (radius = 88)
  const radius = 88;
  const circumference = 2 * Math.PI * radius; // 552.92


  return (
    <>
      <div className="grid grid-cols-12 gap-lg max-w-[1600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Left Column: Input Panel */}
      <div className="col-span-12 lg:col-span-5 flex flex-col gap-lg">
        <section className="bg-surface rounded-xl border border-border-strong p-card-padding shadow-sm flex flex-col gap-5">
          {/* Select Job Dropdown */}
          <div>
            <label className="font-label-caps text-label-caps text-text-muted mb-2 block uppercase font-bold">Select Job Description</label>
            <JobSelector 
              jobs={jobs}
              selectedJob={selectedJob}
              onJobSelect={setSelectedJob}
            />
          </div>

          {/* Upload Resumes Box */}
          <div>
            <label className="font-label-caps text-label-caps text-text-muted mb-2 block uppercase font-bold">Upload Resume</label>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".pdf,.docx"
            />
            <div 
              className={`border-2 border-dashed border-outline-variant bg-surface-bright rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group ${
                isDragging ? 'border-primary bg-accent-soft' : 'hover:border-primary hover:bg-accent-soft'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-14 h-14 bg-surface rounded-full flex items-center justify-center shadow-sm mb-3 group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-primary text-2xl">
                  {file ? 'check_circle' : 'cloud_upload'}
                </span>
              </div>
              <p className="font-body-bold text-[13px] text-text-primary">
                {file ? file.name : 'Drag and drop resume here'}
              </p>
              <p className="text-[11px] text-text-muted mt-1">
                Supports PDF, DOCX (Max 20MB)
              </p>
              <button 
                type="button"
                className="mt-3 px-3 py-1.5 border border-border-strong rounded-lg text-xs font-body-bold text-text-secondary bg-surface hover:bg-surface-container transition-all"
              >
                {file ? 'Change File' : 'Browse Files'}
              </button>
            </div>
          </div>

          {/* Action Trigger Button */}
          <button 
            onClick={handleScreen}
            disabled={!file || !selectedJob || isScreening}
            className="w-full py-4 bg-primary text-on-primary rounded-xl font-title-page text-title-page hover:bg-accent-hover active:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
            {isScreening ? 'Screening Resume...' : 'Screen Resume'}
          </button>
        </section>
      </div>

      {/* Right Column: Live Results */}
      <div className="col-span-12 lg:col-span-7 flex flex-col gap-lg">
        {/* Status Bar during Analysis */}
        {isScreening && (
          <div className="bg-primary text-on-primary rounded-xl px-6 py-4 flex items-center justify-between overflow-hidden relative animate-in fade-in duration-300">
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-2.5 h-2.5 bg-on-primary rounded-full animate-ping"></div>
              <p className="font-body-standard">
                Analyzing <span className="font-data-mono font-medium">{file?.name}</span>...
              </p>
            </div>
            <div className="relative z-10 font-data-mono text-xs opacity-90">{screeningProgress}% COMPLETE</div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent-hover opacity-50"></div>
          </div>
        )}

        {/* Dynamic Panel (Empty state, loading state, or completed result) */}
        {!result && !isScreening && (
          <div className="bg-surface rounded-xl border border-border-strong shadow-sm p-8 flex flex-col items-center justify-center text-center min-h-[500px]">
            <div className="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mb-6 text-text-muted">
              <span className="material-symbols-outlined text-4xl">analytics</span>
            </div>
            <h4 className="font-headline-auth text-headline-auth text-text-primary mb-2">Awaiting Analysis</h4>
            <p className="text-text-secondary max-w-sm">
              Select a job description, upload a candidate's resume, and click 'Screen Resume' to generate a full semantic alignment breakdown.
            </p>
          </div>
        )}

        {/* Result view */}
        {result && (
          <div className="bg-surface rounded-xl border border-border-strong shadow-sm overflow-hidden flex flex-col md:flex-row min-h-[500px] animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Score Left Section */}
            <div className="w-full md:w-2/5 p-card-padding flex flex-col items-center justify-center bg-surface-container-lowest border-r border-border-subtle">
              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle 
                    className="text-surface-container-high" 
                    cx="96" 
                    cy="96" 
                    fill="transparent" 
                    r="88" 
                    stroke="currentColor" 
                    strokeWidth="12"
                  />
                  <circle 
                    className="text-primary score-ring" 
                    cx="96" 
                    cy="96" 
                    fill="transparent" 
                    r="88" 
                    stroke="currentColor" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={circumference - (Math.round(result.score || 0) / 100) * circumference} 
                    strokeLinecap="round" 
                    strokeWidth="12"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-data-mono text-5xl font-bold text-primary">
                    {Math.round(result.score || 0)}
                    <span className="text-2xl">%</span>
                  </span>
                  <span className="font-label-caps text-text-muted mt-1 uppercase">Match Score</span>
                </div>
              </div>

            </div>

            {/* Breakdown Right Section */}
            <div className="w-full md:w-3/5 p-card-padding flex flex-col gap-6 bg-surface overflow-y-auto">
              <div>
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 overflow-hidden flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
                    {result.photo_path ? (
                      <img alt={result.candidate_name} className="w-full h-full object-cover" src={`http://localhost:5000/${result.photo_path.replace(/\\/g, '/')}`} />
                    ) : (
                      <span>{getInitials(result.candidate_name || '')}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-title-page text-[18px] font-bold text-text-primary leading-tight">{result.candidate_name || 'Candidate Result'}</h3>
                    {result.candidate_email && (
                      <p className="text-xs text-text-secondary font-body-standard flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[14px]">mail</span>
                        {result.candidate_email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <p className="text-xs text-text-secondary font-body-standard flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">description</span>
                    {result.file_name}
                  </p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${result.strength === 'Strong Match' || result.strength === 'Excellent' ? 'bg-accent-soft text-primary' : result.strength === 'Not a Match' ? 'bg-danger-soft text-danger' : 'bg-surface-container text-text-secondary'}`}>
                    {result.strength}
                  </span>
                </div>
                <div className="space-y-4">
                  {/* Semantic alignment */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-body-standard text-text-primary">Semantic Alignment</span>
                      <span className="font-data-mono text-primary">{Math.round(result.semantic_score || 0)}%</span>
                    </div>
                    <div className="w-full h-[5px] bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${result.semantic_score || 0}%` }}></div>
                    </div>
                  </div>

                  {/* Technical Proficiency */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-body-standard text-text-primary">Technical Proficiency</span>
                      <span className="font-data-mono text-primary">{Math.round(result.skill_score || 0)}%</span>
                    </div>
                    <div className="w-full h-[5px] bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${result.skill_score || 0}%` }}></div>
                    </div>
                  </div>

                  {/* Keyword Correlation Bonus */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-body-standard text-text-primary">Keyword Correlation Bonus</span>
                      <span className="font-data-mono text-primary">+{result.keyword_bonus || 0}%</span>
                    </div>
                    <div className="w-full h-[5px] bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${((result.keyword_bonus || 0) / 15) * 100}%` }}></div>
                    </div>
                  </div>

                  {/* Cosine Similarity */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-body-standard text-text-primary">Cosine Similarity</span>
                      <span className="font-data-mono text-primary">
                        {result.similarity !== undefined ? ((result.similarity > 1 || result.similarity < 0) ? result.similarity : (result.similarity * 100)).toFixed(1) : '0.0'}%
                      </span>
                    </div>
                    <div className="w-full h-[5px] bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${result.similarity !== undefined ? Math.min(100, Math.max(0, (result.similarity > 1 || result.similarity < 0) ? result.similarity : result.similarity * 100)) : 0}%` }}></div>
                    </div>
                  </div>

                  {/* Skill Match Percentage */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-body-standard text-text-primary">Skill Match Percentage</span>
                      <span className="font-data-mono text-primary">{Math.round(result.skill_match_percentage || 0)}%</span>
                    </div>
                    <div className="w-full h-[5px] bg-surface-container-high rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${result.skill_match_percentage || 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-surface-bright border border-border-subtle p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                    <span className="font-label-caps text-[10px] uppercase text-text-muted">Matched Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.matched_skills.map((skill, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-accent-soft text-[11px] font-medium text-primary rounded capitalize">
                        {skill}
                      </span>
                    ))}
                    {result.matched_skills.length === 0 && (
                      <span className="text-[11px] text-text-muted">No skills matched</span>
                    )}
                  </div>
                </div>

                <div className="bg-surface-bright border border-border-subtle p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-danger text-sm">error</span>
                    <span className="font-label-caps text-[10px] uppercase text-text-muted">Missing Skills</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.missing_skills.map((skill, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-danger-soft text-[11px] font-medium text-danger rounded capitalize">
                        {skill}
                      </span>
                    ))}
                    {result.missing_skills.length === 0 && (
                      <span className="text-[11px] text-text-muted">No missing skills</span>
                    )}
                  </div>
                </div>
              </div>


              {/* Final Actions */}
              <div className="mt-auto border-t border-border-subtle pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="font-data-mono text-[11px] text-text-muted uppercase">
                  Unsaved Preview Result
                </span>
                
                <div className="flex gap-3 w-full sm:w-auto justify-end">
                  <button 
                    onClick={handleSubmitToDatabase}
                    disabled={isApplying}
                    className="w-full sm:w-auto px-6 py-2.5 bg-primary text-on-primary rounded-lg font-body-bold hover:bg-accent-hover transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    {isApplying ? 'Applying to DB...' : 'Submit to Database'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Name conflict blocking modal */}
    {conflictModal && (
      <NameConflictModal
        oldName={conflictModal.oldName}
        newName={conflictModal.newName}
        email={conflictModal.email}
        onResolve={handleConflictResolved}
      />
    )}
  </>
  );
};

export default Screening;
