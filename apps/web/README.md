# 📱 TikTok Web Client App (Next.js)

Trang web khách hàng (Web Client) được phát triển bằng **Next.js 16** (App Router), mang lại giao diện người dùng độ trung thực cao, tương thích thiết bị di động và máy tính, cùng khả năng phản hồi mượt mà cho toàn bộ hệ thống mạng xã hội video.

---

## 🛠️ Công Nghệ & Thư Viện Sử Dụng

* **Khung ứng dụng**: Next.js 16 (App Router), hỗ trợ render phía máy chủ (SSR) kết hợp tối ưu phông chữ và tối ưu hóa SEO.
* **Quản lý trạng thái toàn cục**: Redux Toolkit (`@reduxjs/toolkit` và `react-redux`).
* **Truy vấn & Quản lý API Cache**: TanStack React Query (`@tanstack/react-query`) kết hợp với thư viện kết nối Axios.
* **Hệ thống CSS**: TailwindCSS v4 đem lại giao diện bóng bẩy, hiện đại và hỗ trợ Glassmorphism cùng hiệu ứng chuyển động vi mô (micro-animations).
* **Đa ngôn ngữ (i18n)**: Sử dụng `next-intl` hỗ trợ chuyển đổi mượt mà tiếng Việt (`vi`) và tiếng Anh (`en`).
* **Hệ thống Livestream**: LiveKit React Components (`@livekit/components-react`) kết hợp LiveKit Client.
* **Giao tiếp thời gian thực**: WebSockets với giao thức STOMP (`@stomp/stompjs`) hỗ trợ luồng chat thời gian thực.
* **Đồ họa**: Thư viện icon Lucide React.

---

## 🌟 Các Tính Năng Điển Hình

### 1. Bảng Tin Video Động (Video Feed UI)
* Tự động phát video khi cuộn đến vùng hiển thị (Viewport) và dừng phát khi cuộn qua.
* Đồng bộ hóa trạng thái âm thanh (Mute/Volume) trên toàn hệ thống.
* Tương tác thả tim (Like), lưu video (Save), chia sẻ (Share) và danh sách bình luận (Comments).
* Đề xuất video thông minh (Gemini AI Re-ranking) cá nhân hóa cho từng tài khoản.

### 2. Chuẩn Hóa Xác Thực Người Dùng (Auth & Registration)
* Thiết kế đồng bộ giữa **Trang đăng nhập/đăng ký độc lập** (`/login`, `/signup`) và **Hộp thoại xác thực (AuthModal)**.
* Toàn bộ trường dữ liệu (Tài khoản, Email, Mật khẩu, Ngày sinh) đều được kiểm thử tính đúng đắn ngay trước khi submit.
* **Trải nghiệm Premium**: Loại bỏ hoàn toàn bong bóng báo lỗi mặc định của trình duyệt (`required` tooltip), thay thế bằng việc tô đỏ viền ô nhập (`border-red-500`) và hiển thị thông báo lỗi chi tiết đã được dịch thuật tương ứng bên dưới ô nhập dữ liệu.

### 3. TikTok Shop (Thương mại điện tử)
* Duyệt danh sách sản phẩm, xem thông tin chi tiết người bán.
* Quản lý giỏ hàng trực quan (thêm, sửa, xóa số lượng sản phẩm).
* Trang thanh toán chuyên nghiệp tích hợp cổng bảo mật.

### 4. Livestreaming Thời Gian Thực
* Người dùng có thể tự phát livestream (Broadcaster) qua Webcam cá nhân hoặc tham gia phòng phát với tư cách người xem (Viewer).
* Tích hợp khung chat livestream thời gian thực và hiển thị số lượng người xem đồng thời.

### 5. Chat Trực Tiếp (Direct Messages)
* Hệ thống nhắn tin 1-1 thời gian thực tích hợp WebSockets.
* Gửi nhận tin nhắn tức thì, hiển thị danh sách người nhắn gần đây và trạng thái trực tuyến.

---

## ⚙️ Cấu Hình Môi Trường (`.env`)

Tạo tệp `.env` trong thư mục `front/apps/web/` với các tham số sau:

```env
# Địa chỉ cổng API Spring Boot
NEXT_PUBLIC_BACK_END_URL=http://localhost:8080

# Địa chỉ dự phòng (IP Local/LAN)
NEXT_PUBLIC_IP_BACK_END_URL=http://26.87.198.178:8080

# (Tùy chọn) Endpoint Ngrok khi chạy public test
NEXT_PUBLIC_NGROK_BACK_END_URL=https://exchange-pastor-persecute.ngrok-free.dev

# Địa chỉ máy chủ LiveKit Server kết nối Livestream
NEXT_PUBLIC_LIVEKIT_URL=wss://test-p8yyqb2g.livekit.cloud
```

---

## 🚀 Cách Chạy Ứng Dụng

Ứng dụng Web Client mặc định chạy trên cổng **`3001`**.

Để chạy riêng ứng dụng này, di chuyển tới thư mục `front` và gõ lệnh:
```bash
pnpm --filter web dev
```
Hoặc truy cập trực tiếp thư mục `front/apps/web` và chạy:
```bash
pnpm dev
```
Sau đó truy cập: [http://localhost:3001](http://localhost:3001).
