// src/pages/SupportPage.jsx
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export default function SupportPage() {
  const [tickets,       setTickets]       = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages,      setMessages]      = useState([]);
  const [newMsg,        setNewMsg]        = useState('');
  const [loading,       setLoading]       = useState(true);
  const [sending,       setSending]       = useState(false);
  const [filter,        setFilter]        = useState('all');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      subscribeToMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('support_tickets')
        .select(`
          *,
          profiles:user_id(username, email, avatar_url),
          association_profiles:association_id(name, logo_url)
        `)
        .order('updated_at', { ascending: false });

      setTickets(data || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (ticketId) => {
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    setMessages(data || []);
  };

  let realtimeChannel = null;
  const subscribeToMessages = (ticketId) => {
    if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    realtimeChannel = supabase
      .channel(`admin-ticket-${ticketId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'support_messages',
        filter: `ticket_id=eq.${ticketId}`,
      }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !selectedTicket) return;
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('support_messages').insert({
        ticket_id:   selectedTicket.id,
        sender_type: 'admin',
        sender_id:   user.id,
        message:     newMsg.trim(),
      });

      // Mettre à jour le statut en "in_progress" si était "open"
      if (selectedTicket.status === 'open') {
        await supabase
          .from('support_tickets')
          .update({ status: 'in_progress', updated_at: new Date().toISOString() })
          .eq('id', selectedTicket.id);
        setSelectedTicket(prev => ({ ...prev, status: 'in_progress' }));
      }

      // Notifier l'utilisateur
      if (selectedTicket.user_id) {
        await supabase.from('notifications').insert({
          user_id:  selectedTicket.user_id,
          title:    '💬 Réponse de l\'admin',
          body:     `L'admin a répondu à votre ticket : "${selectedTicket.subject}"`,
          read:     false,
        });
      }

      setNewMsg('');
      fetchTickets();
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (ticketId, status) => {
    await supabase
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', ticketId);

    setSelectedTicket(prev => prev ? { ...prev, status } : prev);
    fetchTickets();
  };

  const filtered = tickets.filter(t => {
    if (filter === 'open')        return t.status === 'open';
    if (filter === 'in_progress') return t.status === 'in_progress';
    if (filter === 'closed')      return t.status === 'closed';
    return true;
  });

  const statusInfo = {
    open:        { label: 'Ouvert',   color: '#2563EB', bg: '#EEF4FF' },
    in_progress: { label: 'En cours', color: '#D97706', bg: '#FEF9C3' },
    closed:      { label: 'Résolu',   color: '#16A34A', bg: '#DCFCE7' },
  };

  const priorityInfo = {
    low:    { label: 'Basse',   color: '#16A34A' },
    normal: { label: 'Normale', color: '#D97706' },
    high:   { label: 'Haute',   color: '#DC2626' },
  };

  const formatTime = (iso) => {
    if (!iso) return '';
    const dt   = new Date(iso);
    const diff = Date.now() - dt.getTime();
    const min  = Math.floor(diff / 60000);
    const h    = Math.floor(diff / 3600000);
    if (min < 1)  return "À l'instant";
    if (min < 60) return `Il y a ${min}min`;
    if (h < 24)   return `Il y a ${h}h`;
    return dt.toLocaleDateString('fr-FR');
  };

  const formatMsgTime = (iso) => {
    if (!iso) return '';
    const dt = new Date(iso);
    return `${String(dt.getHours()).padStart(2,'0')}:${String(dt.getMinutes()).padStart(2,'0')}`;
  };

  return (
    <div style={{ padding: '32px 40px' }}>
      {/* ── Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: '#1A202C' }}>
          🎧 Support & Messages
        </h1>
        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 14 }}>
          Gérez les tickets des utilisateurs et associations
        </p>
      </div>

      <div style={{ display: 'flex', gap: 20, height: 'calc(100vh - 200px)' }}>

        {/* ── Colonne gauche : Liste tickets */}
        <div style={{
          width: 360, flexShrink: 0,
          background: '#fff', borderRadius: 16,
          border: '1px solid #E4E9F0',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Filtres */}
          <div style={{
            padding: '14px 16px',
            borderBottom: '1px solid #F1F5F9',
          }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { key: 'all',        label: `Tous (${tickets.length})`                                },
                { key: 'open',       label: `Ouverts (${tickets.filter(t => t.status === 'open').length})`        },
                { key: 'in_progress',label: `En cours (${tickets.filter(t => t.status === 'in_progress').length})` },
                { key: 'closed',     label: 'Résolus'                                                },
              ].map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)} style={{
                  padding: '5px 10px', borderRadius: 6,
                  border: 'none', fontSize: 11,
                  fontWeight: 600, cursor: 'pointer',
                  background: filter === f.key ? '#2563EB' : '#F1F5F9',
                  color:      filter === f.key ? '#fff'     : '#64748B',
                }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Liste */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
                Chargement...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
                <div>Aucun ticket</div>
              </div>
            ) : filtered.map(ticket => {
              const si       = statusInfo[ticket.status] || statusInfo.open;
              const pi       = priorityInfo[ticket.priority] || priorityInfo.normal;
              const isActive = selectedTicket?.id === ticket.id;
              const sender   = ticket.profiles || ticket.association_profiles;
              const name     = ticket.profiles?.username
                || ticket.profiles?.email?.split('@')[0]
                || ticket.association_profiles?.name
                || 'Utilisateur';

              return (
                <div
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid #F8FAFC',
                    cursor: 'pointer',
                    background: isActive ? '#EEF4FF' : 'transparent',
                    borderLeft: isActive ? '3px solid #2563EB' : '3px solid transparent',
                    transition: 'all 0.1s',
                  }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'flex-start',
                    justifyContent: 'space-between', gap: 8,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 700,
                        color: '#1A202C', marginBottom: 3,
                        whiteSpace: 'nowrap', overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {ticket.subject}
                      </div>
                      <div style={{
                        fontSize: 11, color: '#64748B', marginBottom: 6,
                      }}>
                        👤 {name} · {formatTime(ticket.updated_at)}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 10,
                          background: si.bg, color: si.color,
                          fontSize: 10, fontWeight: 600,
                        }}>
                          {si.label}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 600,
                          color: pi.color,
                        }}>
                          ● {pi.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Colonne droite : Chat */}
        {selectedTicket ? (
          <div style={{
            flex: 1, background: '#fff',
            borderRadius: 16, border: '1px solid #E4E9F0',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Header chat */}
            <div style={{
              padding: '14px 20px',
              borderBottom: '1px solid #F1F5F9',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div>
                <div style={{
                  fontSize: 15, fontWeight: 700, color: '#1A202C',
                }}>
                  {selectedTicket.subject}
                </div>
                <div style={{ fontSize: 12, color: '#64748B' }}>
                  Ticket #{selectedTicket.id.slice(0, 8).toUpperCase()}
                  · {(statusInfo[selectedTicket.status] || statusInfo.open).label}
                </div>
              </div>

              {/* Actions statut */}
              <div style={{ display: 'flex', gap: 8 }}>
                {selectedTicket.status !== 'in_progress' && (
                  <button
                    onClick={() => updateStatus(selectedTicket.id, 'in_progress')}
                    style={{
                      padding: '6px 12px', borderRadius: 8,
                      border: '1px solid #FDE68A', background: '#FEF9C3',
                      color: '#D97706', fontSize: 12,
                      fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    🔄 En cours
                  </button>
                )}
                {selectedTicket.status !== 'closed' && (
                  <button
                    onClick={() => updateStatus(selectedTicket.id, 'closed')}
                    style={{
                      padding: '6px 12px', borderRadius: 8,
                      border: '1px solid #BBF7D0', background: '#DCFCE7',
                      color: '#16A34A', fontSize: 12,
                      fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    ✅ Résoudre
                  </button>
                )}
                {selectedTicket.status === 'closed' && (
                  <button
                    onClick={() => updateStatus(selectedTicket.id, 'open')}
                    style={{
                      padding: '6px 12px', borderRadius: 8,
                      border: '1px solid #BFDBFE', background: '#EEF4FF',
                      color: '#2563EB', fontSize: 12,
                      fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    🔁 Rouvrir
                  </button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1, overflowY: 'auto',
              padding: '20px', display: 'flex',
              flexDirection: 'column', gap: 12,
              background: '#F8FAFC',
            }}>
              {messages.map(msg => {
                const isAdmin = msg.sender_type === 'admin';
                return (
                  <div key={msg.id} style={{
                    display: 'flex',
                    justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-end', gap: 8,
                  }}>
                    {!isAdmin && (
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: '#EEF4FF', flexShrink: 0,
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14, color: '#2563EB', fontWeight: 700,
                      }}>
                        👤
                      </div>
                    )}
                    <div style={{ maxWidth: '70%' }}>
                      {!isAdmin && (
                        <div style={{
                          fontSize: 11, color: '#94A3B8',
                          marginBottom: 3, paddingLeft: 4,
                        }}>
                          Utilisateur
                        </div>
                      )}
                      <div style={{
                        padding: '10px 14px',
                        borderRadius: isAdmin
                          ? '16px 16px 4px 16px'
                          : '16px 16px 16px 4px',
                        background: isAdmin
                          ? 'linear-gradient(135deg, #2563EB, #7C3AED)'
                          : '#fff',
                        color:      isAdmin ? '#fff' : '#1A202C',
                        fontSize: 14, lineHeight: 1.5,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        border: isAdmin ? 'none' : '1px solid #E4E9F0',
                      }}>
                        {msg.message}
                      </div>
                      <div style={{
                        fontSize: 10, color: '#94A3B8', marginTop: 3,
                        textAlign: isAdmin ? 'right' : 'left',
                        paddingLeft: 4, paddingRight: 4,
                      }}>
                        {formatMsgTime(msg.created_at)}
                        {isAdmin && ' · Admin'}
                      </div>
                    </div>
                    {isAdmin && (
                      <div style={{
                        width: 30, height: 30, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                        flexShrink: 0,
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: 12,
                      }}>
                        A
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input admin */}
            {selectedTicket.status === 'closed' ? (
              <div style={{
                padding: '16px 20px', textAlign: 'center',
                background: '#F0FDF4',
                borderTop: '1px solid #BBF7D0',
                color: '#16A34A', fontSize: 13, fontWeight: 600,
              }}>
                ✅ Ce ticket est résolu
              </div>
            ) : (
              <div style={{
                padding: '14px 20px',
                borderTop: '1px solid #F1F5F9',
                display: 'flex', gap: 10,
              }}>
                <input
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Répondre au ticket..."
                  style={{
                    flex: 1, padding: '10px 16px',
                    borderRadius: 24,
                    border: '1.5px solid #E4E9F0',
                    fontSize: 14, outline: 'none',
                    background: '#F8FAFC',
                  }}
                />
                <button onClick={sendMessage} disabled={sending} style={{
                  width: 44, height: 44, borderRadius: '50%',
                  border: 'none', cursor: sending ? 'not-allowed' : 'pointer',
                  background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                  color: '#fff', fontSize: 18,
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                }}>
                  {sending ? '⏳' : '➤'}
                </button>
              </div>
            )}
          </div>
        ) : (
          // Placeholder si aucun ticket sélectionné
          <div style={{
            flex: 1, background: '#fff',
            borderRadius: 16, border: '1px solid #E4E9F0',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            color: '#94A3B8',
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>💬</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              Sélectionnez un ticket
            </div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              Choisissez un ticket dans la liste pour répondre
            </div>
          </div>
        )}
      </div>
    </div>
  );
}