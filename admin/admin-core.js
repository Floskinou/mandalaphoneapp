(function attachMandalaAdmin(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.MandalaAdmin = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function createMandalaAdmin() {
  const clean = (value) => String(value == null ? '' : value).trim();
  const normalize = (value) => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  function isHttpsUrl(value) {
    try {
      const url = new URL(clean(value));
      return url.protocol === 'https:' && Boolean(url.hostname);
    } catch (_error) {
      return false;
    }
  }

  function filterContent(rows, filters) {
    const query = normalize(filters.search);
    return (rows || []).filter((row) => {
      const searchable = normalize([row.title, row.artist, row.subtitle, row.category, row.category_id].filter(Boolean).join(' '));
      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus = !filters.status || filters.status === 'all'
        || (filters.status === 'published' ? row.published : !row.published);
      const rowCategory = row.category || row.category_id;
      const matchesCategory = !filters.category || filters.category === 'all' || rowCategory === filters.category;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }

  function validateMusicMetadata(input) {
    const errors = [];
    const duration = Number(input.durationSeconds);
    if (!clean(input.title) || !clean(input.artist) || !Number.isFinite(duration) || duration < 1 || duration > 14400) {
      errors.push('Titre, artiste et durée (1 s à 4 h) sont obligatoires.');
    }
    if (!clean(input.licenseName)) errors.push('Le nom de la licence est obligatoire.');
    if (!isHttpsUrl(input.licenseUrl)) errors.push('Le lien de licence doit être une URL HTTPS valide.');
    if (!isHttpsUrl(input.sourceUrl)) errors.push('Le lien source doit être une URL HTTPS valide.');
    if (!input.rightsConfirmed) errors.push('La confirmation des droits commerciaux est obligatoire.');
    return errors;
  }

  function buildWorkoutPatch(input) {
    const duration = Number(input.duration);
    const calories = Number(input.calories);
    if (!clean(input.title) || !Number.isInteger(duration) || duration < 1 || duration > 180
      || !Number.isInteger(calories) || calories < 0) {
      throw new Error('Titre, durée et calories invalides.');
    }
    return {
      title: clean(input.title),
      subtitle: clean(input.subtitle),
      description: clean(input.description),
      category_id: clean(input.category),
      level: clean(input.level),
      duration_min: duration,
      calories,
      premium: Boolean(input.premium),
      published: Boolean(input.published),
    };
  }

  function buildMusicPatch(input) {
    const errors = validateMusicMetadata(input);
    if (errors.length) throw new Error(errors[0]);
    return {
      title: clean(input.title),
      artist: clean(input.artist),
      description: clean(input.description),
      category: clean(input.category),
      duration_seconds: Number(input.durationSeconds),
      premium: Boolean(input.premium),
      license_name: clean(input.licenseName),
      license_url: clean(input.licenseUrl),
      source_url: clean(input.sourceUrl),
      attribution: clean(input.attribution) || null,
      rights_confirmed: true,
      published: Boolean(input.published),
    };
  }

  const LEVEL_LABELS = { beginner: 'Débutant', intermediate: 'Intermédiaire', advanced: 'Avancé' };

  /** Ligne compacte affichée sous le titre d'un élément de la bibliothèque. */
  function rowMeta(kind, row) {
    const parts = kind === 'workouts'
      ? [
          Number.isFinite(Number(row.duration_min)) && Number(row.duration_min) > 0 ? `${Number(row.duration_min)} min` : '',
          LEVEL_LABELS[clean(row.level)] || clean(row.level),
          clean(row.category || row.category_id),
        ]
      : [clean(row.license_name), clean(row.attribution), clean(row.category)];
    return parts.filter(Boolean).join(' · ');
  }

  /** Preuves à compléter avant de publier une musique. */
  function rowWarnings(kind, row) {
    if (kind !== 'music') return [];
    const warnings = [];
    if (!clean(row.license_name)) warnings.push('Licence manquante');
    if (!isHttpsUrl(row.license_url)) warnings.push('Lien de licence manquant');
    if (!isHttpsUrl(row.source_url)) warnings.push('Preuve source manquante');
    if (!row.rights_confirmed) warnings.push('Droits non confirmés');
    return warnings;
  }

  return { filterContent, validateMusicMetadata, buildWorkoutPatch, buildMusicPatch, isHttpsUrl, rowMeta, rowWarnings };
}));
