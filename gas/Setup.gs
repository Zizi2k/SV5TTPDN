/**
 * Khởi tạo & nâng cấp Google Sheets
 *
 * - initializeSheets(): CHỈ chạy LẦN ĐẦU (tạo database mới + dữ liệu mẫu)
 * - upgradeSheets(): Cập nhật schema khi có tính năng mới — GIỮ NGUYÊN dữ liệu cũ
 * - ensureDatabaseSchema(): Tự chạy khi deploy code mới (gọi từ Code.gs)
 */

/** Tăng số này mỗi khi thêm cột/sheet mới trong bản cập nhật */
const DB_SCHEMA_VERSION = '3';

const SHEET_SCHEMA = {
  Users: ['id', 'memberId', 'email', 'mssv', 'password', 'role', 'status', 'name', 'createdAt'],
  Members: ['id', 'userId', 'name', 'mssv', 'school', 'faculty', 'className', 'email', 'phone',
    'birthday', 'address', 'avatar', 'facebook', 'zalo', 'hobbies', 'skills', 'quote', 'reason',
    'bio', 'role', 'cohort', 'status', 'joinDate', 'totalScore', 'titles'],
  Activities: ['id', 'name', 'description', 'startDate', 'endDate', 'location', 'image', 'report',
    'checkInCode', 'qrVisible', 'createdBy', 'createdAt'],
  ActivityParticipants: ['id', 'activityId', 'memberId', 'joinedAt'],
  Announcements: ['id', 'title', 'content', 'authorId', 'authorName', 'createdAt', 'pinned', 'important', 'hidden'],
  ExecutiveBoard: ['id', 'memberId', 'name', 'position', 'avatar', 'bio', 'email', 'phone', 'order'],
  Roles: ['id', 'name', 'permissions', 'description'],
  Attendance: ['id', 'activityId', 'memberId', 'checkedInAt', 'checkedInBy', 'method', 'proofImage'],
  Scores: ['id', 'memberId', 'activityName', 'score', 'date', 'addedBy'],
  Settings: ['key', 'value', 'description'],
  Sessions: ['token', 'userId', 'createdAt', 'expiresAt'],
  AuditLog: ['id', 'action', 'userId', 'details', 'timestamp']
};

const DEFAULT_SETTINGS = [
  { key: 'club_name', value: 'CLB Sinh viên 5 Tốt Thành phố Đồng Nai', description: 'Tên CLB' },
  { key: 'contact_email', value: 'clbsv5t.dongnai@gmail.com', description: 'Email liên hệ' },
  { key: 'club_logo', value: '', description: 'Logo CLB (URL Google Drive)' }
];

/**
 * Tự nâng cấp schema khi deploy code mới (chạy trước mỗi API request nếu cần).
 * Chỉ thực hiện khi DB_SCHEMA_VERSION thay đổi — không ảnh hưởng dữ liệu hiện có.
 */
function ensureDatabaseSchema() {
  const props = PropertiesService.getScriptProperties();
  const ssId = props.getProperty('SPREADSHEET_ID');
  if (!ssId) return { skipped: true, reason: 'Chưa cấu hình SPREADSHEET_ID' };

  const current = props.getProperty('DB_SCHEMA_VERSION') || '0';
  if (current === DB_SCHEMA_VERSION) return { skipped: true, reason: 'Schema đã cập nhật' };

  const report = upgradeSheets();
  props.setProperty('DB_SCHEMA_VERSION', DB_SCHEMA_VERSION);
  return report;
}

/**
 * Nâng cấp database hiện có: thêm sheet/cột thiếu, không xóa hay ghi đè dữ liệu.
 * Chạy thủ công từ Apps Script Editor sau mỗi lần cập nhật code backend.
 */
