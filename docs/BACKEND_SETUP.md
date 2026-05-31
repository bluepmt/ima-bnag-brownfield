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

## F. Tạo Google Sheet nguồn dữ liệu (dùng cho Progress)

> **Vì sao Google Sheets, không phải Excel 365?** Excel 365 + Microsoft Graph (app-only) **bắt buộc tài khoản M365 công việc** (có Azure AD tenant + OneDrive for Business). Tài khoản **Gmail cá nhân không dùng được**. Google Sheets gắn thẳng với Gmail, miễn phí, sửa online là web tự cập nhật — nên dự án dùng hướng này. Backend đọc Sheet công khai dạng CSV (gviz), **không cần API key / OAuth**.

Làm 1 lần:

1. Mở https://sheets.google.com (đăng nhập Gmail) → **Blank** → **File → Import** → tab **Upload** → chọn `docs/IMA_Progress.xlsx` → **Insert new sheet(s)** → **Import data**.
   - Sẽ ra 9 tab: `KPI, Phase, Sections, Variance, Milestones, Engineering, Procurement, SCurve, WPInfo`. **Giữ nguyên tên tab + hàng tiêu đề (dòng 1).**
   - Xoá tab trống mặc định (`Sheet1`) nếu có.
2. **Định dạng cột ngày là text** (tránh Google tự đổi `01-Jul-2026` → kiểu ngày khác): ở tab `Milestones` chọn cột `Baseline`,`Forecast`; tab `Procurement` chọn `PO`,`FAT`,`Site` → menu **Format → Number → Plain text**. (Import từ .xlsx thường đã giữ text — bước này chỉ để chắc.)
3. **Chia sẻ công khai chỉ-xem:** nút **Share** (góc phải) → mục **General access** → đổi **Restricted** → **Anyone with the link** → vai trò **Viewer** → **Done**. (Backend chỉ đọc; không ai sửa được nếu không có quyền edit.)
4. **Lấy Spreadsheet ID** từ URL — phần giữa `/d/` và `/edit`:
   ```
   https://docs.google.com/spreadsheets/d/  1AbC...XYZ  /edit#gid=0
                                            └── đây là SHEETS_ID ──┘
   ```
   Copy đoạn đó → đây là biến `SHEETS_ID`.

> **Bảo mật:** Sheet "Anyone with link: Viewer" = ai có link đều xem được. Dữ liệu Progress vốn đã hiển thị trên trang web (đã gate login) nên không phải bí mật mới. Đừng để thông tin nhạy cảm khác trong cùng spreadsheet.

---

## G. Cấu trúc 9 tab + cách sửa số

File mẫu [`docs/IMA_Progress.xlsx`](IMA_Progress.xlsx) đã chứa toàn bộ số liệu hiện tại của trang 08 (tuần 64/65/66 + milestones + procurement + S-curve). Sau khi import (bước F), Sheet có 9 tab. Backend đọc **theo đúng tên tab**, **hàng 1 là tiêu đề**.

| Tab | Nội dung | Sửa hằng tuần? |
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

**Quy tắc sửa số:**
- **Không đổi tên tab, không xoá/đổi hàng tiêu đề (dòng 1).** Chỉ sửa giá trị bên dưới.
- Cột tuần ở `KPI`/`Sections` tên **`Wk64`, `Wk65`, `Wk66`**. Thêm tuần mới = thêm cột `WkNN` (vd `Wk67`) — *lưu ý:* web hiện chỉ render 3 tuần 64/65/66; muốn hiện tuần mới cần sửa code trang 08 (báo mình).
- `Phase` dùng cột `P64/A64/P65/A65/P66/A66` (P = Planned, A = Actual).
- `Sections`: **giữ đúng định dạng chữ** như mẫu (vd `388 / 450 T`, `99.0%`, `2,560`) — web hiển thị nguyên văn. Đừng đổi cột `Key`.
- Ô là **số** (Phase, Variance, Engineering Actual/Target, Procurement Prog, SCurve) nhập số thuần, không kèm `%`.
- Ô **ngày** (Milestones, Procurement) để cột ở Plain text (bước F.2) cho đúng dạng `dd-Mmm-yyyy`.

