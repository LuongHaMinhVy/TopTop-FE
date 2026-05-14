"use client";

import { useSyncExternalStore } from "react";
import { useState, useRef, useEffect } from "react";
import {
  Search,
  Users, Video, X, TrendingUp,
  Compass, MessageSquare, MoreHorizontal, PlusSquare,
  User, Clock, UserCheck,
  Upload,
  Bell
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "@/store/store";
import { openAuthModal } from "@/store/slices/authSlice";
import { useLogoutMutation } from "@/hooks/auth-hooks";
import { useFollowingList } from "@/hooks/user-hooks";
import { useTranslations } from "next-intl";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import Image from "next/image";

import { 
  SearchRow, 
  TikNavItem, 
  BottomNav, 
  HomeIcon, 
  labelStyle,
  Logo
} from "@/components/layout/LayoutHelpers";
import { SettingsMenu } from "@/components/layout/SettingsMenu";
import { Avatar, Button } from "@repo/ui";
import { useUnreadCount } from "@/hooks/notification-hooks";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('Main');
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const user = useSelector((state: RootState) => state.auth.user);
  const isLoggedIn = useSelector((state: RootState) => !!state.auth.user);
  const dispatch = useDispatch<AppDispatch>();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsMenuRef = useRef<HTMLDivElement>(null);
  const logoutMutation = useLogoutMutation();
  const router = useRouter();
  const pathname = usePathname();
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.data || 0;
  
  const { data: followingData } = useFollowingList();
  const followingList = followingData?.data || [];
  
  function useIsMounted() {
    return useSyncExternalStore(
      () => () => { },
      () => true,
      () => false
    );
  }

  const mounted = useIsMounted(); 
  
  useEffect(() => {
    const handleResize = () => {
      setIsSidebarCollapsed(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => searchInputRef.current?.focus(), 350);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeSearch(); };
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setSettingsOpen(false);
      }
    };

    window.addEventListener("keydown", onKey);
    if (settingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [settingsOpen]);

  const collapsed = mounted ? (isSidebarCollapsed || searchOpen) : false;

  return (
    <div className="flex flex-col h-screen bg-background text-text-primary overflow-hidden">
      {/* Mobile/Tablet Header */}
      <header className="sm:hidden flex items-center gap-3 px-4 h-[60px] border-b border-elevated bg-background/80 backdrop-blur-md z-20 flex-shrink-0 pt-safe">
        <div className="flex items-center gap-2 flex-shrink-0">
          <Logo size="sm" />
          <span className="text-[18px] font-bold tracking-tight">TopTop</span>
        </div>
        <div className="flex-1 flex items-center bg-elevated rounded-full h-[38px] px-3 gap-2 ml-2">
          <Search className="w-4 h-4 text-text-muted flex-shrink-0" />
          <input 
            type="text" 
            placeholder={t('search')} 
            className="bg-transparent flex-1 text-text-primary placeholder:text-text-muted text-[14px] focus:outline-none h-full min-w-0" 
          />
        </div>
        {!isLoggedIn && (
          <Button 
            onClick={() => dispatch(openAuthModal("login"))}
            size="sm"
            className="ml-2 px-4 h-9"
          >
            {t('login')}
          </Button>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside
          className="hidden sm:flex flex-col flex-shrink-0 bg-background no-scrollbar select-none h-full overflow-y-auto"
          style={{
            width: collapsed ? 72 : 240,
            transition: "width 300ms cubic-bezier(0.4,0,0.2,1)",
            overflowX: "hidden",
            position: "relative"
          }}
        >
          {/* Logo - sticky at top */}
          <div className="sticky top-0 bg-background flex-shrink-0 z-20">
            <div className="flex items-center px-5 pt-6 pb-3">
              <Logo size="md" />
              <span className="text-xl font-bold tracking-tight whitespace-nowrap" style={labelStyle(collapsed, 180, 4)}>TopTop</span>
            </div>

            <button
              onClick={openSearch}
              className="group mx-4 mb-4 flex items-center gap-1.5 rounded-full border border-elevated/50 bg-elevated/30 hover:bg-elevated/50 transition-all overflow-hidden"
              style={{ height: 38, paddingLeft: collapsed ? 0 : 10, paddingRight: collapsed ? 0 : 10, justifyContent: collapsed ? "center" : "flex-start", width: collapsed ? 40 : "calc(100% - 32px)" }}
            >
              <Search className="w-[18px] h-[18px] text-text-secondary group-hover:text-text-primary flex-shrink-0" strokeWidth={2.5} />
              <span className={`text-[14px] pl-2 text-start text-text-muted whitespace-nowrap font-medium ${!collapsed ? "block" : "hidden"}`} style={labelStyle(collapsed, 150, 1)}>{t('search')}</span>
            </button>
          </div>

          {/* Scrollable content */}
          <nav className="flex flex-col px-1">
            <Link href="/">
              <TikNavItem icon={<HomeIcon size={24} />} label={t('sidebar.forYou')} active={pathname === "/"} collapsed={collapsed} />
            </Link>
            <Link href="/explore">
              <TikNavItem icon={<Compass size={24} />} label={t('sidebar.explore')} active={pathname === "/explore"} collapsed={collapsed} />
            </Link>
            <Link href="/following">
              <TikNavItem icon={<UserCheck size={24} />} label={t('sidebar.following')} active={pathname === "/following"} collapsed={collapsed} />
            </Link>
            
            {isLoggedIn && (
              <Link href="/friends">
                <TikNavItem icon={<Users size={24} />} label={t('sidebar.friends')} active={pathname === "/friends"} collapsed={collapsed} />
              </Link>
            )}
            
            <Link href="/live">
              <TikNavItem icon={<Video size={24} />} label={t('sidebar.live')} active={pathname === "/live"} collapsed={collapsed} />
            </Link>
            
            {isLoggedIn && (
              <>
                <Link href="/messages">
                  <TikNavItem 
                    icon={
                      <div className="relative">
                        <MessageSquare size={24} />
                        <span className="absolute -top-1 -right-1 bg-brand text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-[1.5px] border-background">1</span>
                      </div>
                    } 
                    label={t('sidebar.messages')} 
                    active={pathname === "/messages"}
                    collapsed={collapsed} 
                  />
                </Link>
                <Link href="/activity">
                <TikNavItem 
                    icon={
                      <div className="relative">
                        <Bell size={24} />
                        { unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-brand text-white text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full border-[1.5px] border-background">{unreadCount}</span> }
                      </div>
                    } 
                    label={t('sidebar.activity')} 
                    active={pathname === "/activity"}
                    collapsed={collapsed} 
                  />
                  
                </Link>
              </>
            )}
            
            <Link href="/toptopstudio/upload">
              <TikNavItem icon={<PlusSquare size={24} />} label={t('sidebar.upload')} active={pathname === "/toptopstudio/upload"} collapsed={collapsed} />
            </Link>
            
            <TikNavItem 
              onClick={() => {
                if (isLoggedIn && user) {
                  router.push(`/@${user.username}`);
                } else {
                  dispatch(openAuthModal("login"));
                }
              }}
              active={user ? pathname === `/@${user.username}` : false}
              icon={
                <Avatar 
                  src={user?.avatarUrl} 
                  alt={user?.nickname ?? user?.username ?? "U"} 
                  size="xs"
                  showBorder={false}
                  className={!isLoggedIn ? "bg-surface" : ""}
                />
              } 
              label={t('sidebar.profile')} 
              collapsed={collapsed} 
            />

          </nav>

          <div
            className="mt-4 border-t border-elevated"
            style={{
              opacity: collapsed ? 0 : 1,
              transition: "opacity 200ms ease",
              pointerEvents: collapsed ? "none" : "auto",
            }}
          >
            {isLoggedIn ? (
              <>
                <p className="text-text-muted text-[13px] font-bold px-4 pt-5 pb-2 uppercase tracking-tight opacity-70">{t('sidebar.followingAccounts')}</p>
                <ul className="flex flex-col px-1 pb-4">
                  {followingList.map(u => (
                    <li key={u.username}>
                      <button 
                        onClick={() => router.push(`/@${u.username}`)}
                        className="flex items-center gap-3 w-full px-3 py-1.5 rounded-[8px] hover:bg-hover transition-colors text-left group"
                      >
                        <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                          <Avatar 
                            src={u.avatarUrl} 
                            alt={u.nickname || u.username || ""} 
                            size="sm"
                            showBorder={false}
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[15px] font-bold text-text-primary truncate leading-tight">{u.nickname ?? u.username}</span>
                          <span className="text-[12px] text-text-muted truncate leading-tight group-hover:text-text-secondary transition-colors">{u.username}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                  {followingList.length === 0 && (
                    <li className="px-5 py-2 text-[13px] text-text-muted italic">
                      {t('sidebar.noFollowing')}
                    </li>
                  )}
                  {followingList.length > 5 && (
                    <li>
                      <button className="flex items-center gap-3 w-full px-3 py-2 rounded-[8px] hover:bg-hover transition-colors text-brand text-[14px] font-bold mt-1 group">
                        <span className="w-8 h-8 flex items-center justify-center text-brand">
                          <MoreHorizontal className="w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={3} />
                        </span>
                        {t('sidebar.seeAll')}
                      </button>
                    </li>
                  )}
                </ul>
              </>
            ) : (
              <>
                <div className="mx-4 mt-6 mb-4 p-4 rounded-xl bg-elevated/30 border border-elevated">
                  <p className="text-text-secondary text-[14px] mb-4 leading-relaxed font-medium">
                    {t('sidebar.loginPrompt')}
                  </p>
                  <Button 
                    onClick={() => dispatch(openAuthModal("login"))}
                    className="w-full h-12 text-lg"
                  >
                    {t('login')}
                  </Button>
                </div>

                <div className="px-4 pb-6 mt-6">
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-4 opacity-60">
                    {[t('footer.company'), t('footer.programs'), t('footer.terms'), t('footer.privacy')].map(label => (
                      <span key={label} className="text-[12px] text-text-muted hover:underline cursor-pointer font-medium">{label}</span>
                    ))}
                  </div>
                  <span className="text-[12px] text-text-muted opacity-50 font-medium">© 2026 TopTop</span>
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Search Panel */}
        <div
          className="hidden lg:flex flex-col flex-shrink-0 border-r border-elevated bg-background overflow-y-auto custom-scrollbar shadow-2xl z-10"
          style={{ width: searchOpen ? 320 : 0, opacity: searchOpen ? 1 : 0, transition: "width 300ms cubic-bezier(0.4,0,0.2,1), opacity 220ms ease" }}
        >
          <div className="w-[320px] p-6 flex flex-col gap-6 h-full">
            <div className="flex items-center gap-2 mt-2">
              <h2 className="text-[22px] font-extrabold flex-1">{t('searchPanel.title')}</h2>
              <button onClick={closeSearch} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-hover transition-colors text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center bg-elevated rounded-full px-4 h-[48px] gap-3 ring-1 ring-transparent focus-within:ring-brand/40 transition-all bg-surface">
              <Search className="w-5 h-5 text-text-muted flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="bg-transparent flex-1 text-text-primary placeholder:text-text-muted text-[15px] focus:outline-none h-full min-w-0"
              />
              {query && (
                <button onClick={() => setQuery("")} className="text-text-muted hover:text-text-primary flex-shrink-0"><X className="w-4 h-4" /></button>
              )}
            </div>

            <section>
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[12px] font-bold text-text-muted uppercase tracking-widest">{t('searchPanel.recent')}</span>
                <button className="text-brand text-[13px] font-semibold hover:underline">{t('searchPanel.clearAll')}</button>
              </div>
              <div className="flex flex-col gap-1">
                <SearchRow icon={<Clock className="w-4 h-4" />} label="trending" removable />
                <SearchRow icon={<Clock className="w-4 h-4" />} label="cats" removable />
              </div>
            </section>

            <section>
              <span className="text-[12px] font-bold text-text-muted uppercase tracking-widest block mb-3 px-1">{t('searchPanel.suggestions')}</span>
              <div className="flex flex-col gap-1">
                <SearchRow icon={<TrendingUp className="w-4 h-4 text-brand" />} label="viral" />
                <SearchRow icon={<TrendingUp className="w-4 h-4 text-brand" />} label="challenge" />
              </div>
            </section>
          </div>
        </div>

        {/* Responsive Header Overlay (Login/User Profile) */}
        <div className="fixed top-3 lg:top-4 right-4 lg:right-6 flex items-center gap-3 z-[60] transition-all duration-300">
          <div className="relative">
            <div className="flex items-center gap-2 bg-background/60 backdrop-blur-xl px-2.5 py-1.5 lg:px-3 lg:py-2 rounded-2xl border border-elevated shadow-2xl hover:bg-background/80 transition-colors">
              {mounted && isLoggedIn && user ? (
                <div 
                  className="flex items-center gap-2 lg:gap-3 cursor-pointer"
                  onClick={() => setSettingsOpen(!settingsOpen)}
                >
                  <div className="flex items-center gap-2 lg:gap-2.5 group">
                    <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full overflow-hidden bg-elevated flex items-center justify-center border-2 border-brand/20 group-hover:border-brand/50 transition-all shadow-inner relative">
                      {user.avatarUrl ? (
                        <Image src={user.avatarUrl} alt={user.nickname ?? ""} fill className="object-cover" />
                      ) : (
                        <span className="text-[14px] font-bold text-brand">
                          {(user.nickname ?? user.username ?? "U")[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="hidden sm:block text-[14px] lg:text-[15px] font-bold text-text-primary group-hover:text-brand transition-colors">
                      {user.nickname ?? user.username}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={() => dispatch(openAuthModal("login"))}
                    size="sm"
                    className="h-9 px-6 rounded-xl"
                  >
                    {t('login')}
                  </Button>
                  <button 
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-hover transition-colors text-text-muted hover:text-text-primary"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {settingsOpen && (
              <div ref={settingsMenuRef} className="absolute top-full right-0 mt-2 z-[70]">
                <SettingsMenu 
                  onClose={() => setSettingsOpen(false)} 
                  onLogout={isLoggedIn ? () => {logoutMutation.mutate(); setSettingsOpen(false);} : undefined}
                  isLoggedIn={isLoggedIn}
                />
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-hidden bg-background flex justify-center">
          <div className="w-full max-w-[1200px] h-full relative">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden flex items-center justify-around border-t border-elevated bg-background/90 backdrop-blur-md h-[64px] flex-shrink-0 z-20 pb-safe">
        <Link href="/">
          <BottomNav icon={<HomeIcon size={26} />} label={t('sidebar.forYou')} active={pathname === "/"} />
        </Link>
        <Link href="/explore">
          <BottomNav icon={<Compass className="w-[26px] h-[26px]" />} label={t('sidebar.explore')} active={pathname === "/explore"} />
        </Link>
        <Link href="/toptopstudio/upload">
          <BottomNav icon={<Upload className="w-[26px] h-[26px]" />} label={t('sidebar.upload')} active={pathname === "/toptopstudio/upload"} />
        </Link>
        <Link href="/friends">
          <BottomNav icon={<Users className="w-[26px] h-[26px]" />} label={t('bottomNav.friends')} active={pathname === "/friends"} />
        </Link>
        <BottomNav 
          active={user ? pathname === `/@${user.username}` : false}
          onClick={() => {
            if (isLoggedIn && user) {
              router.push(`/@${user.username}`);
            } else {
              dispatch(openAuthModal("login"));
            }
          }}
          icon={
            isLoggedIn && user?.avatarUrl ? (
              <div className="w-6 h-6 rounded-full overflow-hidden border border-elevated relative">
                <Image src={user.avatarUrl} alt={user.nickname ?? ""} fill className="object-cover" />
              </div>
            ) : isLoggedIn && user ? (
              <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center text-brand text-[11px] font-bold border border-brand/20">
                {(user.nickname ?? user.username ?? "U")[0].toUpperCase()}
              </div>
            ) : (
              <User className="w-[26px] h-[26px]" />
            )
          } 
          label={t('sidebar.profile')} 
        />
      </nav>
    </div>
  );
}