function upgradeSheets() {
  const ss = getSpreadsheet();
  const report = {
    sheetsCreated: [],
    columnsAdded: {},
    settingsAdded: [],
    activitiesBackfilled: 0
  };

  Object.entries(SHEET_SCHEMA).forEach(([name, headers]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      createSheetWithHeaders(ss, name, headers);
      report.sheetsCreated.push(name);
    } else {
      const added = addMissingColumnsToSheet(sheet, headers);
      if (added.length) report.columnsAdded[name] = added;
    }
  });

  report.settingsAdded = ensureDefaultSettings(ss);
  report.activitiesBackfilled = backfillActivityCheckInCodes();

  Logger.log('upgradeSheets: ' + JSON.stringify(report));
  return report;
}

/**
 * Tạo database MỚI — chỉ dùng lần đầu tiên.
 * Nếu đã có SPREADSHEET_ID sẽ báo lỗi để tránh mất liên kết dữ liệu cũ.
 */
function initializeSheets() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('SPREADSHEET_ID')) {
    throw new Error(
      'Đã có SPREADSHEET_ID. Không chạy initializeSheets() lần nữa — sẽ tạo database mới và mất dữ liệu cũ. ' +
      'Hãy chạy upgradeSheets() để cập nhật cột/sheet mới mà giữ nguyên dữ liệu.'
    );
  }

  const ss = SpreadsheetApp.create('CLB SV5T - Database');
  const ssId = ss.getId();
  props.setProperty('SPREADSHEET_ID', ssId);

  const folder = DriveApp.createFolder('CLB SV5T - Avatars');
  props.setProperty('AVATAR_FOLDER_ID', folder.getId());

  const defaultSheet = ss.getSheets()[0];
  let first = true;

  Object.entries(SHEET_SCHEMA).forEach(([name, headers]) => {
    if (first) {
      defaultSheet.setName(name);
      applyHeaderRow(defaultSheet, headers);
      first = false;
    } else {
      createSheetWithHeaders(ss, name, headers);
    }
  });

  seedData(ss);
  props.setProperty('DB_SCHEMA_VERSION', DB_SCHEMA_VERSION);

  Logger.log('Spreadsheet ID: ' + ssId);
  Logger.log('Avatar Folder ID: ' + folder.getId());
  Logger.log('URL: ' + ss.getUrl());
  return { spreadsheetId: ssId, avatarFolderId: folder.getId(), url: ss.getUrl() };
}

function createSheetWithHeaders(ss, name, headers) {
  const sheet = ss.insertSheet(name);
  applyHeaderRow(sheet, headers);
  return sheet;
}

function applyHeaderRow(sheet, headers) {
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#2563EB')
    .setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
}

function addMissingColumnsToSheet(sheet, requiredHeaders) {
  const lastCol = Math.max(sheet.getLastColumn(), 0);
  const existingHeaders = lastCol > 0
    ? sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(String)
    : [];

  if (lastCol === 0) {
    applyHeaderRow(sheet, requiredHeaders);
    return requiredHeaders;
  }

  const missing = requiredHeaders.filter(h => !existingHeaders.includes(h));
  if (missing.length === 0) return [];

  const startCol = lastCol + 1;
  missing.forEach((header, i) => {
    sheet.getRange(1, startCol + i).setValue(header);
  });
  sheet.getRange(1, startCol, 1, missing.length)
    .setFontWeight('bold')
    .setBackground('#2563EB')
    .setFontColor('#FFFFFF');

  return missing;
}

function ensureDefaultSettings(ss) {
  const sheet = ss.getSheetByName('Settings');
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  const existingKeys = data.length > 1 ? data.slice(1).map(r => String(r[0])) : [];
  const added = [];

  DEFAULT_SETTINGS.forEach(setting => {
    if (!existingKeys.includes(setting.key)) {
      appendRowToSheet(ss, 'Settings', setting);
      added.push(setting.key);
    }
  });

  return added;
}

