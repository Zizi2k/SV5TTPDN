# Hướng dẫn cấu hình Google Sheets

## Tự động (khuyến nghị)

Chạy hàm `initializeSheets()` trong Google Apps Script Editor. Hàm này sẽ:

1. Tạo Spreadsheet mới với tất cả sheet và cột
2. Tạo thư mục Google Drive cho ảnh đại diện
3. Lưu ID vào Script Properties
4. Thêm dữ liệu mẫu (admin, hoạt động, thông báo)

## Thủ công

Nếu muốn dùng Spreadsheet có sẵn, tạo các sheet với cột sau:

### Users

| Cột | Kiểu | Mô tả |
|---|---|---|
| id | Text | Mã user (U_xxx) |
| memberId | Text | Liên kết Members |
| email | Text | Email đăng nhập |
| mssv | Text | MSSV đăng nhập |
| password | Text | Mật khẩu (SHA-256 hash) |
| role | Text | admin / executive / member |
| status | Text | pending / active / locked |
| name | Text | Họ tên |
| createdAt | DateTime | Ngày tạo |

### Members

| Cột | Mô tả |
|---|---|
| id | Mã thành viên (M_xxx) |
| userId | Liên kết Users |
| name, mssv, school, faculty, className | Thông tin học tập |
| email, phone, birthday, address | Liên hệ |
| avatar | URL ảnh (Google Drive) |
| facebook, zalo | Mạng xã hội |
| hobbies, skills, quote, reason, bio | Giới thiệu |
| role | Vai trò hiển thị (Ủy viên, Thành viên...) |
| cohort | Khóa |
| status | pending / active / locked |
| joinDate | Ngày tham gia |
| totalScore | Tổng điểm |
| titles | Danh hiệu |

### Activities

| Cột | Mô tả |
|---|---|
| id | Mã hoạt động (A_xxx) |
| name | Tên hoạt động |
| description | Mô tả |
| startDate, endDate | Thời gian |
| location | Địa điểm |
| image | URL hình ảnh |
| report | Báo cáo (sau khi kết thúc) |
| createdBy | User ID người tạo |
| createdAt | Ngày tạo |

### ActivityParticipants

| Cột | Mô tả |
|---|---|
| id | Mã (P_xxx) |
| activityId | Mã hoạt động |
| memberId | Mã thành viên |
| joinedAt | Thời gian đăng ký |

### Announcements

| Cột | Mô tả |
|---|---|
| id | Mã (N_xxx) |
| title, content | Nội dung |
| authorId, authorName | Người đăng |
| createdAt | Thời gian |
| pinned | TRUE/FALSE - Ghim |
| important | TRUE/FALSE - Quan trọng |
| hidden | TRUE/FALSE - Ẩn |

### ExecutiveBoard

| Cột | Mô tả |
|---|---|
| id | Mã (E_xxx) |
| memberId | Liên kết thành viên |
| name, position | Tên và chức vụ |
| avatar, bio | Ảnh và giới thiệu |
| email, phone | Liên hệ |
| order | Thứ tự hiển thị |

### Roles

| Cột | Mô tả |
|---|---|
| id | Mã vai trò |
| name | Tên (admin, executive, member) |
| permissions | Quyền (all, manage, view) |
| description | Mô tả |

### Attendance

| Cột | Mô tả |
|---|---|
| id | Mã (AT_xxx) |
| activityId | Hoạt động |
| memberId | Thành viên |
| checkedInAt | Thời gian điểm danh |
| checkedInBy | Người điểm danh |

### Scores

| Cột | Mô tả |
|---|---|
| id | Mã (S_xxx) |
| memberId | Thành viên |
| activityName | Tên hoạt động |
| score | Điểm |
| date | Ngày cộng |
| addedBy | Người cộng điểm |

### Settings

| Cột | Mô tả |
|---|---|
| key | Khóa cấu hình |
| value | Giá trị |
| description | Mô tả |

### Sessions

| Cột | Mô tả |
|---|---|
| token | Token phiên |
| userId | User ID |
| createdAt | Tạo lúc |
| expiresAt | Hết hạn |

### AuditLog

| Cột | Mô tả |
|---|---|
| id | Mã log |
| action | Hành động |
| userId | Người thực hiện |
| details | Chi tiết |
| timestamp | Thời gian |

## Script Properties

Sau khi setup, cần 2 property trong Apps Script (Project Settings → Script Properties):

| Key | Giá trị |
|---|---|
| SPREADSHEET_ID | ID của Google Spreadsheet |
| AVATAR_FOLDER_ID | ID thư mục Google Drive chứa ảnh |

## Lưu ý bảo mật

- Mật khẩu được hash SHA-256 trước khi lưu
- Token phiên có thời hạn 7 ngày
- Web App phải deploy với quyền "Bất kỳ ai" để frontend gọi được
- Không chia sẻ link Spreadsheet công khai
