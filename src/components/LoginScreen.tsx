import React, { useState } from 'react';
import { 
  Store, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  User, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Languages, 
  Volume2, 
  VolumeX, 
  Sparkles,
  KeyRound,
  Receipt,
  Package,
  BarChart3,
  ShoppingBag
} from 'lucide-react';
import { StoreProfile, UserAccount, UserRole } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { sounds } from '../utils/sound';
import { StorageService } from '../utils/storage';

export interface LoginScreenProps {
  storeProfile: StoreProfile;
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  storeProfile,
  onLoginSuccess,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [username, setUsername] = useState<string>('owner');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [soundActive, setSoundActive] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleRoleSelect = (role: UserRole) => {
    sounds.playBeep();
    setSelectedRole(role);
    setErrorMessage('');
    setUsername(role === 'owner' ? 'owner' : 'staff');
    setPassword('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage(language === 'en' ? 'Please enter both username and password/PIN.' : 'Harap masukkan username dan PIN/password.');
      sounds.playBeep();
      return;
    }

    setIsSubmitting(true);
    sounds.playBeep();

    setTimeout(() => {
      const user = StorageService.authenticate(username, password);
      if (user) {
        sounds.playSuccess();
        onLoginSuccess(user);
      } else {
        sounds.playBeep();
        setErrorMessage(t.loginFailed);
        setIsSubmitting(false);
      }
    }, 250);
  };

  const handleQuickLoginStaff = () => {
    sounds.playSuccess();
    const staff = StorageService.getUserByRole('staff');
    if (staff) {
      StorageService.setCurrentUser(staff);
      onLoginSuccess(staff);
    } else {
      // Fallback staff authentication
      const user = StorageService.authenticate('staff', '123');
      if (user) onLoginSuccess(user);
    }
  };

  const toggleLanguage = () => {
    sounds.playBeep();
    setLanguage(language === 'id' ? 'en' : 'id');
  };

  const toggleSound = () => {
    const nextState = !soundActive;
    setSoundActive(nextState);
    sounds.enabled = nextState;
    if (nextState) sounds.playBeep();
  };

