import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcXNuYmhhYXJ6ZGxrZGpyenJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDUyNzQsImV4cCI6MjA4ODMyMTI3NH0._85S9Vpnwwiz2xH-lP1Ffc90Y2J1orYi6zXDKaIJjMY";

const BG = '#FFFFFF', SURFACE = '#F8FAFC', BORDER = '#E4E9F0', TEXT = '#1A202C', MUTED = '#64748B';

export default function Users() {
  const [users, setUsers]   = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const { data, error } = await supabase.from('profiles').select('*').not('email', 'ilike', '%@taawoun.tn');
    if (error) { alert(error.message); return; }
    setUsers(data || []);
    setLoading(false);
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    const res = await fetch("https://ppqsnbhaarzdlkdjrzrl.supabase.co/functions/v1/delete-user", {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}` },
      body: JSON.stringify({ user_id: id }),
    });
    const data = await res.json();
    if (data.error) alert(data.error);
    else fetchUsers();
  };

  const filtered = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: TEXT, fontSize: 24, fontWeight: 700, margin: 0 }}>Utilisateurs</h1>
        <p style={{ color: MUTED, fontSize: 14, marginTop: 4 }}>{users.length} utilisateurs inscrits</p>
      </div>

      <input
        placeholder="🔍 Rechercher par nom ou email..."
        value={search} onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%', padding: '10px 14px', borderRadius: 8,
          border: `1.5px solid ${BORDER}`, background: BG,
          color: TEXT, fontSize: 14, outline: 'none',
          marginBottom: 20, boxSizing: 'border-box',
          boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
        }}
        onFocus={e => e.target.style.borderColor = '#2563EB'}
        onBlur={e => e.target.style.borderColor = BORDER}
      />

      {loading ? (
        <div style={{ color: MUTED, textAlign: 'center', padding: 40 }}>Chargement...</div>
      ) : (
        <div style={{ background: BG, borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,0.07)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: SURFACE }}>
                {['Avatar', 'Utilisateur', 'Email', 'ID', 'Actions'].map(h => (
                  <th key={h} style={{ color: MUTED, fontSize: 12, fontWeight: 600, textAlign: 'left', padding: '12px 16px', borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ borderTop: `1px solid ${BORDER}`, background: i % 2 === 0 ? BG : SURFACE, transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#EEF4FF'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? BG : SURFACE}
                >
                  <td style={{ padding: '12px 16px' }}>
                    {u.avatar_url
                      ? <img src={u.avatar_url} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${BORDER}` }} />
                      : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #2563EB, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>
                          {(u.username || 'U')[0].toUpperCase()}
                        </div>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: TEXT, fontWeight: 600, fontSize: 14 }}>{u.username || 'Sans nom'}</div>
                  </td>
                  <td style={{ color: MUTED, fontSize: 13, padding: '12px 16px' }}>{u.email || '—'}</td>
                  <td style={{ color: '#94A3B8', fontSize: 11, padding: '12px 16px', fontFamily: 'monospace' }}>{u.id?.substring(0, 8)}...</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => deleteUser(u.id)} style={{
                      padding: '6px 14px', borderRadius: 6,
                      border: '1px solid #FECACA', background: '#FEF2F2',
                      color: '#DC2626', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                      onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
                    >🗑️ Suppr.</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{ color: MUTED, textAlign: 'center', padding: 40 }}>Aucun utilisateur trouvé</div>}
        </div>
      )}
    </div>
  );
}