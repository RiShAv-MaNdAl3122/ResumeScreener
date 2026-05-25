import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { auth } from '../config/firebase';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential, verifyBeforeUpdateEmail } from 'firebase/auth';

const Settings = () => {
  const { user, login } = useAuth();

  // Account settings state
  const [account, setAccount] = useState({
    fullName: '',
    email: '',
    companyName: '',
  });

  // Change Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // Change Email Modal state
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailStep, setEmailStep] = useState(1);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [emailOtpCode, setEmailOtpCode] = useState('');
  const [isEmailLoading, setIsEmailLoading] = useState(false);

  // AI & Algorithm Tuning state
  const [matchingSensitivity, setMatchingSensitivity] = useState(7.5);
  const [biasShield, setBiasShield] = useState(true);
  const [neuralSkills, setNeuralSkills] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authService.getProfile();
        if (res.success && res.user) {
          setAccount({
            fullName: res.user.full_name || '',
            email: res.user.email || '',
            companyName: res.user.company_name || '',
          });
        }
      } catch (err) {
        console.error('Failed to load profile settings:', err);
      }
    };
    fetchProfile();
  }, []);

  const getSensitivityLabel = (val) => {
    if (val < 4) return 'Loose';
    if (val > 7.5) return 'Strict';
    return 'Balanced';
  };

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccount((prev) => ({ ...prev, [name]: value }));
  };

  const saveAccountDetails = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        fullName: account.fullName,
        companyName: account.companyName,
      };
      const res = await authService.updateProfile(updateData);
      if (res.success) {
        const token = localStorage.getItem('token');
        const updatedUser = {
          ...user,
          full_name: account.fullName,
          company_name: account.companyName,
        };
        login(updatedUser, token);
        toast.success('Account preferences saved successfully!', {
          style: {
            background: '#00694c',
            color: '#ffffff',
            fontFamily: 'DM Sans, sans-serif',
          },
        });
      }
    } catch (err) {
      console.error('Failed to save profile settings:', err);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('All password fields are required');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsPasswordLoading(true);
    try {
      const res = await authService.resetPasswordSettings(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      if (res.success) {
        toast.success('Password updated successfully!');
        
        // Sync with Firebase Auth client side
        try {
          const fbUser = auth.currentUser;
          if (fbUser) {
            await updatePassword(fbUser, passwordData.newPassword);
            console.log('Firebase Auth password sync complete.');
          }
        } catch (fbErr) {
          console.error('Firebase Auth password sync error (may require reauth):', fbErr.message);
        }

        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (err) {
      console.error('Failed to reset password:', err);
    } finally {
      setIsPasswordLoading(false);
    }
  };

  const handleEmailRequestSubmit = async (e) => {
    e.preventDefault();
    if (!emailPassword || !newEmail) {
      toast.error('All fields are required');
      return;
    }
    setIsEmailLoading(true);
    try {
      const fbUser = auth.currentUser;
      if (fbUser) {
        // Reauthenticate first
        const credential = EmailAuthProvider.credential(fbUser.email, emailPassword);
        await reauthenticateWithCredential(fbUser, credential);
        
        // Request email update (sends verification link to the new email)
        await verifyBeforeUpdateEmail(fbUser, newEmail);
        toast.success('Verification link sent to your new email inbox!');
        setEmailStep(2);
      } else {
        toast.error('No active session found. Please re-login.');
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to request email change: ${err.message}`);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleEmailConfirmSubmit = async (e) => {
    e.preventDefault();
    setIsEmailLoading(true);
    try {
      const fbUser = auth.currentUser;
      if (fbUser) {
        await fbUser.reload();
        // If the email has been verified and updated in Firebase
        if (fbUser.email === newEmail) {
          const res = await authService.changeEmailFirebase(newEmail);
          if (res.success) {
            // Update local session
            const token = localStorage.getItem('token');
            const updatedUser = {
              ...user,
              email: newEmail,
            };
            login(updatedUser, token);

            // Update local state
            setAccount((prev) => ({ ...prev, email: newEmail }));
            toast.success('Email address updated successfully!');
            setIsEmailModalOpen(false);
          }
        } else {
          toast.error('New email is not verified yet. Please check your new inbox and click the verification link.');
        }
      } else {
        toast.error('No active session found.');
      }
    } catch (err) {
      console.error(err);
      toast.error(`Verification check failed: ${err.message}`);
    } finally {
      setIsEmailLoading(false);
    }
  };

  const clearAICache = () => {
    const confirmClear = window.confirm('Are you sure you want to clear all locally cached matching weights and training embeddings? Matching scores may fluctuate for 24-48 hours.');
    if (confirmClear) {
      toast('Coming on next version', { icon: 'ℹ️' });
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-4xl mx-auto pb-24">
      {/* Title & Description */}
      <div className="mb-10">
        <h2 className="font-display-metric text-display-metric text-text-primary mb-2">Workspace Settings</h2>
        <p className="font-body-standard text-body-standard text-text-secondary">
          Manage your account preferences, notification triggers, and AI matching parameters.
        </p>
      </div>

      <div className="space-y-gap-lg flex flex-col gap-6">
        {/* Section 1: Account Settings */}
        <section className="bg-surface rounded-xl border border-border-subtle overflow-hidden shadow-sm">
          <div className="px-card-padding py-4 border-b border-border-subtle bg-surface-bright">
            <h3 className="font-body-bold text-body-standard text-text-primary">Account Details</h3>
          </div>
          <form onSubmit={saveAccountDetails} className="p-card-padding">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-label-caps text-text-muted uppercase text-[11px]">Full Name</label>
                <input
                  name="fullName"
                  className="bg-surface border border-border-strong rounded-lg px-3 py-2 font-body-standard text-body-standard focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary"
                  type="text"
                  value={account.fullName}
                  onChange={handleAccountChange}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-label-caps text-text-muted uppercase text-[11px]">Company Name (Optional)</label>
                <input
                  name="companyName"
                  className="bg-surface border border-border-strong rounded-lg px-3 py-2 font-body-standard text-body-standard focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary"
                  type="text"
                  value={account.companyName}
                  onChange={handleAccountChange}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-label-caps text-text-muted uppercase text-[11px]">Email Address</label>
                <div className="flex gap-2">
                  <input
                    name="email"
                    className="flex-1 bg-surface border border-border-strong rounded-lg px-3 py-2 font-body-standard text-body-standard opacity-60 cursor-not-allowed text-text-primary outline-none"
                    type="email"
                    value={account.email}
                    disabled
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsEmailModalOpen(true);
                      setEmailStep(1);
                      setNewEmail('');
                      setEmailPassword('');
                      setEmailOtpCode('');
                    }}
                    className="px-4 py-2 border border-primary text-primary hover:bg-primary/5 rounded-lg font-body-bold text-body-standard transition-all"
                  >
                    Change Email
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                className="bg-primary text-on-primary px-6 py-2 rounded-lg font-body-bold text-body-standard hover:bg-accent-hover transition-colors shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </form>
        </section>

        {/* Section 2: Reset Password */}
        <section className="bg-surface rounded-xl border border-border-subtle overflow-hidden shadow-sm">
          <div className="px-card-padding py-4 border-b border-border-subtle bg-surface-bright">
            <h3 className="font-body-bold text-body-standard text-text-primary">Reset Password</h3>
          </div>
          <form onSubmit={handleResetPassword} className="p-card-padding">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md gap-4">
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-label-caps text-text-muted uppercase text-[11px]">Current Password</label>
                <input
                  name="currentPassword"
                  className="bg-surface border border-border-strong rounded-lg px-3 py-2 font-body-standard text-body-standard focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary"
                  type="password"
                  placeholder="••••••••"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-label-caps text-text-muted uppercase text-[11px]">New Password</label>
                <input
                  name="newPassword"
                  className="bg-surface border border-border-strong rounded-lg px-3 py-2 font-body-standard text-body-standard focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary"
                  type="password"
                  placeholder="••••••••"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-label-caps text-label-caps text-text-muted uppercase text-[11px]">Confirm New Password</label>
                <input
                  name="confirmPassword"
                  className="bg-surface border border-border-strong rounded-lg px-3 py-2 font-body-standard text-body-standard focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-text-primary"
                  type="password"
                  placeholder="••••••••"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={isPasswordLoading}
                className="bg-primary text-on-primary px-6 py-2 rounded-lg font-body-bold text-body-standard hover:bg-accent-hover transition-colors shadow-sm disabled:opacity-50"
              >
                {isPasswordLoading ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </form>
        </section>

        {/* Section 3: AI Configuration */}
        <section className="bg-surface rounded-xl border border-border-subtle overflow-hidden shadow-sm">
          <div className="px-card-padding py-4 border-b border-border-subtle bg-surface-bright flex items-center justify-between">
            <h3 className="font-body-bold text-body-standard text-text-primary">AI &amp; Algorithm Tuning</h3>
            <span className="font-data-mono-sm text-data-mono-sm text-primary bg-accent-soft px-2 py-0.5 rounded border border-primary/20 text-xs">
              v4.2-PRO
            </span>
          </div>
          <div className="p-card-padding p-6 space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="font-label-caps text-label-caps text-text-muted uppercase text-[11px]">Matching Sensitivity</label>
                <span className="font-data-mono text-data-mono text-primary font-semibold">
                  {getSensitivityLabel(matchingSensitivity)} ({matchingSensitivity})
                </span>
              </div>
              <input
                className="w-full h-1.5 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary"
                max="10"
                min="1"
                step="0.5"
                type="range"
                value={matchingSensitivity}
                onChange={(e) => {
                  setMatchingSensitivity(parseFloat(e.target.value));
                  toast('Coming on next version', { icon: 'ℹ️' });
                }}
              />
              <div className="flex justify-between mt-2 text-[10px] text-text-muted font-body-standard">
                <span>High Recall (Loose)</span>
                <span>High Precision (Strict)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md gap-4">
              {/* Bias Shield Card */}
              <div
                onClick={() => {
                  setBiasShield(!biasShield);
                  toast('Coming on next version', { icon: 'ℹ️' });
                }}
                className={`p-4 border rounded-lg transition-colors cursor-pointer group flex flex-col justify-between ${
                  biasShield
                    ? 'border-primary bg-accent-soft/30 hover:bg-accent-soft/40'
                    : 'border-border-subtle bg-surface hover:border-text-muted'
                }`}
              >
                <div>
                  <div className="flex items-center gap-xs gap-1.5 mb-2">
                    <span className={`material-symbols-outlined transition-transform group-hover:scale-115 ${biasShield ? 'text-primary' : 'text-text-muted'}`}>
                      {biasShield ? 'verified_user' : 'shield'}
                    </span>
                    <p className="font-body-bold text-body-standard text-text-primary">Bias Shield</p>
                  </div>
                  <p className="text-[12px] text-text-secondary leading-relaxed">
                    Ensures socio-economic, age, and gender neutrality during initial resume parsing and ranking.
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${biasShield ? 'text-primary' : 'text-text-muted'}`}>
                    {biasShield ? 'Shield Active' : 'Shield Inactive'}
                  </span>
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${biasShield ? 'border-primary bg-primary' : 'border-text-muted'}`}>
                    {biasShield && <span className="material-symbols-outlined text-white text-[8px]">check</span>}
                  </div>
                </div>
              </div>

              {/* Neural Skills Card */}
              <div
                onClick={() => {
                  setNeuralSkills(!neuralSkills);
                  toast('Coming on next version', { icon: 'ℹ️' });
                }}
                className={`p-4 border rounded-lg transition-colors cursor-pointer group flex flex-col justify-between ${
                  neuralSkills
                    ? 'border-primary bg-accent-soft/30 hover:bg-accent-soft/40'
                    : 'border-border-subtle bg-surface hover:border-text-muted'
                }`}
              >
                <div>
                  <div className="flex items-center gap-xs gap-1.5 mb-2">
                    <span className={`material-symbols-outlined transition-transform group-hover:scale-115 ${neuralSkills ? 'text-primary' : 'text-text-muted'}`}>
                      psychology
                    </span>
                    <p className="font-body-bold text-body-standard text-text-primary">Neural Skill Extraction</p>
                  </div>
                  <p className="text-[12px] text-text-secondary leading-relaxed">
                    Uses advanced semantic LLMs to infer latent expertise and concepts not explicitly stated in descriptions.
                  </p>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${neuralSkills ? 'text-primary' : 'text-text-muted'}`}>
                    {neuralSkills ? 'Extraction Active' : 'Extraction Inactive'}
                  </span>
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${neuralSkills ? 'border-primary bg-primary' : 'border-text-muted'}`}>
                    {neuralSkills && <span className="material-symbols-outlined text-white text-[8px]">check</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Data Management (Danger Zone) */}
        <section className="bg-danger-soft/30 rounded-xl border border-danger/20 overflow-hidden shadow-sm">
          <div className="px-card-padding py-4 border-b border-danger/10 bg-danger-soft/50">
            <h3 className="font-body-bold text-body-standard text-danger flex items-center gap-xs gap-1">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              Danger Zone
            </h3>
          </div>
          <div className="p-card-padding p-6 flex flex-col md:flex-row md:items-center justify-between gap-md gap-4">
            <div className="max-w-md">
              <p className="font-body-bold text-body-standard text-text-primary">Clear AI Cache &amp; Embeddings</p>
              <p className="font-body-standard text-body-standard text-text-secondary text-xs mt-1 leading-relaxed">
                This will reset all locally stored intelligence weights and document embeddings. Your matching scores may fluctuate for 24-48 hours while the system re-indexes.
              </p>
            </div>
            <button
              onClick={clearAICache}
              className="whitespace-nowrap border border-danger text-danger px-6 py-2 rounded-lg font-body-bold text-body-standard hover:bg-danger hover:text-white transition-all duration-200 shadow-sm"
            >
              Clear AI Cache
            </button>
          </div>
        </section>
      </div>

      {/* Email Change Modal */}
      {isEmailModalOpen && (
        <>
          {/* Overlay */}
          <div
            onClick={() => setIsEmailModalOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-150"
          ></div>

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-surface rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-border-subtle w-full max-w-md overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border-subtle">
                <h2 className="font-headline-auth text-[18px] font-bold text-text-primary">
                  Change Email Address
                </h2>
                <button
                  onClick={() => setIsEmailModalOpen(false)}
                  className="text-text-muted hover:text-text-primary transition-colors"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={emailStep === 1 ? handleEmailRequestSubmit : handleEmailConfirmSubmit} className="flex-1 flex flex-col">
                <div className="px-6 py-5 space-y-4">
                  {emailStep === 1 ? (
                    <>
                      <p className="text-text-secondary text-xs leading-relaxed">
                        To change your email address, please enter your current password and the new email address you'd like to use. We'll send a 6-digit verification code to the new email.
                      </p>
                      
                      {/* Current Password */}
                      <div className="flex flex-col">
                        <label className="font-label-caps text-label-caps text-text-muted mb-1 block uppercase font-bold text-[10px]">
                          Current Password
                        </label>
                        <input
                          type="password"
                          required
                          value={emailPassword}
                          onChange={(e) => setEmailPassword(e.target.value)}
                          className="px-3 py-2 bg-surface border border-border-strong rounded-lg font-body-standard text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                          placeholder="••••••••"
                        />
                      </div>

                      {/* New Email */}
                      <div className="flex flex-col">
                        <label className="font-label-caps text-label-caps text-text-muted mb-1 block uppercase font-bold text-[10px]">
                          New Email Address
                        </label>
                        <input
                          type="email"
                          required
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="px-3 py-2 bg-surface border border-border-strong rounded-lg font-body-standard text-text-primary placeholder:text-text-muted focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
                          placeholder="newemail@company.com"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-text-secondary text-xs leading-relaxed">
                        A verification link has been sent to <strong className="text-text-primary">{newEmail}</strong>. Please check your inbox and click the verification link to confirm the email change.
                      </p>

                      <div className="text-center py-4 bg-surface-container rounded-lg border border-border-subtle">
                        <p className="text-xs text-text-muted">
                          Once you have clicked the link in your email, click the button below to update your profile.
                        </p>
                      </div>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={async () => {
                            setIsEmailLoading(true);
                            try {
                              const fbUser = auth.currentUser;
                              if (fbUser) {
                                await verifyBeforeUpdateEmail(fbUser, newEmail);
                                toast.success('Verification link resent!');
                              }
                            } catch (err) {
                              toast.error(`Resend failed: ${err.message}`);
                            }
                            setIsEmailLoading(false);
                          }}
                          className="text-primary font-body-bold text-[12px] hover:underline"
                          disabled={isEmailLoading}
                        >
                          Resend Verification Link
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-border-subtle px-6 py-4 flex items-center justify-end gap-3 bg-surface-container-lowest">
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(false)}
                    className="px-4 py-2 border border-border-strong rounded-lg font-body-bold text-body-standard text-text-secondary hover:bg-surface-container transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEmailLoading}
                    className="px-4 py-2 bg-primary hover:bg-accent-hover text-on-primary rounded-lg font-body-bold text-body-standard transition-all shadow-sm disabled:opacity-50"
                  >
                    {isEmailLoading ? 'Processing...' : emailStep === 1 ? 'Send Link' : 'Complete Email Change'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Settings;
