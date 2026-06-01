// Generates IMA_Progress.xlsx — the EPCI project tracking workbook.
//
// Two layers:
//   VISIBLE (team edits daily):
//     README, ENG, FAB, LOG, SITE, COMM  → per-discipline task logs (PMO columns)
//     Procurement                         → long-lead package list (also a web tab)
//     HSE                                 → weekly HSE log
//     Milestones                          → key dates (also a web tab)
//   HIDDEN (machine tabs the website reads as CSV; do not hand-edit):
//     KPI, Phase, Sections, Variance, Engineering, SCurve, WPInfo
//
// Roll-up (Hybrid): each task sheet has an "Auto %" cell (B1) =
//   SUMPRODUCT(Weight, %Complete)/SUM(Weight). The hidden Phase + Sections tabs
//   reference those cells for the CURRENT week's Actual %; past weeks + counts +
//   narrative KPIs are static (typed). Google Sheets recomputes on import.
//
// Web reader: functions/_lib/sheets.js (gviz CSV by tab name; headers in row 1).
// Regenerate:  npm i exceljs  &&  node db/build_progress_xlsx.cjs <out.xlsx>

const ExcelJS = require('exceljs');
const path = require('path');
const OUT = process.argv[2] || path.join(__dirname, 'IMA_Progress.xlsx');

