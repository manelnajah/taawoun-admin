import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#2563EB', '#7C3AED', '#059669', '#EA580C', '#0891B2', '#D97706'];

// Couleurs thème clair
const BG      = '#FFFFFF';
const BORDER  = '#E4E9F0';
const TEXT    = '#1A202C';
const MUTED   = '#64748B';
const SURFACE = '#F8FAFC';

const card = {
  background: BG, borderRadius: 12, padding: 20,
  border: `1px solid ${BORDER}`,
  boxShadow: '0 1px 4px rgba(15,23,42,0.07)',
};

const tooltip = {
  contentStyle: { background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, color: TEXT, fontSize: 13 }
};

export default function Dashboard() {
  const [stats, setStats]           = useState({ donations: 0, users: 0, categories: 0, associations: 0, verified: 0, pending: 0 });
  const [byRegion, setByRegion]     = useState([]);
  const [byCategory, setByCategory] = useState([]);
  const [byAssocCat, setByAssocCat] = useState([]);
  const [recent, setRecent]         = useState([]);
  const [recentAssoc, setRecentAssoc] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [don, usr, cat, assoc] = await Promise.all([
      supabase.from('donations').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*'),
      supabase.from('categories').select('*'),
      supabase.from('association_profiles').select('*').order('created_at', { ascending: false }),
    ]);
    const donations = don.data || [];
    const associations = assoc.data || [];
    setStats({ donations: donations.length, users: usr.data?.length || 0, categories: cat.data?.length || 0,
      associations: associations.length, verified: associations.filter(a => a.is_verified).length,
      pending: associations.filter(a => !a.is_verified).length });
    const regionMap = {};
    donations.forEach(d => { const r = d.region || 'Unknown'; regionMap[r] = (regionMap[r] || 0) + 1; });
    setByRegion(Object.entries(regionMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8));
    const catMap = {};
    donations.forEach(d => { const c = d.category_name || 'Unknown'; catMap[c] = (catMap[c] || 0) + 1; });
    setByCategory(Object.entries(catMap).map(([name, value]) => ({ name, value })));
    const assocCatMap = {};
    associations.forEach(a => { const c = a.category || 'Non définie'; assocCatMap[c] = (assocCatMap[c] || 0) + 1; });
    setByAssocCat(Object.entries(assocCatMap).map(([name, value]) => ({ name, value })));
    setRecent(donations.slice(0, 5));
    setRecentAssoc(associations.slice(0, 5));
    setLoading(false);
  };

  if (loading) return <div style={{ color: MUTED, padding: 40, textAlign: 'center' }}>Chargement...</div>;

  const statCards = [
    { label: 'Total Donations', value: stats.donations,    icon: '🎁', color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Utilisateurs',    value: stats.users,        icon: '👥', color: '#7C3AED', bg: '#F5F3FF' },
    { label: 'Associations',    value: stats.associations, icon: '🤝', color: '#059669', bg: '#ECFDF5' },
    { label: 'Catégories',      value: stats.categories,   icon: '🏷️', color: '#EA580C', bg: '#FFF7ED' },
    { label: 'Assos vérifiées', value: stats.verified,     icon: '✅', color: '#22C55E', bg: '#F0FDF4' },
    { label: 'Assos en attente',value: stats.pending,      icon: '⏳', color: '#F59E0B', bg: '#FFFBEB' },
    { label: 'Régions actives', value: byRegion.length,    icon: '📍', color: '#0891B2', bg: '#ECFEFF' },
    { label: 'Assos ce mois',   value: recentAssoc.filter(a => {
        if (!a.created_at) return false;
        const d = new Date(a.created_at), now = new Date();
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length, icon: '📈', color: '#D97706', bg: '#FFFBEB' },
  ];

  return (
    <div>
      <h1 style={{ color: TEXT, fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Dashboard</h1>
      <p style={{ color: MUTED, fontSize: 14, marginBottom: 28 }}>Vue d'ensemble de la plateforme Taawoun</p>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {statCards.map((s, i) => (
          <div key={i} style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', transition: 'box-shadow 0.2s, transform 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(15,23,42,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(15,23,42,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div>
              <p style={{ color: MUTED, fontSize: 13, margin: 0, marginBottom: 8 }}>{s.label}</p>
              <p style={{ color: TEXT, fontSize: 28, fontWeight: 700, margin: 0 }}>{s.value}</p>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        <div style={card}>
          <h3 style={{ color: TEXT, fontSize: 15, fontWeight: 600, marginBottom: 20, marginTop: 0 }}>🎁 Donations par région</h3>
          {byRegion.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byRegion}>
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} />
                <XAxis dataKey="name" tick={{ fill: MUTED, fontSize: 11 }} />
                <YAxis tick={{ fill: MUTED, fontSize: 11 }} />
                <Tooltip {...tooltip} />
                <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ color: MUTED, textAlign: 'center', padding: '60px 0', fontSize: 13 }}>Aucune donnée</div>}
        </div>
        <div style={card}>
          <h3 style={{ color: TEXT, fontSize: 15, fontWeight: 600, marginBottom: 20, marginTop: 0 }}>🏷️ Donations par catégorie</h3>
          {byCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={byCategory} cx="50%" cy="50%" outerRadius={70} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                  {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...tooltip} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ color: MUTED, textAlign: 'center', padding: '60px 0', fontSize: 13 }}>Aucune donnée</div>}
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        <div style={card}>
          <h3 style={{ color: TEXT, fontSize: 15, fontWeight: 600, marginBottom: 20, marginTop: 0 }}>🤝 Statut des associations</h3>
          {stats.associations > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={[{ name: 'Vérifiées', value: stats.verified }, { name: 'En attente', value: stats.pending }]}
                  cx="50%" cy="50%" outerRadius={70} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={12}>
                  <Cell fill="#22C55E" /><Cell fill="#F59E0B" />
                </Pie>
                <Tooltip {...tooltip} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div style={{ color: MUTED, textAlign: 'center', padding: '60px 0', fontSize: 13 }}>Aucune association</div>}
        </div>
        <div style={card}>
          <h3 style={{ color: TEXT, fontSize: 15, fontWeight: 600, marginBottom: 20, marginTop: 0 }}>📊 Associations par catégorie</h3>
          {byAssocCat.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byAssocCat} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={BORDER} horizontal={false} />
                <XAxis type="number" tick={{ fill: MUTED, fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: MUTED, fontSize: 11 }} width={90} />
                <Tooltip {...tooltip} />
                <Bar dataKey="value" fill="#059669" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div style={{ color: MUTED, textAlign: 'center', padding: '60px 0', fontSize: 13 }}>Aucune donnée</div>}
        </div>
      </div>

      {/* Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        <div style={card}>
          <h3 style={{ color: TEXT, fontSize: 15, fontWeight: 600, marginBottom: 16, marginTop: 0 }}>🎁 Dons récents</h3>
          {recent.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Titre', 'Catégorie', 'Région'].map(h => (
                    <th key={h} style={{ color: MUTED, fontSize: 11, fontWeight: 600, textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${BORDER}`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((d, i) => (
                  <tr key={i} onMouseEnter={e => e.currentTarget.style.background = '#EEF4FF'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ transition: 'background 0.15s' }}>
                    <td style={{ color: TEXT, fontSize: 13, padding: '10px', borderBottom: `1px solid ${SURFACE}`, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</td>
                    <td style={{ padding: '10px', borderBottom: `1px solid ${SURFACE}` }}>
                      <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{d.category_name}</span>
                    </td>
                    <td style={{ color: MUTED, fontSize: 12, padding: '10px', borderBottom: `1px solid ${SURFACE}` }}>{d.region}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div style={{ color: MUTED, textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Aucun don</div>}
        </div>
        <div style={card}>
          <h3 style={{ color: TEXT, fontSize: 15, fontWeight: 600, marginBottom: 16, marginTop: 0 }}>🤝 Associations récentes</h3>
          {recentAssoc.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Nom', 'Catégorie', 'Statut'].map(h => (
                    <th key={h} style={{ color: MUTED, fontSize: 11, fontWeight: 600, textAlign: 'left', padding: '8px 10px', borderBottom: `1px solid ${BORDER}`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentAssoc.map((a, i) => (
                  <tr key={i} onMouseEnter={e => e.currentTarget.style.background = '#EEF4FF'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} style={{ transition: 'background 0.15s' }}>
                    <td style={{ padding: '10px', borderBottom: `1px solid ${SURFACE}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {a.logo_url
                          ? <img src={a.logo_url} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', border: `1px solid ${BORDER}` }} />
                          : <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#2563EB', flexShrink: 0 }}>{(a.name || '?')[0]}</div>}
                        <span style={{ color: TEXT, fontSize: 13 }}>{a.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px', borderBottom: `1px solid ${SURFACE}` }}>
                      {a.category
                        ? <span style={{ background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{a.category}</span>
                        : <span style={{ color: MUTED, fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: '10px', borderBottom: `1px solid ${SURFACE}` }}>
                      {a.is_verified
                        ? <span style={{ background: '#ECFDF5', color: '#059669', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>● Vérifié</span>
                        : <span style={{ background: '#FFFBEB', color: '#F59E0B', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>● En attente</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div style={{ color: MUTED, textAlign: 'center', padding: '40px 0', fontSize: 13 }}>Aucune association</div>}
        </div>
      </div>
    </div>
  );
}