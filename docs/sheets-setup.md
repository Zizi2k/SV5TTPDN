# Hướng dẫn cấu hình Google Sheets

## Tự động — lần đầu tiên

Chạy hàm `initializeSheets()` trong Google Apps Script Editor **một lần duy nhất**. Hàm này sẽ:

1. Tạo Spreadsheet mới với tất cả sheet và cột
2. Tạo thư mục Google Drive cho ảnh đại diện
3. Lưu ID vào Script Properties
4. Thêm dữ liệu mẫu (admin, hoạt động, thông báo)

> **Cảnh báo:** Nếu đã có `SPREADSHEET_ID` trong Script Properties, **không chạy lại** `initializeSheets()` — sẽ tạo database mới và mất liên kết dữ liệu cũ.

## Cập nhật tính năng mới — giữ nguyên dữ liệu cũ

Khi deploy code backend mới (thêm cột QR, điểm danh, logo CLB, v.v.):

### Cách 1: Tự động (khuyến nghị)

1. Copy code GAS mới vào Apps Script Editor
2. **Deploy** lại Web App (Manage deployments → Edit → New version → Deploy)
3. Gọi bất kỳ API nào (đăng nhập, mở trang web) — hệ thống **tự nâng cấp schema** nếu cần

Hệ thống chỉ thêm sheet/cột thiếu, **không xóa hay ghi đè** dữ liệu hiện có.

### Cách 2: Chạy thủ công

Trong Apps Script Editor, chọn hàm `upgradeSheets()` → **Run**.

Kết quả ghi vào log:
- `sheetsCreated`: sheet mới được tạo
- `columnsAdded`: cột mới được thêm vào sheet nào
- `settingsAdded`: cài đặt mặc định mới (chỉ thêm nếu chưa có)
- `activitiesBackfilled`: hoạt động cũ được bổ sung mã QR check-in

### Quy trình cập nhật an toàn

```
1. Sao lưu Google Sheets (File → Make a copy)
2. Copy code .gs mới vào Apps Script
3. Deploy Web App phiên bản mới
4. Mở website → hệ thống tự migrate (hoặc chạy upgradeSheets())
5. Kiểm tra dữ liệu cũ vẫn còn nguyên
```

**Frontend (GitHub Pages)** cập nhật riêng — không ảnh hưởng dữ liệu trong Google Sheets.

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
| checkInCode | Mã QR điểm danh (tự sinh) |
| qrVisible | TRUE/FALSE — hiển thị QR cho thành viên |
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
| method | qr / manual / proof |
| proofImage | URL ảnh minh chứng (Google Drive) |

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
