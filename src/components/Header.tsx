import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Package, 
  Receipt, 
  BarChart3, 
  Settings, 
  WifiOff, 
  Volume2, 
  VolumeX, 
  Store, 
  LogOut, 
  ShieldCheck, 
  UserCheck,
  Cloud
} from 'lucide-react';
import { StoreProfile, UserAccount } from '../types';
import { sounds } from '../utils/sound';
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
  todayTxCount,
  currentUser,
  onLogout,
}: HeaderProps) => {
  const { language, setLanguage, t } = useLanguage();
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [soundActive, setSoundActive] = useState<boolean>(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleSound = () => {
    const nextState = !soundActive;
    setSoundActive(nextState);
    sounds.playBeep();
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
    <header className="bg-[#0B1528] text-slate-100 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-3">
          
          {/* 1. Left: Simple Store Identity */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Store className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-bold text-sm sm:text-base text-white tracking-tight truncate max-w-[180px] sm:max-w-[260px] md:max-w-none">
              {storeProfile.name || t.appName}
            </h1>
          </div>

          {/* 2. Center: Clean Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 shrink-0">
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-blue-950 text-blue-200' : 'bg-slate-800 text-slate-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* 3. Right: Essential Minimal Controls */}
          <div className="flex items-center gap-2 shrink-0">
            
            {/* Minimalist Cloud & Network Status */}
            <div 
              title={isOnline ? "Firebase Cloud Sync: Aktif • Online" : "Mode Offline • Tersimpan di Perangkat"}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/70 border border-slate-800 text-xs text-slate-300"
            >
              <Cloud className="w-3.5 h-3.5 text-sky-400" />
              {isOnline ? (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              )}
            </div>

            {/* Quick Action Icons Group */}
            <div className="flex items-center bg-slate-900/70 rounded-lg border border-slate-800 p-0.5 gap-0.5">
              {/* Language Switch */}
              <button
                id="header-language-toggle"
                onClick={toggleLanguage}
                title={`Language: ${language.toUpperCase()}`}
                className="px-2 py-1 rounded-md text-[11px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {language.toUpperCase()}
              </button>

              {/* Sound Toggle */}
              <button
                onClick={toggleSound}
                title={soundActive ? t.soundOn : t.soundOff}
                className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                {soundActive ? <Volume2 className="w-3.5 h-3.5 text-sky-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
              </button>

              {/* Settings (Owner only) */}
              {isOwner && (
                <button
                  id="header-settings-btn"
                  onClick={() => {
                    sounds.playBeep();
                    openSettings();
                  }}
                  title={t.settingsTooltip}
                  className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* User Account & Logout */}
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-800">
              <div 
                title={`${t.loggedInAs}: ${currentUser.name} (${currentUser.role})`}
                className="flex items-center gap-1 text-xs text-slate-200"
              >
                {isOwner ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                ) : (
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
                <span className="font-medium text-xs truncate max-w-[80px] lg:max-w-[110px]">
                  {currentUser.name}
                </span>
              </div>

              <button
                id="header-logout-btn"
                onClick={handleLogoutClick}
                title={t.logoutBtn}
                className="p-1.5 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>

        {/* Mobile Navigation Tabs (visible only on small screens) */}
        <div className="flex md:hidden overflow-x-auto py-1.5 gap-1.5 border-t border-slate-800 scrollbar-none">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold'
                    : 'bg-slate-800/80 text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] px-1.5 rounded-full font-bold bg-blue-950 text-blue-200">
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
          <div className="bg-[#0B1528] border border-slate-800 text-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-600/20 border border-red-500/30 text-red-400 shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white leading-tight">
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
