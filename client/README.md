  Tóm tắt :

   * Cấu trúc dự án: Tạo thư mục server/ cho backend Node.js và client/ cho frontend React Native (Expo).
   * Backend (`server/`):
       * Khởi tạo dự án Node.js và cài đặt các thư viện cần thiết (express, cors, dotenv, @payos/node).
       * Tạo file server/index.js với một Express app có:
           * Endpoint POST /create-payment-link để tạo link thanh toán PayOS.
           * Kèm theo một placeholder cho webhook của PayOS (/payos-webhook).
       * Tạo file server/.env để bạn điền thông tin xác thực PayOS.
       * Thêm script start vào server/package.json để dễ dàng chạy server.
   * Frontend (`client/`):
       * Khởi tạo dự án Expo React Native.
       * Chỉnh sửa file client/App.js để:
           * Hiển thị giao diện đơn giản với trường nhập số tiền và mô tả.
           * Nút "Create Payment Link" để gọi API backend.
           * Sử dụng Linking.openURL để mở URL thanh toán PayOS.
           * Cấu hình returnUrl và cancelUrl để sử dụng deep link scheme client://.
           * Thêm Linking.addEventListener trong useEffect để bắt các deep link chuyển hướng (client://payment-success hoặc client://payment-cancel) và hiển
             thị thông báo.

  Hướng dẫn để bạn chạy và kiểm tra ứng dụng:

   1. Điền thông tin xác thực PayOS:
       * Mở thư mục server/.
       * Mở file .env.
       * Thay thế YOUR_CLIENT_ID, YOUR_API_KEY, và YOUR_CHECKSUM_KEY bằng thông tin xác thực PayOS thực tế của bạn.

   2. Khởi động Backend Server:
       * Mở Terminal.
       * Di chuyển vào thư mục server/: cd server
       * Chạy server: npm start
       * Server sẽ chạy trên cổng http://localhost:4000.

   3. Cập nhật URL Backend cho Frontend:
       * Mở file client/App.js.
       * Quan trọng: Cập nhật hằng số BACKEND_URL để trỏ đến địa chỉ server backend của bạn.
           * Nếu bạn sử dụng trình giả lập iOS: http://localhost:4000 có thể hoạt động trực tiếp.
           * Nếu bạn sử dụng trình giả lập Android: http://10.0.2.2:4000 thường là địa chỉ chính xác để truy cập localhost của máy chủ.
           * Nếu bạn sử dụng thiết bị vật lý: Bạn sẽ cần sử dụng địa chỉ IP của máy tính trên mạng cục bộ (ví dụ: http://192.168.1.XX:4000) hoặc một dịch vụ
             tunneling như ngrok (ví dụ: https://your-ngrok-id.ngrok-free.app).

   4. Chạy ứng dụng React Native:
       * Mở một tab/cửa sổ Terminal khác.
       * Di chuyển vào thư mục client/: cd client
       * Khởi động ứng dụng Expo: npx expo start
       * Thao tác này sẽ mở một tab trình duyệt với Expo Dev Tools. Từ đó, bạn có thể chọn chạy trên trình giả lập iOS, trình giả lập Android hoặc quét mã QR
         bằng ứng dụng Expo Go trên thiết bị vật lý của bạn.

  Để kiểm tra luồng thanh toán:

   1. Đảm bảo cả backend và frontend đang chạy.
   2. Mở ứng dụng React Native.
   3. Nhập số tiền và mô tả (hoặc sử dụng giá trị mặc định).
   4. Nhấn "Create Payment Link".
   5. Trình duyệt của thiết bị của bạn (hoặc trình duyệt trong ứng dụng của Expo Go) sẽ mở trang thanh toán của PayOS.
   6. Hoàn tất hoặc hủy thanh toán trên trang PayOS.
   7. Sau khi hoàn tất hoặc hủy, PayOS sẽ chuyển hướng trở lại ứng dụng của bạn bằng deep link client://payment-success hoặc client://payment-cancel, và một
      thông báo sẽ được hiển thị.