/* ───────────────────────── static web data (current page-08 numbers) ───────────────────────── */
const KPI = [
  ['status', 'on-track', 'on-track', 'on-track'],
  ['statusText', 'Overall: On Track', 'Overall: On Track', 'Overall: On Track'],
  ['statusDotColor', '#2e7d32', '#2e7d32', '#2e7d32'],
  ['sum_kpi_overall', '56.9%', '59.3%', '61.5%'],
  ['sum_kpi_overall_vs', 'Vs. Planned 55.4% (+1.5% Ahead)', 'Vs. Planned 57.5% (+1.8% Ahead)', 'Vs. Planned 59.6% (+1.9% Ahead)'],
  ['sum_kpi_spi', '1.04', '1.05', '1.06'],
  ['sum_kpi_hse', '1,210K', '1,250K', '1,310K'],
  ['sum_kpi_risks', '1', '0', '0'],
  ['sum_kpi_action', '2', '0', '0'],
  ['sum_kpi_int', '9', '8', '6'],
  ['sum_kpi_ncr', '3', '2', '1'],
  ['sum_kpi_punch', '48', '45', '38'],
];
// Phase: Workfront, P64,A64, P65,A65, P66,A66   (A66 of rows 2/4/5/6/7 overwritten by formulas)
const PHASE = [
  ['Detailed Engineering', 100.0, 100.0, 100.0, 100.0, 100.0, 100.0],
  ['Procurement', 83.5, 85.5, 86.0, 88.5, 88.5, 91.0],
  ['Fabrication Yards', 85.0, 87.0, 88.0, 90.0, 91.0, 93.0],
  ['Transportation & Load-out', 40.0, 42.0, 43.0, 45.0, 46.0, 48.0],
  ['Site Construction', 23.0, 25.0, 25.7, 27.8, 28.0, 30.5],
  ['System Commissioning', 0.0, 0.0, 0.5, 1.0, 2.0, 3.0],
];
const SECTIONS = [
  ['engineering.prog', '100%', '100%', '100%'],
  ['engineering.prog_vs', 'Planned: 100% (KD18 met 01-Jun-27)', 'Planned: 100% (KD18 met 01-Jun-27)', 'Planned: 100% (KD18 met 01-Jun-27)'],
  ['engineering.docs', '2,560', '2,560', '2,560'],
  ['engineering.docs_vs', '2,560 of 2,560 (Code 1 & 2)', '2,560 of 2,560 (Code 1 & 2)', '2,560 of 2,560 (Code 1 & 2)'],
  ['engineering.hazop', '100%', '100%', '100%'],
  ['engineering.hazop_vs', 'All actions closed at AFC', 'All actions closed at AFC', 'All actions closed at AFC'],
  ['engineering.tq', '0', '0', '0'],
  ['procurement.prog', '85.5%', '88.5%', '91.0%'],
  ['procurement.prog_vs', 'Planned: 83.5% (+2.0% Ahead)', 'Planned: 86.0% (+2.5% Ahead)', 'Planned: 88.5% (+2.5% Ahead)'],
  ['procurement.po', '16 / 16', '16 / 16', '16 / 16'],
  ['procurement.delay', '5 / 16', '6 / 16', '8 / 16'],
  ['procurement.overdue', '0', '0', '0'],
  ['fabrication.prog', '87.0%', '90.0%', '93.0%'],
  ['fabrication.prog_vs', 'Planned: 85.0% (+2.0% Ahead)', 'Planned: 88.0% (+2.0% Ahead)', 'Planned: 91.0% (+2.0% Ahead)'],
  ['fabrication.welds', '32,600', '34,200', '35,300'],
  ['fabrication.ndt', '99.0%', '99.2%', '99.3%'],
  ['fabrication.ton', '388 / 450 T', '405 / 450 T', '420 / 450 T'],
  ['logistics.prog', '42.0%', '45.0%', '48.0%'],
  ['logistics.mws', '3 / 4', '4 / 4', '4 / 4'],
  ['logistics.weight', '1,562 T', '1,562 T', '1,562 T'],
  ['logistics.damage', '0', '0', '0'],
  ['site.prog', '25.0%', '27.8%', '30.5%'],
  ['site.prog_vs', 'Planned: 23.0% (+2.0% Ahead)', 'Planned: 25.7% (+2.1% Ahead)', 'Planned: 28.0% (+2.5% Ahead)'],
  ['site.ptw', '22', '24', '28'],
  ['site.simops', 'SIMOPS Restrict', 'SIMOPS Restrict', 'SIMOPS Restrict'],
  ['site.tie', '10 / 45', '12 / 45', '19 / 45'],
  ['commissioning.prog', '0.0%', '1.0%', '3.0%'],
  ['commissioning.sys', '12', '12', '12'],
  ['commissioning.sheet', '0 / 480', '15 / 480', '42 / 480'],
  ['commissioning.punch', '48', '45', '38'],
  ['hse.lti', '0', '0', '0'],
  ['hse.obs', '780', '820', '890'],
  ['hse.weld', '1.7%', '1.4%', '1.2%'],
  ['hse.ncr', '3', '2', '1'],
];
const VARIANCE = {
  '64': [0, 0, -2, -3, -1, -4, -2, 0, 0, -1, -2, 0, 0],
  '65': [0, 0, -3, -4, -5, -4, -3, -2, 0, 0, -2, -3, 0],
  '66': [0, 0, 0, -2, -5, -3, -3, -2, 0, 0, -2, -3, 0],
};
const MILESTONES = [
  ['KD 01 - Effective Date (ED)', '01-Jul-2026', '01-Jul-2026', 'completed'],
  ['KD 02 - KOM & Key Personnel Mobilized', '08-Jul-2026', '08-Jul-2026', 'completed'],
  ['KD 07 - Detailed Work Plan Approved', '30-Jul-2026', '30-Jul-2026', 'completed'],
  ['KD 10-13 - PO for Major Packages Placed', '31-Aug-2026', '31-Aug-2026', 'completed'],
  ['KD 16 - Detailed Engineering 50% IFC', '15-Dec-2026', '15-Dec-2026', 'completed'],
  ['KD 17 - TCC Earthworks & Foundations', '13-Feb-2027', '13-Feb-2027', 'completed'],
  ['KD 18 - Detailed Engineering 100% IFC', '01-Jun-2027', '01-Jun-2027', 'completed'],
  ['KD 20 - TCC Readiness Certificate', '30-Jun-2027', '30-Jun-2027', 'completed'],
  ['KD 21 - Slug Catcher Delivered to SITE', '01-Dec-2027', '01-Dec-2027', 'not-started'],
  ['KD 22 - TEG Unit Delivered to SITE', '29-Jan-2028', '29-Jan-2028', 'not-started'],
  ['KD 23 - Metering Unit Delivered to SITE', '29-Jan-2028', '29-Jan-2028', 'not-started'],
  ['KD 24 - Functional Ready for Commissioning', '05-May-2028', '05-May-2028', 'not-started'],
  ['KD 27 - Provisional Acceptance Certificate', '03-Jan-2029', '03-Jan-2029', 'not-started'],
];
const ENGINEERING = [
  ['Process', 100, 100, 'on-track'], ['Piping & Layout', 100, 100, 'on-track'],
  ['Mechanical', 100, 100, 'on-track'], ['Civil/Struct', 100, 100, 'on-track'],
  ['Electrical', 100, 100, 'on-track'], ['Instrument', 100, 100, 'on-track'],
  ['Safety/HSE', 100, 100, 'on-track'], ['ICSS', 100, 100, 'on-track'],
  ['Telecom', 100, 100, 'on-track'], ['Comm. Eng.', 100, 100, 'on-track'],
];
const PROCUREMENT = [
  ['Pig Receiver (AA-8133)', '30-Sep-2026', '01-Sep-2027', '30-Nov-2027', 100],
  ['Slug Catcher (V-8133)', '31-Aug-2026', '01-Sep-2027', '30-Nov-2027', 100],
  ['TEG Package (C-8160 / A-8160)', '31-Aug-2026', '31-Oct-2027', '29-Jan-2028', 94],
  ['Mercury Removal Unit (A-8170)', '01-Sep-2026', '01-Nov-2027', '30-Jan-2028', 93],
  ['ICSS Cabinets', '31-Aug-2026', '02-Aug-2027', '16-Sep-2027', 100],
  ['Gas Fiscal Metering (M-8101)', '31-Aug-2026', '31-Oct-2027', '29-Jan-2028', 94],
  ['HIPPS Package', '31-Aug-2026', '02-Aug-2027', '16-Sep-2027', 100],
  ['HV Switchboard', '31-Aug-2026', '13-Jun-2027', '28-Jul-2027', 100],
  ['Electrical Room', '31-Aug-2026', '30-Oct-2027', '28-Jan-2028', 96],
  ['Instrument Room', '31-Aug-2026', '30-Oct-2027', '28-Jan-2028', 96],
  ['HP Separator (V-8151)', '30-Nov-2026', '26-Sep-2027', '25-Dec-2027', 100],
  ['Condensate Pump A/B (P-8151)', '31-Dec-2026', '29-Jul-2027', '27-Oct-2027', 100],
  ['Water Pump A/B (P-8152)', '31-Dec-2026', '29-Jul-2027', '27-Oct-2027', 100],
  ['Condensate Metering (M-8102)', '31-Aug-2026', '01-Oct-2027', '30-Dec-2027', 99],
  ['Water Metering Skid (M-8103)', '31-Aug-2026', '01-Oct-2027', '30-Dec-2027', 99],
  ['Flow Control Station (FCV-332)', '31-Aug-2026', '22-Oct-2027', '28-Jan-2028', 78],
];
const SC_LABELS = ["Jun-26","Jul-26","Aug-26","Sep-26","Oct-26","Nov-26","Dec-26","Jan-27","Feb-27","Mar-27","Apr-27","May-27","Jun-27","Jul-27","Aug-27","Sep-27","Oct-27","Nov-27","Dec-27","Jan-28","Feb-28","Mar-28","Apr-28","May-28","Jun-28","Jul-28","Aug-28","Sep-28","Oct-28","Nov-28","Dec-28","Jan-29","Feb-29","Mar-29","Apr-29","May-29"];
const SC_MONTHLY_PHYS = [0,0.356,1.917,0.955,1.08,2.201,1.604,1.282,1.304,3.504,2.12,2.253,2.145,5.743,4.281,3.023,3.758,3.077,2.386,2.347,2.063,2.42,1.915,1.899,0.743,0.752,0.948,0.917,0.793,0.575,0.589,0.506,0.446,0.096,0,0];
const SC_MONTHLY_MILE = [0,8,5,0,0,0,1,0,1,0,0,0,1,3,0,0,0,0,3,1.5,0,0,0,3.5,0,3,0,0,0,5,0,5,0,0,0,0];
const SC_OVERALL_CUM = [0,8.36,15.27,16.23,17.31,19.51,22.11,23.4,25.7,29.2,31.32,33.58,36.72,45.46,49.75,52.77,56.53,59.6,64.99,68.84,70.9,73.32,75.24,80.64,81.38,85.13,86.08,86.99,87.79,93.36,93.95,99.46,99.9,100,100,100];
const SC_MILE_LABELS = ['','Mobilization of KEY PERSONNEL & Contract KOM','Submission CCM, Local Communities, Management Plan, Security Plan for APPROVAL','','','','DE 50% IFC Return Code 1&2','','Completion of all earthworks and foundations for TCC','','','','DE 100% IFC Return Code 1&2','TCC READINESS CERTIFICATE','','','','','Slug Catcher delivered to SITE','TEG, Metering Unit delivered to SITE','','','','READY FOR COMMISSIONING CERTIFICATE','','ACHIEVEMENT OF COMMISSIONING CERTIFICATES','','','','PROVISIONAL ACCEPTANCE CERTIFICATE','','Completed of Start-up CERTIFICATE','','','',''];
const SC_OVERALL_PLAN = [0,0.59,3.79,5.38,7.18,10.85,13.52,15.66,17.83,23.67,27.21,30.96,34.54,44.11,51.24,56.28,62.54,67.67,71.65,75.56,79,83.03,86.23,89.39,90.63,91.88,93.46,94.99,96.31,97.27,98.25,99.1,99.84,100,100,100];
const SC_WP = [
  [0,3.06,6.23,9.3,12.46,15.53,18.69,21.86,24.72,27.89,30.95,34.12,37.18,40.35,43.51,46.58,49.74,52.81,55.98,59.14,62.1,65.27,68.34,71.5,74.57,77.73,80.9,83.96,87.13,90.19,93.36,96.53,99.39,100,100,100],
  [0,0,0,5.43,11.15,16.69,22.42,28.14,32.24,35.59,38.83,42.18,45.43,47.98,50.51,52.96,55.49,57.93,60.46,62.99,65.36,67.89,70.33,72.86,75.31,77.84,80.37,82.81,85.34,87.79,90.32,94.79,99.08,100,100,100],
  [0,5.74,10.82,15.15,19.63,23.97,28.45,32.93,37.37,45.41,53.45,61.75,69.79,75.58,81.07,82.93,84.68,86.37,88.11,89.86,91.49,93.06,93.67,94.3,94.91,95.55,96.18,96.79,97.43,98.04,98.67,99.31,99.88,100,100,100],
  [0,0,8.75,10.5,12.79,21.43,26.58,29.42,29.78,42.44,47.03,48.21,49.08,63.27,72.94,77.04,84.88,91.47,93.88,96.06,97.38,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100],
  [0,0,0,0,0,0,0,1.11,8.89,14.67,21.95,41.19,59.8,79.03,86.94,93.43,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100,100],
  [0,0,0,0,0,0,0.78,2.52,4.08,5.81,7.49,9.38,12.2,18.28,24.46,30.45,36.63,42.61,48.8,54.98,60.77,66.95,72.94,77.51,81.56,85.74,89.92,93.97,98.16,99.07,99.89,100,100,100,100,100],
  [0,0,0,0,0,0,0,0.09,1.3,2.63,3.93,5.27,6.57,15.16,24,32.56,41.4,49.95,58.79,67.63,75.9,84.74,93.29,100,100,100,100,100,100,100,100,100,100,100,100,100],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3.19,23,42.17,52.14,59.76,67.14,74.75,86.33,98.44,100,100,100,100,100],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,26.88,60.22,92.47,100,100,100,100,100,100,100,100],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,33.33,65.59,98.92,100,100,100,100,100,100,100],
];
const WP_NAMES = ["Management & Project Control","Temporary Construction Camp","Engineering","Procurement & Supply","Pre-Fabrication & Mech. Completion","Transport, Storage & Load-out","Construction & MC at SITE","Commissioning & Start-up","Operation & Maintenance","Final Documentation & Data"];
const WP_WEIGHTS = [10, 10, 5, 30, 10, 2, 28, 3, 1, 1];

