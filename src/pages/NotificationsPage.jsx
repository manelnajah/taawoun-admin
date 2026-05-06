import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ADMIN_ID } from '../lib/constants';

export default function NotificationsPage({ onRead }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [replyTo, setReplyTo]   = useState(null); // notif sélectionnée
  const [replyText, setReplyText] = useState('');
  const [sending, setSending]   = useState(false);

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', ADMIN_ID)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setNotifications(data || []);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ── Envoyer réponse vers User OU Association
  const sendReply = async () => {
    if (!replyText.trim() || !replyTo) return;
    setSending(true);
    try {
      const isAssociation = replyTo.sender_type === 'association';

      await supabase.from('notifications').insert({
        user_id:        isAssociation ? null : replyTo.sender_id,
        association_id: isAssociation ? replyTo.sender_id : null,
        title:          '📬 Réponse de l\'administrateur',
        body:           replyText.trim(),
        read:           false,
        sender_id:      ADMIN_ID,
        sender_type:    'admin',
        donation_id:    null,
      });

      // Marquer l'original comme lu
      await markAsRead(replyTo.id);
      setReplyTo(null);
      setReplyText('');
    } catch(e) { console.error(e); }
    finally { setSending(false); }
  };

  const markAllAsRead = async () => {
    await supabase.from('notifications')
      .update({ read: true })
      .eq('user_id', ADMIN_ID)
      .eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    onRead?.();
  };

  const markAsRead = async (id) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    onRead?.();
  };

  const deleteNotif = async (id) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    onRead?.();
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read')   return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getStyle = (notif) => {
    const title = notif.title || '';
    if (notif.sender_type === 'association' || title.includes('🏢'))
      return { icon: '🏢', color: '#7C3AED', bg: '#F3E8FF', label: 'Association' };
    if (notif.sender_type === 'user' || title.includes('📩'))
      return { icon: '👤', color: '#2563EB', bg: '#EEF4FF', label: 'Utilisateur' };
    if (title.includes('✅')) return { icon: '✅', color: '#16A34A', bg: '#DCFCE7', label: '' };
    if (title.includes('❌')) return { icon: '❌', color: '#E11D48', bg: '#FFE4E6', label: '' };
    return { icon: '🔔', color: '#64748B', bg: '#F1F5F9', label: '' };
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const dt = new Date(iso), diff = Date.now() - dt.getTime();
    const min = Math.floor(diff/60000), h = Math.floor(diff/3600000), d = Math.floor(diff/86400000);
    if (min < 1)  return "À l'instant";
    if (min < 60) return `Il y a ${min} min`;
    if (h < 24)   return `Il y a ${h}h`;
    if (d === 1)  return 'Hier';
    return dt.toLocaleDateString('fr-FR');
  };

  // Peut-on répondre à cette notification ?
  const canReply = (n) => n.sender_id && 
    (n.sender_type === 'user' || n.sender_type === 'association');

  return (
    <div style={{ padding: '32px 40px', maxWidth: 900 }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 6 }}>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1A202C' }}>
            🔔 Notifications
          </h1>
          {unreadCount > 0 && (
            <span style={{ background: '#EF4444', color: '#fff',
              fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
              {unreadCount} non lues
            </span>
          )}
        </div>
       <p style={{ margin: 0, color: '#64748B', fontSize: 14 }}>
  Messages des utilisateurs et associations
</p>
      </div>

      {/* Légende */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <span style={{ background: '#EEF4FF', color: '#2563EB', border: '1px solid #BFDBFE',
          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
          👤 Utilisateurs
        </span>
        <span style={{ background: '#F3E8FF', color: '#7C3AED', border: '1px solid #DDD6FE',
          padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
          🏢 Associations
        </span>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { key: 'all',    label: `Toutes (${notifications.length})` },
            { key: 'unread', label: `Non lues (${unreadCount})` },
            { key: 'read',   label: 'Lues' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '7px 16px', borderRadius: 8, border: 'none',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: filter === f.key ? '#2563EB' : '#F1F5F9',
              color:      filter === f.key ? '#fff'    : '#475569',
            }}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} style={{
              padding: '7px 16px', borderRadius: 8,
              border: '1.5px solid #2563EB', background: '#EEF4FF',
              color: '#2563EB', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>
              ✓ Tout marquer lu
            </button>
          )}
          <button onClick={fetchNotifications} style={{
            padding: '7px 16px', borderRadius: 8,
            border: '1.5px solid #E4E9F0', background: '#fff',
            color: '#475569', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          }}>
            🔄 Actualiser
          </button>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94A3B8' }}>Chargement…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: '#fff',
          borderRadius: 16, border: '1px solid #E4E9F0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔔</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#475569' }}>
            Aucune notification
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(notif => {
            const s = getStyle(notif);
            return (
              <div key={notif.id} style={{
                background:   notif.read ? '#fff' : '#F8FBFF',
                border:      `1px solid ${notif.read ? '#E4E9F0' : '#BFDBFE'}`,
                borderRadius: 12, padding: '14px 16px',
                display: 'flex', alignItems: 'flex-start', gap: 14,
                position: 'relative',
              }}>
                {!notif.read && (
                  <div style={{ position: 'absolute', top: 16, right: 16,
                    width: 8, height: 8, borderRadius: '50%', background: '#2563EB' }} />
                )}

                {/* Icône + badge type */}
                <div style={{ flexShrink: 0 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12,
                    background: s.bg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 18, marginBottom: 4 }}>
                    {s.icon}
                  </div>
                  {s.label && (
                    <div style={{ fontSize: 9, fontWeight: 700, color: s.color,
                      textAlign: 'center', background: s.bg, borderRadius: 6, padding: '1px 4px' }}>
                      {s.label}
                    </div>
                  )}
                </div>

                {/* Contenu */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: notif.read ? 600 : 700,
                    color: '#1A202C', marginBottom: 3 }}>
                    {notif.title}
                  </div>
                  <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5, marginBottom: 6 }}>
                    {notif.body}
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>
                    {formatDate(notif.created_at)}
                  </div>
                </div>

                {/* Boutons */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, flexDirection: 'column' }}>
                  {/* Bouton Répondre — uniquement si user ou association */}
                  {canReply(notif) && (
                    <button onClick={() => { setReplyTo(notif); setReplyText(''); }} style={{
                      padding: '5px 10px', borderRadius: 6,
                      border: '1px solid #DDD6FE', background: '#F3E8FF',
                      color: '#7C3AED', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}>
                      ↩ Répondre
                    </button>
                  )}
                  {!notif.read && (
                    <button onClick={() => markAsRead(notif.id)} style={{
                      padding: '5px 10px', borderRadius: 6,
                      border: '1px solid #BFDBFE', background: '#EEF4FF',
                      color: '#2563EB', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                    }}>
                      ✓ Lu
                    </button>
                  )}
                  <button onClick={() => deleteNotif(notif.id)} style={{
                    padding: '5px 10px', borderRadius: 6,
                    border: '1px solid #FECACA', background: '#FEF2F2',
                    color: '#DC2626', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}>
                    🗑
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal Réponse ── */}
      {replyTo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28,
            width: '100%', maxWidth: 480,
            boxShadow: '0 20px 48px rgba(0,0,0,0.15)' }}>

            {/* Header modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1A202C', marginBottom: 4 }}>
                  ↩ Répondre
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  À : <strong>{replyTo.title}</strong>
                </div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                  {replyTo.sender_type === 'association' ? '🏢 Association' : '👤 Utilisateur'}
                </div>
              </div>
              <button onClick={() => setReplyTo(null)} style={{
                background: '#F1F5F9', border: 'none', borderRadius: 8,
                width: 32, height: 32, cursor: 'pointer', fontSize: 16,
              }}>✕</button>
            </div>

            {/* Message original */}
            <div style={{ background: '#F8FAFC', border: '1px solid #E4E9F0',
              borderRadius: 10, padding: 12, marginBottom: 16,
              fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8',
                marginBottom: 4, textTransform: 'uppercase', letterSpacing: '.5px' }}>
                Message reçu
              </div>
              {replyTo.body}
            </div>

            {/* Textarea réponse */}
            <textarea
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              placeholder="Écrivez votre réponse..."
              rows={4}
              style={{ width: '100%', padding: 12, borderRadius: 10,
                border: '1.5px solid #E4E9F0', fontSize: 13,
                fontFamily: 'inherit', resize: 'vertical',
                outline: 'none', boxSizing: 'border-box', color: '#1A202C' }}
              onFocus={e => e.target.style.borderColor = '#2563EB'}
              onBlur={e => e.target.style.borderColor = '#E4E9F0'}
            />

            {/* Boutons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => { setReplyTo(null); setReplyText(''); }} style={{
                padding: '9px 18px', borderRadius: 8,
                border: '1.5px solid #E4E9F0', background: '#fff',
                cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#475569',
              }}>
                Annuler
              </button>
              <button onClick={sendReply}
                disabled={sending || !replyText.trim()}
                style={{ padding: '9px 18px', borderRadius: 8,
                  background: sending || !replyText.trim() ? '#94A3B8' : '#2563EB',
                  color: '#fff', border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: 13,
                }}>
                {sending ? 'Envoi...' : '↩ Envoyer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}