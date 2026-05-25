import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { auth } from '../config/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // Step 1: Input Email, Step 2: Confirmation
  const [isLoading, setIsLoading] = useState(false);

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset link sent to your email!');
      setStep(2);
    } catch (error) {
      console.error(error);
      toast.error(`Password reset failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-container-padding font-body-standard text-text-primary bg-[#faf9f5] relative overflow-hidden w-full">
      {/* Radial gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" style={{
        backgroundImage: `
          radial-gradient(at 0% 0%, rgba(0, 105, 76, 0.03) 0px, transparent 50%),
          radial-gradient(at 100% 100%, rgba(0, 105, 76, 0.03) 0px, transparent 50%)
        `
      }} />

      <main className="w-full max-w-[440px] relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Brand Identity */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary p-2 rounded-lg mb-4 flex items-center justify-center">
            <span className="material-symbols-outlined text-surface text-[32px]">lock_reset</span>
          </div>
          <h1 className="font-title-page text-title-page font-bold text-on-surface tracking-tight">RecruitAI</h1>
          <p className="font-data-mono-sm text-data-mono-sm text-primary uppercase mt-1 tracking-widest">Password Recovery</p>
        </div>

        {/* Recovery Card */}
        <div className="bg-surface border border-border-subtle rounded-xl p-8 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300">
          {step === 1 ? (
            <>
              <div className="text-center mb-8">
                <h2 className="font-headline-auth text-headline-auth text-text-primary mb-2">Forgot Password?</h2>
                <p className="text-text-secondary font-body-standard">
                  Enter your email address and we'll send you a native Firebase password reset link to restore access.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSendResetEmail}>
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label className="font-label-caps text-label-caps text-text-secondary uppercase" htmlFor="email">Email Address</label>
                  <input
                    className="w-full h-11 px-4 bg-surface border border-border-strong rounded-lg text-body-standard transition-all focus:outline-none focus:border-[#00694c] focus:ring-2 focus:ring-[#e1f5ee] placeholder:text-text-muted text-text-primary"
                    id="email"
                    placeholder="name@company.ai"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                {/* Submit Button */}
                <button
                  className="w-full h-12 bg-primary text-on-primary font-body-bold rounded-lg hover:bg-accent-hover transition-all duration-200 shadow-sm flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending Link...' : 'Send Password Reset Link'}
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="font-headline-auth text-headline-auth text-text-primary mb-2">Check Your Inbox</h2>
                <p className="text-text-secondary font-body-standard">
                  We've sent a password reset link to <strong className="text-text-primary">{email}</strong>. Please follow the instructions in the email to set a new password, then return to the sign in page.
                </p>
              </div>

              <div className="text-center mt-6">
                <Link
                  className="w-full h-12 bg-primary text-on-primary font-body-bold rounded-lg hover:bg-accent-hover transition-all duration-200 shadow-sm flex items-center justify-center gap-2"
                  to="/login"
                >
                  Return to Sign In
                  <span className="material-symbols-outlined text-[18px]">login</span>
                </Link>
              </div>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-border-subtle text-center">
            <Link className="font-body-standard text-primary hover:underline transition-all" to="/login">
              Back to Sign in
            </Link>
          </div>
        </div>

        {/* Info Area */}
        <div className="mt-8 flex items-start gap-3 px-4 py-3 bg-surface-container rounded-lg border border-border-subtle">
          <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">info</span>
          <p className="font-body-standard text-on-surface-variant text-[13px] leading-relaxed">
            Email password recovery uses Firebase's native password reset system. Check your real inbox for the link.
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <p className="font-label-caps text-[10px] text-text-muted uppercase tracking-widest">© 2024 RecruitAI. Intelligence in Hiring.</p>
        </footer>
      </main>
    </div>
  );
};

export default ForgotPassword;
