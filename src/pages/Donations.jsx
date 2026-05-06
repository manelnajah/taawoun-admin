import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcXNuYmhhYXJ6ZGxrZGpyenJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDUyNzQsImV4cCI6MjA4ODMyMTI3NH0._85S9Vpnwwiz2xH-lP1Ffc90Y2J1orYi6zXDKaIJjMY";

// Thème clair
const BG = '#FFFFFF', SURFACE = '#F8FAFC', BORDER = '#E4E9F0', TEXT = '#1A202C', MUTED = '#64748B';

const inputStyle = {
  padding: '10px 14px', borderRadius: 8, border: `1.5px solid ${BORDER}`,
  background: BG, color: TEXT, fontSize: 14, outline: 'none',
};

const statusMap = {
  pending:  { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A', label: '⏳ En attente' },
  approved: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0', label: '✅ Approuvé'   },
  rejected: { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: '❌ Rejeté'     },
};

function StatusBadge({ status }) {
  const s = statusMap[status] || statusMap.pending;
  return <span style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}`, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{s.label}</span>;
}

export default function Donations() {
  const [donations, setDonations]   = useState([]);
  const [filtered, setFiltered]     = useState([]);
  const [search, setSearch]         = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason]       = useState('');
  const [donationToReject, setDonationToReject] = useState(null);
  const [loadingId, setLoadingId]   = useState(null);

  useEffect(() => { fetchDonations(); }, []);

  useEffect(() => {
    let d = donations;
    if (search)       d = d.filter(x => x.title?.toLowerCase().includes(search.toLowerCase()));
    if (regionFilter) d = d.filter(x => x.region === regionFilter);
    if (statusFilter) d = d.filter(x => x.status === statusFilter);
    setFiltered(d);
  }, [search, regionFilter, statusFilter, donations]);

  const fetchDonations = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('donations').select('*').order('id', { ascending: false });
    if (!error) setDonations(data || []);
    setLoading(false);
  };

  const approveDonation = async (donation) => {
    if (loadingId) return;
    setLoadingId(`approve-${donation.id}`);
    try {
      const { error } = await supabase.from('donations').update({ status: 'approved', approved_at: new Date().toISOString(), rejected_reason: null, rejected_at: null }).eq('id', donation.id);
      if (error) throw error;
      setDonations(prev => prev.map(d => d.id === donation.id ? { ...d, status: 'approved', approved_at: new Date().toISOString(), rejected_reason: null, rejected_at: null } : d));
      setSelected(null);
      await sendNotification(donation, 'approved', null);
    } catch (e) { alert('Erreur: ' + e.message); }
    setLoadingId(null);
  };

  const openRejectModal = (donation) => { setDonationToReject(donation); setRejectReason(''); setShowRejectModal(true); setSelected(null); };

  const confirmReject = async () => {
    if (!rejectReason.trim()) { alert('Veuillez entrer une raison de rejet'); return; }
    if (loadingId) return;
    setLoadingId(`reject-${donationToReject.id}`);
    try {
      const now = new Date().toISOString(); const reason = rejectReason.trim();
      const { error } = await supabase.from('donations').update({ status: 'rejected', rejected_reason: reason, rejected_at: now }).eq('id', donationToReject.id);
      if (error) throw error;
      setDonations(prev => prev.map(d => d.id === donationToReject.id ? { ...d, status: 'rejected', rejected_reason: reason, rejected_at: now } : d));
      setShowRejectModal(false); setDonationToReject(null); setRejectReason('');
      await sendNotification(donationToReject, 'rejected', reason);
    } catch (e) { alert('Erreur: ' + e.message); }
    setLoadingId(null);
  };

  const sendNotification = async (donation, status, reason) => {
    const isApproved = status === 'approved';
    try {
      await fetch("https://ppqsnbhaarzdlkdjrzrl.supabase.co/functions/v1/send-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json", "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}` },
        body: JSON.stringify({ user_id: donation.user_id, title: isApproved ? "✅ Don approuvé !" : "❌ Don rejeté", body: isApproved ? `Votre don "${donation.title}" a été approuvé` : `Rejeté: ${reason}`, donation_id: donation.id }),
      });
    } catch (e) { console.error("Notification error:", e); }
  };

  const deleteDonation = async (id) => {
    if (!window.confirm('Supprimer cette donation ?')) return;
    setLoadingId(`delete-${id}`);
    await supabase.from('donations').delete().eq('id', id);
    setSelected(null); setLoadingId(null); await fetchDonations();
  };

  const regions = [...new Set(donations.map(d => d.region).filter(Boolean))];
  const pendingCount = donations.filter(d => d.status === 'pending').length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: TEXT, fontSize: 24, fontWeight: 700, margin: 0 }}>Donations</h1>
          <p style={{ color: MUTED, fontSize: 14, marginTop: 4 }}>{donations.length} donations au total</p>
        </div>
        {pendingCount > 0 && (
          <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: '8px 16px', color: '#D97706', fontSize: 13, fontWeight: 600 }}>
            ⏳ {pendingCount} en attente de validation
          </div>
        )}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <input placeholder="🔍 Rechercher..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={inputStyle}>
          <option value="">Tous les statuts</option>
          <option value="pending">⏳ En attente</option>
          <option value="approved">✅ Approuvés</option>
          <option value="rejected">❌ Rejetés</option>
        </select>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} style={inputStyle}>
          <option value="">Toutes les régions</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ color: MUTED, textAlign: 'center', padding: 40 }}>Chargement...</div>
      ) : (
        <div style={{ background: BG, borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden', boxShadow: '0 1px 4px rgba(15,23,42,0.07)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: SURFACE }}>
                {['Image', 'Titre', 'Catégorie', 'Région', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ color: MUTED, fontSize: 12, fontWeight: 600, textAlign: 'left', padding: '12px 16px', borderBottom: `1px solid ${BORDER}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => {
                const isApprovingThis = loadingId === `approve-${d.id}`;
                const isRejectingThis = loadingId === `reject-${d.id}`;
                return (
                  <tr key={d.id} style={{ borderTop: `1px solid ${BORDER}`, background: i % 2 === 0 ? BG : SURFACE, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#EEF4FF'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? BG : SURFACE}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      {d.image
                        ? <img src={d.image} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: `1px solid ${BORDER}` }} />
                        : <div style={{ width: 44, height: 44, borderRadius: 8, background: SURFACE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🎁</div>}
                    </td>
                    <td style={{ color: TEXT, fontSize: 13, padding: '12px 16px', maxWidth: 180 }}>
                      <div style={{ fontWeight: 600 }}>{d.title}</div>
                      <div style={{ color: MUTED, fontSize: 11, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.description}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ background: '#EFF6FF', color: '#2563EB', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{d.category_name || '—'}</span>
                    </td>
                    <td style={{ color: MUTED, fontSize: 13, padding: '12px 16px' }}>{d.region || '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={d.status} />
                      {d.status === 'rejected' && d.rejected_reason && (
                        <div style={{ color: '#DC2626', fontSize: 10, marginTop: 4, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>💬 {d.rejected_reason}</div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setSelected(d)} style={{ background: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', padding: '5px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Voir</button>
                        {d.status !== 'approved' && (
                          <button onClick={() => approveDonation(d)} disabled={!!loadingId} style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '5px 10px', borderRadius: 6, cursor: loadingId ? 'not-allowed' : 'pointer', fontSize: 12, opacity: isApprovingThis ? 0.6 : 1 }}>
                            {isApprovingThis ? '...' : '✅'}
                          </button>
                        )}
                        {d.status !== 'rejected' && (
                          <button onClick={() => openRejectModal(d)} disabled={!!loadingId} style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', padding: '5px 10px', borderRadius: 6, cursor: loadingId ? 'not-allowed' : 'pointer', fontSize: 12, opacity: isRejectingThis ? 0.6 : 1 }}>
                            {isRejectingThis ? '...' : '❌'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{ color: MUTED, textAlign: 'center', padding: 40 }}>Aucune donation trouvée</div>}
        </div>
      )}

      {/* Modal détail */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelected(null)}>
          <div style={{ background: BG, borderRadius: 16, padding: 28, width: 480, border: `1px solid ${BORDER}`, maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 48px rgba(15,23,42,0.14)' }} onClick={e => e.stopPropagation()}>
            {selected.image && <img src={selected.image} alt="" style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 10, marginBottom: 16, border: `1px solid ${BORDER}` }} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h2 style={{ color: TEXT, margin: 0 }}>{selected.title}</h2>
              <StatusBadge status={selected.status} />
            </div>
            <p style={{ color: MUTED, fontSize: 14, margin: '0 0 16px', lineHeight: 1.6 }}>{selected.description}</p>
            {selected.status === 'rejected' && selected.rejected_reason && (
              <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
                <div style={{ color: '#DC2626', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>❌ Raison du rejet</div>
                <div style={{ color: '#B91C1C', fontSize: 13 }}>{selected.rejected_reason}</div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[{ label: 'Catégorie', value: selected.category_name }, { label: 'Région', value: selected.region }, { label: 'Téléphone', value: selected.phone }, { label: 'Localisation', value: selected.location }]
                .map(item => item.value && (
                  <div key={item.label} style={{ background: SURFACE, borderRadius: 8, padding: '10px 14px', border: `1px solid ${BORDER}` }}>
                    <div style={{ color: MUTED, fontSize: 11 }}>{item.label}</div>
                    <div style={{ color: TEXT, fontSize: 13, fontWeight: 600, marginTop: 2 }}>{item.value}</div>
                  </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              {selected.status !== 'approved' && (
                <button onClick={() => approveDonation(selected)} disabled={!!loadingId} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #A7F3D0', background: '#ECFDF5', color: '#059669', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                  {loadingId === `approve-${selected.id}` ? '...' : '✅ Valider'}
                </button>
              )}
              {selected.status !== 'rejected' && (
                <button onClick={() => openRejectModal(selected)} disabled={!!loadingId} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>❌ Rejeter</button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setSelected(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: SURFACE, color: MUTED, cursor: 'pointer' }}>Fermer</button>
              <button onClick={() => deleteDonation(selected.id)} disabled={!!loadingId} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                {loadingId === `delete-${selected.id}` ? '...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal rejet */}
      {showRejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }} onClick={() => setShowRejectModal(false)}>
          <div style={{ background: BG, borderRadius: 16, padding: 28, width: 440, border: `1px solid ${BORDER}`, boxShadow: '0 20px 48px rgba(15,23,42,0.14)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ background: '#FEF2F2', borderRadius: 10, padding: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 20 }}>❌</span>
              </div>
              <div>
                <div style={{ color: TEXT, fontWeight: 700, fontSize: 16 }}>Rejeter ce don</div>
                <div style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>{donationToReject?.title}</div>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ color: MUTED, fontSize: 12, marginBottom: 8 }}>Raisons fréquentes :</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['Image non conforme', 'Description insuffisante', 'Catégorie incorrecte', 'Contenu inapproprié', 'Informations incomplètes'].map(reason => (
                  <button key={reason} onClick={() => setRejectReason(reason)} style={{
                    padding: '5px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                    border: `1px solid ${rejectReason === reason ? '#FECACA' : BORDER}`,
                    background: rejectReason === reason ? '#FEF2F2' : SURFACE,
                    color: rejectReason === reason ? '#DC2626' : MUTED,
                    transition: 'all 0.15s',
                  }}>{reason}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: MUTED, fontSize: 12, marginBottom: 8 }}>Ou écrivez une raison personnalisée :</div>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Expliquez pourquoi ce don est rejeté..." rows={3}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: `1px solid ${BORDER}`, background: SURFACE, color: TEXT, fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowRejectModal(false)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: `1px solid ${BORDER}`, background: SURFACE, color: MUTED, cursor: 'pointer', fontWeight: 600 }}>Annuler</button>
              <button onClick={confirmReject} disabled={!!loadingId || !rejectReason.trim()} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: rejectReason.trim() ? '#DC2626' : '#F1F5F9', color: rejectReason.trim() ? '#fff' : MUTED, cursor: rejectReason.trim() && !loadingId ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: 14 }}>
                {loadingId ? 'En cours...' : '❌ Confirmer le rejet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}