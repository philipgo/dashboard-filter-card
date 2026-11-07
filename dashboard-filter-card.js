/*!
 * Dashboard Filter Card
 * Builds a restricted copy of a Home Assistant dashboard (for kids, guests,
 * wall tablets, ...). For every entity you choose: hidden, read-only or full access.
 *
 * Copyright (C) 2026 philipgo - https://github.com/philipgo/dashboard-filter-card
 *
 * This program is free software: you can redistribute it and/or modify it under
 * the terms of the GNU General Public License as published by the Free Software
 * Foundation, either version 3 of the License, or (at your option) any later version.
 * This program is distributed WITHOUT ANY WARRANTY. See the LICENSE file for details.
 *
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

const VERSION = '1.0.3';
const CARD_TYPE = 'dashboard-filter-card';
const MARKER = 'dashboard_filter_card'; // key in the target dashboard config that holds the selection
// Home Assistant requires a hyphen in dashboard URL paths; we also require lowercase
const TARGET_RE = /^[a-z0-9_]+(-[a-z0-9_]+)+$/;

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------

const STRINGS = {
  en: {
    title: 'Dashboard filter',
    hide: 'Hidden',
    show: 'Read-only',
    control: 'Full access',
    shown: 'Shown',
    search: 'Search name or entity',
    filter_all: 'All',
    filter_new: 'New only',
    save: 'Save & build',
    reload: 'Reload',
    include: 'Include view',
    set_all: 'All visible:',
    new: 'new',
    uses: '{n} uses',
    not_lockable: '{k} of {n} uses cannot be read-only and are hidden in read-only mode',
    not_lockable_one: 'cannot be read-only, hidden in read-only mode',
    no_items: 'No entries',
    not_admin: 'Only administrators can use this card.',
    loading: 'Loading…',
    first_run: 'First run: {n} entries. New entities start hidden.',
    last_saved: 'Last saved: {d} · {n} new entries',
    unsaved: 'Unsaved changes',
    saving: 'Saving…',
    saved: 'Saved: {v} views built in "{t}".',
    err_load: 'Error while loading: {e}',
    err_save: 'Error while saving: {e}',
    missing_config: 'Please choose a source and a target dashboard in the card editor.',
    same_dashboard: 'Source and target must be different dashboards.',
    bad_target: 'The target URL path must be lowercase and contain a hyphen, e.g. "dashboard-kids".',
    yaml_target: 'The target dashboard is in YAML mode and cannot be written.',
    strategy: 'The source dashboard is generated automatically. Take control of it first.',
    create_ask: 'The dashboard "{t}" does not exist yet. Create it?',
    create: 'Create',
    overwrite_ask: 'The dashboard "{t}" was not built by this card. Its content will be replaced completely. Continue?',
    overwrite: 'Replace',
    cancel: 'Cancel',
    cancelled: 'Cancelled.',
    static_element: 'Element without entity',
    static_card: '{type} card',
    missing_entity: 'not found',
    view: 'View {n}',
    empty_view: 'No view selected.',
    // editor
    ed_source: 'Source dashboard',
    ed_target: 'Target dashboard (URL path)',
    ed_target_help: 'Existing dashboard or a new URL path with a hyphen, e.g. "dashboard-kids". It is created on first save.',
    ed_target_title: 'Title for a new target dashboard',
    ed_title: 'Card title (optional)',
    ed_default: 'Overview (default)',
  },
  de: {
    title: 'Dashboard-Filter',
    hide: 'Aus',
    show: 'Nur anzeigen',
    control: 'Bedienbar',
    shown: 'Angezeigt',
    search: 'Name oder Entität suchen',
    filter_all: 'Alle',
    filter_new: 'Nur neue',
    save: 'Speichern & erzeugen',
    reload: 'Neu laden',
    include: 'Ansicht übernehmen',
    set_all: 'Alle sichtbaren:',
    new: 'neu',
    uses: '{n} Elemente',
    not_lockable: '{k} von {n} Elementen können nicht „nur angezeigt“ werden und werden dann ausgeblendet',
    not_lockable_one: 'kann nicht „nur angezeigt“ werden, wird dann ausgeblendet',
    no_items: 'Keine Einträge',
    not_admin: 'Nur Administratoren können diese Karte verwenden.',
    loading: 'Lade …',
    first_run: 'Erster Start: {n} Einträge. Neue Entitäten sind zunächst ausgeblendet.',
    last_saved: 'Zuletzt gespeichert: {d} · {n} neue Einträge',
    unsaved: 'Ungespeicherte Änderungen',
    saving: 'Speichere …',
    saved: 'Gespeichert: {v} Ansichten in „{t}“ erzeugt.',
    err_load: 'Fehler beim Laden: {e}',
    err_save: 'Fehler beim Speichern: {e}',
    missing_config: 'Bitte im Karten-Editor ein Quell- und ein Ziel-Dashboard wählen.',
    same_dashboard: 'Quelle und Ziel müssen verschiedene Dashboards sein.',
    bad_target: 'Der URL-Pfad des Ziels muss kleingeschrieben sein und einen Bindestrich enthalten, z. B. „dashboard-kinder“.',
    yaml_target: 'Das Ziel-Dashboard ist im YAML-Modus und kann nicht geschrieben werden.',
    strategy: 'Das Quell-Dashboard wird automatisch erzeugt. Bitte zuerst die Kontrolle übernehmen.',
    create_ask: 'Das Dashboard „{t}“ existiert noch nicht. Anlegen?',
    create: 'Anlegen',
    overwrite_ask: 'Das Dashboard „{t}“ wurde nicht von dieser Karte erzeugt. Sein Inhalt wird vollständig ersetzt. Fortfahren?',
    overwrite: 'Ersetzen',
    cancel: 'Abbrechen',
    cancelled: 'Abgebrochen.',
    static_element: 'Element ohne Entität',
    static_card: 'Karte {type}',
    missing_entity: 'nicht gefunden',
    view: 'Ansicht {n}',
    empty_view: 'Keine Ansicht ausgewählt.',
    ed_source: 'Quell-Dashboard',
    ed_target: 'Ziel-Dashboard (URL-Pfad)',
    ed_target_help: 'Vorhandenes Dashboard oder neuer URL-Pfad mit Bindestrich, z. B. „dashboard-kinder“. Wird beim ersten Speichern angelegt.',
    ed_target_title: 'Titel für ein neues Ziel-Dashboard',
    ed_title: 'Kartentitel (optional)',
    ed_default: 'Übersicht (Standard)',
  },
};

function translator(hass) {
  const lang = (hass && (hass.locale?.language || hass.language)) || 'en';
  const table = STRINGS[lang.split('-')[0]] || STRINGS.en;
  return (key, vars = {}) =>
    (table[key] ?? STRINGS.en[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
}

// ---------------------------------------------------------------------------
// Dashboard transformation (pure functions, no DOM)
// ---------------------------------------------------------------------------

const ACTIONS = ['tap_action', 'hold_action', 'double_tap_action'];
const ICON_ACTIONS = ['icon_tap_action', 'icon_hold_action', 'icon_double_tap_action'];

// picture-elements element types whose interaction can be disabled with tap_action: none
const LOCKABLE_ELEMENTS = new Set(['state-badge', 'state-icon', 'state-label', 'icon', 'image']);
// Cards that only offer interaction through their actions
const LOCKABLE_CARDS = new Set(['button', 'entity', 'picture', 'picture-entity', 'tile']);
// Cards that only display data; they are kept unchanged in read-only mode
const DISPLAY_CARDS = new Set([
  'sensor', 'gauge', 'statistic', 'markdown', 'weather-forecast', 'clock', 'iframe',
  'history-graph', 'statistics-graph', 'logbook', 'map',
]);
// Cards with an entity list that is filtered entry by entry
const LIST_CARDS = new Set(['entities', 'glance', 'picture-glance', 'history-graph', 'statistics-graph', 'logbook', 'map']);

const clone = (o) => (o === undefined ? o : JSON.parse(JSON.stringify(o)));
const none = () => ({ action: 'none' });

function lockActions(obj) {
  ACTIONS.forEach((a) => (obj[a] = none()));
  return obj;
}

function lockCard(card) {
  const c = lockActions(clone(card));
  if (c.type === 'tile') {
    ICON_ACTIONS.forEach((a) => (c[a] = none()));
    delete c.features;
    delete c.features_position;
  }
  return c;
}

function lockElement(el) {
  const e = clone(el);
  if (e.type !== 'conditional') lockActions(e);
  if (Array.isArray(e.elements)) e.elements = e.elements.map(lockElement);
  return e;
}

function isLockableElement(el) {
  if (el.type === 'conditional') return (el.elements || []).every(isLockableElement);
  return LOCKABLE_ELEMENTS.has(el.type);
}

// First entity of a picture-elements element: own entity, inner elements, then conditions.
function elementEntity(el) {
  if (el.entity) return el.entity;
  for (const inner of el.elements || []) {
    const e = elementEntity(inner);
    if (e) return e;
  }
  const fromConditions = (list) => {
    for (const c of list || []) {
      if (c.entity) return c.entity;
      const n = fromConditions(c.conditions);
      if (n) return n;
    }
    return null;
  };
  return fromConditions(el.conditions);
}

// First entity found anywhere inside an object (used for unknown card types).
function deepEntity(obj) {
  if (!obj || typeof obj !== 'object') return null;
  if (Array.isArray(obj)) {
    for (const x of obj) {
      const e = deepEntity(x);
      if (e) return e;
    }
    return null;
  }
  if (typeof obj.entity === 'string') return obj.entity;
  if (Array.isArray(obj.entities)) {
    const first = obj.entities.find(Boolean);
    if (typeof first === 'string') return first;
    if (first && typeof first.entity === 'string') return first.entity;
  }
  for (const v of Object.values(obj)) {
    const e = deepEntity(v);
    if (e) return e;
  }
  return null;
}

function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// Elements without entity are identified by image and position.
function staticElementKey(el) {
  const img = el.image || (el.elements || []).map((e) => e.image).find(Boolean) || el.type;
  const st = el.style || (el.elements || [])[0]?.style || {};
  return `static:${img}@${st.left || ''},${st.top || ''}`;
}

const staticCardKey = (card) => `card:${card.type || 'unknown'}:${hash(JSON.stringify(card))}`;
const isStaticKey = (key) => key.startsWith('static:') || key.startsWith('card:');

/**
 * Applies the selection to one item.
 * ctx.collect registers the item (analysis), ctx.mode returns hide | show | control.
 */
