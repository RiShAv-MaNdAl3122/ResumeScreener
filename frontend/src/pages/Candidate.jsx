import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { candidatesService } from '../services/api';

const MOCK_CANDIDATES = {
  'mock-1': {
    id: 'mock-1',
    name: 'Michael Chen',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuADhF-O0co0GevDcftfnYMmeyAkQBohd0aybLPxbEkL3Mk-A3LOKXBWRhOEAYE46usYpnDw9ENKGZsr0v0p0gJ_-vfaCScOFLBU5qHOz9vIHXyAAmZaqlpVnWfWDeMzJiK876K1iktfvP7LUXLjo1Y7UlSg8vimH_SIRsAUyDqcwCLxtZFqsqNDhv6Kxoa-LkVIzyyoszqw2nqqwSMIUdfdPcXONlsZIeqypugGhIxt0H9Yo5Af2BULZ7syARrwARHKa_gGGmkXw6TF',
    status: 'Shortlisted',
    email: 'michael.chen@designcorp.com',
    role: 'Senior UX Architect',
    resumeFile: { file_name: 'michael_chen_resume.pdf', stored_file_name: 'michael_chen_resume.pdf' },
    screenings: [
      {
        jobTitle: 'Senior UX Architect',
        score: 95,
        badgeLabel: 'Exceptional Match',
        semanticScore: 94,
        skillScore: 96,
        keywordBonus: 12,
        similarity: 0.89,
        skillMatchPercentage: 96,
        matchedSkills: ['System Design', 'Prototyping', 'Figma', 'React', 'UI/UX', 'Wireframing'],
        missingSkills: ['A/B Testing']
      },
      {
        jobTitle: 'Frontend Architect',
        score: 85,
        badgeLabel: 'Strong Match',
        semanticScore: 82,
        skillScore: 88,
        keywordBonus: 10,
        similarity: 0.79,
        skillMatchPercentage: 88,
        matchedSkills: ['React', 'System Design', 'Figma', 'Prototyping', 'UI/UX'],
        missingSkills: ['TypeScript', 'Advanced JavaScript', 'Performance Optimization']
      },
      {
        jobTitle: 'Product Designer (UX)',
        score: 92,
        badgeLabel: 'Exceptional Match',
        semanticScore: 91,
        skillScore: 93,
        keywordBonus: 11,
        similarity: 0.87,
        skillMatchPercentage: 93,
        matchedSkills: ['Figma', 'Prototyping', 'UI/UX', 'Wireframing', 'User Research'],
        missingSkills: ['Design Systems Knowledge']
      }
    ],
    explanation: ['Exceptional design expertise', 'Strong alignment with React & UI/UX requirements', 'Demonstrated lead UX experience'],
    recommendation: 'Michael Chen has exceptional UI/UX prototyping skills. Highly recommended for the role due to extensive Figma and System Design experience.',
    confidence: 98,
    emailHistory: [
      { id: 101, recipientEmail: 'michael.chen@designcorp.com', subject: 'Application Status Update', body: 'Dear Michael Chen,\n\nWe are pleased to inform you that your profile has been Shortlisted for the Senior UX Architect position. Our recruitment team will reach out shortly to schedule your technical interview.\n\nBest regards,\nRecruitAI Team', sentAt: '2026-05-22T14:32:00Z', status: 'Sent' }
    ]
  },
  'mock-2': {
    id: 'mock-2',
    name: 'Elena Rodriguez',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC16dcPfXmCObcSj-8JbT5UQBYVK8PZ0L68dhV_Zt-LFTz-Xl42Qngv6WBmRDGFyLphtMEsEgSrL7yR4uKH9U6QCoJCFSE2GrH-BslbrvDPYyufiBnweoDqRePMtiJWecWzDmY3xp_oLz3tbAElMFcNoYn09i1ulflMKHeQ9IawZwutDn1MeXjMEE5IbEmABSgwa6RkhA6E3O0wJ5qUxz3Rdq0Am1UEf08arWKV5VA8tCkEy6iRWLXk_2NShpuGFS5oj1UKB7l6zkZj',
    status: 'Reviewing',
    email: 'elena.rod@techdesign.io',
    role: 'Frontend Architect',
    resumeFile: { file_name: 'elena_rod_cv.pdf', stored_file_name: 'elena_rod_cv.pdf' },
    screenings: [
      {
        jobTitle: 'Frontend Architect',
        score: 88,
        badgeLabel: 'Strong Match',
        semanticScore: 89,
        skillScore: 86,
        keywordBonus: 10,
        similarity: 0.78,
        skillMatchPercentage: 86,
        matchedSkills: ['Accessibility', 'React', 'UI/UX', 'Figma', 'HTML/CSS'],
        missingSkills: ['System Design', 'User Research']
      },
      {
        jobTitle: 'Senior UX Architect',
        score: 78,
        badgeLabel: 'Compatible',
        semanticScore: 80,
        skillScore: 76,
        keywordBonus: 8,
        similarity: 0.68,
        skillMatchPercentage: 76,
        matchedSkills: ['UI/UX', 'Figma', 'HTML/CSS', 'React'],
        missingSkills: ['System Design', 'Prototyping', 'Wireframing']
      },
      {
        jobTitle: 'Product Designer (UX)',
        score: 84,
        badgeLabel: 'Strong Match',
        semanticScore: 85,
        skillScore: 82,
        keywordBonus: 9,
        similarity: 0.74,
        skillMatchPercentage: 82,
        matchedSkills: ['Figma', 'UI/UX', 'HTML/CSS', 'React'],
        missingSkills: ['User Research', 'Design Systems Knowledge']
      }
    ],
    explanation: ['Excellent accessibility experience matching WCAG', 'React framework knowledge aligns with frontend team requirements'],
    recommendation: 'Strong candidate with an impressive specialization in Web Accessibility (WCAG 2.1) and React framework. Fits well with design system engineering goals.',
    confidence: 92,
    emailHistory: []
  },
  'mock-3': {
    id: 'mock-3',
    name: 'James Wilson',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCpLRxFx4MMQzOt3gK7Om5Gidc61k0OzTnK9btpA6Mm_vjRODKY8e_7AAF99nTApvMHZ9veJMsGrrZfuF0TBrVQMu0XmWD6UxqhhgUUrcP-UeovluVbi6V4bePXqnF2CuLgRDTi4S_rLWEVTPeoEUqnyzsNaEyxU4kqzuFKBE4gJkU_iO5zJhLVuA8kuUABMgNpyphLOLvlk1nMm41TmYacur7w6Oaou-qQ6f-AF7xTbiGT78AWREo1aQvY31mQWAl1pm-Fl38LIsWT',
    status: 'Reviewing',
    email: 'james.wilson@productlab.com',
    role: 'Senior ML Engineer',
    resumeFile: null,
    screenings: [
      {
        jobTitle: 'Senior ML Engineer',
        score: 76,
        badgeLabel: 'Compatible',
        semanticScore: 78,
        skillScore: 74,
        keywordBonus: 8,
        similarity: 0.65,
        skillMatchPercentage: 72,
        matchedSkills: ['User Research', 'Python', 'Agile', 'Product Strategy'],
        missingSkills: ['Figma', 'System Design', 'Prototyping']
      },
      {
        jobTitle: 'ML Engineer',
        score: 85,
        badgeLabel: 'Strong Match',
        semanticScore: 84,
        skillScore: 86,
        keywordBonus: 9,
        similarity: 0.77,
        skillMatchPercentage: 86,
        matchedSkills: ['Python', 'Agile', 'User Research'],
        missingSkills: ['Scikit-learn', 'TensorFlow', 'Model Training']
      }
    ],
    explanation: ['UX Research background aligns conceptually', 'Lacks hard UI engineering/Figma design experience'],
    recommendation: 'James shows moderate alignment. He has good experience in user research and agile workflows, but has fewer core hard UI engineering skills.',
    confidence: 85,
    emailHistory: []
  },
  'mock-4': {
    id: 'mock-4',
    name: 'Sarah Jenkins',
    avatar: '',
    status: 'Reviewing',
    email: 'sarah.j@freelance.org',
    role: 'Product Designer (UX)',
    resumeFile: null,
    screenings: [
      {
        jobTitle: 'Product Designer (UX)',
        score: 72,
        badgeLabel: 'Compatible',
        semanticScore: 75,
        skillScore: 70,
        keywordBonus: 6,
        similarity: 0.58,
        skillMatchPercentage: 68,
        matchedSkills: ['Figma', 'User Journey', 'Wireframing', 'UI/UX'],
        missingSkills: ['React', 'System Design']
      },
      {
        jobTitle: 'Senior UX Architect',
        score: 60,
        badgeLabel: 'Compatible',
        semanticScore: 62,
        skillScore: 58,
        keywordBonus: 4,
        similarity: 0.45,
        skillMatchPercentage: 55,
        matchedSkills: ['Figma', 'Wireframing', 'UI/UX'],
        missingSkills: ['React', 'System Design', 'Prototyping', 'A/B Testing']
      }
    ],
    explanation: ['Figma wireframing skill matched', 'Lacks experience with React and enterprise architecture'],
    recommendation: 'Sarah has solid visual and user journey modeling capabilities using Figma, though her experience in enterprise architecture is still developing.',
    confidence: 78,
    emailHistory: []
  },
  'mock-5': {
    id: 'mock-5',
    name: 'Devendra Pratap',
    avatar: '',
    status: 'Shortlisted',
    email: 'devendra.pratap@enterprisetech.com',
    role: 'Senior ML Engineer',
    resumeFile: null,
    screenings: [
      {
        jobTitle: 'Senior ML Engineer',
        score: 91,
        badgeLabel: 'Exceptional',
        semanticScore: 92,
        skillScore: 90,
        keywordBonus: 10,
        similarity: 0.84,
        skillMatchPercentage: 90,
        matchedSkills: ['Product Strategy', 'Roadmapping', 'Agile', 'System Design', 'User Research'],
        missingSkills: ['React']
      },
      {
        jobTitle: 'ML Engineer',
        score: 88,
        badgeLabel: 'Strong Match',
        semanticScore: 89,
        skillScore: 87,
        keywordBonus: 9,
        similarity: 0.80,
        skillMatchPercentage: 85,
        matchedSkills: ['Product Strategy', 'Agile', 'User Research'],
        missingSkills: ['React', 'Python', 'Jupyter']
      }
    ],
    explanation: ['Strong product strategy and roadmapping skills', 'Excellent leadership credentials in UX design'],
    recommendation: 'Exceptional strategic product manager and UX architect. Outstanding history of roadmapping and agile leadership in enterprise companies.',
    confidence: 95,
    emailHistory: []
  },
  'mock-6': {
    id: 'mock-6',
    name: 'Priya Patel',
    avatar: '',
    status: 'Reviewing',
    email: 'priya.patel@analytica.com',
    role: 'Python Developer',
    resumeFile: null,
    screenings: [
      {
        jobTitle: 'Python Developer',
        score: 64,
        badgeLabel: 'Compatible',
        semanticScore: 68,
        skillScore: 60,
        keywordBonus: 5,
        similarity: 0.47,
        skillMatchPercentage: 55,
        matchedSkills: ['SQL', 'Analytics', 'Tableau', 'User Research'],
        missingSkills: ['Figma', 'Prototyping', 'System Design']
      },
      {
        jobTitle: 'ML Engineer',
        score: 50,
        badgeLabel: 'Compatible',
        semanticScore: 52,
        skillScore: 48,
        keywordBonus: 3,
        similarity: 0.35,
        skillMatchPercentage: 40,
        matchedSkills: ['SQL', 'Analytics'],
        missingSkills: ['Python', 'Jupyter', 'Scikit-learn', 'TensorFlow']
      }
    ],
    explanation: ['Data analysis and SQL skills matched', 'Missing core visual layout and prototyping tools'],
    recommendation: 'Priya focuses heavily on data analytics and SQL. She is less visual/architectural but possesses solid analytical metrics skills.',
    confidence: 72,
    emailHistory: []
  },
  'mock-7': {
    id: 'mock-7',
    name: 'Marcus Aurelius',
    avatar: '',
    status: 'Shortlisted',
    email: 'marcus.aurelius@rome.org',
    role: 'Frontend Architect',
    resumeFile: null,
    screenings: [
      {
        jobTitle: 'Frontend Architect',
        score: 98,
        badgeLabel: 'Exceptional',
        semanticScore: 99,
        skillScore: 97,
        keywordBonus: 14,
        similarity: 0.94,
        skillMatchPercentage: 98,
        matchedSkills: ['Leadership', 'Product Strategy', 'UI/UX', 'System Design', 'Figma'],
        missingSkills: ['React']
      },
      {
        jobTitle: 'Senior UX Architect',
        score: 90,
        badgeLabel: 'Exceptional',
        semanticScore: 91,
        skillScore: 89,
        keywordBonus: 12,
        similarity: 0.86,
        skillMatchPercentage: 90,
        matchedSkills: ['Leadership', 'Product Strategy', 'UI/UX', 'Figma'],
        missingSkills: ['React', 'A/B Testing']
      }
    ],
    explanation: ['Exceptional leadership and stoic product design strategy', 'Outstanding design system scaling experience'],
    recommendation: 'Top tier UX strategist and philosopher of design. Unparalleled experience leading design strategy and implementing design systems at global scale.',
    confidence: 99,
    emailHistory: []
  },
  'mock-8': {
    id: 'mock-8',
    name: 'Amanda Ross',
    avatar: '',
    status: 'Rejected',
    email: 'amanda.ross@creative.com',
    role: 'Product Designer (UX)',
    resumeFile: null,
    screenings: [
      {
        jobTitle: 'Product Designer (UX)',
        score: 48,
        badgeLabel: 'Gap',
        semanticScore: 50,
        skillScore: 45,
        keywordBonus: 2,
        similarity: 0.28,
        skillMatchPercentage: 35,
        matchedSkills: ['Figma', 'Graphic Design'],
        missingSkills: ['System Design', 'React', 'User Research', 'Product Strategy']
      },
      {
        jobTitle: 'Senior UX Architect',
        score: 35,
        badgeLabel: 'Gap',
        semanticScore: 38,
        skillScore: 32,
        keywordBonus: 1,
        similarity: 0.18,
        skillMatchPercentage: 25,
        matchedSkills: ['Figma'],
        missingSkills: ['System Design', 'React', 'User Research', 'Product Strategy', 'Prototyping']
      }
    ],
    explanation: ['Graphic design elements match basic requirements', 'Lacks system design, product strategy, and frontend framework experience'],
    recommendation: 'Amanda is early in her career with a focus on graphic design. Significant skill gap in UX architecture, React, and system design.',
    confidence: 55,
    emailHistory: []
  }
};

