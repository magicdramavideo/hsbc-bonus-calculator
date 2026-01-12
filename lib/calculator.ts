/**
 * 獎金計算邏輯工具函數
 */

export interface FinancialMetrics {
  investmentIncome: number; // 投資手收
  insuranceIncome: number; // 保險手收
  ca: number; // CA
  nnm: number; // NNM
  wealthPenetration: number; // Wealth Penetration
}

export interface NonFinancialMetrics {
  risk: number; // Risk（輸入值）
  quality: number; // Quality（輸入值）
  complaint: number; // Complaint（輸入值）
  clientAppointment: number; // Client Appointment
  nps: number; // NPS
}

export interface CalculationTargets {
  investmentTarget: number; // 投資手收季目標
  insuranceTarget: number; // 保險手收季目標
  totalIncomeTarget: number; // 總手收季目標
  caTarget: number; // CA季目標
  nnmTarget: number; // NNM季目標
  wealthPenetrationTarget: number; // Wealth Penetration季目標
}

export interface AchievementRates {
  investmentRate: number; // 投資手收達成率
  insuranceRate: number; // 保險手收達成率
  totalIncomeRate: number; // 總手收達成率
  caRate: number; // CA達成率
  nnmRate: number; // NNM達成率
  wealthPenetrationRate: number; // Wealth Penetration達成率
  riskRate: number; // Risk達成率
  qualityRate: number; // Quality達成率
  complaintRate: number; // Complaint達成率
  clientAppointmentRate: number; // Client Appointment達成率
  npsRate: number; // NPS達成率
}

export interface BonusResult {
  financialScore: number; // 財務指標總分（百分比）
  nonFinancialScore: number; // 非財務指標總分（百分比）
  baseBonus: number; // 基礎獎金
  finalBonus: number; // 最終獎金
  penalties: string[]; // 適用的懲罰項目
}

/**
 * 計算達成率（百分比，保留兩位小數）
 */
export function calculateRate(actual: number, target: number): number {
  if (target === 0) return 100.0;
  return Math.round((actual / target) * 10000) / 100;
}

/**
 * 檢查達成率是否超過上限
 */
export function checkRateCap(rate: number, cap: number): { isCapped: boolean; displayRate: number } {
  if (rate > cap) {
    return { isCapped: true, displayRate: cap };
  }
  return { isCapped: false, displayRate: rate };
}

/**
 * 計算財務指標達成率
 */
export function calculateFinancialRates(
  metrics: FinancialMetrics,
  targets: CalculationTargets
): Partial<AchievementRates> {
  const totalIncome = metrics.investmentIncome + metrics.insuranceIncome;
  const nnmRate = calculateRate(metrics.nnm, targets.nnmTarget);
  const wealthPenetrationRate = calculateRate(
    metrics.wealthPenetration,
    targets.wealthPenetrationTarget
  );

  return {
    investmentRate: calculateRate(metrics.investmentIncome, targets.investmentTarget),
    insuranceRate: calculateRate(metrics.insuranceIncome, targets.insuranceTarget),
    totalIncomeRate: calculateRate(totalIncome, targets.totalIncomeTarget),
    caRate: calculateRate(metrics.ca, targets.caTarget),
    nnmRate: Math.min(nnmRate, 200),
    wealthPenetrationRate: Math.min(wealthPenetrationRate, 200),
  };
}

/**
 * 計算非財務指標達成率
 */
export function calculateNonFinancialRates(
  metrics: NonFinancialMetrics
): Partial<AchievementRates> {
  const riskRate = metrics.risk === 0 ? 100.0 : 0.0;
  const qualityRate = metrics.quality === 0 ? 100.0 : 0.0;
  const complaintRate = metrics.complaint === 0 ? 100.0 : 0.0;
  const clientAppointmentRate = calculateRate(metrics.clientAppointment, 3);
  const npsRate = calculateRate(metrics.nps, 100);

  return {
    riskRate: Math.min(riskRate, 100),
    qualityRate: Math.min(qualityRate, 100),
    complaintRate: Math.min(complaintRate, 100),
    clientAppointmentRate: Math.min(clientAppointmentRate, 100),
    npsRate: Math.min(npsRate, 100),
  };
}

