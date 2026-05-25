export const MOCK_JOBS = [
  {
    id: 1,
    title: 'Senior ML Engineer',
    department: 'AI/ML Department',
    status: 'Active',
    candidates: 24,
    avgScore: '87%',
    description: `Looking for a Senior Machine Learning Engineer to lead our AI initiatives.

Required Skills:
• 5+ years ML experience
• Python, TensorFlow, PyTorch
• Computer Vision or NLP
• AWS/GCP deployment
• Model optimization & scaling

Responsibilities:
• Design and implement ML pipelines
• Lead ML team of 3-4 engineers
• Optimize model performance
• Mentor junior engineers
• Research latest ML techniques`,
    createdAt: new Date('2024-05-15'),
    updatedAt: new Date('2024-05-20'),
  },
  {
    id: 2,
    title: 'Frontend Architect',
    department: 'Product Engineering',
    status: 'Active',
    candidates: 12,
    avgScore: '92%',
    description: `We're seeking an experienced Frontend Architect to lead our web platform.

Required Skills:
• 6+ years frontend development
• React/Vue/Angular expertise
• TypeScript & advanced JavaScript
• System design & architecture
• Performance optimization
• UI/UX principles

Responsibilities:
• Design scalable frontend architecture
• Establish best practices & standards
• Code review & mentorship
• Optimize bundle size & performance
• Drive frontend tooling decisions`,
    createdAt: new Date('2024-05-10'),
    updatedAt: new Date('2024-05-18'),
  },
  {
    id: 3,
    title: 'Product Designer (UX)',
    department: 'Design Team',
    status: 'Draft',
    candidates: 0,
    avgScore: '--',
    description: `Join our Design team to shape the future of our platform.

Required Skills:
• 4+ years UX/Product design
• Figma & design tools
• User research & testing
• Design systems knowledge
• Prototyping skills
• Accessibility awareness

Responsibilities:
• Design user flows & interfaces
• Conduct user research
• Create design systems
• Collaborate with engineering
• Test & iterate designs`,
    createdAt: new Date('2024-05-18'),
    updatedAt: new Date('2024-05-18'),
  },
  {
    id: 4,
    title: 'Python Developer',
    department: 'Backend Engineering',
    status: 'Active',
    candidates: 8,
    avgScore: '85%',
    description: `Seeking a Python Developer with experience in React, SQL, AWS, Docker, Git, and Machine Learning.

Required Skills:
• Python 3.8+
• Django/FastAPI
• PostgreSQL/MongoDB
• Docker containerization
• AWS services (EC2, S3, Lambda)
• Git version control
• REST API design
• Basic ML concepts

Responsibilities:
• Build scalable backend services
• Design and optimize databases
• Write clean, maintainable code
• Implement security best practices
• Deploy and monitor applications`,
    createdAt: new Date('2024-05-12'),
    updatedAt: new Date('2024-05-19'),
  },
  {
    id: 5,
    title: 'ML Engineer',
    department: 'AI/ML Department',
    status: 'Active',
    candidates: 15,
    avgScore: '88%',
    description: `We need an ML Engineer to develop cutting-edge machine learning solutions.

Required Skills:
• 3+ years ML experience
• Python & Jupyter
• Scikit-learn, TensorFlow
• Data preprocessing & feature engineering
• Model evaluation & validation
• API development basics
• Git & Linux

Responsibilities:
• Develop ML models and pipelines
• Handle data preprocessing
• Perform feature engineering
• Model training and evaluation
• Deploy models to production`,
    createdAt: new Date('2024-05-16'),
    updatedAt: new Date('2024-05-17'),
  },
  {
    id: 6,
    title: 'Cloud Engineer',
    department: 'Infrastructure',
    status: 'Active',
    candidates: 10,
    avgScore: '90%',
    description: `Looking for a Cloud Engineer to manage and scale our cloud infrastructure.

Required Skills:
• 3+ years cloud experience
• AWS/GCP or Azure
• Kubernetes & Docker
• Infrastructure as Code (Terraform)
• CI/CD pipelines
• Monitoring & logging
• Linux & networking

Responsibilities:
• Design cloud architecture
• Implement infrastructure automation
• Manage deployments and scaling
• Monitor system health
• Optimize cloud costs`,
    createdAt: new Date('2024-05-13'),
    updatedAt: new Date('2024-05-21'),
  },
];

export const MOCK_NOTIFICATION_TEMPLATES = {
  jdUpdated: (jobTitle, candidateCount) => ({
    type: 'jd-updated',
    title: 'Job Updated',
    message: `${jobTitle} job description was updated.`,
    details: `${candidateCount} previously screened candidates may require re-evaluation.`,
    actionText: 'Recheck Candidates',
  }),
  recheckReminder: (jobTitle) => ({
    type: 'recheck-reminder',
    title: 'Candidate Recheck Reminder',
    message: `Consider re-evaluating candidates for ${jobTitle}`,
    details: 'Job description changes may affect candidate fit scores.',
    actionText: 'Review Candidates',
  }),
  screeningComplete: (candidateName) => ({
    type: 'screening-complete',
    title: 'Screening Complete',
    message: `${candidateName} resume has been successfully screened.`,
    details: 'View detailed matching results in the Analytics section.',
    actionText: 'View Results',
  }),
};
