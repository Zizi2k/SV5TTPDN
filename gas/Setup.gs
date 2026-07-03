/**
 * Khởi tạo Google Sheets và dữ liệu mẫu
 * Chạy hàm initializeSheets() một lần từ Apps Script Editor
 */

function initializeSheets() {
  const ss = SpreadsheetApp.create('CLB SV5T - Database');
  const ssId = ss.getId();
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', ssId);

  const folder = DriveApp.createFolder('CLB SV5T - Avatars');
  PropertiesService.getScriptProperties().setProperty('AVATAR_FOLDER_ID', folder.getId());

  const sheets = {
    Users: ['id', 'memberId', 'email', 'mssv', 'password', 'role', 'status', 'name', 'createdAt'],
    Members: ['id', 'userId', 'name', 'mssv', 'school', 'faculty', 'className', 'email', 'phone',
      'birthday', 'address', 'avatar', 'facebook', 'zalo', 'hobbies', 'skills', 'quote', 'reason',
      'bio', 'role', 'cohort', 'status', 'joinDate', 'totalScore', 'titles'],
    Activities: ['id', 'name', 'description', 'startDate', 'endDate', 'location', 'image', 'report', 'checkInCode', 'qrVisible', 'createdBy', 'createdAt'],
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

  const defaultSheet = ss.getSheets()[0];
  let first = true;

  Object.entries(sheets).forEach(([name, headers]) => {
    let sheet;
    if (first) {
      sheet = defaultSheet;
      sheet.setName(name);
      first = false;
    } else {
      sheet = ss.insertSheet(name);
    }
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#2563EB')
      .setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  });

  seedData(ss);

  Logger.log('Spreadsheet ID: ' + ssId);
  Logger.log('Avatar Folder ID: ' + folder.getId());
  Logger.log('URL: ' + ss.getUrl());
  return { spreadsheetId: ssId, avatarFolderId: folder.getId(), url: ss.getUrl() };
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

  appendRowToSheet(ss, 'Settings', { key: 'club_name', value: 'CLB Sinh viên 5 Tốt Thành phố Đồng Nai', description: 'Tên CLB' });
  appendRowToSheet(ss, 'Settings', { key: 'contact_email', value: 'clbsv5t.dongnai@gmail.com', description: 'Email liên hệ' });
  appendRowToSheet(ss, 'Settings', { key: 'club_logo', value: '', description: 'Logo CLB (URL Google Drive)' });

  const today = new Date();
  const fmt = d => Utilities.formatDate(d, 'Asia/Ho_Chi_Minh', 'yyyy-MM-dd');
  const d = offset => { const x = new Date(today); x.setDate(x.getDate() + offset); return fmt(x); };

  appendRowToSheet(ss, 'Activities', {
    id: 'A001', name: 'Mùa hè xanh', description: 'Chương trình tình nguyện mùa hè',
    startDate: d(-3), endDate: d(5), location: 'Huyện Cẩm Mỹ', image: '', report: '',
    createdBy: adminId, createdAt: formatDateTime(now())
  });
  appendRowToSheet(ss, 'Activities', {
    id: 'A002', name: 'Hiến máu nhân đạo', description: 'Ngày hội hiến máu tình nguyện',
    startDate: d(3), endDate: d(3), location: 'Trường ĐH Công nghệ', image: '', report: '',
    createdBy: adminId, createdAt: formatDateTime(now())
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
