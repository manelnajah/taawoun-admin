import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const BG = '#FFFFFF', SURFACE = '#F8FAFC', BORDER = '#E4E9F0', TEXT = '#1A202C', MUTED = '#64748B';
const catColors = ['#2563EB','#7C3AED','#059669','#EA580C','#0891B2','#D97706','#DC2626','#0284C7'];

// ✅ Mapping complet emoji par nom de catégorie (anglais ou français, lowercase)
const EMOJI_MAP = {
  // Vêtements
  'clothes': '👕', 'clothing': '👕', 'vêtements': '👕', 'vetements': '👕',
  'children clothes': '🧒', 'clothes children': '🧒', 'vêtements enfants': '🧒',
  'adult clothing': '👔', "men's clothing": '👔', "women's clothing": '👗',
  'shoes': '👟', 'chaussures': '👟',
  'accessories': '👜', 'accessoires': '👜',

  // Jouets
  'toys': '🧸', 'toy': '🧸', 'jouets': '🧸', 'jouet': '🧸',
  'games': '🎮', 'jeux': '🎮', 'board games': '♟️',

  // Électroménager
  'home appliances': '🏠','home appliance': '🏠',
  'household': '🏠','electroménager': '🏠',
  'electronics': '📱', 'électronique': '📱',
  'tv': '📺', 'television': '📺', 'refrigerator': '🧊',

  // Nourriture
  'food': '🍎', 'nourriture': '🍎', 'aliments': '🍎',
  'groceries': '🛒', 'épicerie': '🛒', 'epicerie': '🛒',

  // Éducation
  'education': '📚', 'éducation': '📚',
  'school supplies': '✏️', 'fournitures scolaires': '✏️',
  'books': '📖', 'livres': '📖', 'stationery': '🖊️',

  // Santé
  'health': '💊', 'santé': '💊', 'sante': '💊',
  'medicine': '💊', 'médicaments': '💊', 'medicaments': '💊',
  'medical': '🏥', 'hygiene': '🧴', 'hygiène': '🧴',

  // Mobilier
  'furniture': '🪑', 'mobilier': '🪑', 'meuble': '🪑', 'meubles': '🪑',
  'sofa': '🛋️', 'bed': '🛏️',

  // Aide humanitaire
  'humanitaire': '🤝', 'humanitarian': '🤝',
  'charity': '❤️', 'aide': '🤝', 'donations': '🎁',

  // Sport
  'sport': '⚽', 'sports': '⚽', 'fitness': '🏋️', 'outdoor': '🏕️',

  // Bébé
  'baby': '🍼', 'bébé': '🍼', 'bebe': '🍼', 'baby items': '🍼', 'infant': '🍼',

  // Animaux
  'animals': '🐾', 'pets': '🐾', 'animaux': '🐾',

  // Outils
  'tools': '🔧', 'outils': '🔧', 'diy': '🔨', 'construction': '🏗️',

  // Cuisine
  'kitchen': '🍳', 'cuisine': '🍳', 'cookware': '🍳',

  // Livres / Médias
  'books & media': '📖', 'media': '💿', 'music': '🎵', 'musique': '🎵',
  'art': '🎨', 'craft': '🎨',

  // Autre / Divers
  'other': '📦', 'autre': '📦', 'autres': '📦',
  'miscellaneous': '📦', 'divers': '📦',
  'general': '📦', 'général': '📦',
};

