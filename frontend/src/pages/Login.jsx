import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleGoogleClick = () => {
    toast('Google Sign-In will be available in a future update.', { icon: 'ℹ️' });
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setIsLoading(true);
    try {
      const data = await authService.login(email, password);
      
      // Sign in to Firebase Auth for sync
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (fbErr) {
        console.error('Firebase Auth signin sync error:', fbErr.message);
        if (fbErr.code === 'auth/user-not-found') {
          try {
            await createUserWithEmailAndPassword(auth, email, password);
            console.log('Firebase Auth account created on sync login.');
          } catch (createErr) {
            console.error('Firebase Auth registration sync error on login:', createErr.message);
          }
        }
      }

      login(data.user, data.token);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error(error);
      // Double toast removed: api.js interceptor handles it
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-container-padding font-body-standard text-text-primary bg-[#F5F4F0] relative overflow-hidden w-full">
      {/* Background radial gradients */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0" style={{
        backgroundImage: `
          radial-gradient(at 0% 0%, #E1F5EE 0px, transparent 50%),
          radial-gradient(at 100% 100%, #F0EFE9 0px, transparent 50%)
        `
      }} />

      <main className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-700 relative z-10">
        {/* Logo Branding Area */}
        <div className="text-center mb-gap-lg">
          <div className="inline-flex items-center justify-center bg-primary-container w-12 h-12 rounded-lg mb-base-unit shadow-sm">
            <span className="material-symbols-outlined text-white text-3xl">analytics</span>
          </div>
          <h1 className="font-headline-auth text-headline-auth text-on-background tracking-tight">RecruitAI</h1>
          <p className="font-body-standard text-body-standard text-text-secondary mt-1">Resume Intelligence for Executive Hiring</p>
        </div>

        {/* Auth Card */}
        <div className="bg-surface border border-border-subtle rounded-xl p-8 shadow-[0_4px_12px_rgba(0,0,0,0.05)]">
          <h2 className="font-title-page text-title-page mb-6">Sign in to your account</h2>
          <form className="space-y-gap-md" onSubmit={handleSubmit}>


            {/* Email Field */}
            <div>
              <label className="block font-label-caps text-label-caps text-text-secondary mb-2 uppercase" htmlFor="email">Email Address</label>
              <input
                className="w-full bg-surface border border-border-strong rounded-[6px] px-4 py-2.5 text-body-standard transition-all placeholder:text-text-muted focus:outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/10"
                id="email"
                placeholder="name@company.ai"
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block font-label-caps text-label-caps text-text-secondary uppercase" htmlFor="password">Password</label>
                <Link className="text-[12px] font-medium text-primary hover:underline transition-all" to="/forgot-password">Forgot password?</Link>
              </div>
              <div className="relative">
                <input
                  className="w-full bg-surface border border-border-strong rounded-[6px] px-4 py-2.5 text-body-standard transition-all placeholder:text-text-muted focus:outline-none focus:border-[#1D9E75] focus:ring-2 focus:ring-[#1D9E75]/10"
                  id="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                  onClick={togglePassword}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Primary Action */}
            <button
              className="w-full bg-[#1D9E75] hover:bg-accent-hover text-white font-body-bold py-3 rounded-[6px] transition-all transform active:scale-[0.98] shadow-sm flex items-center justify-center gap-xs disabled:opacity-50"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-border-subtle"></div>
              <span className="flex-shrink mx-4 text-label-caps text-text-muted uppercase">or continue with</span>
              <div className="flex-grow border-t border-border-subtle"></div>
            </div>

            {/* Social Sign In */}
            <button
              className="w-full bg-surface border border-border-strong hover:bg-surface-container-low text-text-primary font-body-bold py-2.5 rounded-[6px] transition-all flex items-center justify-center gap-xs"
              type="button"
              onClick={handleGoogleClick}
            >
              <img
                alt="Google"
                className="w-5 h-5"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxRAjSZgTBnsntppsiJCvtIi8QaRX_Svkl9YjuQk0cy6tu24hpenFLF-QAYqm0hCds43IIEHKToMIHEfNf0CoSZNCkJLsNjPoj1UHkBrw6CuBh0lmQEzWuq5NkpkmuISPdsXsUKdYoYwXFjMssVgohOQeqTRWTb8SzJ1FbXUBISlhkQiRFH2BkiB-PcTYuG7ABVJINtXIvlERdGya_2xumYm4UV2wqAEcIRs_ws3nyoxaTNgUl-B0pXqHn1EG6RJJ4iWMhqYirewIC"
              />
              Sign in with Google
            </button>
          </form>
        </div>

        {/* Footer Links */}
        <div className="mt-gap-lg flex flex-col items-center gap-2">
          <p className="text-body-standard text-text-secondary">
            Don't have an account?{' '}
            <Link className="font-body-bold text-primary hover:underline transition-all" to="/signup">Request access</Link>
          </p>
          <div className="flex gap-md mt-4">
            <a className="text-[12px] text-text-muted hover:text-text-secondary" href="#">Privacy Policy</a>
            <a className="text-[12px] text-text-muted hover:text-text-secondary" href="#">Terms of Service</a>
          </div>
          <p className="text-[11px] text-text-muted mt-4">© 2024 RecruitAI. Intelligence in Hiring.</p>
        </div>
      </main>

      {/* Visual Atmosphere: Subtle Floating Element */}
      <div className="fixed top-20 right-20 w-32 h-32 bg-accent-soft rounded-full blur-[80px] opacity-40 pointer-events-none"></div>
      <div className="fixed bottom-20 left-20 w-48 h-48 bg-primary-fixed rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
    </div>
  );
};

export default Login;
