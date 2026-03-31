import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider } from './components/ThemeProvider';
import { NotificationProvider } from './components/NotificationProvider';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Transactions from './pages/Transactions';
import About from './pages/About';

export default function App() {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(
    () => sessionStorage.getItem('pos_unlocked') === 'true'
  );

  const handleAuthenticated = () => {
    sessionStorage.setItem('pos_unlocked', 'true');
    setIsUnlocked(true);
  };

  const handleLock = () => {
    sessionStorage.removeItem('pos_unlocked');
    setIsUnlocked(false);
  };

  return (
    <ThemeProvider defaultTheme="system" storageKey="pos-ui-theme">
      <NotificationProvider>
        <Router>
          <Layout>
          <Routes>
          <Route path="/" element={!isUnlocked ? <Login onAuthenticated={handleAuthenticated} /> : <Dashboard onLock={handleLock} />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/products" element={<Products />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Router>
      <Toaster position="top-right" richColors closeButton />
      </NotificationProvider>
    </ThemeProvider>
  );
}