function decide(ctx, key, lockable, obj, lockFn, label) {
  ctx.collect(key, lockable, label);
  const mode = ctx.mode(key);
  if (mode === 'hide') return null;
  if (mode === 'show') return lockable ? lockFn(obj) : null;
  return clone(obj);
}

function procElement(el, ctx) {
  const ent = elementEntity(el);
  const key = ent || staticElementKey(el);
  return decide(ctx, key, isLockableElement(el), el, lockElement, ent ? null : el.image || el.type);
}

function procRow(row, ctx) {
  if (typeof row === 'string') row = { entity: row };
  if (row.type === 'conditional' && row.row) {
    const inner = procRow(row.row, ctx);
    return inner ? { ...clone(row), row: inner } : null;
  }
  if (!row.entity) return clone(row); // dividers, sections, links ...
  const lockable = !row.type || row.type === 'simple-entity' || row.type === 'attribute';
  return decide(ctx, row.entity, lockable, row, (r) => {
    const c = lockActions(clone(r));
    if (!c.type) c.type = 'simple-entity'; // no toggle switch
    return c;
  });
}

function procListEntry(entry, ctx, lockFn) {
  const ent = typeof entry === 'string' ? entry : entry && entry.entity;
  if (!ent) return clone(entry);
  return decide(ctx, ent, true, entry, lockFn);
}

