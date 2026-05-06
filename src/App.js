import { useEffect, useState } from 'react';
import { supabase }        from './lib/supabase';
import Login               from './pages/Login';
import Sidebar             from './components/Sidebar';
import Dashboard           from './pages/Dashboard';
import Donations           from './pages/Donations';
import Users               from './pages/Users';
import Categories          from './pages/Categories';
import AdminAssociations   from './pages/AdminAssociations';
import NotificationsPage   from './pages/NotificationsPage';
import SettingsPage        from './pages/SettingsPage';
import './App.css';
import { ADMIN_ID } from './lib/constants';

export default function App() {
  const [user,         setUser]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState('dashboard');
  const [unreadCount,  setUnreadCount]  = useState(0);

  // ── Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Badge notifications en temps réel
  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();

    const channel = supabase
      .channel('notif-badge')
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'notifications',
      }, () => fetchUnreadCount())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [user]);

  useEffect(() => {
    if (page === 'notifications') fetchUnreadCount();
  }, [page]);

  const fetchUnreadCount = async () => {
    try {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', '93ddcd0b-b59a-4cf3-b40a-d05eb129b39b')
        .eq('read', false);
      setUnreadCount(count || 0);
    } catch (e) {
      console.error(e);
    }
  };

  // ── Loading
  if (loading) return (
    <div style={{
      minHeight:      '100vh',
      background:     '#F4F6F9',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      gap:            16,
    }}>
      <div style={{
        width:          48,
        height:         48,
        borderRadius:   14,
        background:     'linear-gradient(135deg, #2563EB, #7C3AED)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        fontSize:       24,
        boxShadow:      '0 8px 20px rgba(37,99,235,0.3)',
      }}>🤝</div>
      <div style={{
        color:      '#64748B',
        fontSize:   15,
        fontWeight: 500,
      }}>
        Chargement…
      </div>
    </div>
  );

  // ── Login
  if (!user) return <Login onLogin={setUser} />;

  // ── Pages
  const pages = {
    dashboard:     <Dashboard />,
    donations:     <Donations />,
    associations:  <AdminAssociations />,
    users:         <Users />,
    categories:    <Categories />,
    notifications: <NotificationsPage onRead={fetchUnreadCount} />,
    settings:      <SettingsPage user={user} />,
  };

  return (
    <div style={{
      display:    'flex',
      minHeight:  '100vh',
      background: '#F4F6F9',
    }}>
      <Sidebar
        active={page}
        onNavigate={setPage}
        user={user}
        unreadCount={unreadCount}
      />
      <main style={{
        marginLeft: 240,
        flex:       1,
        minHeight:  '100vh',
        background: '#F4F6F9',
        animation:  'fadeIn 0.2s ease',
      }}>
        {pages[page] ?? <Dashboard />}
      </main>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
      `}</style>
    </div>
  );
}