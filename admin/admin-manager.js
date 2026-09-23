/* Admin-only UI. Authorization remains enforced by Supabase RLS. */
(() => {
  'use strict';
  const core = window.MandalaAdmin;
  const $ = (id) => document.getElementById(id);
  let section = 'workouts';
  let showForm = false;
  $('formCard').before($('listCard'));
  $('musicFormCard').before($('musicListCard'));
  const rows = { workouts: [], music: [] };
  const table = (kind) => kind === 'workouts' ? 'workouts' : 'relaxation_tracks';
  const prefix = (kind) => kind === 'workouts' ? 'workout' : 'music';
  const message = (_kind, ok, text) => show('managementMsg', ok, text);
  function navigate(next) {
    section = next;
    const connected = $('loginCard').classList.contains('hidden');
    $('adminNav').classList.toggle('hidden', !connected);
    ['formCard', 'listCard'].forEach(id => $(id).classList.toggle('hidden', !connected || section !== 'workouts'));
    ['musicFormCard', 'musicListCard'].forEach(id => $(id).classList.toggle('hidden', !connected || section !== 'music'));
    if (!showForm) { $('formCard').classList.add('hidden'); $('musicFormCard').classList.add('hidden'); }
    $('createContentBtn').setAttribute('aria-expanded', String(showForm));
    $('createContentBtn').textContent = showForm ? 'Fermer le formulaire' : 'Ajouter un contenu';
    document.querySelectorAll('[data-section]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.section === section)));
  }
  document.querySelectorAll('[data-section]').forEach(button => button.addEventListener('click', () => { showForm = false; navigate(button.dataset.section); }));
  $('createContentBtn').addEventListener('click', () => { showForm = !showForm; navigate(section); if (showForm) $(section === 'workouts' ? 'formCard' : 'musicFormCard').scrollIntoView({ behavior: 'smooth' }); });
  new MutationObserver(() => navigate(section)).observe($('loginCard'), { attributes: true, attributeFilter: ['class'] });
  $('logoutBtn').addEventListener('click', async () => {
    try {
      const { error } = await sb.auth.signOut();
      if (error) throw error;
      rows.workouts = []; rows.music = [];
      $('workoutList').replaceChildren(); $('musicList').replaceChildren();
      $('password').value = '';
      $('loginBtn').disabled = false;
      $('loginCard').classList.remove('hidden');
      navigate('workouts');
    } catch { message(section, false, 'Déconnexion impossible. Réessaie.'); }
  });

  async function load(kind) {
    const all = [];
    try {
      for (let start = 0; ; start += 500) {
        const { data, error } = await sb.from(table(kind)).select('*').order('sort_order', { ascending: false }).order('id').range(start, start + 499);
        if (error) throw error;
        all.push(...(data || []));
        if (!data || data.length < 500) break;
      }
      rows[kind] = all;
      render(kind);
      navigate(section);
    } catch (error) { message(kind, false, 'Lecture impossible : ' + error.message); }
  }
  // The original upload/login handlers call these same global functions.
  window.loadList = () => load('workouts');
  window.loadMusicList = () => load('music');
  function button(label, handler) {
    const el = document.createElement('button'); el.type = 'button'; el.className = 'manageButton'; el.textContent = label;
    el.addEventListener('click', async () => {
      el.disabled = true;
      try { await handler(); } catch (error) { message(section, false, error.message || 'Opération impossible.'); }
      finally { el.disabled = false; }
    });
    return el;
  }
  function render(kind) {
    const p = prefix(kind);
    const filtered = core.filterContent(rows[kind], { search: $(p + 'Search').value, status: $(p + 'StatusFilter').value });
    $(p + 'Summary').textContent = `${filtered.length} résultat(s) · ${rows[kind].filter(row => row.published).length} en ligne · ${rows[kind].length} au total`;
    const list = $(kind === 'workouts' ? 'workoutList' : 'musicList'); list.replaceChildren();
    if (!filtered.length) {
      const empty = document.createElement('p'); empty.className = 'empty'; empty.textContent = 'Aucun contenu ne correspond à ces filtres.';
      const reset = document.createElement('button');
      reset.type = 'button'; reset.className = 'manageButton'; reset.textContent = 'Réinitialiser les filtres';
      reset.addEventListener('click', () => { $(p + 'Search').value = ''; $(p + 'StatusFilter').value = 'all'; render(kind); });
      const wrap = document.createElement('div'); wrap.className = 'emptyState'; wrap.append(empty, reset);
      list.append(wrap);
    }
    filtered.forEach(row => {
      const item = document.createElement('div'); item.className = 'item';
      if (kind === 'workouts' && core.isHttpsUrl(row.thumbnail_url)) {
        const thumb = document.createElement('img');
        thumb.className = 'itemThumb'; thumb.src = row.thumbnail_url;
        thumb.alt = ''; thumb.loading = 'lazy';
        thumb.addEventListener('error', () => thumb.remove());
        item.append(thumb);
      }
      const copy = document.createElement('div'); copy.className = 'itemCopy';
      const title = document.createElement('strong'); title.textContent = row.title + (row.artist ? ' — ' + row.artist : '');
      copy.append(title);
      const meta = document.createElement('span'); meta.className = 'meta'; meta.textContent = core.rowMeta(kind, row);
      copy.append(meta);
      const warnings = core.rowWarnings(kind, row);
      if (warnings.length) {
        const warn = document.createElement('span'); warn.className = 'warn';
        warn.setAttribute('role', 'status');
        warn.textContent = `⚠ ${warnings.join(' · ')}`;
        copy.append(warn);
      }
      const actions = document.createElement('div'); actions.className = 'actions';
      const tag = document.createElement('span'); tag.className = 'tag ' + (row.published ? 'pub' : 'draft'); tag.textContent = `${row.published ? 'EN LIGNE' : 'BROUILLON'}${row.premium ? ' · PLUS' : ' · GRATUIT'}`;
      actions.append(tag, button('Modifier', () => kind === 'workouts' ? editWorkout(row) : editMusic(row)), button(row.published ? 'Mettre en brouillon' : 'Publier', () => kind === 'workouts' ? toggleWorkoutPublication(row) : toggleMusicPublication(row)), button('Aperçu', () => preview(kind, row)));
      item.append(copy, actions); list.append(item);
    });
  }
  ['workouts', 'music'].forEach(kind => {
    const p = prefix(kind);
    $(p + 'Search').addEventListener('input', () => render(kind));
    $(p + 'StatusFilter').addEventListener('change', () => render(kind));
  });
  async function save(kind, row, patch) {
    const { error } = await sb.from(table(kind)).update(patch).eq('id', row.id);
    if (error) throw error;
    const { data, error: readError } = await sb.from(table(kind)).select(Object.keys(patch).join(',')).eq('id', row.id).single();
    if (readError || !data || Object.keys(patch).some(key => JSON.stringify(data[key]) !== JSON.stringify(patch[key]))) throw new Error('Enregistrement non confirmé. Recharge la liste avant de réessayer.');
    await load(kind);
    message(kind, true, 'Modifications enregistrées et vérifiées.');
  }
  async function toggleWorkoutPublication(row) {
    if (!row.published && !core.isHttpsUrl(row.video_url)) throw new Error('Cette vidéo privée reste en brouillon : la lecture par URL signée doit être connectée dans l’application.');
    if (confirm(`${row.published ? 'Retirer de l’application' : 'Publier'} « ${row.title} » ?`)) await save('workouts', row, { published: !row.published });
  }
  async function toggleMusicPublication(row) {
    if (!row.published) {
      const errors = core.validateMusicMetadata({ title: row.title, artist: row.artist, durationSeconds: row.duration_seconds, licenseName: row.license_name, licenseUrl: row.license_url, sourceUrl: row.source_url, rightsConfirmed: row.rights_confirmed });
      if (errors.length) throw new Error(errors[0]);
      if (!core.isHttpsUrl(row.audio_url)) throw new Error('Le fichier audio est manquant.');
    }
    if (confirm(`${row.published ? 'Retirer de l’application' : 'Publier'} « ${row.title} » ?`)) await save('music', row, { published: !row.published });
  }
  function editWorkout(row) { edit('workouts', row); }
  function editMusic(row) { edit('music', row); }
  function edit(kind, row) {
    const dialog = document.createElement('dialog');
    const heading = document.createElement('h2'); heading.textContent = 'Modifier le contenu'; dialog.append(heading);
    dialog.setAttribute('aria-label', 'Modifier le contenu');
    const form = document.createElement('form'); const fields = {};
    const field = (key, label, value, type = 'text') => {
      const wrapper = document.createElement('label'); wrapper.textContent = label;
      const input = document.createElement(key === 'description' ? 'textarea' : 'input');
      input.name = key; if (input.tagName === 'INPUT') input.type = type;
      if (type === 'checkbox') { input.checked = Boolean(value); wrapper.className = 'checkline'; } else input.value = value == null ? '' : value;
      wrapper.append(input); form.append(wrapper); fields[key] = input;
    };
    field('title', 'Titre', row.title); field('description', 'Description', row.description);
    field('premium', 'Réservé à Mandala Plus', row.premium, 'checkbox');
    if (kind === 'workouts') {
      field('subtitle', 'Sous-titre', row.subtitle); field('duration', 'Durée en minutes', row.duration_min, 'number'); field('calories', 'Calories estimées', row.calories, 'number');
    } else {
      field('artist', 'Artiste', row.artist); field('durationSeconds', 'Durée en secondes', row.duration_seconds, 'number');
      field('licenseName', 'Licence', row.license_name); field('licenseUrl', 'Lien licence', row.license_url, 'url'); field('sourceUrl', 'Source / preuve', row.source_url, 'url'); field('attribution', 'Crédit', row.attribution); field('rightsConfirmed', 'Je confirme les droits commerciaux et de redistribution', row.rights_confirmed, 'checkbox');
    }
    const errorBox = document.createElement('p'); errorBox.setAttribute('role', 'alert'); form.append(errorBox);
    const submit = document.createElement('button'); submit.type = 'submit'; submit.className = 'primary'; submit.textContent = 'Enregistrer'; form.append(submit);
    form.append(button('Annuler', () => dialog.close())); dialog.append(form); document.body.append(dialog);
    dialog.addEventListener('close', () => dialog.remove());
    form.addEventListener('submit', async event => {
      event.preventDefault(); if (submit.disabled) return; submit.disabled = true;
      try {
        const input = { category: row.category || row.category_id, level: row.level, published: row.published };
        Object.entries(fields).forEach(([key, el]) => { input[key] = el.type === 'checkbox' ? el.checked : el.value; });
        const patch = kind === 'workouts' ? core.buildWorkoutPatch(input) : core.buildMusicPatch(input);
        await save(kind, row, patch); dialog.close();
      } catch (error) { errorBox.textContent = error.message; } finally { submit.disabled = false; }
    });
    dialog.showModal();
  }
  async function preview(kind, row) {
    let url = kind === 'workouts' ? row.video_url : row.audio_url;
    if (kind === 'workouts' && !url && row.video_object_path) {
      const { data, error } = await sb.storage.from(PRIVATE_VIDEO_BUCKET).createSignedUrl(row.video_object_path, 300);
      if (error) throw error; url = data.signedUrl;
    }
    if (!core.isHttpsUrl(url)) throw new Error('Aucun média disponible.');
    const dialog = document.createElement('dialog'); dialog.setAttribute('aria-label', 'Aperçu du média');
    const media = document.createElement(kind === 'workouts' ? 'video' : 'audio'); media.controls = true; media.style.width = '100%'; media.src = url;
    dialog.append(media, button('Fermer', () => dialog.close())); document.body.append(dialog);
    dialog.addEventListener('close', () => { media.pause(); media.removeAttribute('src'); media.load(); dialog.remove(); }); dialog.showModal();
  }
})();
