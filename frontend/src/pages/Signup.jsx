import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

const Signup = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationStep, setShowVerificationStep] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) {
      toast.error('All fields are required');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    try {
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        await sendEmailVerification(userCredential.user);
        toast.success('Verification link sent to your email inbox!');
        setShowVerificationStep(true);
      } catch (fbErr) {
        if (fbErr.code === 'auth/email-already-in-use') {
          // If already exists, attempt to sign in to check status
          try {
            userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
            if (userCredential.user.emailVerified) {
              // Already verified, complete MySQL registration directly!
              const data = await authService.signup({
                fullName: formData.fullName,
                email: formData.email,
                password: formData.password
              });
              login(data.user, data.token);
              toast.success('Account synced and logged in successfully!');
              navigate('/dashboard');
            } else {
              // Exists but not verified, send verification link
              await sendEmailVerification(userCredential.user);
              toast.success('Verification link sent to your email inbox!');
              setShowVerificationStep(true);
            }
          } catch (signInErr) {
            toast.error(`Firebase Auth error: ${signInErr.message}`);
          }
        } else {
          toast.error(`Firebase Auth error: ${fbErr.message}`);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailAndSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const fbUser = auth.currentUser;
      if (fbUser) {
        await fbUser.reload();
        if (fbUser.emailVerified) {
          const data = await authService.signup({
            fullName: formData.fullName,
            email: formData.email,
            password: formData.password
          });
          login(data.user, data.token);
          toast.success('Email verified successfully! Welcome to RecruitAI.');
          navigate('/dashboard');
        } else {
          toast.error('Email not verified yet. Please check your inbox and click the verification link.');
        }
      } else {
        toast.error('No active session found. Please try signing up again.');
        setShowVerificationStep(false);
      }
    } catch (error) {
      console.error(error);
      toast.error(`Verification check failed: ${error.message}`);
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

      <main className="w-full max-w-[480px] relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Brand Identity */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary p-2 rounded-lg mb-4 flex items-center justify-center">
            <span className="material-symbols-outlined text-surface text-[32px]">network_intelligence</span>
          </div>
          <h1 className="font-title-page text-title-page font-bold text-on-surface tracking-tight">RecruitAI</h1>
          <p className="font-data-mono-sm text-data-mono-sm text-primary uppercase mt-1 tracking-widest">Resume Intelligence</p>
        </div>

        {/* Registration Card */}
        <div className="bg-surface border border-border-subtle rounded-xl p-8 shadow-[0_4px_12px_rgba(0,0,0,0.05)] transition-all duration-300">
          {!showVerificationStep ? (
            <>
              <div className="text-center mb-8">
                <h2 className="font-headline-auth text-headline-auth text-text-primary mb-2">Request Platform Access</h2>
                <p className="text-text-secondary font-body-standard">Join 500+ talent teams using AI to streamline their hiring workflow.</p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="font-label-caps text-label-caps text-text-secondary uppercase" htmlFor="fullName">Full Name</label>
                    <input 
                      className="w-full h-11 px-4 bg-surface border border-border-strong rounded-lg text-body-standard transition-all focus:outline-none focus:border-[#00694c] focus:ring-2 focus:ring-[#e1f5ee] placeholder:text-text-muted" 
                      id="fullName" 
                      name="fullName"
                      placeholder="Jane Doe" 
                      required 
                      type="text"
                      value={formData.fullName}
                      onChange={handleChange}
                    />
                  </div>
                  {/* Work Email */}
                  <div className="space-y-1.5">
                    <label className="font-label-caps text-label-caps text-text-secondary uppercase" htmlFor="email">Work Email</label>
                    <input 
                      className="w-full h-11 px-4 bg-surface border border-border-strong rounded-lg text-body-standard transition-all focus:outline-none focus:border-[#00694c] focus:ring-2 focus:ring-[#e1f5ee] placeholder:text-text-muted" 
                      id="email" 
                      name="email"
                      placeholder="jane@company.com" 
                      required 
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Password */}
                  <div className="space-y-1.5">
                    <label className="font-label-caps text-label-caps text-text-secondary uppercase" htmlFor="password">Password</label>
                    <input 
                      className="w-full h-11 px-4 bg-surface border border-border-strong rounded-lg text-body-standard transition-all focus:outline-none focus:border-[#00694c] focus:ring-2 focus:ring-[#e1f5ee] placeholder:text-text-muted" 
                      id="password" 
                      name="password"
                      placeholder="••••••••" 
                      required 
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                  {/* Confirm Password */}
                  <div className="space-y-1.5">
                    <label className="font-label-caps text-label-caps text-text-secondary uppercase" htmlFor="confirmPassword">Confirm Password</label>
                    <input 
                      className="w-full h-11 px-4 bg-surface border border-border-strong rounded-lg text-body-standard transition-all focus:outline-none focus:border-[#00694c] focus:ring-2 focus:ring-[#e1f5ee] placeholder:text-text-muted" 
                      id="confirmPassword" 
                      name="confirmPassword"
                      placeholder="••••••••" 
                      required 
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  className="w-full h-12 bg-primary text-on-primary font-body-bold rounded-lg hover:bg-accent-hover transition-all duration-200 shadow-sm flex items-center justify-center gap-2 mt-4 disabled:opacity-50" 
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Submitting Request...' : 'Submit Request'}
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="font-headline-auth text-headline-auth text-text-primary mb-2">Verify Your Email</h2>
                <p className="text-text-secondary font-body-standard">
                  A verification link has been sent to <strong className="text-text-primary">{formData.email}</strong>. Please check your inbox and click the verification link, then return here to complete your registration.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleVerifyEmailAndSignup}>
                {/* Submit Button */}
                <button 
                  className="w-full h-12 bg-primary text-on-primary font-body-bold rounded-lg hover:bg-accent-hover transition-all duration-200 shadow-sm flex items-center justify-center gap-2 mt-4 disabled:opacity-50" 
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Checking status...' : 'I have verified my email'}
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </button>

                {import.meta.env.DEV && (
                  <button
                    type="button"
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        const data = await authService.signup({
                          fullName: formData.fullName,
                          email: formData.email,
                          password: formData.password
                        });
                        login(data.user, data.token);
                        toast.success('(Dev Bypass) Account registered successfully!');
                        navigate('/dashboard');
                      } catch (error) {
                        toast.error(`Bypass failed: ${error.message}`);
                      }
                      setIsLoading(false);
                    }}
                    className="w-full h-11 border border-dashed border-primary text-primary font-body-bold rounded-lg hover:bg-primary/5 transition-all duration-200 mt-2 text-xs flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">bug_report</span>
                    Bypass Verification (Dev Only)
                  </button>
                )}

                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsLoading(true);
                      try {
                        const fbUser = auth.currentUser;
                        if (fbUser) {
                          await sendEmailVerification(fbUser);
                          toast.success('Verification link resent!');
                        } else {
                          toast.error('No active session found. Please refresh and try again.');
                        }
                      } catch (err) {
                        toast.error(`Resend failed: ${err.message}`);
                      }
                      setIsLoading(false);
                    }}
                    className="text-primary font-body-bold text-[13px] hover:underline"
                    disabled={isLoading}
                  >
                    Resend Verification Link
                  </button>
                </div>
              </form>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-border-subtle text-center">
            <Link className="font-body-standard text-primary hover:underline transition-all" to="/login">
              Already have an account? Sign in
            </Link>
          </div>
        </div>

        {/* Info Area */}
        <div className="mt-8 flex items-start gap-3 px-4 py-3 bg-surface-container rounded-lg border border-border-subtle">
          <span className="material-symbols-outlined text-primary text-[20px] mt-0.5">info</span>
          <p className="font-body-standard text-on-surface-variant text-[13px] leading-relaxed">
            Email verification uses Firebase's native verification link service. Check your real inbox for the link.
          </p>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <div className="flex justify-center gap-6 mb-4">
            <a className="font-label-caps text-label-caps text-text-muted hover:text-primary transition-colors" href="#">Solutions</a>
            <a className="font-label-caps text-label-caps text-text-muted hover:text-primary transition-colors" href="#">Privacy</a>
            <a className="font-label-caps text-label-caps text-text-muted hover:text-primary transition-colors" href="#">Terms</a>
          </div>
          <p className="font-label-caps text-[10px] text-text-muted uppercase tracking-widest">© 2024 RecruitAI. Intelligence in Hiring.</p>
        </footer>
      </main>
    </div>
  );
};

export default Signup;
