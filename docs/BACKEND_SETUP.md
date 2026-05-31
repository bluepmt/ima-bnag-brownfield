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
npx wrangler d1 execute ima_db --remote --file=./db/schema.sql
```

---

## C. Tạo tài khoản admin đầu tiên

```powershell
node db/seed.mjs admin "MatKhauManh_DoiNgay123" admin > db/seed.sql
npx wrangler d1 execute ima_db --remote --file=./db/seed.sql
```
- `admin` = tên đăng nhập. `"MatKhau..."` = mật khẩu (đặt mạnh). `admin` cuối = quyền admin.
- Sau khi chạy xong, **xoá file `db/seed.sql`** (nó chứa mật khẩu đã mã hoá — không để lại, không commit).

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

## G. File Excel Progress (workbook `IMA_Progress.xlsx`)

**Đã có file mẫu sẵn:** [`docs/IMA_Progress.xlsx`](IMA_Progress.xlsx) — đã chứa toàn bộ số liệu hiện tại của trang 08 (tuần 64/65/66 + milestones + procurement + S-curve). **Không cần tạo lại từ đầu.**

1. Mở `docs/IMA_Progress.xlsx`, kiểm tra/sửa số liệu nếu cần, rồi **upload lên OneDrive for Business** của tài khoản M365 (vd thư mục `IMA/`). Giữ nguyên tên file hoặc đổi tuỳ ý (nhớ cập nhật `GRAPH_FILE_PATH`).
2. **Không sửa cấu trúc** — workbook gồm 9 sheet, mỗi sheet là 1 **Excel Table** đã đặt tên sẵn (backend đọc theo tên bảng):

   | Sheet / Table | Nội dung | Sửa hằng tuần? |
   |---|---|---|
   | `KPI`         | KPI đầu trang theo tuần (overall %, SPI, HSE, số risk/NCR/punch…) | ✅ |
   | `Phase`       | % 6 workfront — Planned/Actual mỗi tuần (số 0–100) | ✅ |
   | `Sections`    | Chi tiết từng tab (`section.field`, vd `fabrication.ton`) — giữ đúng format chữ | ✅ |
   | `Variance`    | 13 điểm schedule-variance mỗi tuần | ✅ |
   | `Milestones`  | Key Dates (Name / Baseline / Forecast / Status) | khi có thay đổi |
   | `Engineering` | Heatmap discipline (Actual/Target là số) | khi có thay đổi |
   | `Procurement` | Long-lead packages (Prog là số 0–100) | khi có thay đổi |
   | `SCurve`      | Đường S-curve baseline (Plan Rev.00), theo tháng | hiếm khi (baseline) |
   | `WPInfo`      | Tên + trọng số 10 Work Package | hiếm khi |

3. **Quy tắc sửa số:**
   - Cột tuần ở các bảng `KPI`/`Sections` có tên **`Wk64`, `Wk65`, `Wk66`**. Thêm tuần mới = thêm cột `WkNN` (vd `Wk67`) — *lưu ý:* trang web hiện chỉ render 3 tuần 64/65/66; muốn hiện tuần mới cần cập nhật code trang 08 (báo mình).
   - Bảng `Phase` dùng cột `P64/A64/P65/A65/P66/A66` (P = Planned, A = Actual).
   - `Sections`: **giữ đúng định dạng chữ** như mẫu (vd `388 / 450 T`, `99.0%`, `2,560`) — web hiển thị nguyên văn. Đừng đổi tên cột `Key`.
   - Các ô là **số** (Phase, Variance, Engineering Actual/Target, Procurement Prog, SCurve) thì nhập số thuần, không kèm `%`.
4. **Save.** Từ giờ chỉ cần sửa giá trị trong các bảng → web tự cập nhật (cache 5 phút). Nếu một bảng lỗi/thiếu, trang 08 tự dùng lại số mô phỏng cho riêng phần đó (không vỡ trang).
5. Ghi nhớ: email tài khoản OneDrive (= `GRAPH_USER`), đường dẫn file (vd `/IMA/IMA_Progress.xlsx` = `GRAPH_FILE_PATH`). **Không cần** `GRAPH_TABLE` nữa (backend đọc cố định 9 bảng trên; chỉ set `GRAPH_TABLES` nếu muốn đổi danh sách).

> Tạo lại file mẫu (nếu cần): script `db/build_progress_xlsx.cjs` (chạy `npm i exceljs` rồi `node db/build_progress_xlsx.cjs <đường-dẫn-out>`).

---

## H. Nạp biến môi trường vào Pages

Trong project Pages → **Settings** → **Environment variables / Secrets** → thêm:

| Tên | Loại | Giá trị |
|-----|------|---------|
| `GRAPH_TENANT`        | Secret    | Directory (tenant) ID (bước F.3) |
| `GRAPH_CLIENT_ID`     | Secret    | Application (client) ID (bước F.3) |
| `GRAPH_CLIENT_SECRET` | Secret    | Client secret Value (bước F.4) |
| `GRAPH_USER`          | Plaintext | email OneDrive chứa file (vd `you@cty.onmicrosoft.com`) |
| `GRAPH_FILE_PATH`     | Plaintext | `/IMA/IMA_Progress.xlsx` |
| `GRAPH_TABLES`        | Plaintext | *(tuỳ chọn)* để trống = đọc 9 bảng mặc định; chỉ set nếu muốn đổi danh sách, vd `KPI,Phase,Sections` |

Sau khi thêm → **Save** → vào tab **Deployments** → **Retry deployment** để áp dụng.

---

## I. Test trên máy trước khi đẩy (tuỳ chọn nhưng nên)

Tạo file `.dev.vars` ở thư mục gốc (chỉ dùng local, KHÔNG commit):
```
GRAPH_TENANT=...
GRAPH_CLIENT_ID=...
GRAPH_CLIENT_SECRET=...
GRAPH_USER=you@cty.onmicrosoft.com
GRAPH_FILE_PATH=/IMA/IMA_Progress.xlsx
```
Chạy:
```powershell
npx wrangler pages dev .
```
Mở `http://localhost:8788` → đăng nhập bằng admin (bước C). Kiểm tra:
- Đăng nhập sai → báo lỗi. Đăng nhập đúng → vào trang 01.
- Vào `http://localhost:8788/pages/01.%20Overview.html` mà chưa login → bị đá về trang login. ✅
- `http://localhost:8788/api/progress` (sau khi login) → trả JSON `{ tables: { KPI:[…], Phase:[…], … }, fetchedAt }` đọc từ Excel. Mở `http://localhost:8788/pages/08.%20Progress%20Report.html` → các số đã đổi theo Excel. Chưa cấu hình Graph → `/api/progress` trả **503** và trang 08 tự dùng số mô phỏng (không lỗi).

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

## Trang 08 ↔ Excel — đã nối xong (code)

Trang 08 **đã được nối** với `/api/progress`: khi tải trang nó render số mô phỏng ngay (nhanh), rồi gọi `/api/progress` ngầm; nếu workbook đọc được thì các bảng Excel **ghi đè** số mô phỏng và trang vẽ lại (KPI, % workfront, variance, milestones, procurement, engineering, S-curve). Mọi lỗi (chưa cấu hình Graph → 503, mạng, parse) → giữ nguyên số mô phỏng, **không vỡ trang**. (Mapping: `applyLiveProgress()` trong `08. Progress Report.html`.)

**Việc còn lại của bạn** (phía Microsoft/Cloudflare, mục F–H ở trên):
1. Đăng ký Azure app + cấp quyền `Files.Read.All` (mục F).
2. Upload `docs/IMA_Progress.xlsx` lên OneDrive (mục G).
3. Set 5 biến `GRAPH_*` trong Pages (mục H) → `/api/progress` hết 503.

Sau đó: sửa số trong Excel trên OneDrive → trang 08 tự cập nhật sau ≤ 5 phút (cache).