/* ───────────────────────── workbook + styles ───────────────────────── */
const wb = new ExcelJS.Workbook();
wb.creator = 'IMA Brownfield';
const FONT = { name: 'Times New Roman', size: 11 };
const HEAD = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
const HEAD_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF24397A' } };
const AUTO_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF6FD' } };
const thin = { style: 'thin', color: { argb: 'FFBBC6DD' } };
const BORDER = { top: thin, left: thin, bottom: thin, right: thin };

function styleHeaderRow(ws, rowIdx, ncols) {
  const r = ws.getRow(rowIdx);
  for (let c = 1; c <= ncols; c++) {
    const cell = r.getCell(c);
    cell.font = HEAD; cell.fill = HEAD_FILL;
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = BORDER;
  }
}

/* A hidden machine tab the website reads (one Excel Table, headers row 1). */
function webTab(name, columns, rows, widths) {
  const ws = wb.addWorksheet(name, { state: 'hidden', views: [{ state: 'frozen', ySplit: 1 }] });
  ws.addTable({
    name: name, ref: 'A1', headerRow: true,
    style: { theme: 'TableStyleLight9', showRowStripes: true },
    columns: columns.map(c => ({ name: c, filterButton: true })),
    rows,
  });
  ws.getRow(1).eachCell(c => { c.font = HEAD; c.fill = HEAD_FILL; c.alignment = { vertical: 'middle' }; });
  for (let r = 2; r <= 1 + rows.length; r++) ws.getRow(r).eachCell(c => { if (!c.font || !c.font.bold) c.font = FONT; });
  (widths || []).forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  return ws;
}

