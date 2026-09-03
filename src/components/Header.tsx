import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Package, 
  Receipt, 
  BarChart3, 
  Settings, 
  Wifi, 
  WifiOff, 
  Volume2, 
  VolumeX, 
  Store, 
  Languages,
  LogOut,
  ShieldCheck,
  UserCheck,
  Cloud
} from 'lucide-react';
import { StoreProfile, UserAccount } from '../types';
import { sounds } from '../utils/sound';
import { formatRupiah } from '../utils/formatters';
import { useLanguage } from '../i18n/LanguageContext';

export interface HeaderProps {
  activeTab: 'pos' | 'inventory' | 'transactions' | 'reports';
  setActiveTab: (tab: 'pos' | 'inventory' | 'transactions' | 'reports') => void;
  openSettings: () => void;
  storeProfile: StoreProfile;
  todayRevenue: number;
  todayTxCount: number;
  currentUser: UserAccount;
  onLogout: () => void;
}

export const Header = ({
  activeTab,
  setActiveTab,
  openSettings,
  storeProfile,
  todayRevenue,
  todayTxCount,
  currentUser,
  onLogout,
}: HeaderProps) => {
  const { language, setLanguage, t } = useLanguage();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [soundActive, setSoundActive] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const updateClock = () => {
      const now = new Date();
      const locale = language === 'en' ? 'en-US' : 'id-ID';
      setCurrentTime(
        new Intl.DateTimeFormat(locale, {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(now)
      );
      setCurrentDate(
        new Intl.DateTimeFormat(locale, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(now)
      );
    };

    updateClock();
    const interval = setInterval(updateClock, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [language]);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  const toggleSound = () => {
    const nextState = !soundActive;
    setSoundActive(nextState);
    sounds.enabled = nextState;
    if (nextState) sounds.playBeep();
  };

  const toggleLanguage = () => {
    sounds.playBeep();
    setLanguage(language === 'id' ? 'en' : 'id');
  };

  const handleLogoutClick = () => {
    sounds.playBeep();
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    sounds.playBeep();
    setShowLogoutConfirm(false);
    onLogout();
  };

  // Role based tabs: Staff can ONLY see Kasir and Riwayat Struk
  const allNavItems = [
    { id: 'pos' as const, label: t.navPos, icon: ShoppingBag, badge: null, roles: ['owner', 'staff'] },
    { id: 'inventory' as const, label: t.navInventory, icon: Package, badge: null, roles: ['owner'] },
    { id: 'transactions' as const, label: t.navTransactions, icon: Receipt, badge: todayTxCount > 0 ? `${todayTxCount}` : null, roles: ['owner', 'staff'] },
    { id: 'reports' as const, label: t.navReports, icon: BarChart3, badge: null, roles: ['owner'] },
  ];

  const navItems = allNavItems.filter((item) => item.roles.includes(currentUser.role));

  const isOwner = currentUser.role === 'owner';

  return (
    <header className="bg-[#0B1528] text-slate-100 border-b border-blue-950/80 sticky top-0 z-30 shadow-lg shadow-slate-950/40">
      <div className="max-w-7xl mx-auto px-3 sm:px-5">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold border border-blue-400/40 shadow-md shadow-blue-600/30">
              <Store className="w-5 h-5 text-white drop-shadow-xs" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-sm sm:text-base text-white tracking-tight leading-none">
                  {storeProfile.name || t.appName}
                </h1>
                <span className="hidden md:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-sky-300 border border-blue-500/30">
                  {t.posVersion}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block mt-0.5">
                {storeProfile.tagline || t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => {
                    sounds.playBeep();
                    setActiveTab(item.id);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-950 font-extrabold hover:from-blue-500 hover:to-indigo-500'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${isActive ? 'bg-indigo-950 text-sky-300 shadow-xs' : 'bg-slate-800 text-sky-300'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Status & Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Today Revenue Pill (Owner Only) */}
            {isOwner && (
              <div className="hidden sm:flex flex-col items-end px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-right">
                <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">{t.todayRevenue}</span>
                <span className="text-xs sm:text-sm font-black text-sky-400 font-mono">
                  {formatRupiah(todayRevenue)}
                </span>
              </div>
            )}

            {/* Cloud Database Sync Status Badge */}
            <div 
              title="Firebase Firestore Cloud Database Connected"
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold border bg-sky-950/60 text-sky-300 border-sky-800/60"
            >
              <Cloud className="w-3 h-3 text-sky-400" />
              <span className="hidden xl:inline">Cloud Sync</span>
            </div>

            {/* Offline Status Badge */}
            <div 
              title={isOnline ? t.onlineTooltip : t.offlineTooltip}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-bold border ${
                isOnline
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                  : 'bg-amber-950/80 text-amber-300 border-amber-800/80'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span className="hidden xl:inline">{t.onlineStatus}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400 animate-pulse" />
                  <span className="hidden xl:inline">{t.offlineStatus}</span>
                </>
              )}
            </div>

            {/* Live Clock (Desktop) */}
            <div className="hidden md:flex flex-col items-end text-right px-1">
              <span className="text-xs font-bold text-slate-200 font-mono tracking-tight">{currentTime}</span>
              <span className="text-[9px] text-slate-400">{currentDate}</span>
            </div>

            {/* Language Switcher Pill Button */}
            <button
              id="header-language-toggle"
              onClick={toggleLanguage}
              title={`Switch language: ${language === 'id' ? 'English' : 'Bahasa Indonesia'}`}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Languages className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-extrabold uppercase tracking-wide">
                {language === 'id' ? 'ID' : 'EN'}
              </span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              title={soundActive ? t.soundOn : t.soundOff}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                soundActive 
                  ? 'bg-slate-800 text-sky-400 border-slate-700 hover:bg-slate-700' 
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
            >
              {soundActive ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Settings Button (Owner Only) */}
            {isOwner && (
              <button
                id="header-settings-btn"
                onClick={() => {
                  sounds.playBeep();
                  openSettings();
                }}
                title={t.settingsTooltip}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {/* Logged in User Role Pill & Logout Button */}
            <div className="flex items-center gap-1 pl-1 border-l border-slate-800">
              <div 
                title={`${t.loggedInAs}: ${currentUser.name} (${currentUser.role})`}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-xs font-bold ${
                  isOwner
                    ? 'bg-blue-950/80 border-blue-800/80 text-sky-200'
                    : 'bg-emerald-950/80 border-emerald-800/80 text-emerald-200'
                }`}
              >
                {isOwner ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
                <span className="truncate max-w-[80px] sm:max-w-[120px]">
                  {currentUser.name}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider uppercase ${
                  isOwner ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs' : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                }`}>
                  {currentUser.role === 'owner' ? t.userRoleBadgeOwner : t.userRoleBadgeStaff}
                </span>
              </div>

              {/* Logout button */}
              <button
                id="header-logout-btn"
                onClick={handleLogoutClick}
                title={t.logoutBtn}
                className="p-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 border border-red-800/70 text-red-200 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">{t.logoutBtn}</span>
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex lg:hidden overflow-x-auto py-1.5 gap-1.5 border-t border-blue-950/80 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sounds.playBeep();
                  setActiveTab(item.id);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold shadow-md shadow-blue-950'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 rounded-full font-black ${isActive ? 'bg-indigo-950 text-sky-300' : 'bg-slate-900 text-sky-300'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#0B1528] border border-blue-900/70 text-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-white leading-tight">
                  {language === 'en' ? 'Sign Out Confirmation' : 'Konfirmasi Keluar (Logout)'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {currentUser.name} • <span className="uppercase text-sky-400 font-bold">{currentUser.role}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              {t.confirmLogout}
            </p>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                id="cancel-logout-btn"
                onClick={() => {
                  sounds.playBeep();
                  setShowLogoutConfirm(false);
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer border border-slate-700"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                id="confirm-logout-btn"
                onClick={handleConfirmLogout}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-red-950"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Yes, Sign Out' : 'Ya, Keluar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
