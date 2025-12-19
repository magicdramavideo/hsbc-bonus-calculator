/**
 * 匯出功能工具函數
 */

import * as XLSX from "xlsx";

export interface ExportRecord {
  position: string;
  recognitionRatio: number;
  financialMetrics: {
    investmentIncome: number;
    insuranceIncome: number;
    ca: number;
    nnm: number;
    wealthPenetration: number;
  };
  nonFinancialMetrics: {
    risk: number;
    quality: number;
    complaint: number;
    clientAppointment: number;
    nps: number;
  };
  financialScore: number;
  nonFinancialScore: number;
  finalBonus: number;
  penalties: string[];
  createdAt?: string;
}

/**
 * 生成 HTML 格式的紀錄
 */
export function generateRecordHTML(record: ExportRecord): string {
  const totalIncome = record.financialMetrics.investmentIncome + record.financialMetrics.insuranceIncome;
  const disbursalRatio = totalIncome > 0 ? ((record.finalBonus / totalIncome) * 100).toFixed(2) : "0.00";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #C41E3A; text-align: center; }
    .section { margin: 20px 0; }
    .section-title { font-weight: bold; font-size: 16px; color: #C41E3A; margin-top: 15px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .result { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
    .bonus-value { font-size: 18px; font-weight: bold; color: #C41E3A; }
    .penalty { color: #FF3B30; margin: 5px 0; }
  </style>
</head>
<body>
  <h1>HSBC 2026 理專獎金計算紀錄</h1>
  
  <div class="section">
    <div class="section-title">基本資訊</div>
    <table>
      <tr><td>職級</td><td>${record.position}</td></tr>
      <tr><td>認列比例</td><td>${record.recognitionRatio}%</td></tr>
      <tr><td>記錄時間</td><td>${record.createdAt || new Date().toLocaleString("zh-TW")}</td></tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">財務指標</div>
    <table>
      <tr>
        <th>指標</th>
        <th>輸入值</th>
      </tr>
      <tr><td>投資手收</td><td>${record.financialMetrics.investmentIncome.toLocaleString()}</td></tr>
      <tr><td>保險手收</td><td>${record.financialMetrics.insuranceIncome.toLocaleString()}</td></tr>
      <tr><td>總手收</td><td>${totalIncome.toLocaleString()}</td></tr>
      <tr><td>CA</td><td>${record.financialMetrics.ca}</td></tr>
      <tr><td>NNM</td><td>${record.financialMetrics.nnm.toLocaleString()}</td></tr>
      <tr><td>Wealth Penetration</td><td>${record.financialMetrics.wealthPenetration}</td></tr>
    </table>
    <p><strong>財務指標得分：${record.financialScore.toFixed(2)}%</strong></p>
  </div>

  <div class="section">
    <div class="section-title">非財務指標</div>
    <table>
      <tr>
        <th>指標</th>
        <th>輸入值</th>
      </tr>
      <tr><td>Risk</td><td>${record.nonFinancialMetrics.risk}</td></tr>
      <tr><td>Quality</td><td>${record.nonFinancialMetrics.quality}</td></tr>
      <tr><td>Complaint</td><td>${record.nonFinancialMetrics.complaint}</td></tr>
      <tr><td>Client Appointment</td><td>${record.nonFinancialMetrics.clientAppointment}</td></tr>
      <tr><td>NPS</td><td>${record.nonFinancialMetrics.nps}</td></tr>
    </table>
    <p><strong>非財務指標得分：${record.nonFinancialScore.toFixed(2)}%</strong></p>
  </div>

  <div class="result">
    <div class="section-title">獎金結果</div>
    <p><strong>基礎獎金：</strong> $${record.finalBonus.toLocaleString()}</p>
    <p><strong>提撥比：</strong> ${disbursalRatio}%</p>
    ${record.penalties.length > 0 ? `
      <div style="margin-top: 10px;">
        <strong>適用懲罰：</strong>
        ${record.penalties.map((p) => `<div class="penalty">• ${p}</div>`).join("")}
      </div>
    ` : ""}
  </div>
</body>
</html>
  `;
}

/**
 * 匯出為 PDF（通過 HTML）
 */
export async function exportToPDF(record: ExportRecord, filename: string): Promise<void> {
  try {
    const html = generateRecordHTML(record);
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/html;charset=utf-8," + encodeURIComponent(html));
    element.setAttribute("download", `${filename}.html`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  } catch (error) {
    console.error("PDF 匯出失敗:", error);
    throw error;
  }
}

/**
 * 匯出為 Excel
 */
export async function exportToExcel(record: ExportRecord, filename: string): Promise<void> {
  try {
    const totalIncome = record.financialMetrics.investmentIncome + record.financialMetrics.insuranceIncome;
    const disbursalRatio = totalIncome > 0 ? ((record.finalBonus / totalIncome) * 100).toFixed(2) : "0.00";

    // 建立工作簿
    const workbook = XLSX.utils.book_new();

    // 基本資訊工作表
    const basicData = [
      ["HSBC 2026 理專獎金計算紀錄"],
      [],
      ["職級", record.position],
      ["認列比例", `${record.recognitionRatio}%`],
      ["記錄時間", record.createdAt || new Date().toLocaleString("zh-TW")],
    ];
    const basicSheet = XLSX.utils.aoa_to_sheet(basicData);
    XLSX.utils.book_append_sheet(workbook, basicSheet, "基本資訊");

    // 財務指標工作表
    const financialData = [
      ["財務指標"],
      ["指標", "輸入值"],
      ["投資手收", record.financialMetrics.investmentIncome],
      ["保險手收", record.financialMetrics.insuranceIncome],
      ["總手收", totalIncome],
      ["CA", record.financialMetrics.ca],
      ["NNM", record.financialMetrics.nnm],
      ["Wealth Penetration", record.financialMetrics.wealthPenetration],
      [],
      ["財務指標得分", `${record.financialScore.toFixed(2)}%`],
    ];
    const financialSheet = XLSX.utils.aoa_to_sheet(financialData);
    XLSX.utils.book_append_sheet(workbook, financialSheet, "財務指標");

    // 非財務指標工作表
    const nonFinancialData = [
      ["非財務指標"],
      ["指標", "輸入值"],
      ["Risk", record.nonFinancialMetrics.risk],
      ["Quality", record.nonFinancialMetrics.quality],
      ["Complaint", record.nonFinancialMetrics.complaint],
      ["Client Appointment", record.nonFinancialMetrics.clientAppointment],
      ["NPS", record.nonFinancialMetrics.nps],
      [],
      ["非財務指標得分", `${record.nonFinancialScore.toFixed(2)}%`],
    ];
    const nonFinancialSheet = XLSX.utils.aoa_to_sheet(nonFinancialData);
    XLSX.utils.book_append_sheet(workbook, nonFinancialSheet, "非財務指標");

    // 獎金結果工作表
    const resultData = [
      ["獎金結果"],
      ["基礎獎金", `$${record.finalBonus.toLocaleString()}`],
      ["提撥比", `${disbursalRatio}%`],
      [],
      ...(record.penalties.length > 0
        ? [["適用懲罰"], ...record.penalties.map((p) => [p])]
        : []),
    ];
    const resultSheet = XLSX.utils.aoa_to_sheet(resultData);
    XLSX.utils.book_append_sheet(workbook, resultSheet, "獎金結果");

    // 寫入檔案
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error("Excel 匯出失敗:", error);
    throw error;
  }
}

/**
 * 匯出為圖片（HTML 截圖）
 */
export async function exportAsImage(record: ExportRecord, filename: string): Promise<void> {
  try {
    const html = generateRecordHTML(record);
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/html;charset=utf-8," + encodeURIComponent(html));
    element.setAttribute("download", `${filename}.html`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  } catch (error) {
    console.error("圖片匯出失敗:", error);
    throw error;
  }
}
