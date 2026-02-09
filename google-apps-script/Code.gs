/**
 * PHDesign CMS API (Sheets -> JSON)
 * Resources:
 *  - GET  ?resource=projects|services|categories|all
 *  - POST /exec   (contact lead submission)
 *
 * Notes:
 * - Vercel/Astro build-time fetch must use: fetch(url, { redirect: "follow" })
 * - "isPublished" is respected when present.
 */

const CONFIG = {
  SHEET_NAMES: {
    projects: 'projects',
    services: 'services',
    categories: 'categories',
    leads: 'leads',
  },
  CACHE_SECONDS: 120, // small cache to reduce quota + speed up builds
  // Optional: set in Script Properties instead of hardcoding.
  // Vercel deploy hook should be set as Script Property: VERCEL_DEPLOY_HOOK
};

function doGet(e) {
  const resource = (e && e.parameter && e.parameter.resource) ? String(e.parameter.resource) : 'projects';

  if (resource === 'all') {
    const payload = {
      projects: getResourceData_('projects'),
      services: getResourceData_('services'),
      categories: getResourceData_('categories'),
      // You typically do NOT expose leads.
    };
    return json_(payload);
  }

  if (!['projects', 'services', 'categories'].includes(resource)) {
    return json_({ error: 'Invalid resource', resource }, 400);
  }

  const data = getResourceData_(resource);
  return json_(data);
}

function doPost(e) {
  // Contact submissions -> append to leads sheet + send emails
  try {
    const body = e && e.postData && e.postData.contents ? e.postData.contents : '';
    const data = body ? JSON.parse(body) : {};

    // Minimal validation
    const name = safeStr_(data.name, 120);
    const email = safeStr_(data.email, 160);
    const message = safeStr_(data.message, 4000);
    const lang = safeStr_(data.lang, 5) || 'de';
    const service_id = safeStr_(data.service_id, 80);
    const budget = safeStr_(data.budget, 80);

    if (!name || !email || !message) {
      return json_({ ok: false, error: 'Missing required fields: name, email, message' }, 400);
    }
    if (!isEmail_(email)) {
      return json_({ ok: false, error: 'Invalid email' }, 400);
    }

    appendLead_({
      timestamp: new Date(),
      name,
      email,
      message,
      lang,
      service_id,
      budget,
      verified: false,
      token: '',
      token_expires_at: '',
      verified_at: ''
    });

    // Notify you (owner)
    sendOwnerNotificationEmail_({ name, email, message, lang, service_id, budget });

    // Optional: send user confirmation
    sendUserConfirmationEmail_({ name, email, lang });

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) }, 500);
  }
}

/** Vercel deploy hook trigger (call manually or via installable trigger) */
function triggerBuild() {
  const hook = getScriptProperty_('VERCEL_DEPLOY_HOOK');
  if (!hook) throw new Error('Missing Script Property: VERCEL_DEPLOY_HOOK');
  UrlFetchApp.fetch(hook, { method: 'post', muteHttpExceptions: true });
}

/** Only rebuild when relevant sheets change (installable On edit trigger) */
function onEdit(e) {
  try {
    const sheetName = e && e.range && e.range.getSheet ? e.range.getSheet().getName() : '';
    const rebuildSheets = ['projects', 'services', 'categories'];
    if (rebuildSheets.includes(sheetName)) triggerBuild();
  } catch (err) {
    // swallow to avoid failing edits
  }
}

// ----------------------- Helpers -----------------------

function getResourceData_(resource) {
  const cacheKey = 'phd_' + resource;
  const cache = CacheService.getScriptCache();
  const cached = cache.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES[resource] || resource);
  if (!sheet) throw new Error('Missing sheet: ' + resource);

  const values = sheet.getDataRange().getValues();
  if (!values || values.length < 2) return [];

  const headers = values[0].map(h => String(h).trim());
  const rows = values.slice(1);

  const objects = rows
    .filter(r => r.some(cell => cell !== '' && cell !== null)) // ignore empty rows
    .map(row => {
      const obj = {};
      headers.forEach((key, idx) => obj[key] = row[idx]);
      // Normalize booleans from checkboxes
      if (typeof obj.isPublished !== 'undefined') obj.isPublished = Boolean(obj.isPublished);
      return obj;
    });

  const published = (headers.includes('isPublished'))
    ? objects.filter(o => o.isPublished === true)
    : objects;

  cache.put(cacheKey, JSON.stringify(published), CONFIG.CACHE_SECONDS);
  return published;
}

function appendLead_(lead) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAMES.leads);
  if (!sheet) throw new Error('Missing sheet: leads');

  // Ensure header row exists
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
  if (!headers || headers.filter(Boolean).length === 0) {
    sheet.getRange(1, 1, 1, 11).setValues([[
      'timestamp','name','email','message','lang','service_id','budget','verified','token','token_expires_at','verified_at'
    ]]);
  }

  sheet.appendRow([
    lead.timestamp,
    lead.name,
    lead.email,
    lead.message,
    lead.lang,
    lead.service_id,
    lead.budget,
    lead.verified,
    lead.token,
    lead.token_expires_at,
    lead.verified_at
  ]);
}

function sendOwnerNotificationEmail_(data) {
  const ownerEmail = Session.getActiveUser().getEmail(); // you
  const subject = `[PHDesign] New inquiry (${data.lang})`;
  const html = renderHtml_('OwnerNotification', data);
  GmailApp.sendEmail(ownerEmail, subject, stripHtml_(html), { htmlBody: html });
}

function sendUserConfirmationEmail_(data) {
  const subjectByLang = {
    de: 'Danke für deine Anfrage',
    en: 'Thanks for your inquiry',
    fr: 'Merci pour votre demande',
    it: 'Grazie per la tua richiesta',
  };
  const subject = subjectByLang[data.lang] || subjectByLang.de;
  const html = renderHtml_('UserConfirmation', data);
  GmailApp.sendEmail(data.email, subject, stripHtml_(html), { htmlBody: html });
}

function renderHtml_(templateName, data) {
  const t = HtmlService.createTemplateFromFile(templateName);
  Object.keys(data || {}).forEach(k => t[k] = data[k]);
  return t.evaluate().getContent();
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function json_(obj, statusCode) {
  // Apps Script ContentService does not consistently support custom headers everywhere.
  // Build-time fetch from Vercel/Astro does not need CORS headers.
  // If browser POST hits CORS issues, proxy via Vercel Function later.
  const out = ContentService.createTextOutput(JSON.stringify(obj));
  out.setMimeType(ContentService.MimeType.JSON);
  return out;
}

function safeStr_(v, maxLen) {
  const s = (v === null || typeof v === 'undefined') ? '' : String(v).trim();
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function isEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function stripHtml_(html) {
  return String(html).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function getScriptProperty_(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}
