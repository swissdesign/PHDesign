/*******************************
 * P. Heiniger Design – Sheet API
 * - Email verification (HTML, multilingual)
 * - Only notify owner after verification
 * - Drive folder galleries -> image URLs (lh3 + caching)
 *******************************/

// ==== CONFIG ====
const SPREADSHEET_ID = '126eovOYWPxYaIHguFnnF-XbycfLNUUMz3DEEmwewtd8';

const TABS = {
  projects: 'projects',
  services: 'services',
  categories: 'categories',
  translations: 'translations',
  contact: 'contact_requests',
};

const SITE_BASE_URL = 'https://pascalheiniger.ch'; // used inside emails + verify page

// Verified leads will notify you here:
const NOTIFY_EMAILS = [
  'pascal.heiniger@gmail.com',
];

// token expiry (minutes)
const VERIFY_TOKEN_TTL_MIN = 60 * 24; // 24 hours

// Drive gallery
const ENABLE_DRIVE_GALLERIES = true;
const AUTO_SHARE_IMAGES_ANYONE_WITH_LINK = true; // recommended for lh3
const FOLDER_CACHE_SECONDS = 60 * 60 * 6; // 6h

const LANG_FALLBACK = ['en', 'de'];

// ==== ROUTING ====
function doGet(e) {
  try {
    const params = normalizeParams_(e?.parameter || {});
    const entity = params.entity;
    if (!entity) return json_(400, { error: 'Missing ?entity=' });

    switch (entity) {
      case 'projects':
        return json_(200, getProjects_(params));
      case 'project_detail':
        return json_(200, getProjectDetail_(params));
      case 'services':
        return json_(200, getServices_(params));
      case 'categories':
        return json_(200, getCategories_(params));
      case 'translations':
        return json_(200, getTranslations_(params));

      // email verification endpoint
      case 'verify_email':
        return verifyEmail_(params);

      default:
        return json_(404, { error: `Unknown entity: ${entity}` });
    }
  } catch (err) {
    return json_(500, { error: String(err), stack: err?.stack ? String(err.stack) : undefined });
  }
}

function doPost(e) {
  try {
    const params = normalizeParams_(e?.parameter || {});
    const entity = params.entity;
    if (!entity) return json_(400, { error: 'Missing ?entity=' });

    const body = parseJsonBody_(e);

    switch (entity) {
      case 'contact_request':
        return json_(200, createContactRequestWithVerification_(body));
      default:
        return json_(404, { error: `Unknown entity: ${entity}` });
    }
  } catch (err) {
    return json_(500, { error: String(err), stack: err?.stack ? String(err.stack) : undefined });
  }
}

// ==== UTIL ====
function normalizeParams_(p) {
  const out = {};
  Object.keys(p || {}).forEach(k => (out[k] = String(p[k]).trim()));
  out.lang = out.lang ? out.lang.toLowerCase() : 'en';
  out.includeUnpublished = out.includeUnpublished === '1' || out.includeUnpublished === 'true';
  return out;
}

function parseJsonBody_(e) {
  if (!e?.postData?.contents) return {};
  try {
    return JSON.parse(e.postData.contents);
  } catch {
    throw new Error('Invalid JSON body');
  }
}

function sheet_() {
  if (!SPREADSHEET_ID || SPREADSHEET_ID.includes('PASTE_YOUR_SHEET_ID_HERE')) {
    throw new Error('Set SPREADSHEET_ID in Code.gs');
  }
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getTab_(name) {
  const sh = sheet_().getSheetByName(name);
  if (!sh) throw new Error(`Missing tab: ${name}`);
  return sh;
}

function getRowsAsObjects_(tabName) {
  const sh = getTab_(tabName);
  const values = sh.getDataRange().getValues();
  if (!values || values.length < 2) return [];

  const headers = values[0].map(h => String(h).trim());
  const rows = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (row.every(v => v === '' || v === null)) continue;

    const obj = {};
    headers.forEach((h, idx) => (obj[h] = row[idx]));
    obj.__rowNumber = i + 1; // sheet row index (1-based)
    rows.push(obj);
  }
  return rows;
}

function isPublished_(row) {
  const v = row.isPublished;
  if (v === true) return true;
  const s = String(v || '').toLowerCase().trim();
  return ['true', '1', 'yes', 'y'].includes(s);
}