/* A visible, human-edited tab the website also reads (Table, headers row 1). */
function listTab(name, columns, rows, widths) {
  const ws = webTab(name, columns, rows, widths);
  ws.state = 'visible';
  return ws;
}

const PMO_COLS = ['WBS / ID', 'Description', 'Weight %', 'Plan Start', 'Plan Finish',
  'Actual Start', 'Actual Finish', '% Complete', 'Status', 'Responsible', 'Remarks'];
const STATUS = p => p >= 100 ? 'Complete' : p > 0 ? 'In Progress' : 'Not Started';

/* A visible per-discipline task log. Row1 = Auto% roll-up, Row3 = headers, Row4+ = tasks.
   target = desired Auto% (example tasks are solved to hit it). extra = {cols:[], data:[[...]]} */
function taskSheet(name, title, target, taskNames, weights, pcts, extra) {
  const ws = wb.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 3 }] });
  // Row 1 — auto roll-up
  ws.getCell('A1').value = title + '  —  Auto % (Actual, current week):';
  ws.getCell('A1').font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF24397A' } };
  const roll = `IFERROR(ROUND(SUMPRODUCT($C$4:$C$1000,$H$4:$H$1000)/SUM($C$4:$C$1000),1),0)`;
  ws.getCell('B1').value = { formula: roll, result: target };
  ws.getCell('B1').font = { name: 'Times New Roman', size: 14, bold: true, color: { argb: 'FF1565C0' } };
  ws.getCell('B1').fill = AUTO_FILL; ws.getCell('B1').alignment = { horizontal: 'center' };
  ws.getCell('C1').value = '◀ tự tính từ Weight × % Complete';
  ws.getCell('C1').font = { name: 'Times New Roman', size: 9, italic: true, color: { argb: 'FF888888' } };
  // Row 3 — headers
  const cols = PMO_COLS.concat((extra && extra.cols) || []);
  cols.forEach((h, i) => { ws.getCell(3, i + 1).value = h; });
  styleHeaderRow(ws, 3, cols.length);
  // Row 4+ — tasks (weights sum 100; pct solved to hit target)
  taskNames.forEach((nm, i) => {
    const p = pcts[i];
    const row = [
      name + '-' + String(i + 1).padStart(3, '0'), nm, weights[i],
      '01-Jul-2026', '30-Jun-2028',
      p > 0 ? '01-Jul-2026' : '', p >= 100 ? '30-Jun-2028' : '',
      p, STATUS(p), 'PTSC', '',
    ];
    const ex = (extra && extra.data && extra.data[i]) || [];
    const full = row.concat(ex);
    full.forEach((v, c) => {
      const cell = ws.getCell(4 + i, c + 1);
      cell.value = v === '' ? null : v;
      cell.font = FONT; cell.border = BORDER;
      if (c === 2 || c === 7) cell.alignment = { horizontal: 'center' };
    });
  });
  const widths = [11, 34, 9, 12, 12, 12, 12, 11, 12, 12, 20].concat(((extra && extra.cols) || []).map(() => 11));
  widths.forEach((w, i) => { ws.getColumn(i + 1).width = w; });
  return ws;
}

