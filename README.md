# CLB SV5T Thành phố Đồng Nai

Hệ thống quản lý thành viên và hoạt động cho CLB Sinh viên 5 Tốt Thành phố Đồng Nai.

## Kiến trúc

```
Người dùng → GitHub Pages (SPA) → Google Apps Script (API) → Google Sheets + Google Drive
```

| Thành phần | Công nghệ |
|---|---|
| Frontend | HTML, CSS, Bootstrap 5, JavaScript (SPA) |
| Backend | Google Apps Script (REST API) |
| Database | Google Sheets |
| Lưu trữ ảnh | Google Drive |

## Tính năng

- Đăng nhập / Đăng ký thành viên (chờ duyệt)
- Trang chủ với hoạt động nổi bật, tin mới, thành viên tiêu biểu
- Danh sách thành viên (tìm kiếm, lọc theo trường/khoa/khóa/vai trò)
- Hồ sơ cá nhân từng thành viên
- Ban Chủ nhiệm (sơ đồ tổ chức)
- Hoạt động (đang diễn ra / sắp diễn ra / đã kết thúc)
- Thông báo (ghim, đánh dấu quan trọng)
- Điểm hoạt động
- Quản lý (Ban Chủ nhiệm) và Quản trị (Admin)
- Điểm danh QR, xuất Excel, nhật ký audit log

## Demo nhanh (không cần backend)

Mở `index.html` trực tiếp hoặc chạy local server. Hệ thống tự dùng dữ liệu demo khi chưa cấu hình API.

**Tài khoản demo:**
- Admin: `admin` / `admin123`
- Thành viên: `member` / `member123`

## Hướng dẫn triển khai

### Bước 1: Google Apps Script (Backend)

1. Truy cập [script.google.com](https://script.google.com) → **Dự án mới**
2. Copy toàn bộ file trong thư mục `gas/` vào project (tạo file `.gs` tương ứng)
3. Chạy hàm `initializeSheets()` từ Editor (chọn hàm → Run)
   - Lần đầu cần cấp quyền Google Drive và Sheets
   - Ghi lại **Spreadsheet ID** và **Avatar Folder ID** từ log
4. **Triển khai** → **Triển khai mới** → Loại: **Ứng dụng web**
   - Thực thi với tư cách: **Tôi**
   - Ai có quyền truy cập: **Bất kỳ ai**
5. Copy **URL Web App** (dạng `https://script.google.com/macros/s/.../exec`)

### Bước 2: Cấu hình Frontend

Mở `config.js` và thay URL:

```javascript
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec',
  // ...
};
```

### Bước 3: GitHub Pages

1. Push code lên GitHub repository
2. Vào **Settings** → **Pages**
3. Source: **Deploy from branch** → chọn `main` / thư mục gốc `/`
4. Truy cập: `https://<username>.github.io/<repo>/`

### Bước 4: Tài khoản Admin mặc định

Sau khi chạy `initializeSheets()`:

| Email | Mật khẩu | Vai trò |
|---|---|---|
| admin@sv5t.vn | admin123 | Admin |

## Cấu trúc Google Sheets

| Sheet | Mục đích |
|---|---|
| Users | Tài khoản đăng nhập |
| Members | Thông tin thành viên |
| Activities | Hoạt động |
| ActivityParticipants | Thành viên tham gia hoạt động |
| Announcements | Thông báo |
| ExecutiveBoard | Ban Chủ nhiệm |
| Roles | Phân quyền |
| Attendance | Điểm danh |
| Scores | Điểm hoạt động |
| Settings | Cấu hình hệ thống |
| Sessions | Phiên đăng nhập |
| AuditLog | Nhật ký hoạt động |

Chi tiết cột xem tại `docs/sheets-setup.md`.

## Cấu trúc thư mục

```
├── index.html              # SPA shell
├── config.js               # Cấu hình API URL
├── assets/
│   ├── css/main.css        # Giao diện tùy chỉnh
│   ├── img/logo.svg        # Logo CLB
│   └── js/
│       ├── api.js          # API client + demo data
│       ├── auth.js         # Xác thực
│       ├── router.js       # Hash router
│       ├── utils.js        # Tiện ích
│       ├── app.js          # Khởi tạo
│       └── pages/          # Các trang SPA
├── gas/                    # Google Apps Script backend
│   ├── Code.gs
│   ├── Auth.gs
│   ├── Members.gs
│   ├── Activities.gs
│   ├── Announcements.gs
│   ├── Utils.gs
│   └── Setup.gs
└── docs/
    └── sheets-setup.md
```

## Phân quyền

| Vai trò | Quyền |
|---|---|
| Admin | Toàn quyền: thành viên, hoạt động, thông báo, cài đặt, audit log |
| Ban Chủ nhiệm | Duyệt thành viên, quản lý hoạt động/thông báo, cộng điểm, điểm danh |
| Thành viên | Xem thông tin, hồ sơ cá nhân, tham gia hoạt động |
| Khách | Chỉ xem thông tin công khai |

## Giao diện

- Màu chủ đạo: xanh dương `#2563EB`, vàng `#FACC15`, trắng
- Bootstrap 5, responsive (mobile/tablet/desktop)
- Card layout, bo góc, đổ bóng nhẹ, hiệu ứng chuyển trang

## Phát triển local

```bash
# Python
python -m http.server 8080

# Node.js
npx serve .
```

Truy cập `http://localhost:8080`

## License

Dự án phục vụ CLB Sinh viên 5 Tốt Thành phố Đồng Nai.