const lockEntry = (e) => lockActions(typeof e === 'string' ? { entity: e } : clone(e));

function procHeaderFooter(hf, ctx) {
  if (!hf || typeof hf !== 'object') return hf;
  if (hf.type === 'buttons' && Array.isArray(hf.entities)) {
    const entities = hf.entities.map((e) => procListEntry(e, ctx, lockEntry)).filter(Boolean);
    return entities.length ? { ...clone(hf), entities } : undefined;
  }
  if (hf.type === 'graph' && hf.entity) {
    return decide(ctx, hf.entity, true, hf, clone) || undefined;
  }
  return clone(hf);
}

function procBadge(badge, ctx) {
  const ent = typeof badge === 'string' ? badge : badge && badge.entity;
  if (!ent) return clone(badge);
  return decide(ctx, ent, true, badge, (b) =>
    lockActions(typeof b === 'string' ? { type: 'entity', entity: b } : clone(b)));
}

function procListCard(card, ctx) {
  const c = clone(card);
  const hadEntities = (card.entities || []).some((e) => typeof e === 'string' || (e && (e.entity || e.row)));

  if (card.type === 'entities') {
    c.entities = card.entities.map((r) => procRow(r, ctx)).filter(Boolean);
  } else if (card.type === 'glance' || card.type === 'picture-glance') {
    c.entities = card.entities.map((e) => procListEntry(e, ctx, lockEntry)).filter(Boolean);
  } else {
    // display only: history-graph, statistics-graph, logbook, map
    c.entities = card.entities.map((e) => procListEntry(e, ctx, clone)).filter(Boolean);
  }

  if (card.type === 'picture-glance' && card.entity) {
    ctx.collect(card.entity, true);
    const mode = ctx.mode(card.entity);
    if (mode === 'hide') delete c.entity;
    if (mode !== 'control') lockActions(c);
  }

  const left = c.entities.some((e) => typeof e === 'string' || (e && (e.entity || e.row)));
  if (hadEntities && !left) {
    if (card.type === 'picture-glance' && c.entity) return c;
    if (card.type === 'map' && card.geo_location_sources) return c;
    return null;
  }
  return c;
}

function procCard(card, ctx) {
  if (!card || typeof card !== 'object') return card;
  const type = card.type || '';

  // Containers: vertical-stack, horizontal-stack, grid, custom stacks
  if (Array.isArray(card.cards)) {
    const cards = card.cards.map((c) => procCard(c, ctx)).filter(Boolean);
    return cards.length ? { ...clone(card), cards } : null;
  }
  // Wrappers: conditional card and similar
  if (card.card && typeof card.card === 'object') {
    const inner = procCard(card.card, ctx);
    return inner ? { ...clone(card), card: inner } : null;
  }
  if (type === 'picture-elements') {
    const c = clone(card);
    c.elements = (card.elements || []).map((e) => procElement(e, ctx)).filter(Boolean);
    return c;
  }
  if (type === 'heading') {
    const c = clone(card);
    if (Array.isArray(card.badges)) c.badges = card.badges.map((b) => procBadge(b, ctx)).filter(Boolean);
    return c;
  }
  if (LIST_CARDS.has(type) && Array.isArray(card.entities)) {
    const c = procListCard(card, ctx);
    if (!c) return null;
    for (const k of ['header', 'footer']) {
      if (card[k]) {
        const hf = procHeaderFooter(card[k], ctx);
        if (hf) c[k] = hf;
        else delete c[k];
      }
    }
    return c;
  }

  const base = clone(card);
  for (const k of ['header', 'footer']) {
    if (card[k]) {
      const hf = procHeaderFooter(card[k], ctx);
      if (hf) base[k] = hf;
      else delete base[k];
    }
  }

  const ent = typeof card.entity === 'string' ? card.entity : deepEntity(card);
  if (!ent) {
    // Cards without entity: known display cards can be shown safely, unknown ones may trigger actions
    const lockable = LOCKABLE_CARDS.has(type) || DISPLAY_CARDS.has(type);
    return decide(ctx, staticCardKey(card), lockable, base, LOCKABLE_CARDS.has(type) ? lockCard : clone, type);
  }
  if (LOCKABLE_CARDS.has(type)) return decide(ctx, ent, true, base, lockCard);
  if (DISPLAY_CARDS.has(type)) return decide(ctx, ent, true, base, clone);
  return decide(ctx, ent, false, base, clone);
}

function procView(view, ctx) {
  const v = clone(view);
  if (Array.isArray(view.badges)) v.badges = view.badges.map((b) => procBadge(b, ctx)).filter(Boolean);
  if (Array.isArray(view.cards)) v.cards = view.cards.map((c) => procCard(c, ctx)).filter(Boolean);
  if (Array.isArray(view.sections)) {
    v.sections = view.sections
      .map((s) => {
        const cards = (s.cards || []).map((c) => procCard(c, ctx)).filter(Boolean);
        const hadContent = (s.cards || []).some((c) => c.type !== 'heading');
        if (hadContent && !cards.some((c) => c.type !== 'heading')) return null; // only headings left
        return { ...clone(s), cards };
      })
      .filter(Boolean);
  }
  if (view.header && view.header.card) {
    const card = procCard(view.header.card, ctx);
    if (card) v.header.card = card;
    else delete v.header;
  }
  return v;
}

