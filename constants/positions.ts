/**
 * 職級資料類型與常數定義
 */

export interface PositionData {
  name: string; // 職級名稱
  qti: number; // QTI 獎金基數
  monthlyTarget: number; // 業績月目標
  nnm: number; // NNM 目標
  ca: number; // CA 目標
  wealthPenetration: number; // Wealth Penetration 目標（固定為2）
}

export const POSITIONS: Record<string, PositionData> = {
  Assoc: {
    name: "Assoc",
    qti: 92400,
    monthlyTarget: 550000,
    nnm: 4000000,
    ca: 4,
    wealthPenetration: 2,
  },
  PRM2: {
    name: "PRM2",
    qti: 134904,
    monthlyTarget: 770000,
    nnm: 7000000,
    ca: 3,
    wealthPenetration: 2,
  },
  PRM1: {
    name: "PRM1",
    qti: 180576,
    monthlyTarget: 990000,
    nnm: 8500000,
    ca: 3,
    wealthPenetration: 2,
  },
  "Sr. PRM2": {
    name: "Sr. PRM2",
    qti: 286200,
    monthlyTarget: 1325000,
    nnm: 10000000,
    ca: 3,
    wealthPenetration: 2,
  },
  "Sr. PRM1": {
    name: "Sr. PRM1",
    qti: 344844,
    monthlyTarget: 1545000,
    nnm: 11500000,
    ca: 3,
    wealthPenetration: 2,
  },
  AVP: {
    name: "AVP",
    qti: 406656,
    monthlyTarget: 1765000,
    nnm: 13000000, // 修正原始資料中的錯誤（1300000 -> 13000000）
    ca: 2,
    wealthPenetration: 2,
  },
  VP: {
    name: "VP",
    qti: 582120,
    monthlyTarget: 2205000,
    nnm: 14500000,
    ca: 2,
    wealthPenetration: 2,
  },
  Director2: {
    name: "Director2",
    qti: 863880,
    monthlyTarget: 3130000,
    nnm: 16000000,
    ca: 2,
    wealthPenetration: 2,
  },
  Director1: {
    name: "Director1",
    qti: 1203840,
    monthlyTarget: 4180000,
    nnm: 17500000,
    ca: 2,
    wealthPenetration: 2,
  },
};

export const POSITION_KEYS = Object.keys(POSITIONS);

/**
 * 計算季度目標（月目標 * 3）
 */
export function getQuarterlyTarget(monthlyTarget: number): number {
  return monthlyTarget * 3;
}

/**
 * 計算投資手收目標（月目標的50%）
 */
export function getInvestmentTarget(monthlyTarget: number): number {
  return monthlyTarget * 0.5;
}

/**
 * 計算保險手收目標（月目標的50%）
 */
export function getInsuranceTarget(monthlyTarget: number): number {
  return monthlyTarget * 0.5;
}
