PayOS Demo – React Native + Node.js
===================================

Giới thiệu
----------
Demo tích hợp PayOS cho ứng dụng React Native (Expo Router) với backend Node.js/Express. Flow chính:
- Home tab: tạo đơn hàng, redirect sang trang thanh toán PayOS.
- Webhook: PayOS gọi về server, verify checksum và cập nhật trạng thái đơn.
- Admin tab: xem danh sách đơn, trạng thái (PENDING/PAID), refresh sau khi webhook về.
- Endpoint order-status: cho phép kiểm tra trạng thái một đơn qua API.

Kiến trúc thư mục
-----------------
- `server/`: Backend Express + PayOS SDK.
- `client/`: Ứng dụng React Native (Expo Router) với 2 tab: Home (tạo thanh toán) và Admin (xem đơn).

Chuẩn bị môi trường
-------------------
1) Yêu cầu:
   - Node.js 18+ (đang dùng v24 trong máy này).
   - Expo CLI (cài tự động qua `npx expo start`).
2) Clone và cài đặt:
   ```bash
   git clone <repo-url>
   cd demo-payment-ie307
   cd server && npm install
   cd ../client && npm install
   ```
3) Cấu hình PayOS (bắt buộc):
   - Tạo file `server/.env` (không commit) với nội dung:
     ```
     PAYOS_CLIENT_ID=...
     PAYOS_API_KEY=...
     PAYOS_CHECKSUM_KEY=...
     PORT=4000
     ```
   - Đổi giá trị theo PayOS dashboard. Không đưa `.env` lên git.
4) Cập nhật `BACKEND_URL` cho thiết bị:
   - File `client/app/(tabs)/index.tsx` có hằng `BACKEND_URL`.
   - Dùng `http://localhost:4000` cho iOS simulator.
   - Dùng `http://10.0.2.2:4000` cho Android emulator.
   - Dùng IP LAN của máy backend (vd `http://192.168.1.10:4000`) cho thiết bị thật.

Chạy dự án
----------
1) Backend:
   ```bash
   cd server
   npm start
   ```
   Server chạy tại `http://localhost:4000`.

2) Frontend (Expo):
   ```bash
   cd client
   npx expo start
   ```
   Mở trên iOS/Android emulator hoặc quét QR bằng Expo Go (thiết bị thật phải trỏ đúng `BACKEND_URL`).

Endpoint chính (server/index.js)
--------------------------------
- `POST /payment/create-order`
  - Body: `{ amount, description, returnUrl, cancelUrl, orderCode? }`
  - Tạo đơn PENDING, gọi PayOS SDK → trả `checkoutUrl`, `orderCode`, `paymentLinkId`.
- `POST /payment/payos-webhook`
  - PayOS gọi về; verify signature bằng `PAYOS_CHECKSUM_KEY`; cập nhật trạng thái (PAID nếu code=00); lưu metadata.
- `GET /payment/order-status/:orderCode`
  - Trả `{ orderCode, status }` để app/poll kiểm tra nhanh.
- `GET /payment/orders` và `GET /payment/orders/:orderCode`
  - Dùng cho Admin tab để liệt kê/chi tiết đơn.


*) Demo `order-status`:
   - Lấy `orderCode` (log khi tạo hoặc xem ở Admin).
   - Gọi: `curl http://localhost:4000/payment/order-status/<orderCode>` để thấy `PENDING` hoặc `PAID`.

Deep link
---------
- Scheme Expo: `client://`.
- Home tạo `returnUrl` = `client://payment-success?orderCode=...`; `cancelUrl` tương tự.
- Khi success: app chuyển sang tab Admin, highlight order vừa thanh toán.
- Khi cancel: app quay về Home.

Liên hệ & góp ý
---------------
Pull request/issue được chào mừng.
