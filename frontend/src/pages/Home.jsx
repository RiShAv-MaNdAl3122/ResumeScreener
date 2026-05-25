import { Link } from 'react-router-dom';
import { useEffect } from 'react';

const Home = () => {
  useEffect(() => {
    // Scroll effect for header
    const handleScroll = () => {
      const nav = document.querySelector('nav');
      if (nav) {
        if (window.scrollY > 20) {
          nav.classList.add('shadow-sm');
        } else {
          nav.classList.remove('shadow-sm');
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-background text-on-surface font-body-standard min-h-screen flex flex-col">
      {/* TopNavBar */}
      <nav className="fixed top-0 left-0 right-0 h-[64px] bg-surface/80 backdrop-blur-md border-b border-border-subtle z-50 flex items-center justify-between px-container-padding transition-all">
        <div className="flex items-center gap-xs">
          <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            account_tree
          </span>
          <span className="font-title-page text-title-page font-bold text-on-surface">RecruitAI</span>
        </div>

        <div className="flex items-center gap-md">
          <Link to="/login" className="font-nav-item text-nav-item text-text-primary px-4 py-2 hover:bg-surface-container rounded-lg transition-all text-center">
            Login
          </Link>
          <Link to="/signup" className="font-nav-item text-nav-item bg-primary text-on-primary px-5 py-2.5 rounded-lg font-bold hover:bg-accent-hover shadow-sm transition-all text-center">
            Get Started
          </Link>
        </div>
      </nav>

      <main className="pt-[64px] flex-1">
        {/* Hero Section */}
        <section className="hero-gradient pt-24 pb-16 px-container-padding text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-xs bg-accent-soft text-primary px-3 py-1 rounded-full border border-primary/10 mb-6">
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span className="font-label-caps text-label-caps uppercase">Next-Gen Resume Intelligence</span>
            </div>
            <h1 className="font-display-metric text-[48px] md:text-[64px] leading-tight text-text-primary mb-6 tracking-tight">
              Screen Resumes with <span className="text-primary italic">AI Precision</span>
            </h1>
            <p className="font-body-standard text-[18px] text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
              RecruitAI parses thousands of resumes in seconds, scoring candidates against your JD with mathematical accuracy and eliminating manual bias.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-md">
              <Link to="/signup" className="w-full sm:w-auto bg-primary text-on-primary px-8 py-4 rounded-xl font-bold text-[16px] hover:bg-accent-hover shadow-lg shadow-primary/10 transition-all flex items-center justify-center gap-xs">
                Try for free
                <span className="material-symbols-outlined">arrow_forward</span>
              </Link>
              <button className="w-full sm:w-auto bg-surface text-text-primary border border-border-strong px-8 py-4 rounded-xl font-bold text-[16px] hover:bg-surface-container transition-all flex items-center justify-center gap-xs">
                View Demo
              </button>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 max-w-6xl mx-auto relative group">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[120%] h-[120%] bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            <div className="relative bg-surface rounded-2xl border border-border-strong shadow-2xl overflow-hidden">
              {/* Browser Bar */}
              <div className="h-10 bg-surface-container border-b border-border-subtle flex items-center px-4 gap-2">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-error/20"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-warning/20"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-primary/20"></div>
                </div>
                <div className="mx-auto bg-surface px-8 py-1 rounded text-[11px] text-text-muted flex items-center gap-xs">
                  <span className="material-symbols-outlined text-[12px]">lock</span>
                  app.recruit.ai/dashboard
                </div>
              </div>
              {/* Main Screenshot */}
              <img 
                className="w-full aspect-[16/9] object-cover" 
                alt="A sophisticated dashboard interface for an AI recruitment platform." 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuB5qzy6F49WyZzG_ghr30OA-NYfOG4Fgl2cd5MeZaa-_P_rr8rohFPzYF2mNa059oHoAsuekEluTUqcF0Cz2F4_19Ww2mWFV5AP5casLYeie8Re_ib8s4NV9Pul-a_ZPbj1jS3wIxjPq0_MrNVWQMknsAikYMQxIpQ7QVE0_TICBv2Lqb2JKwQErDxZJS8YWDgKYnKc3DYYtxufVBolBh0Z4J-UWiM0uLX5UN9mwo_UhAW4YA84E7JUm64uyVAM6C-9iec0HVSGUAwP"
              />
            </div>
          </div>
        </section>



        {/* Features Section */}
        <section className="py-24 px-container-padding bg-surface">
          <div className="max-w-7xl mx-auto">
            <div className="mb-16">
              <h2 className="font-display-metric text-[32px] md:text-[40px] text-text-primary mb-4">Precision-Engineered Screening</h2>
              <p className="font-body-standard text-text-secondary max-w-xl">Move beyond keyword matching. Our neural networks understand context, seniority, and transferable skills.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
              {/* Feature 1 */}
              <div className="p-card-padding rounded-[14px] border border-border-subtle bg-surface-bright hover:shadow-lg transition-all group">
                <div className="w-12 h-12 rounded-xl bg-accent-soft flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">batch_prediction</span>
                </div>
                <h3 className="font-title-page text-title-page mb-3">Batch Parsing</h3>
                <p className="font-body-standard text-text-secondary leading-relaxed">Upload hundreds of PDFs, DocX, or plain text files. Our engine extracts structured data with 99.9% accuracy.</p>
              </div>
              {/* Feature 2 */}
              <div className="p-card-padding rounded-[14px] border border-border-subtle bg-surface-bright hover:shadow-lg transition-all group">
                <div className="w-12 h-12 rounded-xl bg-accent-soft flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">analytics</span>
                </div>
                <h3 className="font-title-page text-title-page mb-3">AI Match Scoring</h3>
                <p className="font-body-standard text-text-secondary leading-relaxed">Proprietary algorithms rank candidates based on role requirements, experience depth, and company culture fit.</p>
              </div>
              {/* Feature 3 */}
              <div className="p-card-padding rounded-[14px] border border-border-subtle bg-surface-bright hover:shadow-lg transition-all group">
                <div className="w-12 h-12 rounded-xl bg-accent-soft flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">difference</span>
                </div>
                <h3 className="font-title-page text-title-page mb-3">Skill Gap Analysis</h3>
                <p className="font-body-standard text-text-secondary leading-relaxed">Instantly see where a candidate falls short and what training they might need to succeed in the specific role.</p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works (Bento Layout) */}
        <section className="py-24 px-container-padding bg-surface-container-low">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-display-metric text-[32px] md:text-[40px] text-text-primary mb-4">The Workflow of the Future</h2>
              <p className="font-body-standard text-text-secondary max-w-xl mx-auto">Three steps to transforming your hiring funnel into a data-driven engine.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-12 grid-rows-2 gap-md h-auto md:h-[600px]">
              {/* Step 1 */}
              <div className="md:col-span-7 bg-surface rounded-[14px] border border-border-subtle p-8 flex flex-col justify-between overflow-hidden relative">
                <div>
                  <span className="font-data-mono text-primary text-[14px] mb-2 block">STEP 01</span>
                  <h3 className="font-display-metric text-[28px] mb-4">Create Job Description</h3>
                  <p className="font-body-standard text-text-secondary max-w-md">Input your JD or use our AI generator to define the perfect persona for the role. Define hard skills, soft traits, and mission values.</p>
                </div>
                <div className="mt-8 bg-surface-container rounded-lg p-4 border border-border-subtle rotate-2 translate-y-4">
                  <div className="flex items-center gap-xs mb-4">
                    <div className="w-8 h-8 rounded-full bg-primary-fixed"></div>
                    <div className="h-3 w-32 bg-text-muted/20 rounded"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 w-full bg-text-muted/10 rounded"></div>
                    <div className="h-2 w-[90%] bg-text-muted/10 rounded"></div>
                    <div className="h-2 w-[95%] bg-text-muted/10 rounded"></div>
                  </div>
                </div>
              </div>
              {/* Step 2 */}
              <div className="md:col-span-5 bg-primary text-on-primary rounded-[14px] p-8 flex flex-col items-center justify-center text-center overflow-hidden">
                <span className="font-data-mono text-on-primary/60 text-[14px] mb-4 block">STEP 02</span>
                <h3 className="font-display-metric text-[28px] mb-4">Upload Resumes</h3>
                <p className="font-body-standard text-on-primary/80 mb-8">Drag and drop folders. We handle the heavy lifting of extraction and structuring.</p>
                <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center border border-white/20 animate-pulse">
                  <span className="material-symbols-outlined text-[40px]">upload_file</span>
                </div>
              </div>
              {/* Step 3 */}
              <div className="md:col-span-12 bg-surface rounded-[14px] border border-border-subtle p-8 flex flex-col md:flex-row items-center gap-lg">
                <div className="flex-1">
                  <span className="font-data-mono text-primary text-[14px] mb-2 block">STEP 03</span>
                  <h3 className="font-display-metric text-[28px] mb-4">Get Ranked Results</h3>
                  <p className="font-body-standard text-text-secondary">Review a list of candidates ranked by a weighted intelligence score. Focus only on the top 1% who truly match your needs.</p>
                  <button className="mt-6 text-primary font-bold flex items-center gap-xs hover:gap-md transition-all">
                    Learn about our scoring <span className="material-symbols-outlined">trending_flat</span>
                  </button>
                </div>
                <div className="flex-1 flex gap-md w-full overflow-hidden">
                  <div className="flex-1 bg-accent-soft rounded-xl p-4 border border-primary/10">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-data-mono-sm">SCORE</span>
                      <span className="font-data-mono text-primary font-bold">98/100</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[98%]"></div>
                    </div>
                  </div>
                  <div className="flex-1 bg-surface-container rounded-xl p-4 border border-border-subtle opacity-60">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-data-mono-sm">SCORE</span>
                      <span className="font-data-mono font-bold">82/100</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                      <div className="h-full bg-primary w-[82%]"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-container-padding bg-surface">
          <div className="max-w-5xl mx-auto glass-card rounded-[24px] p-12 md:p-20 text-center border border-border-strong overflow-hidden relative">
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
            <h2 className="font-display-metric text-[36px] md:text-[48px] text-text-primary mb-6 relative z-10">Ready to Hire Smarter?</h2>
            <p className="font-body-standard text-[18px] text-text-secondary mb-10 max-w-xl mx-auto relative z-10">Experience the power of AI-driven resume screening — screen candidates faster, smarter, and with zero bias.</p>
            <div className="flex items-center justify-center relative z-10">
              <Link to="/signup" className="bg-primary text-on-primary px-10 py-5 rounded-xl font-bold text-[18px] hover:bg-accent-hover shadow-xl transition-all text-center">
                Get Started Free
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-low border-t border-border-subtle py-10 px-container-padding">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6 text-center">
          {/* Brand */}
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-primary text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              account_tree
            </span>
            <span className="font-title-page text-title-page font-bold text-on-surface">RecruitAI</span>
          </div>

          {/* Tagline */}
          <p className="font-body-standard text-text-secondary max-w-sm">
            AI-powered resume intelligence platform — built to help recruiters make smarter, faster hiring decisions.
          </p>

          {/* Divider */}
          <div className="w-16 h-px bg-border-subtle"></div>

          {/* Creator Credit */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>engineering</span>
              <p className="font-body-standard text-[13px] text-text-secondary">
                Designed &amp; developed by{' '}
                <span className="font-body-bold text-text-primary">Rishav Mandal</span>
              </p>
            </div>
            <p className="font-label-caps text-[10px] text-text-muted uppercase tracking-wider">Computer Engineering Student</p>
          </div>

          {/* Copyright */}
          <p className="font-label-caps text-[10px] text-text-muted uppercase tracking-widest">
            © 2024 RecruitAI · All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