/* ───────────────────────── README (visible, first) ───────────────────────── */
(function readme() {
  const ws = wb.addWorksheet('README', { views: [{ showGridLines: false }] });
  ws.getColumn(1).width = 4; ws.getColumn(2).width = 110;
  const lines = [
    ['', 'IMA BROWNFIELD — EPCI PROGRESS WORKBOOK', 'title'],
    ['', '', ''],
    ['', 'Cách dùng:', 'h'],
    ['', '1. Mỗi discipline có 1 sheet log task: ENG, FAB, LOG, SITE, COMM. Nhập task vào, điền Weight % và % Complete.', ''],
    ['', '   Ô "Auto %" (góc trên, màu xanh) tự tính tiến độ Actual của discipline = Σ(Weight×%Complete)/ΣWeight.', ''],
    ['', '2. Procurement: list 16 package — cập nhật cột Prog (0–100) và các mốc PO / FAT / Site.', ''],
    ['', '3. HSE: log theo tuần (manhours, LTI, observations, NCR).', ''],
    ['', '4. Milestones: cập nhật Forecast + Status các Key Date.', ''],
    ['', '', ''],
    ['', 'Cập nhật hằng tuần (giữ trend trên web):', 'h'],
    ['', 'Cuối tuần: ở các sheet ẩn KPI/Phase/Sections, copy cột tuần hiện tại → Paste special → Values only (chốt số),', ''],
    ['', 'rồi thêm cột tuần mới (vd Wk67) sao chép công thức tuần cũ. Web vẽ trend qua các tuần đã chốt.', ''],
    ['', '', ''],
    ['', 'Sheet ẩn (KPI, Phase, Sections, Variance, Engineering, SCurve, WPInfo) = dữ liệu web đọc.', 'h'],
    ['', 'KHÔNG sửa tay trừ các ô đếm/KPI (PO, NCR, punch, manhours…). Bỏ ẩn: chuột phải tab → Unhide.', ''],
    ['', '', ''],
    ['', 'Đẩy lên web: Share → Anyone with the link → Viewer. Copy Spreadsheet ID (đoạn /d/<ID>/edit) → đặt SHEETS_ID.', 'h'],
    ['', 'Chi tiết: docs/BACKEND_SETUP.md §F–H. Số sửa trong Sheet → web tự cập nhật ≤ 5 phút.', ''],
  ];
  lines.forEach((ln, i) => {
    const cell = ws.getCell(i + 1, 2);
    cell.value = ln[1];
    if (ln[2] === 'title') cell.font = { name: 'Times New Roman', size: 16, bold: true, color: { argb: 'FF24397A' } };
    else if (ln[2] === 'h') cell.font = { name: 'Times New Roman', size: 11, bold: true, color: { argb: 'FF24397A' } };
    else cell.font = { name: 'Times New Roman', size: 11 };
  });
})();