const Candidate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadCandidate = async () => {
    try {
      setLoading(true);
      if (id && id.startsWith('mock-')) {
        const found = MOCK_CANDIDATES[id];
        if (found) {
          setCandidate({ ...found });
        } else {
          setCandidate(null);
          toast.error('Mock candidate not found');
        }
      } else {
        const res = await candidatesService.getCandidate(id);
        if (res.success && res.data) {
          setCandidate(res.data);
        } else {
          toast.error('Failed to load candidate details');
        }
      }
    } catch (err) {
      console.error('Error fetching candidate:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidate();
  }, [id]);

  const handleUpdateStatus = async (newStatus) => {
    if (id && id.startsWith('mock-')) {
      setCandidate(prev => ({ ...prev, status: newStatus }));
      toast.success(`Candidate status updated to ${newStatus}!`);
      return;
    }

    try {
      const res = await candidatesService.updateCandidateStatus(id, newStatus);
      if (res.success) {
        setCandidate(prev => ({ ...prev, status: newStatus }));
        toast.success(`Candidate ${newStatus.toLowerCase()}!`);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDownloadResume = async () => {
    if (id && id.startsWith('mock-')) {
      toast.success(`Downloading resume for ${candidate.name}... (Mock File)`, {
        icon: '📥'
      });
    } else if (candidate && candidate.resumeFile) {
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
      toast.error('No resume file found for this candidate');
    }
  };

  const handleRemoveScreening = async (screeningId) => {
    const isLastScreening = candidate?.screenings?.length === 1;
    const confirmMsg = isLastScreening 
      ? "Warning: Deleting this JD screening result will remove the candidate from the list entirely. Do you wish to proceed?"
      : "Are you sure you want to remove this screening result?";

    if (!window.confirm(confirmMsg)) {
      return;
    }
    try {
      const res = await candidatesService.deleteScreeningResult(screeningId);
      if (res.success) {
        toast.success("Screening result removed successfully!");
        if (String(screeningId) === String(id)) {
          // If we deleted the screening result we are currently viewing, go back to candidates list
          navigate('/candidates');
        } else {
          // Otherwise, just remove it from the screenings list in state
          setCandidate(prev => ({
            ...prev,
            screenings: prev.screenings.filter(s => s.id !== screeningId)
          }));
        }
      }
    } catch (err) {
      console.error("Failed to remove screening result:", err);
      toast.error("Failed to remove screening result");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-bold text-text-primary">Candidate not found</h3>
        <p className="text-text-secondary mt-2">The candidate screening details you are looking for do not exist or you do not have permission to view them.</p>
        <div className="mt-6">
          <Link to="/candidates" className="bg-primary text-white px-6 py-2.5 rounded-lg font-body-bold hover:bg-accent-hover transition-colors">
            Back to Candidates
          </Link>
        </div>
      </div>
    );
  }

  const screeningsToRender = candidate.screenings && candidate.screenings.length > 0
    ? candidate.screenings
    : [
        {
          jobTitle: candidate.role || 'Senior UX Architect',
          score: candidate.score || 0,
          badgeLabel: candidate.badgeLabel || 'N/A',
          semanticScore: candidate.semanticScore || 0,
          skillScore: candidate.skillScore || 0,
          keywordBonus: candidate.keywordBonus || 0,
          similarity: candidate.similarity || 0,
          skillMatchPercentage: candidate.skillMatchPercentage || 0,
          matchedSkills: candidate.matchedSkills || [],
          missingSkills: candidate.missingSkills || [],
        }
      ];

  return (
    <div className="space-y-gap-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-text-muted">
        <Link to="/candidates" className="text-[12px] font-label-caps hover:text-primary transition-colors uppercase">
          Candidates
        </Link>
        <span className="material-symbols-outlined text-[14px]">chevron_right</span>
        <span className="text-[12px] font-label-caps text-primary uppercase">{candidate.name}</span>
      </nav>

      {/* Profile Header Card */}
      <section className="bg-surface rounded-xl border border-border-subtle p-card-padding flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="relative">
            {candidate.photoUrl ? (
              <img
                alt={`${candidate.name} photo`}
                className="w-20 h-20 rounded-full object-cover border-2 border-primary/10 shadow-sm"
                src={candidate.photoUrl}
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-2xl uppercase">
                <span>{candidate.avatar || candidate.name.split(' ').map(n => n[0]).join('').toUpperCase()}</span>
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-lg">
              <span className="material-symbols-outlined text-[14px]">verified</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h1 className="font-headline-auth text-headline-auth text-text-primary">{candidate.name || 'Unknown Candidate'}</h1>
              <span className={`px-3 py-1 font-label-caps text-label-caps rounded-full ${
                candidate.status === 'Shortlisted' ? 'bg-primary/10 text-primary border border-primary/20' :
                candidate.status === 'Reviewing' ? 'bg-warning-soft text-warning border border-warning/10' :
                'bg-danger-soft text-danger border border-danger/10'
              }`}>
                {candidate.status}
              </span>
            </div>
            <div className="flex items-center flex-wrap gap-3 text-xs text-text-muted mt-3">
              <span className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded border border-border-subtle shadow-sm">
                <span className="material-symbols-outlined text-[14px] text-primary">mail</span>
                <span className="font-body-bold text-text-secondary">Email:</span> {candidate.email || 'N/A'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 flex-shrink-0 w-full xl:w-auto">
          <button 
            onClick={() => handleUpdateStatus('Shortlisted')}
            className="px-4 py-2 bg-primary text-white font-body-bold rounded-lg hover:bg-accent-hover transition-all shadow-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            Move to Shortlist
          </button>
          <button 
            onClick={() => handleUpdateStatus('Reviewing')}
            className="px-4 py-2 bg-warning-soft hover:bg-warning/20 text-warning font-body-bold rounded-lg border border-warning/10 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">rate_review</span>
            Keep Under Review
          </button>
          <button 
            onClick={() => handleUpdateStatus('Rejected')}
            className="px-4 py-2 bg-surface border border-danger text-danger font-body-bold rounded-lg hover:bg-danger-soft transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">block</span>
            Reject Candidate
          </button>
          <button 
            onClick={handleDownloadResume}
            className="px-4 py-2 bg-surface border border-border-strong text-text-primary font-body-bold rounded-lg hover:bg-surface-container-low transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Download CV
          </button>
        </div>
      </section>

      {/* JD Screening Results Stack */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border-subtle pb-3">
          <h2 className="font-title-page text-title-page flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">assessment</span>
            Job Description Screening Results ({screeningsToRender.length})
          </h2>
          <span className="text-xs text-text-muted">Scroll down to view all screenings</span>
        </div>

        {/* Scrollable Container */}
        <div className="space-y-8 max-h-[800px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          {screeningsToRender.map((scr, idx) => {
            const circumference = 2 * Math.PI * 60;
            const scoreVal = Math.round(scr.score || 0);
            const dashOffset = circumference - (scoreVal / 100) * circumference;

            return (
              <div 
                key={idx} 
                className="bg-surface rounded-xl border border-border-subtle p-6 shadow-sm space-y-6 animate-in fade-in duration-500 hover:border-primary/20 transition-all"
              >
                {/* Screening Title Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-border-subtle gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                      <span className="material-symbols-outlined font-bold">work</span>
                    </div>
                    <div>
                      <h3 className="font-title-page text-title-page text-text-primary">{scr.jobTitle}</h3>
                      <p className="text-[10px] text-text-muted uppercase font-bold tracking-wider">Evaluation Profile</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded uppercase tracking-wider">
                      {scr.badgeLabel || 'N/A'}
                    </span>
                    <span className="font-data-mono text-xl text-primary font-bold">{scoreVal}% Match</span>
                    <button 
                      onClick={() => handleRemoveScreening(scr.id)}
                      className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all flex items-center justify-center"
                      title="Remove JD Result"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>

                {/* Grid layout for Ring and Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-gap-lg">
                  {/* Match Score Ring */}
                  <div className="lg:col-span-4 bg-surface rounded-xl border border-border-subtle p-6 flex flex-col items-center justify-center shadow-sm min-h-[260px]">
                    <div className="relative w-36 h-36 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
                        <circle
                          cx="70" cy="70" r="60"
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="10"
                          className="text-surface-container-high"
                        />
                        <circle
                          cx="70" cy="70" r="60"
                          fill="transparent"
                          stroke="currentColor"
                          strokeWidth="10"
                          strokeDasharray={circumference}
                          strokeDashoffset={dashOffset}
                          strokeLinecap="round"
                          className="text-primary transition-all duration-1000"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-data-mono text-[32px] leading-none text-primary font-bold">
                          {scoreVal}
                        </span>
                        <p className="font-label-caps text-text-muted uppercase text-[9px] mt-1">Match Score</p>
                      </div>
                    </div>
                  </div>
 
                  {/* Score Breakdown */}
                  <div className="lg:col-span-8 bg-surface rounded-xl border border-border-subtle p-6 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-label-caps text-text-muted uppercase font-bold flex items-center gap-1.5 mb-4">
                        <span className="material-symbols-outlined text-[16px] text-primary">bar_chart</span>
                        Metrics Breakdown
                      </h4>
                      <div className="space-y-3">
                        {/* Semantic Score */}
                        <div>
                          <div className="flex justify-between items-end mb-1">
                            <span className="text-xs font-body-bold text-text-secondary">Semantic Score</span>
                            <span className="font-data-mono text-xs text-primary font-bold">{Math.round(scr.semanticScore || 0)}%</span>
                          </div>
                          <div className="h-[6px] w-full bg-surface-container-high rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.round(scr.semanticScore || 0)}%` }}></div>
                          </div>
                        </div>
 
                        {/* Hard Skill Match */}
                        <div>
                          <div className="flex justify-between items-end mb-1">
                            <span className="text-xs font-body-bold text-text-secondary">Hard Skill Match</span>
                            <span className="font-data-mono text-xs text-primary font-bold">{Math.round(scr.skillScore || 0)}%</span>
                          </div>
                          <div className="h-[6px] w-full bg-surface-container-high rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.round(scr.skillScore || 0)}%` }}></div>
                          </div>
                        </div>
 
                        {/* Keyword Density */}
                        <div>
                          <div className="flex justify-between items-end mb-1">
                            <span className="text-xs font-body-bold text-text-secondary">Keyword Density Bonus</span>
                            <span className="font-data-mono text-xs text-primary font-bold">+{Math.round(scr.keywordBonus || 0)}%</span>
                          </div>
                          <div className="h-[6px] w-full bg-surface-container-high rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.round(Math.min(100, ((scr.keywordBonus || 0) / 15) * 100))}%` }}></div>
                          </div>
                        </div>
 
                        {/* Cosine Similarity */}
                        <div>
                          <div className="flex justify-between items-end mb-1">
                            <span className="text-xs font-body-bold text-text-secondary">Cosine Similarity</span>
                            <span className="font-data-mono text-xs text-primary font-bold">
                              {scr.similarity !== undefined ? ((scr.similarity > 1 || scr.similarity < 0) ? scr.similarity : (scr.similarity * 100)).toFixed(1) : '0.0'}%
                            </span>
                          </div>
                          <div className="h-[6px] w-full bg-surface-container-high rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${scr.similarity !== undefined ? Math.round(Math.min(100, Math.max(0, (scr.similarity > 1 || scr.similarity < 0) ? scr.similarity : scr.similarity * 100))) : 0}%` }}></div>
                          </div>
                        </div>
 
                        {/* Skill Match Percentage */}
                        <div>
                          <div className="flex justify-between items-end mb-1">
                            <span className="text-xs font-body-bold text-text-secondary">Skill Match Percentage</span>
                            <span className="font-data-mono text-xs text-primary font-bold">{Math.round(scr.skillMatchPercentage || 0)}%</span>
                          </div>
                          <div className="h-[6px] w-full bg-surface-container-high rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${Math.round(scr.skillMatchPercentage || 0)}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Skill Gap Analysis inside card */}
                <div className="bg-surface rounded-xl border border-border-subtle p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-label-caps text-text-muted uppercase font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">difference</span>
                      Skill Gap Analysis
                    </h4>
                    <div className="flex gap-3">
                      <span className="flex items-center gap-1 text-[10px] text-text-muted">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                        Matched
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-text-muted">
                        <div className="w-1.5 h-1.5 rounded-full bg-error"></div>
                        Missing
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Matched Skills */}
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-label-caps text-text-muted uppercase font-bold">Matched Skills</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {scr.matchedSkills && scr.matchedSkills.map((skill, sIdx) => (
                          <span key={sIdx} className="flex items-center gap-1 px-2.5 py-0.5 bg-accent-soft text-primary rounded-full text-xs font-medium">
                            <span className="material-symbols-outlined text-[12px]">check_circle</span>
                            {skill}
                          </span>
                        ))}
                        {(!scr.matchedSkills || scr.matchedSkills.length === 0) && (
                          <span className="text-xs text-text-muted">No skills matched</span>
                        )}
                      </div>
                    </div>

                    {/* Missing Skills */}
                    <div className="space-y-2">
                      <h5 className="text-[10px] font-label-caps text-text-muted uppercase font-bold">Missing Skills</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {scr.missingSkills && scr.missingSkills.map((skill, sIdx) => (
                          <span key={sIdx} className="flex items-center gap-1 px-2.5 py-0.5 bg-error-container/20 text-error rounded-full text-xs font-medium">
                            <span className="material-symbols-outlined text-[12px]">cancel</span>
                            {skill}
                          </span>
                        ))}
                        {(!scr.missingSkills || scr.missingSkills.length === 0) && (
                          <span className="text-xs text-text-muted">No missing skills</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>


    </div>
  );
};

export default Candidate;
