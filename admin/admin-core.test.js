const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const htmlPath = path.join(__dirname, 'index.html');

describe('admin content helpers', () => {
  test('filters by search, publication status and category without accent sensitivity', () => {
    const { filterContent } = require('./admin-core');
    const rows = [
      { title: 'Énergie douce', artist: 'Mandala', published: true, category: 'Méditation' },
      { title: 'Sommeil profond', artist: 'Léa', published: false, category: 'Sommeil' },
    ];

    expect(filterContent(rows, { search: 'energie', status: 'published', category: 'Méditation' })).toEqual([rows[0]]);
    expect(filterContent(rows, { search: 'lea', status: 'draft', category: 'all' })).toEqual([rows[1]]);
  });

  test('validates music rights and requires real HTTPS evidence URLs before publication', () => {
    const { validateMusicMetadata } = require('./admin-core');
    const valid = {
      title: 'Respire', artist: 'Mandala', durationSeconds: 300,
      licenseName: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
      sourceUrl: 'https://example.org/source', rightsConfirmed: true,
    };

    expect(validateMusicMetadata(valid)).toEqual([]);
    expect(validateMusicMetadata({ ...valid, rightsConfirmed: false, licenseUrl: 'javascript:alert(1)' }))
      .toEqual(expect.arrayContaining([
        'La confirmation des droits commerciaux est obligatoire.',
        'Le lien de licence doit être une URL HTTPS valide.',
      ]));
  });

  test('builds only schema-safe editable workout metadata', () => {
    const { buildWorkoutPatch } = require('./admin-core');
    expect(buildWorkoutPatch({
      title: '  Matin tonique  ', subtitle: '  10 minutes ', description: ' Doux ',
      category: 'pilates', level: 'beginner', duration: '10', calories: '80',
      premium: true, published: false, ignored: '<script>alert(1)</script>',
    })).toEqual({
      title: 'Matin tonique', subtitle: '10 minutes', description: 'Doux', category_id: 'pilates',
      level: 'beginner', duration_min: 10, calories: 80, premium: true, published: false,
    });
    expect(() => buildWorkoutPatch({ title: '', duration: '0', calories: '-1' })).toThrow('Titre, durée et calories invalides.');
  });

  test('refuses publishing music when rights are missing', () => {
    const { buildMusicPatch } = require('./admin-core');
    expect(() => buildMusicPatch({
      title: 'Titre', artist: 'Artiste', durationSeconds: 60, category: 'Nature',
      licenseName: 'Licence', licenseUrl: 'https://example.org/licence', sourceUrl: 'https://example.org/source',
      rightsConfirmed: false, published: true,
    })).toThrow('La confirmation des droits commerciaux est obligatoire.');
  });

  test('builds a scannable row summary for both content types', () => {
    const { rowMeta } = require('./admin-core');
    expect(rowMeta('workouts', { duration_min: 10, level: 'beginner', category: 'Fitness', published: true }))
      .toBe('10 min · Débutant · Fitness');
    expect(rowMeta('music', { license_name: 'CC BY 4.0', attribution: 'Artiste', category: 'Sommeil' }))
      .toBe('CC BY 4.0 · Artiste · Sommeil');
  });

  test('flags music rows whose licence evidence is incomplete', () => {
    const { rowWarnings } = require('./admin-core');
    expect(rowWarnings('music', {})).toEqual([
      'Licence manquante',
      'Lien de licence manquant',
      'Preuve source manquante',
      'Droits non confirmés',
    ]);
    expect(rowWarnings('music', {
      license_name: 'CC BY 4.0',
      license_url: 'https://creativecommons.org/licenses/by/4.0/',
      source_url: 'https://example.org/source',
      rights_confirmed: true,
    })).toEqual([]);
    expect(rowWarnings('workouts', {})).toEqual([]);
  });
});

describe('admin page security and management UI', () => {
  const readHtml = () => fs.readFileSync(htmlPath, 'utf8').replace(/\r\n/g, '\n');

  test('offers responsive section navigation, search, filters and explicit empty states', () => {
    const html = readHtml();
    expect(html).toContain('id="adminNav"');
    expect(html).toContain('id="workoutSearch"');
    expect(html).toContain('id="workoutStatusFilter"');
    expect(html).toContain('id="musicSearch"');
    expect(html).toContain('id="musicStatusFilter"');
    expect(fs.readFileSync(path.join(__dirname, 'admin-manager.js'), 'utf8')).toContain('Aucun contenu ne correspond à ces filtres.');
    expect(fs.readFileSync(path.join(__dirname, 'admin-manager.js'), 'utf8')).toContain('Réinitialiser les filtres');
    expect(html).toContain('@media (max-width: 720px)');
  });

  test('supports metadata editing and draft/publication actions for both content types', () => {
    const manager = fs.readFileSync(path.join(__dirname, 'admin-manager.js'), 'utf8');
    expect(manager).toContain('editWorkout');
    expect(manager).toContain('toggleWorkoutPublication');
    expect(manager).toContain('editMusic');
    expect(manager).toContain('toggleMusicPublication');
    expect(manager).toContain("thumb.addEventListener('error'");
  });

  test('keeps DOM rendering XSS-safe and every inline script authorized by CSP hash', () => {
    const html = readHtml();
    expect(html).not.toMatch(/\.innerHTML\s*=/);
    const csp = html.match(/Content-Security-Policy" content="([^"]+)"/)[1];
    const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
      .filter((match) => match[1].trim());
    expect(scripts.length).toBeGreaterThan(0);
    for (const script of scripts) {
      const hash = crypto.createHash('sha256').update(script[1]).digest('base64');
      expect(csp).toContain(`'sha256-${hash}'`);
    }
  });
});
