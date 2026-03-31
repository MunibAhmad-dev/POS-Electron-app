import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Package, Boxes, Users,
  CreditCard, BarChart3, Settings, User, Moon, Sun, 
  Bell, Menu, X, CheckCircle2, AlertCircle, Info, ChevronLeft, ChevronRight
} from 'lucide-react';
import Logo from '../components/img/yasir_logo_transparent.png';
import { useTheme } from './ThemeProvider';
import { useNotifications } from './NotificationProvider';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { cn } from '../lib/utils';
import ErrorBoundary from './ErrorBoundary';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  
  const [logoData, setLogoData] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    async function fetchLogo() {
      if (window.api && window.api.getLogo) {
        try {
          const res = await window.api.getLogo();
          if (res.success && res.data) {
            setLogoData(res.data);
          }
        } catch (e) {
          console.error("Failed to load dynamic logo", e);
        }
      }
    }
    fetchLogo();
  }, []);

  const navigationItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/sales', icon: ShoppingCart, label: 'Sales' },
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/inventory', icon: Boxes, label: 'Inventory' },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/transactions', icon: CreditCard, label: 'Transactions' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' },
    { path: '/about', icon: User, label: 'About' }
  ];

  return (
    <div className="flex bg-background min-h-screen font-sans text-foreground transition-colors overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={cn(
          "flex-shrink-0 bg-card border-r border-border flex flex-col transition-all duration-300 relative",
          isSidebarCollapsed ? "w-[80px]" : "w-64"
        )}
      >
        <div className="absolute -right-3 top-6 z-50 rounded-full border border-border bg-background shadow-md">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full" 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </Button>
        </div>

        {/* Sidebar Header */}
        <div className={cn("p-6 border-b border-border flex items-center h-20", isSidebarCollapsed ? "justify-center px-0" : "justify-center")}>
          <div className={cn("flex items-center space-x-3 transition-all", isSidebarCollapsed ? "flex-col space-x-0" : "")}>
            <div className="bg-primary/10 p-2 rounded-xl border border-primary/20">
              <img src={logoData || Logo} className="h-8 w-8 object-contain" alt="Logo" />
            </div>
            {!isSidebarCollapsed && <h2 className="text-xl font-bold tracking-tight text-foreground truncate">Restaurant POS</h2>}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={isSidebarCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-lg transition-all duration-200 group text-muted-foreground",
                  isSidebarCollapsed ? "justify-center py-3" : "px-4 py-3",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" 
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className={cn("shrink-0", isSidebarCollapsed ? "w-5 h-5 mx-0" : "w-5 h-5 mr-3", isActive && !isSidebarCollapsed && "scale-110 transition-transform")} />
                {!isSidebarCollapsed && (
                  <span className={cn("font-medium text-sm transition-all", isActive ? "font-semibold" : "")}>
                    {item.label}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border mt-auto h-16 flex items-center justify-center">
          {!isSidebarCollapsed ? (
            <span className="text-xs font-medium text-muted-foreground">© 2025 POS System v1.0</span>
          ) : (
             <span className="text-xs font-bold text-muted-foreground">v1</span>
          )}
        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 flex flex-col min-w-0 h-screen transition-all">
        {/* Top Header */}
        <header className="h-20 bg-card/60 backdrop-blur-md border-b border-border flex items-center justify-between px-8 shrink-0 relative z-20">
          <div className="flex items-center gap-3">
             {/* If sidebar is fully mobile-collapsed we'd show a hamburger here, but for desktop we just show title */}
             <h1 className="text-2xl font-semibold tracking-tight text-foreground">
               {navigationItems.find((item) => item.path === location.pathname)?.label || 'Dashboard'}
             </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="icon"
              className="rounded-full h-10 w-10 border-border bg-background"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
               {theme === "dark" ? <Sun size={18} className="text-orange-300" /> : <Moon size={18} className="text-slate-600" />}
            </Button>

            {/* Notification Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full h-10 w-10 border-border bg-background relative">
                  <Bell size={18} className="text-foreground" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground animate-in zoom-in">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0 shadow-2xl rounded-xl">
                <div className="flex items-center justify-between p-4 border-b">
                  <DropdownMenuLabel className="p-0 font-semibold text-base">Notifications</DropdownMenuLabel>
                  <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto p-0 text-xs text-primary hover:bg-transparent hover:text-primary/80">
                    Mark all read
                  </Button>
                </div>
                
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center">
                      <Bell size={32} className="opacity-20 mb-2"/>
                      No new notifications
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className={cn(
                          "p-4 border-b last:border-0 hover:bg-muted/50 cursor-default transition-colors flex gap-3",
                          !notif.read && "bg-primary/5"
                        )}
                        onClick={() => markAsRead(notif.id)}
                      >
                         <div className="shrink-0 mt-0.5">
                           {notif.type === 'success' && <CheckCircle2 size={16} className="text-green-500" />}
                           {notif.type === 'error' && <AlertCircle size={16} className="text-destructive" />}
                           {notif.type === 'info' && <Info size={16} className="text-blue-500" />}
                           {notif.type === 'warning' && <AlertCircle size={16} className="text-orange-500" />}
                         </div>
                         <div className="flex-1 space-y-1">
                           <p className={cn("text-sm font-medium leading-none", !notif.read ? "text-foreground" : "text-muted-foreground")}>{notif.title}</p>
                           <p className="text-xs text-muted-foreground">{notif.message}</p>
                           <p className="text-[10px] text-muted-foreground/80 mt-1">
                             {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </p>
                         </div>
                      </div>
                    ))
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <div className="p-2 border-t text-center">
                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground h-8" onClick={clearAll}>
                      Clear All
                    </Button>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile Placeholder or generic lock mechanism wrapper if requested */}
          </div>
        </header>

        {/* Dynamic Content Rendering Wrapper */}
        <div className="flex-1 p-8 overflow-y-auto bg-background/50 relative">
           <div className="mx-auto w-full max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
           </div>
        </div>
      </main>
    </div>
  );
}
