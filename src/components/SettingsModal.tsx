import React, { useState } from 'react';
import { 
  X, 
  Store, 
  Save, 
  Download, 
  Upload, 
  Check, 
  AlertCircle, 
  Building2,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  Lock,
  Sparkles,
  Info
} from 'lucide-react';
import { StoreProfile } from '../types';
import { StorageService } from '../utils/storage';
import { sounds } from '../utils/sound';
import { useLanguage } from '../i18n/LanguageContext';

export interface SettingsModalProps {
  storeProfile: StoreProfile;
  onUpdateStoreProfile: (profile: StoreProfile) => void;
  onResetAllData: () => void;
  onClose: () => void;
}

type SettingsTab = 'store' | 'security' | 'backup';

export const SettingsModal = ({
  storeProfile,
  onUpdateStoreProfile,
  onResetAllData,
  onClose,
}: SettingsModalProps) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<SettingsTab>('security'); // default to security tab to show the requested feature immediately
  const [profile, setProfile] = useState<StoreProfile>({ ...storeProfile });
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string>('');

  // Owner PIN State
  const [ownerNewPin, setOwnerNewPin] = useState<string>('');
  const [ownerConfirmPin, setOwnerConfirmPin] = useState<string>('');
  const [showOwnerPin, setShowOwnerPin] = useState<boolean>(false);
  const [ownerFeedback, setOwnerFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Staff PIN State
  const [currentStaffPin, setCurrentStaffPin] = useState<string>(
    StorageService.getUserByRole('staff')?.password || '123'
  );
  const [showCurrentStaffPin, setShowCurrentStaffPin] = useState<boolean>(false);
  const [staffNewPin, setStaffNewPin] = useState<string>('');
  const [staffConfirmPin, setStaffConfirmPin] = useState<string>('');
  const [showStaffPin, setShowStaffPin] = useState<boolean>(false);
  const [staffFeedback, setStaffFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playBeep();
    onUpdateStoreProfile(profile);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleUpdateOwnerPin = (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerFeedback(null);

    const cleanPin = ownerNewPin.trim();
    if (cleanPin.length < 3) {
      sounds.playBeep();
      setOwnerFeedback({ type: 'error', message: t.pinLengthError });
      return;
    }

    if (cleanPin !== ownerConfirmPin.trim()) {
      sounds.playBeep();
      setOwnerFeedback({ type: 'error', message: t.pinMismatchError });
      return;
    }

    const success = StorageService.updateUserPassword('owner', cleanPin);
    if (success) {
      sounds.playSuccess();
      setOwnerFeedback({ type: 'success', message: `${t.pinSaveSuccess} (Owner)` });
      setOwnerNewPin('');
      setOwnerConfirmPin('');
      setTimeout(() => setOwnerFeedback(null), 4000);
    } else {
      sounds.playBeep();
      setOwnerFeedback({ type: 'error', message: 'Gagal memperbarui PIN Owner.' });
    }
  };

  const handleUpdateStaffPin = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffFeedback(null);

    const cleanPin = staffNewPin.trim();
    if (cleanPin.length < 3) {
      sounds.playBeep();
      setStaffFeedback({ type: 'error', message: t.pinLengthError });
      return;
    }

    if (cleanPin !== staffConfirmPin.trim()) {
      sounds.playBeep();
      setStaffFeedback({ type: 'error', message: t.pinMismatchError });
      return;
    }

    const success = StorageService.updateUserPassword('staff', cleanPin);
    if (success) {
      sounds.playSuccess();
      setStaffFeedback({ type: 'success', message: `${t.pinSaveSuccess} (Staff Kasir)` });
      setCurrentStaffPin(cleanPin);
      setStaffNewPin('');
      setStaffConfirmPin('');
      setTimeout(() => setStaffFeedback(null), 4000);
    } else {
      sounds.playBeep();
      setStaffFeedback({ type: 'error', message: 'Gagal memperbarui PIN Staff.' });
    }
  };

  const handleExportBackup = () => {
    sounds.playBeep();
    const jsonStr = StorageService.exportBackupJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Angkringan_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sounds.playBeep();
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = StorageService.importBackupJSON(content);
      if (success) {
        setImportStatus(t.backupSuccessMsg);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setImportStatus(t.backupInvalidMsg);
      }
    };
    reader.readAsText(file);
  };

  const handleResetConfirm = () => {
    sounds.playBeep();
    setShowResetConfirm(true);
  };

  const executeReset = () => {
    sounds.playBeep();
    setShowResetConfirm(false);
    onResetAllData();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-blue-950/80 bg-[#0B1528] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-sky-400">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-white text-sm sm:text-base leading-tight">
                {t.settingsTitle}
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">
                {language === 'en' ? 'Owner Privileges & Configuration' : 'Hak Akses & Konfigurasi Owner'}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              sounds.playBeep();
              onClose();
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-3 pt-2 gap-1.5 overflow-x-auto">
          
          <button
            type="button"
            onClick={() => {
              sounds.playBeep();
              setActiveTab('security');
            }}
            className={`px-3.5 py-2 rounded-t-xl font-extrabold text-xs flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-white border-blue-600 text-blue-600 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.tabSecurityPin}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playBeep();
              setActiveTab('store');
            }}
            className={`px-3.5 py-2 rounded-t-xl font-extrabold text-xs flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'store'
                ? 'bg-white border-blue-600 text-blue-600 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>{t.tabStoreProfile}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playBeep();
              setActiveTab('backup');
            }}
            className={`px-3.5 py-2 rounded-t-xl font-extrabold text-xs flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'backup'
                ? 'bg-white border-blue-600 text-blue-600 shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.tabBackupData}</span>
          </button>

        </div>

        {/* Modal Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-slate-800 custom-scrollbar">
          
          {/* TAB 1: SECURITY & PIN MANAGEMENT */}
          {activeTab === 'security' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Overview Notice */}
              <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-blue-900 space-y-1">
                <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-blue-950">
                  <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{t.securitySectionTitle}</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  {t.securitySectionDesc}
                </p>
              </div>

              {/* CARD 1: OWNER PIN */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {t.ownerPinHeading}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {t.ownerPinSubheading}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] uppercase tracking-wider">
                    Full Access
                  </span>
                </div>

                {ownerFeedback && (
                  <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    ownerFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}>
                    {ownerFeedback.type === 'success' ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{ownerFeedback.message}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateOwnerPin} className="space-y-2.5 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                        {t.newPinLabel}
                      </label>
                      <div className="relative">
                        <input
                          type={showOwnerPin ? 'text' : 'password'}
                          value={ownerNewPin}
                          onChange={(e) => setOwnerNewPin(e.target.value)}
                          placeholder={t.newPinPlaceholder}
                          required
                          className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowOwnerPin(!showOwnerPin)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showOwnerPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                        {t.confirmPinLabel}
                      </label>
                      <input
                        type={showOwnerPin ? 'text' : 'password'}
                        value={ownerConfirmPin}
                        onChange={(e) => setOwnerConfirmPin(e.target.value)}
                        placeholder={t.confirmPinPlaceholder}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500">
                      💡 {language === 'en' ? 'Min. 3 characters (numbers or letters)' : 'Min. 3 karakter (angka atau huruf)'}
                    </span>
                    <button
                      type="submit"
                      id="save-owner-pin-btn"
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-blue-900/30 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{t.savePinBtn} (Owner)</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* CARD 2: STAFF PIN */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {t.staffPinHeading}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {t.staffPinSubheading}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase tracking-wider">
                    Cashier Only
                  </span>
                </div>

                {/* Inspect current staff PIN */}
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                  <span className="text-slate-600 font-medium">
                    {t.currentStoredPin}:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {showCurrentStaffPin ? currentStaffPin : '••••'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCurrentStaffPin(!showCurrentStaffPin)}
                      className="text-slate-500 hover:text-slate-800 text-[11px] font-bold cursor-pointer underline flex items-center gap-1"
                    >
                      {showCurrentStaffPin ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showCurrentStaffPin ? t.hidePin : t.revealPin}</span>
                    </button>
                  </div>
                </div>

                {staffFeedback && (
                  <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    staffFeedback.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}>
                    {staffFeedback.type === 'success' ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    )}
                    <span>{staffFeedback.message}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateStaffPin} className="space-y-2.5 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                        {t.newPinLabel} (Staff)
                      </label>
                      <div className="relative">
                        <input
                          type={showStaffPin ? 'text' : 'password'}
                          value={staffNewPin}
                          onChange={(e) => setStaffNewPin(e.target.value)}
                          placeholder={t.newPinPlaceholder}
                          required
                          className="w-full px-3 py-2 pr-9 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowStaffPin(!showStaffPin)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showStaffPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                        {t.confirmPinLabel}
                      </label>
                      <input
                        type={showStaffPin ? 'text' : 'password'}
                        value={staffConfirmPin}
                        onChange={(e) => setStaffConfirmPin(e.target.value)}
                        placeholder={t.confirmPinPlaceholder}
                        required
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="submit"
                      id="save-staff-pin-btn"
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{t.savePinBtn} (Staff)</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* CARD 3: SECURITY TIPS & PROTOCOL */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 space-y-1.5">
                <div className="font-bold text-xs flex items-center gap-1.5 text-amber-900">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t.securityTipsTitle}</span>
                </div>
                <ul className="space-y-1 text-[11px] text-amber-900 list-disc pl-4 leading-relaxed">
                  <li>{t.securityTip1}</li>
                  <li>{t.securityTip2}</li>
                  <li>{t.securityTip3}</li>
                </ul>
              </div>

            </div>
          )}

          {/* TAB 2: STORE PROFILE */}
          {activeTab === 'store' && (
            <form onSubmit={handleSaveProfile} className="space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t.storeIdentitySection}</span>
                </h4>
                {isSaved && (
                  <span className="text-emerald-700 flex items-center gap-1 text-[11px] font-bold">
                    <Check className="w-3 h-3" /> {t.savedNotice}
                  </span>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">{t.storeNameField}</label>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  placeholder="cth: Angkringan Kopi Jos Mas Joko"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 text-[11px]">{t.taglineField}</label>
                <input
                  type="text"
                  value={profile.tagline}
                  onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                  placeholder="cth: Hangatnya Kebersamaan & Cita Rasa Asli Jogja"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">{t.addressField}</label>
                  <input
                    type="text"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                    placeholder="Jl. Malioboro No. 45"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">{t.phoneField}</label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="0812-3456-7890"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">{t.cashierNameField}</label>
                  <input
                    type="text"
                    value={profile.cashierName}
                    onChange={(e) => setProfile({ ...profile, cashierName: e.target.value })}
                    placeholder="Mas Joko"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">{t.receiptFooterField}</label>
                  <input
                    type="text"
                    value={profile.footerMessage}
                    onChange={(e) => setProfile({ ...profile, footerMessage: e.target.value })}
                    placeholder="Matur Nuwun Sampun Mampir!"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-blue-900/30 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{t.saveProfileBtn}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: BACKUP DATA & FACTORY RESET */}
          {activeTab === 'backup' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t.backupSectionTitle}</span>
                </h4>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  {t.backupSectionDesc}
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1.5 border border-slate-300 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t.exportBackupBtn}</span>
                  </button>

                  <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold flex items-center gap-1.5 border border-slate-300 transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t.importBackupBtn}</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackup}
                      className="hidden"
                    />
                  </label>
                </div>

                {importStatus && (
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold">
                    {importStatus}
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <h4 className="font-bold text-red-600 text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{t.dangerZoneTitle}</span>
                </h4>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-red-50 border border-red-200">
                  <div className="space-y-0.5">
                    <div className="font-bold text-red-900 text-xs">{t.resetDefaultsTitle}</div>
                    <p className="text-[11px] text-red-700 leading-relaxed">{t.resetDefaultsDesc}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetConfirm}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    {t.resetDataBtn}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-red-200 text-slate-900 rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-100 border border-red-200 text-red-600 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-red-900 leading-tight">
                  {t.resetDefaultsTitle}
                </h3>
                <p className="text-[11px] text-red-600 font-bold mt-0.5">
                  {t.dangerZoneTitle}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-red-50 p-3 rounded-xl border border-red-200">
              {t.confirmResetAll}
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  sounds.playBeep();
                  setShowResetConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-slate-300"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                id="confirm-reset-all-btn"
                onClick={executeReset}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-red-900/30"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Yes, Reset Everything' : 'Ya, Reset Semua'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
