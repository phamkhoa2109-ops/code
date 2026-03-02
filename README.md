# FB Group Lead Scanner (Chrome Extension)

Công cụ hỗ trợ quét bài viết trong Facebook Groups theo tổ hợp từ khóa để tìm khách hàng tiềm năng cho sản phẩm loa/tai nghe Bluetooth.

## 1) Vì sao chọn Chrome Extension thay vì Python headless?

- Python headless (Selenium/Playwright) linh hoạt và chạy server 24/7, nhưng rủi ro checkpoint/khóa tài khoản cao hơn khi Facebook phát hiện hành vi automation bất thường.
- Extension chạy trong trình duyệt thật, phiên đăng nhập thật của bạn nên “tự nhiên” hơn; phù hợp mục tiêu giảm rủi ro cho tài khoản cá nhân.

Chi tiết phân tích: xem `docs/architecture.md`.

---

## 2) Tính năng đã có

- Quản lý danh sách URL Group.
- Bộ lọc tổ hợp từ khóa (AND theo từng dòng, OR giữa các dòng).
  - Ví dụ:
    - `cần mua|loa bluetooth`
    - `tư vấn|tai nghe`
    - `tầm giá|loa`
- Tự động trích xuất:
  - Nội dung bài viết.
  - Tên người đăng.
  - URL trực tiếp bài viết.
- Lưu kết quả vào danh sách lead trong extension popup.
- Tuỳ chọn gửi thông báo Telegram khi có lead mới.
- Quét định kỳ bằng background service worker + alarms.
- Có cơ chế cuộn trang (infinite scroll/lazy loading) trước khi lọc.

---

## 3) Cài đặt nhanh (cho người không rành code)

### Bước 1: Chuẩn bị
- Cài Google Chrome (hoặc Edge Chromium).
- Đăng nhập Facebook trên trình duyệt này.

### Bước 2: Nạp extension
1. Mở `chrome://extensions`.
2. Bật **Developer mode** (góc phải).
3. Chọn **Load unpacked**.
4. Trỏ vào thư mục `extension` trong project này.

### Bước 3: Cấu hình
1. Bấm icon extension → **Cài đặt**.
2. Điền:
   - Danh sách URL group (mỗi dòng 1 link).
   - Tổ hợp từ khóa (mỗi dòng dạng `từ 1|từ 2|...`).
   - Chu kỳ quét (phút), số group mỗi chu kỳ, số lần cuộn.
3. (Tuỳ chọn) Điền Telegram bot token + chat id.
4. Bấm **Lưu cấu hình**.

### Bước 4: Chạy thử
1. Mở popup extension.
2. Bấm **Quét ngay**.
3. Xem danh sách lead mới trong popup.

---

## 4) Cách hệ thống lọc từ khóa

- Mỗi dòng là một **tổ hợp bắt buộc đồng thời** (AND).
- Nhiều dòng là **chỉ cần khớp một dòng** (OR).

Ví dụ bạn cấu hình:
- `cần mua|loa bluetooth`
- `tư vấn|tai nghe`

Thì bài viết sẽ khớp nếu:
- chứa cả `cần mua` và `loa bluetooth`, **hoặc**
- chứa cả `tư vấn` và `tai nghe`.

---

## 5) Giảm rủi ro checkpoint tối đa

- Đặt chu kỳ quét tối thiểu 10–20 phút/lần.
- Không quét quá nhiều group cùng lúc; tăng dần theo thời gian.
- Không tự động like/comment/inbox hàng loạt.
- Dùng IP và thiết bị ổn định, bật 2FA.
- Tránh đăng nhập cùng lúc nhiều vị trí địa lý bất thường.

> Lưu ý: Không có giải pháp nào đảm bảo 0% rủi ro. Bạn cần tuân thủ Điều khoản Facebook và quy định pháp lý liên quan dữ liệu cá nhân.

---

## 6) Cấu trúc mã nguồn

- `extension/manifest.json`: cấu hình extension MV3.
- `extension/background.js`: lịch quét định kỳ, mở tab nền, gom lead, gửi Telegram.
- `extension/content.js`: cuộn trang + trích xuất bài viết + lọc từ khóa.
- `extension/options.*`: màn hình cấu hình.
- `extension/popup.*`: xem lead nhanh + trigger quét thủ công.
- `docs/architecture.md`: so sánh Python vs Extension + khuyến nghị.

---

## 7) Hạn chế hiện tại & hướng mở rộng

- Selector DOM Facebook có thể đổi theo thời gian → cần cập nhật định kỳ.
- Service worker cần trình duyệt đang mở để chạy lịch.
- Nên mở rộng thêm:
  - Export CSV/Google Sheet.
  - Chấm điểm lead (lead scoring).
  - Webhook cho Zalo OA/CRM.
  - Bổ sung blacklist từ khóa nhiễu (ví dụ “đã bán”, “không còn”).
