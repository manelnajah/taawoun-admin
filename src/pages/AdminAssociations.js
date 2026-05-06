import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

const ANON_KEY    = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwcXNuYmhhYXJ6ZGxrZGpyenJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDUyNzQsImV4cCI6MjA4ODMyMTI3NH0._85S9Vpnwwiz2xH-lP1Ffc90Y2J1orYi6zXDKaIJjMY";
const EDGE_URL    = "https://ppqsnbhaarzdlkdjrzrl.supabase.co/functions/v1/create-association";
const BUCKET_NAME = "logos";
const CATEGORIES  = ["Humanitaire","Éducation","Santé","Environnement","Culture","Sport","Autre"];
const edgeHeaders = { "Content-Type": "application/json", "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}` };

// ─── Thème clair ──────────────────────────────────────────────────────────────
const C = {
  bg:       '#F4F6F9',
  surface:  '#FFFFFF',
  surface2: '#F8FAFC',
  border:   '#E4E9F0',
  text:     '#1A202C',
  muted:    '#64748B',
  hint:     '#94A3B8',
  accent:   '#2563EB',
};

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  .aa-root{font-family:'Inter',sans-serif;background:${C.bg};min-height:100vh;color:${C.text};padding:32px;}
  .aa-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:36px;flex-wrap:wrap;gap:16px;}
  .aa-title{font-size:24px;font-weight:700;letter-spacing:-0.3px;display:flex;align-items:center;gap:12px;color:${C.text};}
  .aa-title-badge{background:#EFF6FF;border:1px solid #BFDBFE;color:#2563EB;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;font-family:monospace;}
  .aa-stats{display:flex;gap:12px;margin-bottom:28px;flex-wrap:wrap;}
  .aa-stat{background:${C.surface};border:1px solid ${C.border};border-radius:12px;padding:14px 20px;flex:1;min-width:120px;box-shadow:0 1px 4px rgba(15,23,42,0.07);}
  .aa-stat-val{font-size:26px;font-weight:700;font-family:monospace;line-height:1;margin-bottom:4px;}
  .aa-stat-lbl{font-size:12px;color:${C.muted};font-weight:500;}
  .aa-toolbar{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;align-items:center;}
  .aa-search-wrap{position:relative;flex:1;min-width:220px;}
  .aa-search{width:100%;background:${C.surface};border:1.5px solid ${C.border};border-radius:10px;padding:10px 16px 10px 40px;color:${C.text};font-family:'Inter',sans-serif;font-size:14px;outline:none;transition:border-color .2s;box-shadow:0 1px 3px rgba(15,23,42,0.06);}
  .aa-search:focus{border-color:#2563EB;}
  .aa-search::placeholder{color:${C.hint};}
  .aa-search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);color:${C.hint};pointer-events:none;}
  .aa-filter{background:${C.surface};border:1.5px solid ${C.border};border-radius:10px;padding:10px 14px;color:${C.text};font-family:'Inter',sans-serif;font-size:13px;outline:none;cursor:pointer;box-shadow:0 1px 3px rgba(15,23,42,0.06);}
  .btn{display:inline-flex;align-items:center;gap:7px;font-family:'Inter',sans-serif;font-weight:600;font-size:13px;border-radius:10px;border:none;cursor:pointer;transition:all .18s;padding:10px 18px;white-space:nowrap;}
  .btn-primary{background:linear-gradient(135deg,#2563EB,#7C3AED);color:#fff;box-shadow:0 4px 14px rgba(37,99,235,0.28);}
  .btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(37,99,235,0.32);}
  .btn-ghost{background:${C.surface2};border:1.5px solid ${C.border};color:${C.muted};}
  .btn-ghost:hover{border-color:#CBD5E1;color:${C.text};background:#F1F5F9;}
  .btn-danger{background:#FEF2F2;color:#DC2626;border:1.5px solid #FECACA;}
  .btn-danger:hover{background:#FEE2E2;}
  .btn-success{background:#ECFDF5;color:#059669;border:1.5px solid #A7F3D0;}
  .btn-success:hover{background:#D1FAE5;}
  .btn-icon{padding:7px;border-radius:8px;}
  .btn:disabled{opacity:.45;cursor:not-allowed;transform:none!important;}
  .aa-table-wrap{background:${C.surface};border:1px solid ${C.border};border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(15,23,42,0.07);}
  .aa-table{width:100%;border-collapse:collapse;}
  .aa-table th{background:${C.surface2};padding:12px 18px;text-align:left;font-size:11px;font-weight:700;color:${C.muted};letter-spacing:.7px;text-transform:uppercase;border-bottom:1px solid ${C.border};}
  .aa-table td{padding:14px 18px;font-size:13.5px;border-bottom:1px solid #F1F5F9;vertical-align:middle;color:${C.text};}
  .aa-table tr:last-child td{border-bottom:none;}
  .aa-table tr:hover td{background:#EEF4FF;}
  .aa-avatar{width:36px;height:36px;border-radius:10px;background:${C.surface2};border:1px solid ${C.border};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px;overflow:hidden;flex-shrink:0;}
  .aa-avatar img{width:100%;height:100%;object-fit:cover;}
  .aa-name-cell{display:flex;align-items:center;gap:10px;}
  .aa-name{font-weight:600;font-size:14px;color:${C.text};}
  .aa-email{font-size:12px;color:${C.muted};margin-top:1px;}
  .badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:20px;font-size:11px;font-weight:600;}
  .badge-green{background:#ECFDF5;color:#059669;border:1px solid #A7F3D0;}
  .badge-amber{background:#FFFBEB;color:#D97706;border:1px solid #FDE68A;}
  .badge-blue{background:#EFF6FF;color:#2563EB;border:1px solid #BFDBFE;}
  .aa-actions{display:flex;gap:6px;align-items:center;}
  .aa-empty{text-align:center;padding:60px 20px;color:${C.muted};}
  .aa-empty-icon{font-size:48px;margin-bottom:12px;opacity:.4;}
  .modal-overlay{position:fixed;inset:0;z-index:1000;background:rgba(15,23,42,0.35);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .15s ease;}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .modal{background:${C.surface};border:1px solid ${C.border};border-radius:18px;width:100%;max-width:560px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 48px rgba(15,23,42,0.14);animation:slideUp .2s ease;}
  @keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
  .modal-header{padding:24px 28px 0;display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;}
  .modal-title{font-size:18px;font-weight:700;color:${C.text};}
  .modal-body{padding:0 28px 28px;}
  .modal-footer{padding:20px 28px;border-top:1px solid ${C.border};display:flex;gap:10px;justify-content:flex-end;}
  .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;}
  .form-grid .span2{grid-column:1/-1;}
  .form-group{display:flex;flex-direction:column;gap:6px;}
  .form-label{font-size:11px;font-weight:700;color:${C.muted};letter-spacing:.6px;text-transform:uppercase;}
  .form-input{background:${C.surface2};border:1.5px solid ${C.border};border-radius:10px;padding:10px 14px;color:${C.text};font-family:'Inter',sans-serif;font-size:14px;outline:none;transition:border-color .2s;width:100%;}
  .form-input:focus{border-color:#2563EB;}
  .form-input::placeholder{color:${C.hint};}
  textarea.form-input{resize:vertical;min-height:80px;}
  select.form-input{cursor:pointer;}
  .email-chip{background:#EFF6FF;border:1.5px dashed #BFDBFE;border-radius:10px;padding:12px 14px;font-size:13px;color:${C.muted};line-height:1.5;grid-column:1/-1;}
  .email-chip strong{color:#2563EB;}
  .file-wrap{display:flex;align-items:center;gap:12px;}
  .file-wrap input[type="file"]{font-family:'Inter',sans-serif;font-size:13px;color:${C.muted};}
  .file-wrap input[type="file"]::file-selector-button{background:${C.surface2};border:1px solid ${C.border};border-radius:8px;color:${C.text};font-family:'Inter',sans-serif;font-size:12px;font-weight:600;padding:6px 14px;cursor:pointer;transition:border-color .2s;margin-right:10px;}
  .file-wrap input[type="file"]::file-selector-button:hover{border-color:#2563EB;}
  .file-preview{width:40px;height:40px;border-radius:8px;object-fit:cover;border:1px solid ${C.border};}
  .toast-wrap{position:fixed;bottom:28px;right:28px;z-index:2000;display:flex;flex-direction:column;gap:10px;}
  .toast{background:${C.surface};border:1.5px solid ${C.border};border-radius:12px;padding:12px 18px;font-size:13px;font-weight:500;display:flex;align-items:center;gap:10px;box-shadow:0 8px 24px rgba(15,23,42,0.12);animation:slideUp .2s ease;min-width:260px;max-width:380px;color:${C.text};}
  .toast-success{border-color:#A7F3D0;}
  .toast-error{border-color:#FECACA;}
  .spinner{width:18px;height:18px;border:2px solid ${C.border};border-top-color:#2563EB;border-radius:50%;animation:spin .7s linear infinite;display:inline-block;}
  @keyframes spin{to{transform:rotate(360deg)}}
  .confirm-modal{max-width:380px;}
  .confirm-icon{font-size:36px;text-align:center;margin-bottom:12px;}
  .confirm-text{text-align:center;color:${C.muted};font-size:14px;line-height:1.6;}
  @media(max-width:700px){.aa-root{padding:16px;}.form-grid{grid-template-columns:1fr;}.form-grid .span2{grid-column:1;}.aa-table-wrap{overflow-x:auto;}}
`;

const COLOR_MAP   = ["#2563EB","#059669","#D97706","#7C3AED","#DC2626","#0891B2","#EA580C"];
const avatarColor = (name) => COLOR_MAP[(name?.charCodeAt(0)||0) % COLOR_MAP.length];
const getInitials = (name) => (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

let toastId = 0;
function useToasts() {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, type="success") => {
    const id = ++toastId;
    setToasts(t => [...t, {id, msg, type}]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  }, []);
  return {toasts, add};
}

async function uploadLogo(file) {
  if (!file) return null;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${Date.now()}_${safeName}`;
  const {error} = await supabase.storage.from(BUCKET_NAME).upload(path, file, {upsert: false});
  if (error) throw new Error("Upload échoué: " + error.message);
  const {data} = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return data.publicUrl;
}

const EMPTY = {name:"",email:"",description:"",category:"",website_url:"",address:"",logo_url:"",file:null};

// ─── COMPOSANT DÉPLACÉ À L'EXTÉRIEUR ─────────────────────────────────────────
// Cela empêche React de recréer le composant à chaque frappe
const FormFields = ({ form, setForm, handleFileChange, filePreview, isEdit }) => (
  <div className="form-grid">
    <div className="form-group">
      <label className="form-label">Nom *</label>
      <input className="form-input" placeholder="Taawoun Tunis" value={form.name} onChange={e => setForm(f=>({...f, name:e.target.value}))} />
    </div>
    <div className="form-group">
      <label className="form-label">Email *</label>
      <input className="form-input" type="email" placeholder="contact@asso.tn" value={form.email} disabled={isEdit} style={isEdit ? {opacity:.5} : {}} onChange={e => setForm(f=>({...f, email:e.target.value}))} />
    </div>
    <div className="form-group">
      <label className="form-label">Catégorie</label>
      <select className="form-input" value={form.category} onChange={e => setForm(f=>({...f, category:e.target.value}))}>
        <option value="">Sélectionner…</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </div>
    <div className="form-group">
      <label className="form-label">Site web</label>
      <input className="form-input" placeholder="https://…" value={form.website_url} onChange={e => setForm(f=>({...f, website_url:e.target.value}))} />
    </div>
    <div className="form-group span2">
      <label className="form-label">Description</label>
      <textarea className="form-input" placeholder="Description…" value={form.description} onChange={e => setForm(f=>({...f, description:e.target.value}))} />
    </div>
    <div className="form-group span2">
      <label className="form-label">Adresse</label>
      <input className="form-input" placeholder="Rue, Ville" value={form.address} onChange={e => setForm(f=>({...f, address:e.target.value}))} />
    </div>
    <div className="form-group span2">
      <label className="form-label">Logo (max 5 Mo)</label>
      <div className="file-wrap">
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {(filePreview || (isEdit && form.logo_url)) && <img src={filePreview || form.logo_url} alt="Logo" className="file-preview" />}
      </div>
    </div>
    {!isEdit && form.email && (
      <div className="email-chip">📧 Un email avec le <strong>mot de passe généré automatiquement</strong> sera envoyé à <strong>{form.email}</strong></div>
    )}
  </div>
);
// ───────────────────────────────────────────────────────────────────────────────

export default function AdminAssociations() {
  const [associations, setAssociations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [showCreate, setShowCreate]     = useState(false);
  const [showEdit, setShowEdit]         = useState(false);
  const [showConfirm, setShowConfirm]   = useState(null);
  const [form, setForm]                 = useState(EMPTY);
  const [submitting, setSubmitting]     = useState(false);
  const [filePreview, setFilePreview]   = useState(null);
  const {toasts, add: toast}            = useToasts();

  const fetchAssociations = useCallback(async () => {
    setLoading(true);
    try {
      const {data, error} = await supabase.from("association_profiles").select("*").order("created_at", {ascending: false});
      if (error) throw error;
      setAssociations(data || []);
    } catch(e) { toast("Erreur: " + e.message, "error"); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchAssociations(); }, [fetchAssociations]);

  const filtered = associations.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !search || a.name?.toLowerCase().includes(q) || a.email?.toLowerCase().includes(q);
    const matchStatus = filterStatus === "all" ? true : filterStatus === "verified" ? a.is_verified : !a.is_verified;
    const matchCat = filterCategory === "all" || a.category === filterCategory;
    return matchSearch && matchStatus && matchCat;
  });

  const stats = { total: associations.length, verified: associations.filter(a => a.is_verified).length, pending: associations.filter(a => !a.is_verified).length };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5*1024*1024) { toast("Fichier trop volumineux (max 5 Mo)", "error"); return; }
    setForm(f => ({...f, file}));
    const reader = new FileReader();
    reader.onload = () => setFilePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const resetForm = () => { setForm(EMPTY); setFilePreview(null); };

  const handleCreate = async () => {
    if (!form.name || !form.email) return toast("Nom et email obligatoires", "error");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return toast("Format email invalide", "error");
    setSubmitting(true);
    try {
      let logo_url = null;
      if (form.file) logo_url = await uploadLogo(form.file);
      const res = await fetch(EDGE_URL, { method: "POST", headers: edgeHeaders, body: JSON.stringify({ name: form.name, email: form.email, description: form.description||null, category: form.category||null, website_url: form.website_url||null, address: form.address||null, logo_url }) });
      const text = await res.text();
      let data; try { data = JSON.parse(text); } catch { throw new Error("Réponse invalide: " + text.slice(0, 200)); }
      if (data.error) throw new Error(data.error);
      if (data.warning) toast("⚠️ Compte créé mais email non envoyé", "error");
      else toast("✅ Association créée & email envoyé !");
      setShowCreate(false); resetForm(); fetchAssociations();
    } catch(e) { toast(e.message, "error"); }
    finally { setSubmitting(false); }
  };

  const openEdit = (assoc) => {
    setForm({name:assoc.name||"", email:assoc.email||"", description:assoc.description||"", category:assoc.category||"", website_url:assoc.website_url||"", address:assoc.address||"", logo_url:assoc.logo_url||"", file:null, _id:assoc.id});
    setFilePreview(null); setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!form.name) return toast("Nom obligatoire", "error");
    setSubmitting(true);
    try {
      let logo_url = form.logo_url;
      if (form.file) logo_url = await uploadLogo(form.file);
      const {error} = await supabase.from("association_profiles").update({name:form.name, description:form.description, category:form.category, website_url:form.website_url, address:form.address, logo_url}).eq("id", form._id);
      if (error) throw error;
      toast("✅ Association mise à jour"); setShowEdit(false); resetForm(); fetchAssociations();
    } catch(e) { toast(e.message, "error"); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (assoc) => {
    setSubmitting(true);
    try {
      const {error} = await supabase.from("association_profiles").delete().eq("id", assoc.id);
      if (error) throw error;
      toast("🗑️ Association supprimée"); setShowConfirm(null); fetchAssociations();
    } catch(e) { toast(e.message, "error"); }
    finally { setSubmitting(false); }
  };

  const handleVerify = async (assoc) => {
    setSubmitting(true);
    try {
      const {error} = await supabase.from("association_profiles").update({is_verified: !assoc.is_verified}).eq("id", assoc.id);
      if (error) throw error;
      toast(assoc.is_verified ? "Vérification retirée" : "✅ Association vérifiée"); setShowConfirm(null); fetchAssociations();
    } catch(e) { toast(e.message, "error"); }
    finally { setSubmitting(false); }
  };

  const handleResend = async (assoc) => {
    setSubmitting(true);
    try {
      const res = await fetch(EDGE_URL, { method:"POST", headers:edgeHeaders, body: JSON.stringify({resend_only:true, email:assoc.email}) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast("📧 Email renvoyé à " + assoc.email); setShowConfirm(null);
    } catch(e) { toast(e.message, "error"); }
    finally { setSubmitting(false); }
  };

  const handleConfirm = () => {
    if (!showConfirm) return;
    ({delete: handleDelete, verify: handleVerify, resend: handleResend})[showConfirm.type]?.(showConfirm.assoc);
  };

  const confirmMeta = {
    delete: {icon:"🗑️", title:"Supprimer l'association", btnClass:"btn-danger",  btnLabel:"Supprimer"},
    verify: {icon:"✅", title:"Modifier le statut",       btnClass:"btn-success", btnLabel: showConfirm?.assoc?.is_verified ? "Retirer" : "Vérifier"},
    resend: {icon:"📧", title:"Renvoyer l'email",         btnClass:"btn-primary", btnLabel:"Renvoyer"},
  };

  return (
    <>
      <style>{styles}</style>
      <div className="aa-root">
        <div className="aa-header">
          <div className="aa-title">🤝 Associations <span className="aa-title-badge">{stats.total} total</span></div>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreate(true); }}>＋ Nouvelle association</button>
        </div>

        <div className="aa-stats">
          <div className="aa-stat"><div className="aa-stat-val" style={{color:"#2563EB"}}>{stats.total}</div><div className="aa-stat-lbl">Total</div></div>
          <div className="aa-stat"><div className="aa-stat-val" style={{color:"#059669"}}>{stats.verified}</div><div className="aa-stat-lbl">Vérifiées</div></div>
          <div className="aa-stat"><div className="aa-stat-val" style={{color:"#D97706"}}>{stats.pending}</div><div className="aa-stat-lbl">En attente</div></div>
        </div>

        <div className="aa-toolbar">
          <div className="aa-search-wrap">
            <span className="aa-search-icon">🔍</span>
            <input className="aa-search" placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="aa-filter" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">Tous statuts</option>
            <option value="verified">Vérifiés</option>
            <option value="pending">En attente</option>
          </select>
          <select className="aa-filter" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="all">Toutes catégories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button className="btn btn-ghost" onClick={fetchAssociations} disabled={loading}>{loading ? <span className="spinner"/> : "↻"} Actualiser</button>
        </div>

        <div className="aa-table-wrap">
          {loading ? (
            <div className="aa-empty"><span className="spinner" style={{width:32,height:32}}/></div>
          ) : filtered.length === 0 ? (
            <div className="aa-empty"><div className="aa-empty-icon">🏢</div><div>Aucune association trouvée</div></div>
          ) : (
            <table className="aa-table">
              <thead>
                <tr><th>Association</th><th>Catégorie</th><th>Statut</th><th>Créée le</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div className="aa-name-cell">
                        <div className="aa-avatar" style={{background:avatarColor(a.name)+"18",color:avatarColor(a.name)}}>
                          {a.logo_url ? <img src={a.logo_url} alt={a.name} onError={e=>e.target.style.display="none"} /> : getInitials(a.name)}
                        </div>
                        <div><div className="aa-name">{a.name}</div><div className="aa-email">{a.email}</div></div>
                      </div>
                    </td>
                    <td>{a.category ? <span className="badge badge-blue">{a.category}</span> : <span style={{color:C.hint,fontSize:12}}>—</span>}</td>
                    <td>{a.is_verified ? <span className="badge badge-green">● Vérifié</span> : <span className="badge badge-amber">● En attente</span>}</td>
                    <td style={{color:C.muted,fontSize:12,fontFamily:"monospace"}}>{a.created_at ? new Date(a.created_at).toLocaleDateString("fr-FR") : "—"}</td>
                    <td>
                      <div className="aa-actions">
                        <button className="btn btn-ghost btn-icon" title="Modifier" onClick={() => openEdit(a)}>✏️</button>
                        <button className={`btn btn-icon ${a.is_verified ? "btn-ghost" : "btn-success"}`} title={a.is_verified ? "Retirer vérification" : "Vérifier"} onClick={() => setShowConfirm({type:"verify", assoc:a})}>{a.is_verified ? "✅" : "☑️"}</button>
                        <button className="btn btn-ghost btn-icon" title="Renvoyer email" onClick={() => setShowConfirm({type:"resend", assoc:a})}>📧</button>
                        <button className="btn btn-danger btn-icon" title="Supprimer" onClick={() => setShowConfirm({type:"delete", assoc:a})}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowCreate(false)}>
          <div className="modal">
            <div className="modal-header"><div className="modal-title">➕ Nouvelle association</div><button className="btn btn-ghost btn-icon" onClick={() => { setShowCreate(false); resetForm(); }}>✕</button></div>
            {/* On passe ici les props manquantes */}
            <div className="modal-body"><FormFields isEdit={false} form={form} setForm={setForm} handleFileChange={handleFileChange} filePreview={filePreview} /></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setShowCreate(false); resetForm(); }}>Annuler</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={submitting}>{submitting ? <span className="spinner"/> : "Créer & envoyer email"}</button>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowEdit(false)}>
          <div className="modal">
            <div className="modal-header"><div className="modal-title">✏️ Modifier l'association</div><button className="btn btn-ghost btn-icon" onClick={() => { setShowEdit(false); resetForm(); }}>✕</button></div>
            {/* On passe ici les props manquantes */}
            <div className="modal-body"><FormFields isEdit={true} form={form} setForm={setForm} handleFileChange={handleFileChange} filePreview={filePreview} /></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => { setShowEdit(false); resetForm(); }}>Annuler</button>
              <button className="btn btn-primary" onClick={handleEdit} disabled={submitting}>{submitting ? <span className="spinner"/> : "Enregistrer"}</button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (() => {
        const meta = confirmMeta[showConfirm.type];
        return (
          <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setShowConfirm(null)}>
            <div className="modal confirm-modal">
              <div className="modal-body" style={{paddingTop:32}}>
                <div className="confirm-icon">{meta.icon}</div>
                <div className="modal-title" style={{textAlign:"center",marginBottom:12}}>{meta.title}</div>
                <div className="confirm-text">
                  {showConfirm.type==="delete" && <>Supprimer <strong>{showConfirm.assoc.name}</strong> ? Irréversible.</>}
                  {showConfirm.type==="verify" && <>Modifier le statut de <strong>{showConfirm.assoc.name}</strong> ?</>}
                  {showConfirm.type==="resend" && <>Renvoyer un email à <strong>{showConfirm.assoc.email}</strong> ?</>}
                </div>
              </div>
              <div className="modal-footer" style={{justifyContent:"center"}}>
                <button className="btn btn-ghost" onClick={() => setShowConfirm(null)}>Annuler</button>
                <button className={`btn ${meta.btnClass}`} onClick={handleConfirm} disabled={submitting}>{submitting ? <span className="spinner"/> : meta.btnLabel}</button>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="toast-wrap">
        {toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}>{t.type==="success" ? "✅" : "❌"} {t.msg}</div>)}
      </div>
    </>
  );
}