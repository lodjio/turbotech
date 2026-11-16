/**
 * Logio · Saudia Hajj & Umrah demo — access-code sheet backend (Google Apps Script).
 *
 * Paste this into the access-code spreadsheet: Extensions → Apps Script → replace Code.gs.
 * Then: Project Settings → Script properties → add LOGIO_TOKEN (same value as the
 * HU_SHEET_TOKEN secret on Cloudflare Pages). Deploy → New deployment → Web app,
 * Execute as: Me, Who has access: Anyone. Copy the /exec URL into the Cloudflare Pages
 * secret HU_SHEET_URL.
 *
 * The Cloudflare function (functions/hajj-umrah/…) is the only caller. It POSTs JSON:
 *   { token, action: "unlock" | "view", code, ip, city, country, device, browser }
 *
 * "Codes" tab columns: Code | Name | Login count | Last login | Page views | Last seen | Active
 * One tab per person (named after the Name column), created automatically:
 *   Visit # | Date & time (Riyadh) | Event | IP address | City | Country | Device | Browser
 * Set Active to "No" to switch a code off.
 */

const CODES_TAB = 'Codes';
const LOG_HEADER = ['Visit #', 'Date & time (Riyadh)', 'Event', 'IP address', 'City', 'Country', 'Device', 'Browser'];
const COL = { code: 0, name: 1, logins: 2, lastLogin: 3, views: 4, lastSeen: 5, active: 6 };

function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad_request' }); }

  const token = PropertiesService.getScriptProperties().getProperty('LOGIO_TOKEN');
  if (!token || req.token !== token) return json_({ ok: false, error: 'forbidden' });

  const code = String(req.code || '').trim();
  if (!/^\d{4}$/.test(code)) return json_({ ok: false });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CODES_TAB);
    const rows = sheet.getDataRange().getValues();
    let r = -1;
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][COL.code]).trim() === code) { r = i; break; }
    }
    if (r === -1) return json_({ ok: false });
    const row = rows[r];
    const active = String(row[COL.active] || 'Yes').trim().toLowerCase();
    if (active === 'no' || active === 'false') return json_({ ok: false, revoked: true });

    const name = String(row[COL.name] || 'Guest').trim() || 'Guest';
    const now = new Date();
    const isLogin = req.action === 'unlock';

    // Counters on the Codes tab
    if (isLogin) {
      sheet.getRange(r + 1, COL.logins + 1).setValue((Number(row[COL.logins]) || 0) + 1);
      sheet.getRange(r + 1, COL.lastLogin + 1).setValue(now);
    } else {
      sheet.getRange(r + 1, COL.views + 1).setValue((Number(row[COL.views]) || 0) + 1);
    }
    sheet.getRange(r + 1, COL.lastSeen + 1).setValue(now);
    if (!row[COL.active]) sheet.getRange(r + 1, COL.active + 1).setValue('Yes');

    // Per-person log tab
    const log = personTab_(ss, name);
    const visitNo = Math.max(log.getLastRow(), 1); // header is row 1
    log.appendRow([
      visitNo,
      Utilities.formatDate(now, 'Asia/Riyadh', 'yyyy-MM-dd HH:mm:ss'),
      isLogin ? 'Login' : 'Page view',
      String(req.ip || ''), String(req.city || ''), String(req.country || ''),
      String(req.device || ''), String(req.browser || '')
    ]);

    return json_({ ok: true, name: name });
  } finally {
    lock.releaseLock();
  }
}

/** Also create tabs for every code as soon as it is typed into the sheet. */
function onEdit(e) {
  const sh = e && e.range && e.range.getSheet();
  if (!sh || sh.getName() !== CODES_TAB || e.range.getRow() < 2) return;
  const name = String(sh.getRange(e.range.getRow(), COL.name + 1).getValue() || '').trim();
  if (name) personTab_(e.source, name);
}

function personTab_(ss, name) {
  const title = name.replace(/[\[\]\*\?\/\\:]/g, ' ').slice(0, 90);
  let tab = ss.getSheetByName(title);
  if (!tab) {
    tab = ss.insertSheet(title);
    tab.appendRow(LOG_HEADER);
    tab.getRange(1, 1, 1, LOG_HEADER.length).setFontWeight('bold');
    tab.setFrozenRows(1);
  }
  return tab;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
