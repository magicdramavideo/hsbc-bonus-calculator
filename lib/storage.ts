/**
 * 本地資料儲存工具函數（使用 AsyncStorage）
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FinancialMetrics, NonFinancialMetrics } from "./calculator";

export interface CalculationRecord {
  id: string; // 唯一識別碼（時間戳記）
  timestamp: number; // 儲存時間
  position: string; // 職級
  recognitionRatio: number; // 認列比例（0-100）
  financialMetrics: FinancialMetrics; // 財務指標
  nonFinancialMetrics: NonFinancialMetrics; // 非財務指標
  financialScore: number; // 財務指標總分
  nonFinancialScore: number; // 非財務指標總分
  finalBonus: number; // 最終獎金
  penalties: string[]; // 懲罰項目
}

const STORAGE_KEY = "hsbc_bonus_records";

/**
 * 載入所有紀錄
 */
export async function loadRecords(): Promise<CalculationRecord[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("載入紀錄失敗:", error);
    return [];
  }
}

/**
 * 儲存新紀錄
 */
export async function saveRecord(record: Omit<CalculationRecord, "id" | "timestamp">): Promise<void> {
  try {
    const records = await loadRecords();
    const newRecord: CalculationRecord = {
      ...record,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    records.unshift(newRecord); // 新紀錄放在最前面
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error("儲存紀錄失敗:", error);
    throw error;
  }
}

/**
 * 更新現有紀錄
 */
export async function updateRecord(id: string, updates: Partial<CalculationRecord>): Promise<void> {
  try {
    const records = await loadRecords();
    const index = records.findIndex((r) => r.id === id);
    if (index === -1) throw new Error("找不到紀錄");

    records[index] = { ...records[index], ...updates };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error("更新紀錄失敗:", error);
    throw error;
  }
}

/**
 * 刪除紀錄
 */
export async function deleteRecord(id: string): Promise<void> {
  try {
    const records = await loadRecords();
    const filtered = records.filter((r) => r.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("刪除紀錄失敗:", error);
    throw error;
  }
}

/**
 * 取得單筆紀錄
 */
export async function getRecord(id: string): Promise<CalculationRecord | null> {
  try {
    const records = await loadRecords();
    return records.find((r) => r.id === id) || null;
  } catch (error) {
    console.error("取得紀錄失敗:", error);
    return null;
  }
}