// Trouve l'emoji le plus proche pour un nom de catégorie
function getEmoji(nameEn, nameFr) {
  const keys = [nameEn, nameFr].filter(Boolean).map(s => s.toLowerCase().trim());
  for (const key of keys) {
    // Match exact
    if (EMOJI_MAP[key]) return EMOJI_MAP[key];
    // Match partiel
    for (const [mapKey, emoji] of Object.entries(EMOJI_MAP)) {
      if (key.includes(mapKey) || mapKey.includes(key)) return emoji;
    }
  }
  return '🏷️'; // fallback générique
}

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState({ name_en: '', name_fr: '', name_ar: '' });

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('categories').select('*').order('id');
    if (error) { alert(error.message); setLoading(false); return; }
    setCategories(data || []);
    setLoading(false);
  };

  const openAdd  = () => { setEditing(null); setForm({ name_en: '', name_fr: '', name_ar: '' }); setShowForm(true); };
  const openEdit = (cat) => {
    setEditing(cat);
    setForm({ name_en: cat.name_en || '', name_fr: cat.name_fr || '', name_ar: cat.name_ar || '' });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name_en.trim()) return alert('Le nom en anglais est requis');
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase.from('categories')
          .update({ name_en: form.name_en.trim(), name_fr: form.name_fr.trim() || null, name_ar: form.name_ar.trim() || null })
          .eq('id', editing.id);
        if (error) throw error;
      } else {
        const { data: existing } = await supabase.from('categories').select('id').eq('name_en', form.name_en.trim()).maybeSingle();
        if (existing) { alert('Une catégorie avec ce nom existe déjà'); setSaving(false); return; }
        const { error } = await supabase.from('categories')
          .insert({ name_en: form.name_en.trim(), name_fr: form.name_fr.trim() || null, name_ar: form.name_ar.trim() || null });
        if (error) throw error;
      }
      setShowForm(false);
      fetchCategories();
    } catch (e) {
      const msg = e.message || e.toString();
      if (msg.includes('409') || msg.includes('duplicate') || msg.includes('unique'))
        alert('Cette catégorie existe déjà');
      else alert('Erreur: ' + msg);
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { alert('Erreur: ' + error.message); return; }
    fetchCategories();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: TEXT, fontSize: 24, fontWeight: 700, margin: 0 }}>Catégories</h1>
          <p style={{ color: MUTED, fontSize: 14, marginTop: 4 }}>{categories.length} catégories</p>
        </div>
        <button onClick={openAdd} style={{
          padding: '10px 20px', borderRadius: 8, border: 'none',
          background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
          color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 14px rgba(37,99,235,0.28)', transition: 'transform 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >➕ Ajouter</button>
      </div>

      {/* Liste */}
      {loading ? (
        <div style={{ color: MUTED, textAlign: 'center', padding: 40 }}>Chargement...</div>
      ) : categories.length === 0 ? (
        <div style={{ color: MUTED, textAlign: 'center', padding: 60 }}>
          Aucune catégorie — cliquez sur "Ajouter" pour commencer
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {categories.map((cat, i) => {
            const color   = catColors[i % catColors.length];
            const emoji   = getEmoji(cat.name_en, cat.name_fr);
            const hasImg  = !!cat.image;

            return (
              <div key={cat.id} style={{
                background: BG, borderRadius: 12, padding: 20,
                border: `1px solid ${BORDER}`,
                boxShadow: '0 1px 4px rgba(15,23,42,0.07)',
                transition: 'box-shadow 0.2s, transform 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 20px rgba(15,23,42,0.10)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(15,23,42,0.07)'; e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {/* ✅ Icône : image Supabase si disponible, sinon emoji */}
                <div style={{
                  width: 50, height: 50, borderRadius: 14,
                  background: color + '18', border: `1.5px solid ${color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14, fontSize: 26,
                }}>
                  {hasImg ? (
                    <img
                      src={cat.image} alt=""
                      style={{ width: 30, height: 30, borderRadius: 6, objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'inline'; }}
                    />
                  ) : null}
                  <span style={{ display: hasImg ? 'none' : 'inline' }}>{emoji}</span>
                </div>

                {/* Noms */}
                <div style={{ color: TEXT, fontWeight: 700, fontSize: 15, marginBottom: 3 }}>{cat.name_en}</div>
                {cat.name_fr && <div style={{ color: MUTED, fontSize: 13, marginBottom: 2 }}>{cat.name_fr}</div>}
                {cat.name_ar && <div style={{ color: '#94A3B8', fontSize: 13, direction: 'rtl', marginBottom: 12 }}>{cat.name_ar}</div>}

                {/* Boutons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => openEdit(cat)} style={{
                    flex: 1, padding: '7px', borderRadius: 6, border: `1px solid ${BORDER}`,
                    background: SURFACE, color: '#2563EB', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                    onMouseLeave={e => e.currentTarget.style.background = SURFACE}
                  >✏️ Modifier</button>
                  <button onClick={() => deleteCategory(cat.id)} style={{
                    flex: 1, padding: '7px', borderRadius: 6,
                    border: '1px solid #FECACA', background: '#FEF2F2',
                    color: '#DC2626', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
                    onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
                  >🗑️ Suppr.</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.35)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowForm(false)}
        >
          <div
            style={{ background: BG, borderRadius: 16, padding: 28, width: 420, border: `1px solid ${BORDER}`, boxShadow: '0 20px 48px rgba(15,23,42,0.14)' }}
            onClick={e => e.stopPropagation()}
          >
            <h2 style={{ color: TEXT, margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>
              {editing ? '✏️ Modifier la catégorie' : '➕ Nouvelle catégorie'}
            </h2>

            {/* ✅ Prévisualisation emoji en temps réel */}
            {form.name_en && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: SURFACE, borderRadius: 10, padding: '10px 14px',
                border: `1px solid ${BORDER}`, marginBottom: 18,
              }}>
                <span style={{ fontSize: 30 }}>{getEmoji(form.name_en, form.name_fr)}</span>
                <div>
                  <div style={{ color: TEXT, fontWeight: 600, fontSize: 14 }}>{form.name_en}</div>
                  {form.name_fr && <div style={{ color: MUTED, fontSize: 12 }}>{form.name_fr}</div>}
                </div>
              </div>
            )}

            {[
              { label: 'Nom (Anglais) *', key: 'name_en', placeholder: 'Toys' },
              { label: 'Nom (Français)',  key: 'name_fr', placeholder: 'Jouets' },
              { label: 'Nom (Arabe)',     key: 'name_ar', placeholder: 'الألعاب' },
            ].map(field => (
              <div key={field.key} style={{ marginBottom: 14 }}>
                <label style={{ color: '#374151', fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  {field.label}
                </label>
                <input
                  value={form[field.key]}
                  onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                  placeholder={field.placeholder}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 8,
                    border: `1.5px solid ${BORDER}`, background: SURFACE,
                    color: TEXT, fontSize: 14, outline: 'none', boxSizing: 'border-box',
                    direction: field.key === 'name_ar' ? 'rtl' : 'ltr',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#2563EB'}
                  onBlur={e => e.target.style.borderColor = BORDER}
                  onKeyDown={e => e.key === 'Enter' && save()}
                />
              </div>
            ))}

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowForm(false)} style={{
                flex: 1, padding: '10px', borderRadius: 8,
                border: `1px solid ${BORDER}`, background: SURFACE,
                color: MUTED, cursor: 'pointer', fontWeight: 600,
              }}>Annuler</button>
              <button onClick={save} disabled={saving} style={{
                flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                background: saving ? '#94A3B8' : 'linear-gradient(135deg, #2563EB, #7C3AED)',
                color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                boxShadow: saving ? 'none' : '0 4px 14px rgba(37,99,235,0.28)',
              }}>
                {saving ? '⏳ Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}