/* ───────────────────────── task sheets (visible) ───────────────────────── */
const W = [40, 30, 20, 10];
taskSheet('ENG', 'Engineering', 100,
  ['IFC drawings — Process & Mechanical', 'IFC drawings — Piping & Layout', 'IFC drawings — Electrical & Instrument', 'As-built & engineering close-out'],
  W, [100, 100, 100, 100],
  { cols: ['Group'], data: [['Process'], ['Piping & Layout'], ['Electrical/Instrument'], ['Comm. Eng.']] });
taskSheet('FAB', 'Fabrication', 93,
  ['Structural fabrication', 'Piping spool fabrication', 'Equipment skid assembly', 'Surface treatment & painting'],
  W, [100, 95, 90, 65],
  { cols: ['Welds', 'NDT %', 'Tonnage (T)'], data: [[14000, 99.3, 150], [11000, '', 130], [7000, '', 90], [3300, '', 50]] });
taskSheet('LOG', 'Logistics & Transport', 48,
  ['Sea-fastening & grillage design', 'Load-out engineering', 'Transport / MWS mobilization', 'Offshore installation'],
  W, [60, 50, 40, 10],
  { cols: ['MWS', 'Weight (T)'], data: [['4 / 4', 800], ['', 500], ['', 262], ['', '']] });
taskSheet('SITE', 'Site Construction', 30.5,
  ['Civil works & foundations', 'Structural steel erection', 'Mechanical / piping installation', 'E&I installation & tie-ins'],
  W, [40, 30, 15, 25],
  { cols: ['Tie-in Done', 'Tie-in Total', 'PTW'], data: [[19, 45, 28], ['', '', ''], ['', '', ''], ['', '', '']] });
taskSheet('COMM', 'Commissioning', 3,
  ['Pre-commissioning preparation', 'System walkdowns', 'Loop checks & function tests', 'Start-up & performance test'],
  W, [5, 2, 0, 4],
  { cols: ['System', 'Punch'], data: [['Process', 20], ['Utilities', 10], ['Safety', 8], ['', 0]] });

