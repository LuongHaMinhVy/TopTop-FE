# 🔒 TikTok Admin Dashboard (Next.js)

Bảng quản trị (Admin Dashboard) được xây dựng bằng **Next.js 16** (App Router), cung cấp công cụ quản trị mạnh mẽ cho người kiểm duyệt nội dung và quản trị viên hệ thống để kiểm soát hoạt động mạng xã hội, quản lý bán hàng và theo dõi nhật ký hoạt động.

---

## 🛠️ Công Nghệ Sử Dụng

* **Khung ứng dụng**: Next.js 16 (App Router), hỗ trợ phân chia quyền truy cập trang quản lý.
* **Truy vấn & Quản lý API Cache**: TanStack React Query (`@tanstack/react-query`) và Axios.
* **Hệ thống CSS**: TailwindCSS v4 tích hợp thiết kế bảng biểu dữ liệu nâng cao, bộ lọc linh hoạt và hiển thị trạng thái tải dữ liệu (Loading skeleton).
* **Đa ngôn ngữ**: Hỗ trợ đầy đủ tiếng Anh và tiếng Việt qua `next-intl`.
* **Component UI**: Tái sử dụng các thẻ đầu vào và nút bấm từ gói `@repo/ui`.

---

## 🌟 Các Tính Năng Quản Trị Cốt Lõi

### 1. Phân Hệ Kiểm Duyệt Video (Video Moderation)
* Danh sách video đang chờ phê duyệt (Pending) hoặc bị báo cáo (Flagged).
* Trình xem trước video kèm các thông tin chi tiết (Hashtag, Nhạc nền, Người đăng).
* Thực hiện duyệt nhanh hàng loạt hoặc duyệt chi tiết từng video (Approve/Reject) kèm lý do kiểm duyệt.

### 2. Quản Lý Thương Mại Điện Tử (TikTok Shop Admin)
* Kiểm tra và phê duyệt yêu cầu đăng ký mở cửa hàng mới của người dùng.
* Quản lý trạng thái hiển thị của các sản phẩm trên hệ thống Shop.
* Theo dõi thống kê đơn hàng và trạng thái vận đơn.

### 3. Nhật Ký Kiểm Duyệt Tập Trung (Centralized Audit Logs)
* Theo dõi dòng thời gian lịch sử mọi hành động kiểm duyệt trong hệ thống (Hành động nào được thực hiện bởi ai, trên thực thể nào, vào lúc nào và lý do tương ứng).
* Tìm kiếm nâng cao bằng ID mục tiêu (Target ID) kết hợp các bộ lọc đa dạng (Loại hành động, Loại thực thể kiểm duyệt, Loại tài khoản thực hiện).
* **Chi tiết nhật ký**: Modal hiển thị chi tiết cho phép xem sự biến đổi trạng thái trước/sau (status transitions) và cấu trúc siêu dữ liệu dạng JSON thô.

---

## 🚀 Hướng Dẫn Vận Hành

Bảng điều khiển Admin mặc định chạy trên cổng **`3002`**.

Để khởi chạy riêng bảng điều khiển Admin, di chuyển tới thư mục `front` và chạy:
```bash
pnpm --filter admin dev
```
Hoặc truy cập trực tiếp thư mục `front/apps/admin` và chạy:
```bash
pnpm dev
```
Sau đó mở trình duyệt truy cập: [http://localhost:3002](http://localhost:3002).
