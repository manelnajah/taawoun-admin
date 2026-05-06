import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function SettingsPage({ user }) {
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [message,  setMessage]  = useState(null);

  const showMsg = (text, isError = false) => {
    setMessage({ text, isError });
    setTimeout(() => setMessage(null), 3000);
  };

  const savePassword = async () => {
    if (!password) {
      showMsg('Entrez un nouveau mot de passe', true);
      return;
    }
    if (password !== confirm) {
      showMsg('Les mots de passe ne correspondent pas', true);
      return;
    }
    if (password.length < 6) {
      showMsg('Minimum 6 caractères requis', true);
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword('');
      setConfirm('');
      showMsg('Mot de passe mis à jour ✅');
    } catch (e) {
      showMsg(e.message, true);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Voulez-vous vraiment vous déconnecter ?')) {
      await supabase.auth.signOut();
    }
  };

  const inputStyle = {
    width: '100%', padding: '10px 14px',
    borderRadius: 8, border: '1.5px solid #E4E9F0',
    fontSize: 14, color: '#1A202C',
    background: '#F8FAFC', outline: 'none',
    boxSizing: 'border-box', transition: 'border 0.15s',
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 780 }}>

      {/* ── Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{
          margin: 0, fontSize: 26,
          fontWeight: 800, color: '#1A202C',
        }}>
          ⚙️ Paramètres
        </h1>
        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 14 }}>
          Gérez votre compte administrateur
        </p>
      </div>

      {/* ── Message feedback */}
      {message && (
        <div style={{
          padding: '12px 16px', borderRadius: 10, marginBottom: 20,
          background: message.isError ? '#FEF2F2' : '#F0FDF4',
          border: `1px solid ${message.isError ? '#FECACA' : '#BBF7D0'}`,
          color: message.isError ? '#DC2626' : '#16A34A',
          fontSize: 14, fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {message.isError ? '⚠️' : '✅'} {message.text}
        </div>
      )}

      {/* ── Profil */}
      <Section title="Informations du compte" icon="👤">
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: 16, background: '#F8FAFC',
          borderRadius: 12, border: '1px solid #E4E9F0',
          marginBottom: 16,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            color: '#fff', fontWeight: 800, fontSize: 22,
          }}>
            {(user?.email?.[0] || 'A').toUpperCase()}
          </div>
          <div>
            <div style={{
              fontSize: 15, fontWeight: 700, color: '#1A202C',
            }}>
              {user?.email?.split('@')[0] || 'Admin'}
            </div>
            <div style={{ fontSize: 13, color: '#94A3B8' }}>
              {user?.email}
            </div>
            <div style={{ marginTop: 4 }}>
              <span style={{
                padding: '3px 10px', borderRadius: 20,
                background: '#DCFCE7', color: '#16A34A',
                fontSize: 11, fontWeight: 600,
              }}>
                ✓ Administrateur vérifié
              </span>
            </div>
          </div>
        </div>

        {/* Email (non modifiable) */}
        <div>
          <label style={labelStyle}>Adresse email</label>
          <input
            style={{ ...inputStyle, background: '#F1F5F9', color: '#94A3B8' }}
            value={user?.email || ''}
            disabled
          />
          <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94A3B8' }}>
            L'email ne peut pas être modifié
          </p>
        </div>
      </Section>

      {/* ── Sécurité */}
      <Section title="Changer le mot de passe" icon="🔒">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 16,
        }}>
          <div>
            <label style={labelStyle}>Nouveau mot de passe</label>
            <input
              type="password"
              style={inputStyle}
              value={password}
              placeholder="••••••••"
              onChange={e => setPassword(e.target.value)}
              onFocus={e => e.target.style.borderColor = '#2563EB'}
              onBlur={e => e.target.style.borderColor = '#E4E9F0'}
            />
          </div>
          <div>
            <label style={labelStyle}>Confirmer le mot de passe</label>
            <input
              type="password"
              style={{
                ...inputStyle,
                borderColor: confirm && password !== confirm
                  ? '#EF4444' : '#E4E9F0',
              }}
              value={confirm}
              placeholder="••••••••"
              onChange={e => setConfirm(e.target.value)}
              onFocus={e => e.target.style.borderColor = '#2563EB'}
              onBlur={e => e.target.style.borderColor = '#E4E9F0'}
            />
          </div>
        </div>
        {confirm && password !== confirm && (
          <p style={{ color: '#EF4444', fontSize: 12, margin: '8px 0 0' }}>
            ⚠️ Les mots de passe ne correspondent pas
          </p>
        )}

        <button onClick={savePassword} disabled={saving} style={{
          marginTop: 16,
          padding: '10px 24px', borderRadius: 10,
          border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
          background: saving ? '#93C5FD' : '#2563EB',
          color: '#fff', fontSize: 14,
          fontWeight: 700, transition: 'background 0.15s',
        }}>
          {saving ? '⏳ Mise à jour...' : '🔒 Mettre à jour le mot de passe'}
        </button>
      </Section>

      {/* ── Application */}
      <Section title="Application" icon="ℹ️">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <InfoRow label="Nom"        value="Taawoun Admin"  />
          <InfoRow label="Version"    value="v1.0.0"         />
          <InfoRow label="Plateforme" value="React + Supabase" />
          <InfoRow
            label="Base de données"
            value="Supabase PostgreSQL"
          />
        </div>
      </Section>

      {/* ── Déconnexion */}
      <Section title="Danger Zone" icon="⚠️" danger>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px', background: '#FEF2F2',
          borderRadius: 10, border: '1px solid #FECACA',
        }}>
          <div>
            <div style={{
              fontSize: 14, fontWeight: 600, color: '#1A202C',
            }}>
              Déconnexion
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>
              Terminer votre session administrateur
            </div>
          </div>
          <button onClick={handleLogout} style={{
            padding: '9px 20px', borderRadius: 8,
            border: '1.5px solid #FECACA', background: '#FEF2F2',
            color: '#DC2626', fontSize: 13,
            fontWeight: 700, cursor: 'pointer',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
            onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
          >
            🚪 Se déconnecter
          </button>
        </div>
      </Section>
    </div>
  );
}

// ── Helpers
const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: '#64748B', marginBottom: 6,
  textTransform: 'uppercase', letterSpacing: '0.04em',
};

function Section({ title, icon, danger = false, children }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 16, marginBottom: 20,
      border: `1px solid ${danger ? '#FECACA' : '#E4E9F0'}`,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      overflow: 'hidden',
    }}>
      {/* Header section */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '16px 24px',
        borderBottom: `1px solid ${danger ? '#FECACA' : '#F1F5F9'}`,
        background: danger ? '#FEF2F2' : '#fff',
      }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <h2 style={{
          margin: 0, fontSize: 15,
          fontWeight: 700,
          color: danger ? '#DC2626' : '#1A202C',
        }}>
          {title}
        </h2>
      </div>
      <div style={{ padding: 24 }}>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px', background: '#F8FAFC',
      borderRadius: 8, border: '1px solid #E4E9F0',
    }}>
      <span style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>
        {label}
      </span>
      <span style={{ fontSize: 13, color: '#1A202C', fontWeight: 600 }}>
        {value}
      </span>
    </div>
  );
}