function pickLangField_(row, baseKey, lang) {
  const requestedKey = `${baseKey}_${lang}`;
  if (row[requestedKey] !== undefined && row[requestedKey] !== '') return row[requestedKey];
  for (const fb of LANG_FALLBACK) {
    const k = `${baseKey}_${fb}`;
    if (row[k] !== undefined && row[k] !== '') return row[k];
  }
  if (row[baseKey] !== undefined) return row[baseKey];
  return '';
}

function toStr_(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}

function json_(status, data) {
  const out = ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
  return out.setHeaders({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
}

// For verification landing pages (HTML)
function html_(html) {
  return ContentService.createTextOutput(html).setMimeType(ContentService.MimeType.HTML);
}

function now_() {
  return new Date();
}

// ==== DATA ENDPOINTS ====
function getProjects_(params) {
  const lang = params.lang || 'en';
  const rows = getRowsAsObjects_(TABS.projects);

  const items = rows
    .filter(r => (params.includeUnpublished ? true : isPublished_(r)))
    .map(r => ({
      slug: toStr_(r.slug),
      title: toStr_(pickLangField_(r, 'title', lang)),
      date: toStr_(r.date),
      category: toStr_(r.category),
      tags: toStr_(r.tags),
      folder_id: toStr_(r.folder_id),
      description: toStr_(pickLangField_(r, 'description', lang)),
    }))
    .filter(x => x.slug);

  return { items, count: items.length, lang };
}

function getProjectDetail_(params) {
  const lang = params.lang || 'en';
  const slug = params.slug;
  if (!slug) throw new Error('Missing ?slug=');

  const rows = getRowsAsObjects_(TABS.projects);
  const r = rows.find(x => toStr_(x.slug) === slug);
  if (!r) return { error: `Project not found: ${slug}` };
  if (!params.includeUnpublished && !isPublished_(r)) return { error: `Project not published: ${slug}` };

  const folderId = toStr_(r.folder_id);
  const images = (ENABLE_DRIVE_GALLERIES && folderId) ? listImagesFromFolder_(folderId) : [];

  return {
    slug,
    title: toStr_(pickLangField_(r, 'title', lang)),
    date: toStr_(r.date),
    category: toStr_(r.category),
    tags: toStr_(r.tags),
    description: toStr_(pickLangField_(r, 'description', lang)),
    folder_id: folderId,
    images, // [{id,url,name,mimeType}]
  };
}

function getServices_(params) {
  const lang = params.lang || 'en';
  const rows = getRowsAsObjects_(TABS.services);

  const items = rows
    .filter(r => (params.includeUnpublished ? true : isPublished_(r)))
    .map(r => ({
      id: toStr_(r.id),
      name: toStr_(pickLangField_(r, 'name', lang)),
      category_slug: toStr_(r.category_slug),
      bullets: toStr_(pickLangField_(r, 'bullets', lang))
        .split(';')
        .map(s => s.trim())
        .filter(Boolean),
      start_price: toStr_(r.start_price),
    }))
    .filter(x => x.id);

  return { items, count: items.length, lang };
}

function getCategories_(params) {
  const lang = params.lang || 'en';
  const rows = getRowsAsObjects_(TABS.categories);

  const items = rows
    .map(r => ({ slug: toStr_(r.slug), name: toStr_(pickLangField_(r, 'name', lang)) }))
    .filter(x => x.slug);

  return { items, count: items.length, lang };
}

function getTranslations_(params) {
  const lang = params.lang || 'en';
  const rows = getRowsAsObjects_(TABS.translations);

  const dict = {};
  rows.forEach(r => {
    const key = toStr_(r.key);
    if (!key) return;
    dict[key] = toStr_(pickLangField_(r, 'value', lang));
  });

  return { lang, strings: dict };
}

// ==== CONTACT: VERIFY FLOW ====
function createContactRequestWithVerification_(body) {
  const name = toStr_(body.name).trim();
  const email = toStr_(body.email).trim();
  const message = toStr_(body.message).trim();
  const lang = toStr_(body.lang || 'en').toLowerCase();
  const service_id = toStr_(body.service_id || '');
  const budget = toStr_(body.budget || '');

  if (!email || !message) return { ok: false, error: 'email and message are required' };

  const token = Utilities.getUuid().replace(/-/g, '');
  const createdAt = now_();
  const expiresAt = new Date(createdAt.getTime() + VERIFY_TOKEN_TTL_MIN * 60 * 1000);

  // Append to sheet
  const sh = getTab_(TABS.contact);

  // timestamp | name | email | message | lang | service_id | budget | verified | token | token_expires_at | verified_at
  sh.appendRow([createdAt, name, email, message, lang, service_id, budget, false, token, expiresAt, '']);

  // Send verification email to user
  sendVerificationEmail_(email, { name, lang, token, service_id });

  // IMPORTANT: do NOT notify you yet. Only after verification.
  return { ok: true };
}

function verifyEmail_(params) {
  const token = toStr_(params.token).trim();
  const lang = (params.lang || 'en').toLowerCase();
  if (!token) return html_(verifyPageHtml_(lang, false, 'Missing token.'));

  const rows = getRowsAsObjects_(TABS.contact);
  const match = rows.find(r => toStr_(r.token) === token);

  if (!match) return html_(verifyPageHtml_(lang, false, 'Token not found.'));

  const verified = String(match.verified).toLowerCase() === 'true';
  if (verified) return html_(verifyPageHtml_(lang, true, 'Already verified.'));

  const expiresAt = match.token_expires_at instanceof Date ? match.token_expires_at : new Date(match.token_expires_at);
  if (isNaN(expiresAt.getTime()) || now_().getTime() > expiresAt.getTime()) {
    return html_(verifyPageHtml_(lang, false, 'Verification link expired.'));
  }

  // Mark verified in sheet (rowNumber is 1-based)
  const sh = getTab_(TABS.contact);
  const row = match.__rowNumber;

  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(h => String(h).trim());
  const colVerified = headers.indexOf('verified') + 1;
  const colVerifiedAt = headers.indexOf('verified_at') + 1;

  if (colVerified < 1) throw new Error('contact_requests missing column: verified');
  sh.getRange(row, colVerified).setValue(true);

  if (colVerifiedAt > 0) sh.getRange(row, colVerifiedAt).setValue(now_());

  // Notify YOU now
  notifyOwnerVerifiedLead_(match);

  return html_(verifyPageHtml_(lang, true, 'Verified. Thank you.'));
}

function notifyOwnerVerifiedLead_(row) {
  if (!NOTIFY_EMAILS.length) return;

  const name = toStr_(row.name);
  const email = toStr_(row.email);
  const message = toStr_(row.message);
  const lang = toStr_(row.lang);
  const service_id = toStr_(row.service_id);
  const budget = toStr_(row.budget);
  const ts = row.timestamp;

  const subject = `Verified lead: ${service_id || 'general'} — ${email}`;
  const text =
    `Verified lead\n\n` +
    `Time: ${ts}\n` +
    `Name: ${name}\n` +
    `Email: ${email}\n` +
    `Lang: ${lang}\n` +
    `Service: ${service_id}\n` +
    `Budget: ${budget}\n\n` +
    `Message:\n${message}\n`;

  NOTIFY_EMAILS.forEach(addr => MailApp.sendEmail(addr, subject, text));
}

// ==== HTML EMAIL (MULTILINGUAL) ====
function sendVerificationEmail_(to, ctx) {
  const t = strings_(ctx.lang);

  const verifyUrl =
    ScriptApp.getService().getUrl() +
    `?entity=verify_email&token=${encodeURIComponent(ctx.token)}&lang=${encodeURIComponent(ctx.lang)}`;

  const subject = t.emailSubject;

  const htmlBody = `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background:#0b0b0c; padding:24px;">
    <div style="max-width:640px; margin:0 auto; background:#111114; border:1px solid rgba(255,255,255,0.08); border-radius:16px; overflow:hidden;">
      <div style="padding:22px 22px 10px;">
        <div style="color:#ffffff; font-size:18px; font-weight:700; letter-spacing:0.2px;">${escapeHtml_(t.headline)}</div>
        <div style="color:rgba(255,255,255,0.72); font-size:13px; margin-top:6px; line-height:1.45;">
          ${escapeHtml_(t.subline)}
        </div>

        <div style="margin-top:18px;">
          <a href="${verifyUrl}"
             style="display:inline-block; background:#ffffff; color:#0b0b0c; text-decoration:none; font-weight:700; padding:12px 16px; border-radius:12px;">
             ${escapeHtml_(t.button)}
          </a>
        </div>

        <div style="color:rgba(255,255,255,0.55); font-size:12px; margin-top:14px; line-height:1.45;">
          ${escapeHtml_(t.fallback)}<br/>
          <span style="word-break:break-all;">${verifyUrl}</span>
        </div>
      </div>

      <div style="padding:14px 22px 20px; border-top:1px solid rgba(255,255,255,0.08); color:rgba(255,255,255,0.55); font-size:12px; line-height:1.45;">
        ${escapeHtml_(t.footerLine1)}<br/>
        ${escapeHtml_(t.footerLine2)}
      </div>
    </div>
  </div>`;

  const plain =
    `${t.headline}\n\n` +
    `${t.subline}\n\n` +
    `${t.button}: ${verifyUrl}\n\n` +
    `${t.footerLine1}\n${t.footerLine2}\n`;

  MailApp.sendEmail({
    to,
    subject,
    body: plain,
    htmlBody,
  });
}

function verifyPageHtml_(lang, ok, msg) {
  const t = strings_(lang);
  const title = ok ? t.verifyOkTitle : t.verifyFailTitle;
  const detail = msg || (ok ? t.verifyOkText : t.verifyFailText);

  return `
  <!doctype html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml_(title)}</title>
  </head>
  <body style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif; background:#0b0b0c; color:#fff; display:flex; min-height:100vh; align-items:center; justify-content:center; padding:24px;">
    <div style="max-width:680px; width:100%; background:#111114; border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:22px;">
      <div style="font-size:18px; font-weight:800;">${escapeHtml_(title)}</div>
      <div style="margin-top:8px; color:rgba(255,255,255,0.72); line-height:1.5;">${escapeHtml_(detail)}</div>
      <div style="margin-top:18px;">
        <a href="${SITE_BASE_URL}" style="color:#0b0b0c; background:#fff; text-decoration:none; font-weight:700; padding:12px 16px; border-radius:12px; display:inline-block;">
          ${escapeHtml_(t.backToSite)}
        </a>
      </div>
    </div>
  </body>
  </html>`;
}

function strings_(lang) {
  // keep this tiny and fast; expand later
  const de = {
    emailSubject: 'Bitte Email bestaetigen',
    headline: 'Bitte bestaetige deine Email-Adresse',
    subline: 'Klicke den Button, damit ich deine Anfrage erhalte. Ohne Bestaetigung wird sie nicht zugestellt.',
    button: 'Email bestaetigen',
    fallback: 'Falls der Button nicht funktioniert, oeffne diesen Link:',
    footerLine1: 'Du hast diese Email erhalten, weil du das Kontaktformular genutzt hast.',
    footerLine2: 'Wenn du das nicht warst, kannst du diese Email ignorieren.',
    verifyOkTitle: 'Email bestaetigt',
    verifyOkText: 'Danke. Deine Anfrage ist jetzt bestaetigt und wird zugestellt.',
    verifyFailTitle: 'Bestaetigung fehlgeschlagen',
    verifyFailText: 'Der Link ist ungueltig oder abgelaufen.',
    backToSite: 'Zurueck zur Website',
  };

  const en = {
    emailSubject: 'Please verify your email',
    headline: 'Please verify your email address',
    subline: 'Click the button so I can receive your request. Without verification, it won’t be delivered.',
    button: 'Verify email',
    fallback: 'If the button doesn’t work, open this link:',
    footerLine1: 'You received this email because you used the contact form.',
    footerLine2: 'If this wasn’t you, you can ignore this email.',
    verifyOkTitle: 'Email verified',
    verifyOkText: 'Thanks. Your request is now verified and will be delivered.',
    verifyFailTitle: 'Verification failed',
    verifyFailText: 'This link is invalid or expired.',
    backToSite: 'Back to website',
  };

  return lang === 'de' ? de : en;
}

function escapeHtml_(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ==== DRIVE GALLERIES (FOLDER -> IMAGE URLS) ====
function listImagesFromFolder_(folderId) {
  const cache = CacheService.getScriptCache();
  const cacheKey = `folder_images_${folderId}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch (_) {}
  }

  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();
  const out = [];

  while (files.hasNext()) {
    const f = files.next();
    const mime = f.getMimeType();
    if (!mime || !mime.startsWith('image/')) continue;

    if (AUTO_SHARE_IMAGES_ANYONE_WITH_LINK) {
      // Needed so public image URLs actually render reliably
      try {
        f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (_) {
        // ignore if restricted; user will need to adjust permissions manually
      }
    }

    const id = f.getId();

    // Preferred fast URL (works when file is accessible with link):
    const url = `https://lh3.googleusercontent.com/d/${id}=w2000`;

    out.push({
      id,
      url,
      name: f.getName(),
      mimeType: mime,
    });
  }

  cache.put(cacheKey, JSON.stringify(out), FOLDER_CACHE_SECONDS);
  return out;
}
