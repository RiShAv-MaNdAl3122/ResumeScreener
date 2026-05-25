const Footer = () => {
  return (
    <footer className="border-t border-border-subtle bg-surface-container-low py-4 mt-auto">
      <div className="max-w-[1200px] mx-auto px-container-padding flex items-center justify-between">
        {/* Left: Brand + Copyright */}
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 bg-primary rounded flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-[12px]">auto_awesome</span>
          </div>
          <span className="font-body-bold text-[13px] text-text-primary">RecruitAI</span>
          <span className="w-px h-3 bg-border-strong"></span>
          <span className="text-[11px] text-text-muted">© 2024 RecruitAI · All rights reserved</span>
        </div>

        {/* Right: Creator Credit */}
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>engineering</span>
          <span className="text-[11px] text-text-secondary">
            Designed &amp; developed by{' '}
            <span className="font-semibold text-text-primary">Rishav Mandal</span>
            <span className="text-text-muted ml-1">· Computer Engineering Student</span>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
