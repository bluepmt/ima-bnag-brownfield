# IMA Brownfield — Hướng dẫn dựng Backend + Database

Code backend đã viết sẵn. File này là checklist **bấm chuột từng bước**. Làm theo thứ tự A → J.

> **Bạn cần:** 1 tài khoản Cloudflare (free), 1 tài khoản Microsoft 365 (đã có), và cài Node.js 1 lần.

---

## A. Cài Node.js + wrangler (1 lần)

1. Tải Node.js (bản LTS): https://nodejs.org → cài như phần mềm bình thường.
2. Mở PowerShell trong thư mục dự án này, chạy:
   ```powershell
   npm install -g wrangler
   wrangler login
   ```
   Trình duyệt mở ra → bấm **Allow** để nối wrangler với Cloudflare.

---

## B. Tạo database D1

```powershell
npx wrangler d1 create ima_db
```
Lệnh in ra 1 đoạn có dòng `database_id = "xxxxxxxx-...."`. **Copy cái id đó.**

Mở file `wrangler.toml`, thay `REPLACE_WITH_DATABASE_ID` bằng id vừa copy.

Tạo bảng:
```powershell
npx wrangler d1 execute ima_db --remote --file=./schema.sql
```

---

## C. Tạo tài khoản admin đầu tiên

```powershell
node seed.mjs admin "MatKhauManh_DoiNgay123" admin > seed.sql
npx wrangler d1 execute ima_db --remote --file=./seed.sql
```
- `admin` = tên đăng nhập. `"MatKhau..."` = mật khẩu (đặt mạnh). `admin` cuối = quyền admin.
- Sau khi chạy xong, **xoá file `seed.sql`** (nó chứa mật khẩu đã mã hoá — không để lại, không commit).

Thêm user khác sau này (xem mục K) — không cần lặp bước này.

---

## D. Nối repo GitHub với Cloudflare Pages

1. Vào https://dash.cloudflare.com → **Workers & Pages** → **Create** → tab **Pages** → **Connect to Git**.
2. Chọn repo `bluepmt/ima-brownfield`.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** (để trống)
   - **Build output directory:** `/`
4. **Save and Deploy.** Lần đầu deploy xong bạn có URL dạng `ima-portal.pages.dev`.

---

## E. Nối D1 vào Pages

Trong project Pages vừa tạo → **Settings** → **Functions** (hoặc **Bindings**) → **D1 database bindings** → **Add**:
- Variable name: `DB`
- D1 database: `ima_db`

Bấm **Save**. (Đây là lý do code dùng `env.DB`.)

---

## F. Đăng ký app Microsoft để đọc Excel (Graph)

Phần này cho **mục Progress tự động lấy từ Excel 365**. Làm 1 lần.

1. Vào https://portal.azure.com → tìm **Microsoft Entra ID** (tên cũ: Azure AD).
2. **App registrations** → **New registration**:
   - Name: `IMA Web Reader`
   - Supported account types: **Single tenant** (mặc định)
   - **Register**.
3. Ở trang Overview của app, copy 2 thứ:
   - **Application (client) ID** → đây là `GRAPH_CLIENT_ID`
   - **Directory (tenant) ID** → đây là `GRAPH_TENANT`
4. Menu trái → **Certificates & secrets** → **New client secret** → đặt tên, chọn hạn → **Add**.
   - Copy ngay cột **Value** (chỉ hiện 1 lần!) → đây là `GRAPH_CLIENT_SECRET`.
5. Menu trái → **API permissions** → **Add a permission** → **Microsoft Graph** → **Application permissions** → tìm và tick **Files.Read.All** → **Add permissions**.
6. Vẫn trang đó → bấm **Grant admin consent for <tổ chức>** → **Yes**.
   - (Cần quyền admin M365. Nếu bạn không phải admin, nhờ IT bấm bước này.)

> **Lưu ý bảo mật:** `Files.Read.All` cho app đọc được mọi file trong tenant. Muốn thắt chặt chỉ 1 file, dùng `Sites.Selected` (SharePoint) — làm sau cũng được, giờ cứ chạy trước.

---

## G. Tạo file Excel Progress đúng chuẩn

