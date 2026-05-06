import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError('Email ou mot de passe incorrect'); setLoading(false); }
    else onLogin(data.user);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #EFF6FF 0%, #F4F6F9 50%, #F0F4FF 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#FFFFFF', borderRadius: 16, padding: 40, width: 380,
        border: '1px solid #E4E9F0',
        boxShadow: '0 8px 32px rgba(15,23,42,0.10), 0 2px 8px rgba(15,23,42,0.06)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 24,
            boxShadow: '0 4px 14px rgba(37,99,235,0.30)',
          }}>🤝</div>
          <h1 style={{ color: '#1A202C', fontSize: 22, fontWeight: 700, margin: 0 }}>Taawoun Admin</h1>
          <p style={{ color: '#64748B', fontSize: 14, marginTop: 6 }}>Panneau d'administration</p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#374151', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="admin@taawoun.tn"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                border: '1.5px solid #E4E9F0', background: '#F8FAFC',
                color: '#1A202C', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#2563EB'}
              onBlur={e => e.target.style.borderColor = '#E4E9F0'}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ color: '#374151', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Mot de passe</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 8,
                border: '1.5px solid #E4E9F0', background: '#F8FAFC',
                color: '#1A202C', fontSize: 14, outline: 'none', boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#2563EB'}
              onBlur={e => e.target.style.borderColor = '#E4E9F0'}
            />
          </div>

          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
              <p style={{ color: '#DC2626', fontSize: 13, margin: 0 }}>⚠️ {error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '12px', borderRadius: 8, border: 'none',
            background: loading ? '#E2E8F0' : 'linear-gradient(135deg, #2563EB, #7C3AED)',
            color: loading ? '#94A3B8' : '#fff',
            fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 14px rgba(37,99,235,0.30)',
            transition: 'all 0.2s',
          }}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}