const viewKey = (v, i) => v.path || v.title || `view-${i}`;

// Rewrites links to views of the source dashboard so they point to the target.
function rewriteNavigation(obj, srcPath, dstPath, viewMap) {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) return obj.forEach((x) => rewriteNavigation(x, srcPath, dstPath, viewMap));
  if (obj.action === 'navigate' && typeof obj.navigation_path === 'string') {
    const esc = srcPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const m = obj.navigation_path.match(new RegExp(`^/${esc}(?=$|[/?#])(?:/([^/?#]+))?(.*)$`));
    if (m) {
      if (!m[1]) obj.navigation_path = `/${dstPath}${m[2]}`;
      else if (m[1] in viewMap) obj.navigation_path = `/${dstPath}/${viewMap[m[1]]}${m[2]}`;
      else {
        obj.action = 'none';
        delete obj.navigation_path;
      }
    }
  }
  Object.values(obj).forEach((v) => rewriteNavigation(v, srcPath, dstPath, viewMap));
}

/** Lists all items per view of the source dashboard. */
function analyse(src) {
  return (src.views || []).map((view, i) => {
    const items = new Map();
    const ctx = {
      mode: () => 'control',
      collect: (key, lockable, label) => {
        if (!items.has(key)) items.set(key, { key, count: 0, lockable: 0, label });
        const it = items.get(key);
        it.count++;
        if (lockable) it.lockable++;
      },
    };
    procView(view, ctx);
    return { key: viewKey(view, i), title: view.title, index: i, items: [...items.values()] };
  });
}

