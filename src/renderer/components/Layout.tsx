import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Users,
  CreditCard,
  BarChart3,
  Settings,
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const navigationItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/sales', icon: ShoppingCart, label: 'Sales' },
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/inventory', icon: Boxes, label: 'Inventory' },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/transactions', icon: CreditCard, label: 'Transactions' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-blue-900 text-white flex flex-col">
        {/* Sidebar Header */}
        <div className="p-6 border-b border-white/10 bg-black/10">
          <h2 className="text-xl font-bold text-center tracking-wide">
            💼 POS System
          </h2>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-white/15 text-white border border-white/20 shadow-lg translate-x-1'
                    : 'text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-1'
                }`}
              >
                <Icon
                  className={`w-5 h-5 mr-4 ${isActive ? 'drop-shadow-md' : ''}`}
                />
                <span
                  className={`font-medium tracking-wide ${
                    isActive ? 'font-semibold' : ''
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/10 bg-black/10 mt-auto">
          <span className="block text-center text-xs text-white/60">
            © 2025 POS System v1.0
          </span>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 shadow-sm flex items-center px-6 shrink-0">
          <h1 className="text-lg font-medium text-gray-600">
            {navigationItems.find((item) => item.path === location.pathname)
              ?.label || 'Dashboard'}
          </h1>
        </header>

        {/* Content Area */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-full overflow-hidden">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