Sửa xong → web tự cập nhật (cache 5 phút). Một tab lỗi/thiếu → trang 08 tự dùng số mô phỏng cho riêng phần đó (không vỡ trang).

> Tạo lại file mẫu .xlsx (nếu cần): `npm i exceljs` rồi `node db/build_progress_xlsx.cjs <đường-dẫn-out>`.

---

## H. Nạp biến môi trường vào Pages

Trong project Pages → **Settings** → **Environment variables / Secrets** → thêm:

| Tên | Loại | Giá trị |
|-----|------|---------|
| `SHEETS_ID`     | Plaintext | Spreadsheet ID lấy ở bước F.4 (vd `1AbC...XYZ`) |
| `SHEETS_TABLES` | Plaintext | *(tuỳ chọn)* để trống = đọc 9 tab mặc định; chỉ set nếu đổi danh sách, vd `KPI,Phase,Sections` |

Sau khi thêm → **Save** → vào tab **Deployments** → **Retry deployment** để áp dụng. (Không cần Secret nào cho Progress — Sheet đã công khai chỉ-xem.)

---

## I. Test trên máy trước khi đẩy (tuỳ chọn nhưng nên)

Tạo file `.dev.vars` ở thư mục gốc (chỉ dùng local, KHÔNG commit):
```
SHEETS_ID=1AbC...XYZ
```
Chạy:
```powershell
npx wrangler pages dev .
```
Mở `http://localhost:8788` → đăng nhập bằng admin (bước C). Kiểm tra:
- Đăng nhập sai → báo lỗi. Đăng nhập đúng → vào trang 01.
- Vào `http://localhost:8788/pages/01.%20Overview.html` mà chưa login → bị đá về trang login. ✅
- `http://localhost:8788/api/progress` (sau khi login) → trả JSON `{ tables: { KPI:[…], Phase:[…], … }, fetchedAt }` đọc từ Google Sheet. Mở `http://localhost:8788/pages/08.%20Progress%20Report.html` → các số đã đổi theo Sheet. Chưa set `SHEETS_ID` → `/api/progress` trả **503** và trang 08 tự dùng số mô phỏng (không lỗi).

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

**Cập nhật Progress:** chỉ sửa số trong Google Sheet. Web tự lấy sau ≤ 5 phút.

---

## ⚠ KHÔNG commit các file nhạy cảm

Thêm vào `.gitignore`:
```
.dev.vars
seed.sql
node_modules/
```

---

## Trang 08 ↔ Google Sheet — đã nối xong (code)

Trang 08 **đã được nối** với `/api/progress`: khi tải trang nó render số mô phỏng ngay (nhanh), rồi gọi `/api/progress` ngầm; nếu Sheet đọc được thì các tab **ghi đè** số mô phỏng và trang vẽ lại (KPI, % workfront, variance, milestones, procurement, engineering, S-curve). Mọi lỗi (chưa set `SHEETS_ID` → 503, mạng, parse) → giữ nguyên số mô phỏng, **không vỡ trang**. (Mapping: `applyLiveProgress()` trong `08. Progress Report.html`; reader: `functions/_lib/sheets.js`.)

**Việc còn lại của bạn** (mục F–H ở trên):
1. Tạo Google Sheet từ `docs/IMA_Progress.xlsx`, chia sẻ **Anyone with link: Viewer** (mục F).
2. Lấy **Spreadsheet ID** từ URL (mục F.4).
3. Set biến `SHEETS_ID` trong Pages (mục H) → `/api/progress` hết 503.

Sau đó: sửa số trong Google Sheet → trang 08 tự cập nhật sau ≤ 5 phút (cache).