/* HSE — weekly log (visible; not auto-wired to web) */
(function hse() {
  const ws = wb.addWorksheet('HSE', { views: [{ state: 'frozen', ySplit: 1 }] });
  const cols = ['Week', 'Safe Manhours', 'LTI', 'Observations', 'NCR', 'Comment'];
  cols.forEach((h, i) => ws.getCell(1, i + 1).value = h);
  styleHeaderRow(ws, 1, cols.length);
  const rows = [
    ['64', '1,210K', 0, 780, 3, ''],
    ['65', '1,250K', 0, 820, 2, ''],
    ['66', '1,310K', 0, 890, 1, ''],
  ];
  rows.forEach((r, ri) => r.forEach((v, ci) => {
    const cell = ws.getCell(2 + ri, ci + 1); cell.value = v === '' ? null : v; cell.font = FONT; cell.border = BORDER;
  }));
  [8, 14, 8, 14, 8, 30].forEach((w, i) => ws.getColumn(i + 1).width = w);
})();

/* Procurement (visible) + Milestones (visible) — website reads these directly */
listTab('Procurement', ['Name', 'PO', 'FAT', 'Site', 'Prog'], PROCUREMENT, [32, 14, 14, 14, 8]);
listTab('Milestones', ['Name', 'Baseline', 'Forecast', 'Status'], MILESTONES, [42, 14, 14, 14]);

/* ───────────────────────── hidden machine tabs ───────────────────────── */
webTab('KPI', ['Metric', 'Wk64', 'Wk65', 'Wk66'], KPI, [22, 34, 34, 34]);
const phaseWs = webTab('Phase', ['Workfront', 'P64', 'A64', 'P65', 'A65', 'P66', 'A66'], PHASE, [30, 8, 8, 8, 8, 8, 8]);
const secWs = webTab('Sections', ['Key', 'Wk64', 'Wk65', 'Wk66'], SECTIONS, [24, 34, 34, 34]);
webTab('Variance', ['Week', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10', 'V11', 'V12', 'V13'],
  ['64', '65', '66'].map(w => [w, ...VARIANCE[w]]), [8, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6]);
webTab('Engineering', ['Name', 'Actual', 'Target', 'Status'], ENGINEERING, [28, 9, 9, 14]);
webTab('SCurve',
  ['Month', 'MonthlyPhysical', 'MonthlyMilestone', 'OverallCum', 'MilestoneLabel', 'OverallPlan',
    'WP1', 'WP2', 'WP3', 'WP4', 'WP5', 'WP6', 'WP7', 'WP8', 'WP9', 'WP10'],
  SC_LABELS.map((m, i) => [m, SC_MONTHLY_PHYS[i], SC_MONTHLY_MILE[i], SC_OVERALL_CUM[i], SC_MILE_LABELS[i], SC_OVERALL_PLAN[i], ...SC_WP.map(wp => wp[i])]),
  [9, 15, 16, 11, 40, 11, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8]);
webTab('WPInfo', ['WP', 'Name', 'Weight'], WP_NAMES.map((n, i) => [`WP${i + 1}`, n, WP_WEIGHTS[i]]), [8, 40, 9]);

/* ── Hybrid wiring: CURRENT week (Wk66) Actual % ← detail-sheet Auto% cells ── */
// Phase: column G = A66; data rows 2..7 in PHASE order. Procurement (row3) stays static.
const phaseLink = { 2: 'ENG', 4: 'FAB', 5: 'LOG', 6: 'SITE', 7: 'COMM' };
const phaseRes = { 2: 100, 4: 93, 5: 48, 6: 30.5, 7: 3 };
for (const r of Object.keys(phaseLink)) {
  phaseWs.getCell('G' + r).value = { formula: `${phaseLink[r]}!B1`, result: phaseRes[r] };
}
// Sections: column D = Wk66; the *.prog rows reference the same Auto% as text "NN.N%".
const secLink = { 'engineering.prog': ['ENG', '100.0'], 'fabrication.prog': ['FAB', '93.0'], 'logistics.prog': ['LOG', '48.0'], 'site.prog': ['SITE', '30.5'], 'commissioning.prog': ['COMM', '3.0'] };
SECTIONS.forEach((row, i) => {
  const link = secLink[row[0]];
  if (link) secWs.getCell('D' + (i + 2)).value = { formula: `TEXT(${link[0]}!B1,"0.0")&"%"`, result: link[1] + '%' };
});

wb.xlsx.writeFile(OUT).then(() => {
  console.log('WROTE', OUT);
  console.log('sheets:', wb.worksheets.map(w => `${w.name}${w.state === 'hidden' ? '(hidden)' : ''}`).join(', '));
}).catch(e => { console.error(e); process.exit(1); });