/** Builds the target dashboard config from source and selection. */
function build(src, selection, modeOf, srcPath, dstPath) {
  const ctx = { mode: modeOf, collect: () => {} };
  const views = [];
  const viewMap = {};
  (src.views || []).forEach((view, i) => {
    if (!selection.views[viewKey(view, i)]) return;
    viewMap[view.path || String(i)] = view.path || String(views.length);
    views.push(procView(view, ctx));
  });
  views.forEach((v) => rewriteNavigation(v, srcPath, dstPath, viewMap));
  const root = clone(src);
  delete root.views;
  delete root[MARKER];
  return { ...root, [MARKER]: selection, views };
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

const DOMAIN_ICONS = {
  light: 'mdi:lightbulb', switch: 'mdi:toggle-switch', sensor: 'mdi:eye', binary_sensor: 'mdi:checkbox-blank-circle-outline',
  cover: 'mdi:window-shutter', climate: 'mdi:thermostat', media_player: 'mdi:cast', lock: 'mdi:lock', camera: 'mdi:cctv',
  person: 'mdi:account', device_tracker: 'mdi:account', weather: 'mdi:weather-partly-cloudy', input_boolean: 'mdi:toggle-switch-outline',
  select: 'mdi:format-list-bulleted', script: 'mdi:script-text', automation: 'mdi:robot', fan: 'mdi:fan', vacuum: 'mdi:robot-vacuum',
  alarm_control_panel: 'mdi:shield-home', calendar: 'mdi:calendar', timer: 'mdi:timer-outline', scene: 'mdi:palette',
};

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const STYLE = `
  :host { display: block; }
  [hidden] { display: none !important; }
  ha-card { overflow: hidden; }
  .head { padding: 16px 16px 8px; display: flex; flex-wrap: wrap; gap: 8px 12px; align-items: center; }
  .head h2 { margin: 0; font-size: 20px; font-weight: 400; flex: 1 1 auto; color: var(--primary-text-color); }
  .route { width: 100%; color: var(--secondary-text-color); font-size: 13px; margin-top: -6px; }
  .tools { padding: 0 16px 8px; display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
  input[type=search], select {
    font: inherit; color: var(--primary-text-color); background: var(--secondary-background-color, transparent);
    border: 1px solid var(--divider-color); border-radius: 8px; padding: 7px 10px; min-width: 0;
  }
  input[type=search] { flex: 1 1 180px; }
  button { font: inherit; cursor: pointer; }
  .btn { border: 1px solid var(--divider-color); background: transparent; color: var(--primary-text-color); border-radius: 8px; padding: 7px 12px; }
  .btn.primary { background: var(--primary-color); border-color: var(--primary-color); color: var(--text-primary-color, #fff); font-weight: 500; }
  .btn:disabled { opacity: .5; cursor: default; }
  .status { padding: 0 16px 12px; font-size: 13px; color: var(--secondary-text-color); }
  .status.err { color: var(--error-color); }
  .status.ok { color: var(--success-color, var(--primary-color)); }
  .ask { margin: 0 16px 12px; padding: 12px; border-radius: 8px; border: 1px solid var(--warning-color, orange);
         display: flex; flex-wrap: wrap; gap: 8px; align-items: center; color: var(--primary-text-color); }
  .ask span { flex: 1 1 240px; }
  details { border-top: 1px solid var(--divider-color); }
  summary { list-style: none; cursor: pointer; padding: 12px 16px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; }
  summary::-webkit-details-marker { display: none; }
  summary .chev { transition: transform .2s; color: var(--secondary-text-color); }
  details[open] summary .chev { transform: rotate(90deg); }
  summary h3 { margin: 0; font-size: 16px; font-weight: 500; flex: 1 1 auto; color: var(--primary-text-color); }
  summary label { display: flex; gap: 6px; align-items: center; color: var(--primary-text-color); }
  .bulk { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; padding: 0 16px 8px; font-size: 12px; color: var(--secondary-text-color); }
  .bulk button { border: 1px solid var(--divider-color); background: transparent; color: var(--primary-text-color); border-radius: 6px; padding: 3px 8px; font-size: 12px; }
  details.off .rows, details.off .bulk { opacity: .45; pointer-events: none; }
  .row { display: flex; align-items: center; gap: 12px; padding: 8px 16px; border-top: 1px solid var(--divider-color); }
  .row .icon { width: 24px; flex: none; color: var(--state-icon-color, var(--secondary-text-color)); display: flex; justify-content: center; }
  .info { flex: 1 1 auto; min-width: 0; }
  .name { color: var(--primary-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .meta { color: var(--secondary-text-color); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .warn { color: var(--warning-color, orange); }
  .badge { display: inline-block; font-size: 11px; font-weight: 600; color: var(--accent-color, var(--primary-color));
           border: 1px solid currentColor; border-radius: 4px; padding: 0 4px; margin-left: 6px; vertical-align: 1px; }
  .seg { display: inline-flex; border: 1px solid var(--divider-color); border-radius: 8px; overflow: hidden; flex: none; }
  .seg button { border: 0; background: transparent; color: var(--secondary-text-color); padding: 5px 10px; font-size: 13px; }
  .seg button + button { border-left: 1px solid var(--divider-color); }
  .seg button.on[data-m=hide] { background: var(--disabled-text-color, #888); color: #fff; }
  .seg button.on[data-m=show] { background: var(--warning-color, #f0a830); color: #fff; }
  .seg button.on[data-m=control], .seg button.on.st[data-m=show] { background: var(--success-color, #43a047); color: #fff; }
  .empty { padding: 12px 16px; color: var(--secondary-text-color); border-top: 1px solid var(--divider-color); }
  @media (max-width: 600px) {
    .row { flex-wrap: wrap; }
    .seg { width: 100%; }
    .seg button { flex: 1; }
  }
`;

class DashboardFilterCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._loaded = false;
    this._dirty = false;
    this._busy = false;
    this._open = {};
  }

  static getConfigElement() {
    return document.createElement(`${CARD_TYPE}-editor`);
  }

  static getStubConfig() {
    return { source: 'lovelace', target: 'dashboard-restricted' };
  }

  setConfig(config) {
    if (!config) throw new Error('Invalid configuration');
    const changed = !this._config || config.source !== this._config.source || config.target !== this._config.target;
    this._config = { ...config };
    if (changed && this._hass) this._load();
    else if (this._loaded) this._renderHead();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    this._t = translator(hass);
    if (first) this._load();
  }

  getCardSize() {
    return 12;
  }

  getGridOptions() {
    return { columns: 'full', min_columns: 6 };
  }

  getLayoutOptions() {
    return { grid_columns: 'full' };
  }

  // ----- data -----

  get _srcPath() {
    return this._config.source || 'lovelace';
  }

  get _dstPath() {
    return (this._config.target || '').trim();
  }

  _ws(msg) {
    return this._hass.callWS(msg);
  }

  async _dashboards() {
    try {
      return await this._ws({ type: 'lovelace/dashboards/list' });
    } catch (e) {
      return [];
    }
  }

  // The default dashboard is addressed with url_path null unless a dashboard with that path exists.
  _wsPath(path, list) {
    if (path === 'lovelace' && !list.some((d) => d.url_path === 'lovelace')) return null;
    return path;
  }

  async _load() {
    const t = this._t;
    this._skeleton();
    this._loaded = false;
    this._renderHead();
    this.shadowRoot.querySelector('.list').innerHTML = '';
    if (!this._hass.user?.is_admin) return this._status(t('not_admin'), 'err');
    if (!this._dstPath) return this._status(t('missing_config'), 'err');
    if (!TARGET_RE.test(this._dstPath)) return this._status(t('bad_target'), 'err');
    if (this._dstPath === this._srcPath) return this._status(t('same_dashboard'), 'err');

    this._status(t('loading'));
    try {
      const list = await this._dashboards();
      this._list = list;
      this._src = await this._ws({ type: 'lovelace/config', url_path: this._wsPath(this._srcPath, list) });
      if (this._src.strategy && !this._src.views) return this._status(t('strategy'), 'err');

      let dst = null;
      if (list.some((d) => d.url_path === this._dstPath)) {
        try {
          dst = await this._ws({ type: 'lovelace/config', url_path: this._dstPath });
        } catch (e) {
          /* not configured yet */
        }
      }
      const stored = dst && dst[MARKER];
      this._sel = stored && stored.entities ? clone(stored) : { views: {}, entities: {} };
      this._groups = analyse(this._src);
      this._lockMap = {};
      this._groups.forEach((g) =>
        g.items.forEach((it) => (this._lockMap[it.key] = this._lockMap[it.key] !== false && it.lockable === it.count)));
      if (!Object.keys(this._sel.views).length) this._groups.forEach((g) => (this._sel.views[g.key] = true));

      this._loaded = true;
      this._dirty = false;
      const fresh = this._newCount();
      this._status(
        this._sel.updated
          ? t('last_saved', { d: new Date(this._sel.updated).toLocaleString(this._hass.locale?.language), n: fresh })
          : t('first_run', { n: fresh }),
      );
      this._renderHead();
      this._renderList();
    } catch (e) {
      this._status(t('err_load', { e: e.message || e.code || JSON.stringify(e) }), 'err');
    }
  }

  // Entities start hidden. Items without entity (images, markdown, ...) start shown,
  // but only if they can be locked; buttons without entity start hidden.
  _defaultMode(key) {
    if (!isStaticKey(key)) return 'hide';
    return this._lockable(key) ? 'show' : 'hide';
  }

  _lockable(key) {
    return this._lockMap[key] !== false;
  }

  // Modes offered for an item. Items without entity only know hidden / shown.
  _modesFor(key) {
    const t = this._t;
    if (!isStaticKey(key)) return [['hide', t('hide')], ['show', t('show')], ['control', t('control')]];
    return [['hide', t('hide')], [this._lockable(key) ? 'show' : 'control', t('shown')]];
  }

  _modeOf(key) {
    return this._sel.entities[key] || this._defaultMode(key);
  }

  _isNew(key) {
    return !(key in this._sel.entities);
  }

  _newCount() {
    return this._groups.reduce((s, g) => s + g.items.filter((it) => this._isNew(it.key)).length, 0);
  }

  _touch() {
    this._dirty = true;
    this._status(this._t('unsaved'));
    this._renderHead();
  }

  // ----- saving -----

  async _save() {
    const t = this._t;
    if (this._busy) return;
    const dst = this._dstPath;
    if (dst === this._srcPath || dst === 'lovelace') return this._status(t('same_dashboard'), 'err');
    if (!TARGET_RE.test(dst)) return this._status(t('bad_target'), 'err');

    this._busy = true;
    this._renderHead();
    try {
      const list = await this._dashboards();
      const entry = list.find((d) => d.url_path === dst);
      if (!entry) {
        if (!(await this._ask(t('create_ask', { t: dst }), t('create')))) return this._status(t('cancelled'));
        await this._ws({
          type: 'lovelace/dashboards/create',
          url_path: dst,
          title: this._config.target_title || dst.replace(/^dashboard-/, '').replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase()),
          icon: 'mdi:view-dashboard-variant',
          mode: 'storage',
          require_admin: false,
          show_in_sidebar: true,
        });
      } else {
        if (entry.mode === 'yaml') return this._status(t('yaml_target'), 'err');
        let existing = null;
        try {
          existing = await this._ws({ type: 'lovelace/config', url_path: dst });
        } catch (e) {
          /* empty dashboard */
        }
        const hasContent = existing && ((existing.views && existing.views.length) || existing.strategy);
        if (hasContent && !existing[MARKER]) {
          if (!(await this._ask(t('overwrite_ask', { t: entry.title || dst }), t('overwrite')))) return this._status(t('cancelled'));
        }
      }

      this._status(t('saving'));
      // Everything currently listed counts as known from now on
      this._groups.forEach((g) => {
        if (!(g.key in this._sel.views)) this._sel.views[g.key] = false;
        g.items.forEach((it) => {
          if (!(it.key in this._sel.entities)) this._sel.entities[it.key] = this._defaultMode(it.key);
        });
      });
      this._sel.source = this._srcPath;
      this._sel.version = VERSION;
      this._sel.updated = new Date().toISOString();

      const cfg = build(this._src, this._sel, (k) => this._modeOf(k), this._srcPath, dst);
      if (!cfg.views.length) cfg.views.push({ title: '—', cards: [{ type: 'markdown', content: t('empty_view') }] });
      await this._ws({ type: 'lovelace/config/save', url_path: dst, config: cfg });

      this._dirty = false;
      const title = (list.find((d) => d.url_path === dst) || {}).title || dst;
      this._status(t('saved', { v: cfg.views.length, t: title }), 'ok');
      this._renderList();
    } catch (e) {
      this._status(t('err_save', { e: e.message || e.code || JSON.stringify(e) }), 'err');
    } finally {
      this._busy = false;
      this._renderHead();
    }
  }

  // Inline confirmation instead of window.confirm (works in the companion apps too)
  _ask(text, okLabel) {
    return new Promise((resolve) => {
      const box = this.shadowRoot.querySelector('.ask');
      box.hidden = false;
      box.innerHTML = `<span>${esc(text)}</span>
        <button class="btn" data-a="no">${esc(this._t('cancel'))}</button>
        <button class="btn primary" data-a="yes">${esc(okLabel)}</button>`;
      box.querySelectorAll('button').forEach((b) =>
        b.addEventListener('click', () => {
          box.hidden = true;
          box.innerHTML = '';
          resolve(b.dataset.a === 'yes');
        }),
      );
    });
  }

  // ----- rendering -----

  _skeleton() {
    if (this.shadowRoot.querySelector('ha-card')) return;
    this.shadowRoot.innerHTML = `<style>${STYLE}</style>
      <ha-card>
        <div class="head"><h2></h2><div class="route"></div></div>
        <div class="tools" hidden>
          <input type="search">
          <select class="filter"></select>
          <button class="btn reload"></button>
          <button class="btn primary save"></button>
        </div>
        <div class="ask" hidden></div>
        <div class="status"></div>
        <div class="list"></div>
      </ha-card>`;
    const root = this.shadowRoot;
    root.querySelector('input').addEventListener('input', () => this._renderList());
    root.querySelector('.filter').addEventListener('change', () => this._renderList());
    root.querySelector('.reload').addEventListener('click', () => {
      if (!this._busy) this._load();
    });
    root.querySelector('.save').addEventListener('click', () => this._save());
  }

  _status(text, cls = '') {
    this._skeleton();
    const s = this.shadowRoot.querySelector('.status');
    s.textContent = text;
    s.className = `status ${cls}`;
  }

  _renderHead() {
    const t = this._t;
    const root = this.shadowRoot;
    root.querySelector('h2').textContent = this._config.title || t('title');
    root.querySelector('.route').textContent = `${this._srcPath} → ${this._dstPath}`;
    root.querySelector('.tools').hidden = !this._loaded;
    root.querySelector('input').placeholder = t('search');
    const f = root.querySelector('.filter');
    const current = f.value || 'all';
    f.innerHTML = [['all', t('filter_all')], ['new', t('filter_new')], ['hide', t('hide')], ['show', t('show')], ['control', t('control')]]
      .map(([v, l]) => `<option value="${v}">${esc(l)}</option>`)
      .join('');
    f.value = current;
    root.querySelector('.reload').textContent = t('reload');
    const save = root.querySelector('.save');
    save.textContent = t('save');
    save.disabled = this._busy || !this._loaded;
  }

  _label(it) {
    const t = this._t;
    if (it.key.startsWith('static:')) return { name: t('static_element'), meta: it.label || it.key.slice(7), icon: 'mdi:image-outline' };
    if (it.key.startsWith('card:')) return { name: t('static_card', { type: it.label || 'unknown' }), meta: '', icon: 'mdi:card-outline' };
    const s = this._hass.states[it.key];
    const state = s ? `${s.state}${s.attributes.unit_of_measurement ? ' ' + s.attributes.unit_of_measurement : ''}` : t('missing_entity');
    return {
      name: (s && s.attributes.friendly_name) || it.key,
      meta: `${it.key} · ${state}`,
      icon: (s && s.attributes.icon) || DOMAIN_ICONS[it.key.split('.')[0]] || 'mdi:help-circle-outline',
      stateObj: s,
    };
  }

  _renderList() {
    if (!this._loaded) return;
    const t = this._t;
    const root = this.shadowRoot;
    const q = root.querySelector('input').value.trim().toLowerCase();
    const filter = root.querySelector('.filter').value || 'all';
    const list = root.querySelector('.list');
    const html = [];
    const iconSlots = [];

    this._groups.forEach((g, gi) => {
      const on = !!this._sel.views[g.key];
      const visible = g.items.filter((it) => {
        const l = this._label(it);
        if (q && !`${l.name} ${it.key}`.toLowerCase().includes(q)) return false;
        if (filter === 'new') return this._isNew(it.key);
        if (filter !== 'all') return this._modeOf(it.key) === filter;
        return true;
      });
      g._visible = visible;
      // While searching or filtering, open every view with matches
      const open = q || filter !== 'all' ? visible.length > 0 : this._open[g.key] ?? gi === 0;
      html.push(`<details data-g="${gi}" class="${on ? '' : 'off'}" ${open ? 'open' : ''}>
        <summary>
          <ha-icon class="chev" icon="mdi:chevron-right"></ha-icon>
          <h3>${esc(g.title || t('view', { n: g.index + 1 }))}${g.key in this._sel.views ? '' : ` <span class="badge">${esc(t('new'))}</span>`}</h3>
          <label><input type="checkbox" class="inc" ${on ? 'checked' : ''}> ${esc(t('include'))}</label>
        </summary>
        <div class="bulk">${esc(t('set_all'))}
          ${['hide', 'show', 'control'].map((m) => `<button data-bulk="${m}">${esc(t(m))}</button>`).join('')}
        </div>
        <div class="rows">`);
      if (!visible.length) html.push(`<div class="empty">${esc(t('no_items'))}</div>`);
      visible.forEach((it, ii) => {
        const l = this._label(it);
        const mode = this._modeOf(it.key);
        const isStatic = isStaticKey(it.key);
        const modes = this._modesFor(it.key);
        const notes = [];
        if (it.count > 1) notes.push(t('uses', { n: it.count }));
        if (!isStatic && it.lockable < it.count) {
          notes.push(`<span class="warn">${esc(it.count === 1 ? t('not_lockable_one') : t('not_lockable', { k: it.count - it.lockable, n: it.count }))}</span>`);
        }
        iconSlots.push({ gi, ii, l });
        html.push(`<div class="row" data-g="${gi}" data-i="${ii}">
          <div class="icon"></div>
          <div class="info">
            <div class="name">${esc(l.name)}${this._isNew(it.key) ? ` <span class="badge">${esc(t('new'))}</span>` : ''}</div>
            <div class="meta">${esc(l.meta)}${notes.length ? (l.meta ? ' · ' : '') + notes.map((n) => (n.startsWith('<span') ? n : esc(n))).join(' · ') : ''}</div>
          </div>
          <div class="seg">${modes.map(([m, txt]) => `<button data-m="${m}" class="${m === mode ? 'on' : ''}${isStatic ? ' st' : ''}">${esc(txt)}</button>`).join('')}</div>
        </div>`);
      });
      html.push('</div></details>');
    });
    list.innerHTML = html.join('');

    // Icons (ha-state-icon shows the state dependent icon like everywhere in HA)
    const useStateIcon = !!customElements.get('ha-state-icon');
    iconSlots.forEach(({ gi, ii, l }) => {
      const slot = list.querySelector(`.row[data-g="${gi}"][data-i="${ii}"] .icon`);
      let icon;
      if (useStateIcon && l.stateObj) {
        icon = document.createElement('ha-state-icon');
        icon.hass = this._hass;
        icon.stateObj = l.stateObj;
      } else {
        icon = document.createElement('ha-icon');
        icon.icon = l.icon;
        icon.setAttribute('icon', l.icon);
      }
      slot.appendChild(icon);
    });

    // Events
    list.querySelectorAll('details').forEach((d) => {
      const g = this._groups[d.dataset.g];
      d.addEventListener('toggle', () => (this._open[g.key] = d.open));
      const inc = d.querySelector('.inc');
      inc.addEventListener('click', (e) => e.stopPropagation());
      inc.addEventListener('change', () => {
        this._sel.views[g.key] = inc.checked;
        this._touch();
        this._renderList();
      });
      d.querySelectorAll('[data-bulk]').forEach((b) =>
        b.addEventListener('click', () => {
          g._visible.forEach((it) => {
            const m = b.dataset.bulk;
            // Items without entity: "read-only" means shown if lockable, otherwise hidden
            let mode = m;
            if (isStaticKey(it.key) && m !== 'hide') {
              const shown = this._modesFor(it.key)[1][0];
              mode = m === 'show' && shown === 'control' ? 'hide' : shown;
            }
            this._sel.entities[it.key] = mode;
          });
          this._touch();
          this._renderList();
        }),
      );
    });
    list.querySelectorAll('.row').forEach((r) => {
      const it = this._groups[r.dataset.g]._visible[r.dataset.i];
      r.querySelectorAll('.seg button').forEach((b) =>
        b.addEventListener('click', () => {
          this._sel.entities[it.key] = b.dataset.m;
          this._touch();
          this._renderList();
        }),
      );
    });
  }
}

