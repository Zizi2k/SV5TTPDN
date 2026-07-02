/**
 * Tiện ích dùng chung cho GAS Backend
 */

const SHEET_NAMES = {
  USERS: 'Users',
  MEMBERS: 'Members',
  ACTIVITIES: 'Activities',
  ACTIVITY_PARTICIPANTS: 'ActivityParticipants',
  ANNOUNCEMENTS: 'Announcements',
  EXECUTIVE_BOARD: 'ExecutiveBoard',
  ROLES: 'Roles',
  ATTENDANCE: 'Attendance',
  SCORES: 'Scores',
  SETTINGS: 'Settings',
  SESSIONS: 'Sessions',
  AUDIT_LOG: 'AuditLog'
};

function getSpreadsheet() {
  const ssId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!ssId) throw new Error('Chưa cấu hình SPREADSHEET_ID. Chạy initializeSheets() trước.');
  return SpreadsheetApp.openById(ssId);
}

function getSheet(name) {
  const sheet = getSpreadsheet().getSheetByName(name);
  if (!sheet) throw new Error('Sheet không tồn tại: ' + name);
  return sheet;
}

function getSheetData(sheetName) {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] !== '' ? row[i] : ''; });
    return obj;
  });
}

function findRowById(sheetName, id, idCol = 'id') {
  const sheet = getSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIndex = headers.indexOf(idCol);
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idIndex]) === String(id)) {
      return { sheet, row: i + 1, headers, data: data[i] };
    }
  }
  return null;
}

function generateId(prefix) {
  return prefix + '_' + Utilities.getUuid().substring(0, 8).toUpperCase();
}

function hashPassword(password) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password);
  return digest.map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
}

function generateToken() {
  return Utilities.getUuid() + '-' + Date.now();
}

function formatDate(date) {
  if (!date) return '';
  if (date instanceof Date) {
    return Utilities.formatDate(date, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
  }
  return String(date);
}

function formatDateTime(date) {
  if (!date) return '';
  if (date instanceof Date) {
    return Utilities.formatDate(date, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd HH:mm:ss');
  }
  return String(date);
}

function now() {
  return new Date();
}

function rowToObject(headers, row) {
  const obj = {};
  headers.forEach((h, i) => { obj[h] = row[i] !== '' ? row[i] : ''; });
  return obj;
}

function appendRow(sheetName, obj) {
  const sheet = getSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => obj[h] !== undefined ? obj[h] : '');
  sheet.appendRow(row);
  return obj;
}

function updateRow(sheetName, id, updates, idCol = 'id') {
  const found = findRowById(sheetName, id, idCol);
  if (!found) throw new Error('Không tìm thấy bản ghi: ' + id);
  found.headers.forEach((h, i) => {
    if (updates[h] !== undefined) {
      found.sheet.getRange(found.row, i + 1).setValue(updates[h]);
    }
  });
}

function deleteRow(sheetName, id, idCol = 'id') {
  const found = findRowById(sheetName, id, idCol);
  if (!found) throw new Error('Không tìm thấy bản ghi: ' + id);
  found.sheet.deleteRow(found.row);
}

function logAudit(action, details, token) {
  try {
    let userId = 'system';
    if (token) {
      const session = getSheetData(SHEET_NAMES.SESSIONS).find(s => s.token === token);
      if (session) userId = session.userId;
    }
    appendRow(SHEET_NAMES.AUDIT_LOG, {
      id: generateId('LOG'),
      action: action,
      userId: userId,
      details: details,
      timestamp: formatDateTime(now())
    });
  } catch (e) {
    console.error('Audit log error:', e);
  }
}

function uploadAvatar(base64, filename, user) {
  if (!base64) throw new Error('Không có dữ liệu ảnh');
  const folderId = PropertiesService.getScriptProperties().getProperty('AVATAR_FOLDER_ID');
  if (!folderId) throw new Error('Chưa cấu hình AVATAR_FOLDER_ID');

  const blob = Utilities.newBlob(Utilities.base64Decode(base64), 'image/jpeg', filename || 'avatar.jpg');
  const folder = DriveApp.getFolderById(folderId);

  const memberId = user.memberId || user.id;
  const existing = getSheetData(SHEET_NAMES.MEMBERS).find(m => m.id === memberId);
  if (existing && existing.avatar) {
    try {
      const oldFile = DriveApp.getFileById(existing.avatar);
      oldFile.setTrashed(true);
    } catch (e) { /* ignore */ }
  }

  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const url = 'https://drive.google.com/uc?id=' + file.getId();

  updateRow(SHEET_NAMES.MEMBERS, memberId, { avatar: url });
  logAudit('UPLOAD_AVATAR', memberId, null);
  return { url };
}

function getSettings() {
  const data = getSheetData(SHEET_NAMES.SETTINGS);
  const settings = {};
  data.forEach(row => { settings[row.key] = row.value; });
  return settings;
}

function getDashboard() {
  const members = getSheetData(SHEET_NAMES.MEMBERS);
  const users = getSheetData(SHEET_NAMES.USERS);
  const activities = getSheetData(SHEET_NAMES.ACTIVITIES);
  const announcements = getSheetData(SHEET_NAMES.ANNOUNCEMENTS);

  return {
    totalMembers: members.filter(m => m.status === 'active').length,
    pendingMembers: users.filter(u => u.status === 'pending').length,
    totalActivities: activities.length,
    totalAnnouncements: announcements.filter(a => a.hidden !== true && a.hidden !== 'TRUE').length,
    activeMembers: members.filter(m => m.status === 'active').length
  };
}

function getAuditLog() {
  const logs = getSheetData(SHEET_NAMES.AUDIT_LOG);
  const users = getSheetData(SHEET_NAMES.USERS);
  return logs.slice(-50).reverse().map(log => {
    const user = users.find(u => u.id === log.userId);
    return {
      action: log.action,
      user: user ? user.name : log.userId,
      details: log.details,
      timestamp: log.timestamp
    };
  });
}
