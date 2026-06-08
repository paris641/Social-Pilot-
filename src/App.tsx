import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Analytics from './pages/Analytics';
import Calendar from './pages/Calendar';
import ContentLibrary from './pages/ContentLibrary';
import AIReview from './pages/AIReview';
import Inspiration from './pages/Inspiration';
import AIAssistant from './pages/AIAssistant';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import { useAppStore } from './store/appStore';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi, clientsApi } from './services/api';

export default function App() {
  const { setClients, setNotifications, setUnreadCount } = useAppStore();

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: clientsApi.getAll,
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getAll,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    if (clients) setClients(clients);
  }, [clients]);

  useEffect(() => {
    if (notifications) {
      setNotifications(notifications);
      setUnreadCount(notifications.length);
    }
  }, [notifications]);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/clients/:id" element={<ClientDetail />} />
              <Route path="/clients/:id/analytics" element={<Analytics />} />
              <Route path="/clients/:id/calendar" element={<Calendar />} />
              <Route path="/clients/:id/content" element={<ContentLibrary />} />
              <Route path="/clients/:id/reports" element={<Reports />} />
              <Route path="/ai-review" element={<AIReview />} />
              <Route path="/inspiration" element={<Inspiration />} />
              <Route path="/assistant" element={<AIAssistant />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
