import { supabase } from '../lib/supabase';

const NAV = [
  // ── GÉNÉRAL
  { id: 'dashboard',      icon: '📊', label: 'Dashboard',      group: 'general' },
  { id: 'donations',      icon: '🎁', label: 'Donations',      group: 'general' },
  { id: 'associations',   icon: '🤝', label: 'Associations',   group: 'general' },
  { id: 'users',          icon: '👥', label: 'Utilisateurs',   group: 'general' },
  { id: 'categories',     icon: '🏷️', label: 'Catégories',    group: 'general' },
  // ── OUTILS
  { id: 'notifications',  icon: '🔔', label: 'Notifications',  group: 'tools'   },
  { id: 'settings',       icon: '⚙️', label: 'Paramètres',    group: 'tools'   },
];

export default function Sidebar({ active, onNavigate, user, unreadCount = 0, unreadTickets = 0 }) {
  const handleLogout = async () => { await supabase.auth.signOut(); };

  const generalItems = NAV.filter(n => n.group === 'general');
  const toolsItems   = NAV.filter(n => n.group === 'tools');

  return (
    <aside style={{
      width: 240, minHeight: '100vh',
      background: '#FFFFFF',
      borderRight: '1px solid #E4E9F0',
      position: 'fixed', left: 0, top: 0,
      display: 'flex', flexDirection: 'column',
      boxShadow: '2px 0 8px rgba(15,23,42,0.06)',
      zIndex: 100,
    }}>
      {/* ── Brand */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
            boxShadow: '0 4px 10px rgba(37,99,235,0.25)',
          }}>🤝</div>
          <div>
            <div style={{ color: '#1A202C', fontWeight: 700, fontSize: 15 }}>Taawoun</div>
            <div style={{ color: '#94A3B8', fontSize: 11 }}>Administration</div>
          </div>
        </div>
      </div>

      {/* ── Nav */}
      <nav style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>

        {/* Groupe GÉNÉRAL */}
        <GroupLabel label="Général" />
        {generalItems.map(item => (
          <NavItem
            key={item.id}
            item={item}
            isActive={active === item.id}
            onClick={() => onNavigate(item.id)}
          />
        ))}

        {/* Groupe OUTILS */}
        <GroupLabel label="Outils" />
        {toolsItems.map(item => (
          <NavItem
            key={item.id}
            item={item}
            isActive={active === item.id}
            onClick={() => onNavigate(item.id)}
            // 🆕 Badge selon la page
            badge={
              item.id === 'notifications' ? unreadCount   :
              item.id === 'support'       ? unreadTickets :
              0
            }
          />
        ))}
      </nav>

      {/* ── User + Logout */}
      <div style={{ padding: '12px 10px 20px', borderTop: '1px solid #F1F5F9' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 10,
          background: '#F8FAFC', marginBottom: 8,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 13, flexShrink: 0,
          }}>
            {(user?.email || 'A')[0].toUpperCase()}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              color: '#1A202C', fontSize: 12, fontWeight: 600,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {user?.email?.split('@')[0] || 'Admin'}
            </div>
            <div style={{ color: '#94A3B8', fontSize: 10 }}>Administrateur</div>
          </div>
        </div>

        <button onClick={handleLogout} style={{
          width: '100%', padding: '9px 12px', borderRadius: 10,
          border: '1.5px solid #FECACA', background: '#FEF2F2',
          color: '#DC2626', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
          onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
        >
          🚪 Déconnexion
        </button>
      </div>
    </aside>
  );
}

// ── Composants helpers
function GroupLabel({ label }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 700, color: '#94A3B8',
      letterSpacing: '0.08em', padding: '8px 12px 6px',
      textTransform: 'uppercase',
    }}>
      {label}
    </div>
  );
}

function NavItem({ item, isActive, onClick, badge = 0 }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 12px', borderRadius: 10, border: 'none',
      cursor: 'pointer', marginBottom: 2, textAlign: 'left',
      background: isActive ? '#EEF4FF' : 'transparent',
      color:      isActive ? '#2563EB' : '#475569',
      fontWeight: isActive ? 700 : 500, fontSize: 14,
      transition: 'all 0.15s',
    }}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#F8FAFC'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>
        {item.icon}
      </span>

      {item.label}

      {/* Badge */}
      {badge > 0 ? (
        <span style={{
          marginLeft: 'auto',
          background: '#EF4444', color: '#fff',
          fontSize: 10, fontWeight: 700,
          padding: '2px 7px', borderRadius: 20,
          minWidth: 20, textAlign: 'center',
        }}>
          {badge > 99 ? '99+' : badge}
        </span>
      ) : isActive ? (
        <span style={{
          marginLeft: 'auto', width: 7, height: 7,
          borderRadius: '50%', background: '#2563EB',
          display: 'inline-block',
        }} />
      ) : null}
    </button>
  );
}