1. Tạo file Excel (vd `Progress.xlsx`), lưu vào **OneDrive for Business** của tài khoản M365 (vd thư mục `IMA/`).
2. Trong sheet, làm 1 bảng 2 cột, hàng đầu là tiêu đề:

   | Key            | Value      |
   |----------------|------------|
   | overall_pct    | 42         |
   | data_date      | 2027-09-30 |
   | reporting_week | 65         |
   | hse_ltir       | 0          |

3. Bôi đen vùng bảng → **Insert → Table** → tick **My table has headers** → OK.
4. Tab **Table Design** → ô **Table Name** (góc trái) → đổi thành `Progress`.
5. **Save.** Từ giờ chỉ cần sửa giá trị cột Value → web tự cập nhật (cache 5 phút).
6. Ghi nhớ: email tài khoản OneDrive (= `GRAPH_USER`), đường dẫn file (vd `/IMA/Progress.xlsx` = `GRAPH_FILE_PATH`), tên bảng `Progress` (= `GRAPH_TABLE`).

---

## H. Nạp biến môi trường vào Pages

Trong project Pages → **Settings** → **Environment variables / Secrets** → thêm:

| Tên | Loại | Giá trị |
|-----|------|---------|
| `GRAPH_TENANT`        | Secret    | Directory (tenant) ID (bước F.3) |
| `GRAPH_CLIENT_ID`     | Secret    | Application (client) ID (bước F.3) |
| `GRAPH_CLIENT_SECRET` | Secret    | Client secret Value (bước F.4) |
| `GRAPH_USER`          | Plaintext | email OneDrive chứa file (vd `you@cty.onmicrosoft.com`) |
| `GRAPH_FILE_PATH`     | Plaintext | `/IMA/Progress.xlsx` |
| `GRAPH_TABLE`         | Plaintext | `Progress` |

Sau khi thêm → **Save** → vào tab **Deployments** → **Retry deployment** để áp dụng.

---

## I. Test trên máy trước khi đẩy (tuỳ chọn nhưng nên)

Tạo file `.dev.vars` ở thư mục gốc (chỉ dùng local, KHÔNG commit):
```
GRAPH_TENANT=...
GRAPH_CLIENT_ID=...
GRAPH_CLIENT_SECRET=...
GRAPH_USER=you@cty.onmicrosoft.com
GRAPH_FILE_PATH=/IMA/Progress.xlsx
GRAPH_TABLE=Progress
```
Chạy:
```powershell
npx wrangler pages dev .
```
Mở `http://localhost:8788` → đăng nhập bằng admin (bước C). Kiểm tra:
- Đăng nhập sai → báo lỗi. Đăng nhập đúng → vào trang 01.
- Vào `http://localhost:8788/pages/01.%20Overview.html` mà chưa login → bị đá về trang login. ✅
- `http://localhost:8788/api/progress` (sau khi login) → trả JSON data từ Excel.

---

## J. Hoàn tất + tên miền

- Push code lên GitHub → Pages tự build lại.
- Muốn tên miền riêng: project Pages → **Custom domains** → Add.

---

## K. Việc thường ngày

**Thêm user mới** (chỉ admin): sau khi đăng nhập admin, gọi API (dùng trình duyệt console hoặc 1 form admin sau này):
```js
fetch('/api/users', {
  method:'POST', headers:{'content-type':'application/json'}, credentials:'same-origin',
  body: JSON.stringify({ username:'john', password:'matkhau8kytu', role:'viewer' })
}).then(r=>r.json()).then(console.log);
```

**Xem ai đã đăng nhập** (chỉ admin): đăng nhập admin rồi mở `/api/audit` → danh sách login/login_fail/xem trang gần nhất (200 dòng mới nhất).

**Cập nhật Progress:** chỉ sửa file Excel trên OneDrive. Web tự lấy sau ≤ 5 phút.

---

## ⚠ KHÔNG commit các file nhạy cảm

Thêm vào `.gitignore`:
```
.dev.vars
seed.sql
node_modules/
```

---

## Còn lại (bước 2 — làm sau khi có Excel thật)

Trang 08 hiện chạy bằng data mô phỏng (`EPCI_DATA`). Sau khi bạn tạo xong file Excel `Progress` và `/api/progress` trả JSON, mình sẽ nối các số trên trang 08 (overall %, data date, reporting week...) vào dữ liệu Excel thật. Cần thống nhất bảng Excel có những cột (Key) nào để map đúng.