  return (
    <div className="min-h-screen bg-[#070D18] flex flex-col justify-between text-slate-100 selection:bg-blue-600 selection:text-white relative overflow-hidden">
      
      {/* Background glowing accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Language and Sound toggle */}
      <header className="px-4 sm:px-8 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
            <Store className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
            {storeProfile.name || t.appName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <button
            id="login-language-toggle"
            onClick={toggleLanguage}
            title="Switch Language"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-bold transition-all cursor-pointer shadow-xs"
          >
            <Languages className="w-3.5 h-3.5 text-sky-400" />
            <span className="font-extrabold uppercase">{language === 'id' ? 'ID 🇮🇩' : 'EN 🇬🇧'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundActive ? t.soundOn : t.soundOff}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              soundActive 
                ? 'bg-slate-900/90 text-sky-400 border-slate-800 hover:bg-slate-800' 
                : 'bg-slate-950 text-slate-500 border-slate-900 hover:text-slate-300'
            }`}
          >
            {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-3 sm:p-6 z-10">
        <div className="w-full max-w-xl bg-slate-900/95 border border-slate-800/90 rounded-3xl shadow-2xl shadow-slate-950/80 p-5 sm:p-8 backdrop-blur-md space-y-6">
          
          {/* Header Title */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-950/40 mb-1">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {t.loginTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-sm mx-auto">
              {t.loginSubtitle}
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Owner Role Card */}
            <button
              type="button"
              id="role-card-owner"
              onClick={() => handleRoleSelect('owner')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
                selectedRole === 'owner'
                  ? 'bg-gradient-to-br from-blue-950/80 to-slate-900 border-blue-500 shadow-md shadow-blue-900/40 ring-1 ring-blue-500/50'
                  : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-850/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${selectedRole === 'owner' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-xs sm:text-sm">
                      {t.roleOwner}
                    </h3>
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                      {language === 'en' ? 'Full Access' : 'Akses Penuh'}
                    </span>
                  </div>
                </div>
                {selectedRole === 'owner' && (
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                )}
              </div>

              <div className="space-y-1 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <ShoppingBag className="w-3 h-3 text-sky-400 shrink-0" />
                  <span>{t.navPos}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Package className="w-3 h-3 text-sky-400 shrink-0" />
                  <span>{t.navInventory}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Receipt className="w-3 h-3 text-sky-400 shrink-0" />
                  <span>{t.navTransactions}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300">
                  <BarChart3 className="w-3 h-3 text-sky-400 shrink-0" />
                  <span>{t.navReports} & {t.settingsTitle}</span>
                </div>
              </div>
            </button>

            {/* Staff Role Card */}
            <button
              type="button"
              id="role-card-staff"
              onClick={() => handleRoleSelect('staff')}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-3 ${
                selectedRole === 'staff'
                  ? 'bg-gradient-to-br from-blue-950/80 to-slate-900 border-blue-500 shadow-md shadow-blue-900/40 ring-1 ring-blue-500/50'
                  : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-850/60 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${selectedRole === 'staff' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-xs sm:text-sm">
                      {t.roleStaff}
                    </h3>
                    <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">
                      {language === 'en' ? 'Cashier Mode' : 'Mode Kasir'}
                    </span>
                  </div>
                </div>
                {selectedRole === 'staff' && (
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                )}
              </div>

              <div className="space-y-1 text-[11px] text-slate-300">
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <ShoppingBag className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>✓ {t.navPos}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                  <Receipt className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>✓ {t.navTransactions}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 line-through">
                  <Package className="w-3 h-3 text-slate-600 shrink-0" />
                  <span>{t.navInventory}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 line-through">
                  <BarChart3 className="w-3 h-3 text-slate-600 shrink-0" />
                  <span>{t.navReports}</span>
                </div>
              </div>
            </button>

          </div>

          {/* Form Credentials */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs font-semibold flex items-center gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {t.usernameLabel}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="login-username-input"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder={t.usernamePlaceholder}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password-input"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  placeholder={t.passwordPlaceholder}
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-submit-btn"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-950/40 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t.loginBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security Banner & Quick Staff Sign In */}
          <div className="pt-3 border-t border-slate-800/80 space-y-3">
            
            {/* Owner Security Protection Note */}
            <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-900/40 text-slate-300 flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
                <Lock className="w-3.5 h-3.5" />
              </div>
              <div className="space-y-0.5">
                <span className="font-bold text-amber-200 text-xs block">
                  {language === 'en' ? 'Owner Quick Access Disabled' : 'Akses Instan Owner Dinonaktifkan'}
                </span>
                <span className="text-[11px] text-slate-400 block leading-relaxed">
                  {t.quickLoginDisabledNotice}
                </span>
              </div>
            </div>

            {/* Quick Staff Sign In */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider px-0.5">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  {t.quickLoginStaffTitle}
                </span>
                <span className="text-[10px] text-emerald-400/90 font-medium">
                  {language === 'en' ? 'Cashier only mode' : 'Hanya kasir & riwayat'}
                </span>
              </div>

              <button
                type="button"
                id="quick-login-staff"
                onClick={handleQuickLoginStaff}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-emerald-950/40 border border-slate-800 hover:border-emerald-700/70 text-slate-200 hover:text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <span>{t.quickLoginStaff}</span>
                <span className="text-[10px] py-0.5 px-1.5 rounded bg-emerald-900/50 text-emerald-300 font-normal">
                  {language === 'en' ? 'Limited' : 'Terbatas'}
                </span>
              </button>
            </div>

          </div>

        </div>
      </main>

      {/* Footer Branding */}
      <footer className="py-3 px-4 text-center text-xs text-slate-500 z-10 font-medium">
        <span>{storeProfile.name || t.appName} • {storeProfile.tagline || t.appSubtitle}</span>
      </footer>

    </div>
  );
};
