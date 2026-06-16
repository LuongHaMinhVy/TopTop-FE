# 🎨 Frontend Turborepo Monorepo (Next.js + pnpm)

Thư mục này chứa toàn bộ giao diện người dùng (Frontend) của hệ thống TikTok Clone, được quản lý dưới dạng **Monorepo** sử dụng **Turborepo** và **pnpm Workspaces** để tối ưu hóa việc phân chia và chia sẻ tài nguyên giữa các ứng dụng.

---

## 📂 Sơ Đồ Cấu Trúc Monorepo

```txt
front/
├── apps/
│   ├── web/               # Ứng dụng Next.js cho Client/Người dùng (Port 3001)
│   └── admin/             # Ứng dụng Next.js cho Quản trị viên (Port 3002)
├── packages/
│   ├── ui/                # Thư viện component React dùng chung (@repo/ui)
│   ├── eslint-config/     # Cấu hình ESLint chuẩn hóa dùng chung
│   └── typescript-config/ # Các file tsconfig.json dùng chung cho monorepo
├── package.json           # File cấu hình gốc của Monorepo
├── pnpm-workspace.yaml    # Khai báo không gian làm việc của pnpm
└── turbo.json             # Cấu hình các tác vụ Turborepo (dev, build, lint...)
```

---

## ⚡ Các Lệnh Điều Hành Chính

Khi phát triển dự án, bạn hãy đứng ở **thư mục gốc `/front`** để chạy các lệnh quản trị monorepo thông qua `pnpm`:

### 1. Cài đặt toàn bộ dependencies:
```bash
pnpm install
```

### 2. Khởi chạy môi trường phát triển (Dev Mode):
* **Chạy tất cả các ứng dụng (`web` và `admin`)**:
  ```bash
  pnpm dev
  ```
* **Chỉ chạy ứng dụng Web Client người dùng**:
  ```bash
  pnpm dev:web
  ```
* **Chỉ chạy ứng dụng Admin Panel**:
  ```bash
  pnpm dev:admin
  ```

### 3. Biên dịch dự án (Production Build):
```bash
pnpm build
```
Turborepo sẽ tự động tối ưu hóa bộ nhớ đệm (caching) để bỏ qua các gói không thay đổi và biên dịch nhanh nhất có thể.

### 4. Kiểm tra mã nguồn (Linting, Formatting & Type Checking):
* **Chạy ESLint kiểm tra lỗi cú pháp**:
  ```bash
  pnpm lint
  ```
* **Tự động định dạng mã nguồn bằng Prettier**:
  ```bash
  pnpm format
  ```
* **Kiểm tra kiểu dữ liệu TypeScript**:
  ```bash
  pnpm check-types
  ```

---

## 🛠️ Chia Sẻ Tài Nguyên Giữa Các Gói

1. **Shared UI Components (`@repo/ui`)**:
   Mọi component nút (`Button`), đầu vào (`Input`), thanh cuộn, thẻ hiển thị... được tạo trong thư mục `packages/ui` đều có thể được import trực tiếp vào `apps/web` và `apps/admin` bằng cú pháp:
   ```tsx
   import { Button, Input } from "@repo/ui";
   ```
2. **Cấu hình chia sẻ**:
   Giúp dự án tuân thủ tiêu chuẩn code chung mà không cần viết lại tệp cấu hình ESLint và TypeScript tại từng app riêng biệt.

---

## ⚙️ Thiết Lập Môi Trường (Environments)
Mỗi ứng dụng Next.js trong `apps/` có thể yêu cầu file cấu hình môi trường `.env` riêng biệt. Hãy đọc kỹ hướng dẫn cấu hình chi tiết tại:
* [Hướng dẫn chạy ứng dụng Web Client (apps/web)](file:///d:/LmBt/tiktok/front/apps/web/README.md)
* [Hướng dẫn chạy ứng dụng Admin (apps/admin)](file:///d:/LmBt/tiktok/front/apps/admin/README.md)