// ---------------------------------------------------------------------------
// Editor
// ---------------------------------------------------------------------------

class DashboardFilterCardEditor extends HTMLElement {
  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) {
      hass
        .callWS({ type: 'lovelace/dashboards/list' })
        .then((list) => {
          this._list = list;
          this._built = false;
          this._render();
        })
        .catch(() => {});
      this._render();
    }
  }

  _render() {
    if (!this._hass || !this._config) return;
    const t = translator(this._hass);
    if (!this._built) {
      const list = this._list || [];
      const options = [
        ['lovelace', t('ed_default')],
        ...list.filter((d) => d.url_path !== 'lovelace').map((d) => [d.url_path, `${d.title || d.url_path} (${d.url_path})`]),
      ];
      this.innerHTML = `
        <style>
          .f { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
          .f label { font-weight: 500; }
          .f small { color: var(--secondary-text-color); }
          .f small.err { color: var(--error-color); }
          .f input.invalid { border-color: var(--error-color); }
          .f input, .f select { font: inherit; padding: 8px; border-radius: 6px; border: 1px solid var(--divider-color);
            background: var(--card-background-color); color: var(--primary-text-color); }
        </style>
        <div class="f"><label>${esc(t('ed_source'))}</label>
          <select data-k="source">${options.map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select></div>
        <div class="f"><label>${esc(t('ed_target'))}</label>
          <input data-k="target" list="dfc-dashboards" autocomplete="off">
          <datalist id="dfc-dashboards">${list.map((d) => `<option value="${esc(d.url_path)}">${esc(d.title || '')}</option>`).join('')}</datalist>
          <small class="err" hidden></small>
          <small>${esc(t('ed_target_help'))}</small></div>
        <div class="f"><label>${esc(t('ed_target_title'))}</label><input data-k="target_title"></div>
        <div class="f"><label>${esc(t('ed_title'))}</label><input data-k="title"></div>`;
      this.querySelectorAll('[data-k]').forEach((el) =>
        el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
          if (el.dataset.k === 'target') {
            // Lowercase and spaces to hyphens while typing
            const v = el.value.toLowerCase().replace(/\s+/g, '-');
            if (v !== el.value) {
              const pos = el.selectionStart;
              el.value = v;
              el.setSelectionRange(pos, pos);
            }
          }
          this._changed(el.dataset.k, el.value);
        }),
      );
      this._built = true;
    }
    // Update values without stealing the focus while typing
    this.querySelectorAll('[data-k]').forEach((el) => {
      if (el === document.activeElement || el.matches(':focus')) return;
      const v = this._config[el.dataset.k] ?? (el.dataset.k === 'source' ? 'lovelace' : '');
      if (el.value !== v) el.value = v;
    });
    this._validate();
  }

  // Shows an error below the target field while the URL path is not usable
  _validate() {
    const t = translator(this._hass);
    const input = this.querySelector('[data-k="target"]');
    const err = this.querySelector('small.err');
    if (!input || !err) return;
    const v = input.value.trim();
    const src = this._config.source || 'lovelace';
    let msg = '';
    if (v && !TARGET_RE.test(v)) msg = t('bad_target');
    else if (v && v === src) msg = t('same_dashboard');
    err.textContent = msg;
    err.hidden = !msg;
    input.classList.toggle('invalid', !!msg);
  }

  _changed(key, value) {
    const config = { ...this._config };
    if (value === '' && key !== 'source') delete config[key];
    else config[key] = value;
    this._config = config;
    this._validate();
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config }, bubbles: true, composed: true }));
  }
}

if (!customElements.get(CARD_TYPE)) customElements.define(CARD_TYPE, DashboardFilterCard);
if (!customElements.get(`${CARD_TYPE}-editor`)) customElements.define(`${CARD_TYPE}-editor`, DashboardFilterCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === CARD_TYPE)) {
  window.customCards.push({
    type: CARD_TYPE,
    name: 'Dashboard Filter Card',
    description: 'Build a restricted copy of a dashboard: choose per entity hidden, read-only or full access.',
    preview: false,
    documentationURL: 'https://github.com/philipgo/dashboard-filter-card',
  });
}

console.info(`%c DASHBOARD-FILTER-CARD %c v${VERSION} `, 'color:#fff;background:#0b6bcb;font-weight:600', 'color:#0b6bcb');

// Exported for tests (ignored by Home Assistant)
window.__dashboardFilterCard = { analyse, build, procCard, rewriteNavigation, VERSION };