function backfillActivityCheckInCodes() {
  let count = 0;
  const activities = getSheetData(SHEET_NAMES.ACTIVITIES);
  activities.forEach(a => {
    if (!a.checkInCode) {
      const code = Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase();
      updateRow(SHEET_NAMES.ACTIVITIES, a.id, { checkInCode: code });
      count++;
    }
  });
  return count;
}

function seedData(ss) {
  const adminId = 'U_ADMIN001';
  const adminMemberId = 'M_ADMIN001';
  const adminPw = hashPassword('admin123');

  appendRowToSheet(ss, 'Users', {
    id: adminId, memberId: adminMemberId, email: 'admin@sv5t.vn', mssv: 'admin',
    password: adminPw, role: 'admin', status: 'active', name: 'Quản trị viên',
    createdAt: formatDateTime(now())
  });

  appendRowToSheet(ss, 'Members', {
    id: adminMemberId, userId: adminId, name: 'Quản trị viên', mssv: 'admin',
    school: 'CLB SV5T', faculty: 'Ban Chủ nhiệm', className: '', email: 'admin@sv5t.vn',
    phone: '0900000000', birthday: '', address: 'Đồng Nai', avatar: '',
    facebook: '', zalo: '', hobbies: '', skills: 'Quản trị', quote: '',
    reason: '', bio: 'Quản trị viên hệ thống', role: 'Admin', cohort: '',
    status: 'active', joinDate: formatDate(now()), totalScore: 0, titles: ''
  });

  appendRowToSheet(ss, 'Roles', { id: 'R1', name: 'admin', permissions: 'all', description: 'Quản trị viên' });
  appendRowToSheet(ss, 'Roles', { id: 'R2', name: 'executive', permissions: 'manage', description: 'Ban Chủ nhiệm' });
  appendRowToSheet(ss, 'Roles', { id: 'R3', name: 'member', permissions: 'view', description: 'Thành viên' });

  DEFAULT_SETTINGS.forEach(s => appendRowToSheet(ss, 'Settings', s));

  const today = new Date();
  const fmt = d => Utilities.formatDate(d, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
  const d = offset => { const x = new Date(today); x.setDate(x.getDate() + offset); return fmt(x); };

  appendRowToSheet(ss, 'Activities', {
    id: 'A001', name: 'Mùa hè xanh', description: 'Chương trình tình nguyện mùa hè',
    startDate: d(-3), endDate: d(5), location: 'Huyện Cẩm Mỹ', image: '', report: '',
    checkInCode: Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase(),
    qrVisible: false, createdBy: adminId, createdAt: formatDateTime(now())
  });
  appendRowToSheet(ss, 'Activities', {
    id: 'A002', name: 'Hiến máu nhân đạo', description: 'Ngày hội hiến máu tình nguyện',
    startDate: d(3), endDate: d(3), location: 'Trường ĐH Công nghệ', image: '', report: '',
    checkInCode: Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase(),
    qrVisible: false, createdBy: adminId, createdAt: formatDateTime(now())
  });

  appendRowToSheet(ss, 'Announcements', {
    id: 'N001', title: 'Thông báo tuyển thành viên mới',
    content: 'CLB SV5T mở đợt tuyển thành viên mới. Hạn đăng ký: 30/09/2026.',
    authorId: adminId, authorName: 'Ban Chủ nhiệm', createdAt: formatDateTime(now()),
    pinned: true, important: true, hidden: false
  });

  appendRowToSheet(ss, 'ExecutiveBoard', {
    id: 'E001', memberId: adminMemberId, name: 'Nguyễn Văn Minh', position: 'Chủ nhiệm',
    avatar: '', bio: 'Sinh viên năm 4, đam mê hoạt động xã hội.',
    email: 'minh@sv5t.vn', phone: '0901111111', order: 1
  });
}

function appendRowToSheet(ss, sheetName, obj) {
  const sheet = ss.getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = headers.map(h => obj[h] !== undefined ? obj[h] : '');
  sheet.appendRow(row);
}