/**
 * 計算財務指標總分
 * 公式：投資手收*25% + 保險手收*25% + CA*20% + NNM*10% + Wealth Penetration*20%
 */
export function calculateFinancialScore(rates: Partial<AchievementRates>): number {
  const score =
    (rates.investmentRate || 0) * 0.25 +
    (rates.insuranceRate || 0) * 0.25 +
    (rates.caRate || 0) * 0.2 +
    (rates.nnmRate || 0) * 0.1 +
    (rates.wealthPenetrationRate || 0) * 0.2;

  return Math.round(score * 100) / 100;
}

/**
 * 計算非財務指標總分
 * 公式：Risk*20% + Quality*20% + Client Appointment*20% + Complaint*20% + NPS*20%
 * 特殊規則：若NPS為100，則NPS以25%計算，其他四項各佔20%；若NPS<100，則五項各佔20%
 */
export function calculateNonFinancialScore(rates: Partial<AchievementRates>): number {
  const npsRate = rates.npsRate || 0;
  const isNpsPerfect = npsRate >= 100;

  let score: number;

  if (isNpsPerfect) {
    // NPS為100時，NPS佔25%，其他四項各佔20%
    score =
      (rates.riskRate || 0) * 0.2 +
      (rates.qualityRate || 0) * 0.2 +
      (rates.clientAppointmentRate || 0) * 0.2 +
      (rates.complaintRate || 0) * 0.2 +
      npsRate * 0.25;
  } else {
    // NPS未達100時，五項各佔20%
    score =
      (rates.riskRate || 0) * 0.2 +
      (rates.qualityRate || 0) * 0.2 +
      (rates.clientAppointmentRate || 0) * 0.2 +
      (rates.complaintRate || 0) * 0.2 +
      npsRate * 0.2;
  }

  return Math.round(score * 100) / 100;
}

/**
 * 計算最終獎金
 * @param qti 職級QTI
 * @param financialScore 財務指標總分
 * @param nonFinancialScore 非財務指標總分
 * @param metrics 財務指標數據
 * @param targets 目標數據
 */
export function calculateBonus(
  qti: number,
  financialScore: number,
  nonFinancialScore: number,
  metrics: FinancialMetrics,
  targets: CalculationTargets
): BonusResult {
  const penalties: string[] = [];

  // 1. 檢查財務與非財務指標是否皆達70%
  if (financialScore < 70 || nonFinancialScore < 70) {
    return {
      financialScore,
      nonFinancialScore,
      baseBonus: 0,
      finalBonus: 0,
      penalties: ["財務或非財務指標未達70%"],
    };
  }

  // 計算基礎獎金（使用限制後的達成率）
  let baseBonus = qti * (financialScore / 100) * (nonFinancialScore / 100);
  let finalBonus = baseBonus;

  // 2. 檢查CA及NNM是否皆低於目標
  const caTarget = targets.caTarget;
  const nnmTarget = targets.nnmTarget;

  if (metrics.ca < caTarget && metrics.nnm < nnmTarget) {
    finalBonus *= 0.9;
    penalties.push("CA及NNM皆低於目標（-10%）");
  }

  // 3. 檢查投資手收+保險手收是否低於職級業績目標
  const totalIncome = metrics.investmentIncome + metrics.insuranceIncome;
  const totalIncomeTarget = targets.totalIncomeTarget;

  if (totalIncome < totalIncomeTarget) {
    finalBonus *= 0.5;
    penalties.push("總手收低於業績目標（-50%）");
  }

  return {
    financialScore,
    nonFinancialScore,
    baseBonus: Math.round(baseBonus),
    finalBonus: Math.round(finalBonus),
    penalties,
  };
}
