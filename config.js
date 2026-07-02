/**
 * Cấu hình hệ thống CLB SV5T
 * Thay API_URL bằng URL Web App sau khi deploy Google Apps Script
 */
const CONFIG = {
  APP_VERSION: '2.2.2',
  API_URL: 'https://script.google.com/macros/s/AKfycbwWXhD7yrVWRgoGyX2XGJWxe_3T0xUUdyU0U4lQfypgPyt-Nu6IZt17NsgerMDByN7Zhw/exec',
  CLUB_NAME: 'CLB Sinh viên 5 Tốt Thành phố Đồng Nai',
  CLUB_SHORT: 'CLB SV5T Đồng Nai',
  COLORS: {
    primary: '#2563EB',
    accent: '#FACC15',
    white: '#FFFFFF'
  },
  ROLES: {
    admin: 'Admin',
    executive: 'Ban Chủ nhiệm',
    member: 'Thành viên',
    guest: 'Khách'
  },
  MEMBER_STATUS: {
    pending: 'Chờ duyệt',
    active: 'Đã kích hoạt',
    locked: 'Đã khóa'
  },
  ACTIVITY_STATUS: {
    ongoing: 'Đang diễn ra',
    upcoming: 'Sắp diễn ra',
    completed: 'Đã kết thúc'
  }
};
