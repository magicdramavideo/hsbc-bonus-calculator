import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { POSITIONS, getQuarterlyTarget, getInvestmentTarget, getInsuranceTarget } from "@/constants/positions";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  calculateFinancialRates,
  calculateNonFinancialRates,
  calculateFinancialScore,
  calculateNonFinancialScore,
  calculateBonus,
  type FinancialMetrics,
  type NonFinancialMetrics,
  type CalculationTargets,
} from "@/lib/calculator";
import { saveRecord } from "@/lib/storage";

export default function CalculatorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const position = params.position as string;
  const recognitionRatio = parseFloat(params.recognitionRatio as string) || 100;

  const positionData = POSITIONS[position];
  const adjustedRatio = recognitionRatio / 100;

  // 計算調整後的目標
  const adjustedMonthlyTarget = Math.round(positionData.monthlyTarget * adjustedRatio);
  const targets: CalculationTargets = {
    investmentTarget: getInvestmentTarget(adjustedMonthlyTarget) * 3,
    insuranceTarget: getInsuranceTarget(adjustedMonthlyTarget) * 3,
    totalIncomeTarget: getQuarterlyTarget(adjustedMonthlyTarget),
    caTarget: Math.round(positionData.ca * adjustedRatio * 3),
    nnmTarget: Math.round(positionData.nnm * adjustedRatio * 3),
    wealthPenetrationTarget: positionData.wealthPenetration * 3,
  };

  const adjustedQTI = Math.round(positionData.qti * adjustedRatio);

  // 財務指標狀態
  const [investmentIncome, setInvestmentIncome] = useState("");
  const [insuranceIncome, setInsuranceIncome] = useState("");
  const [ca, setCa] = useState("");
  const [nnm, setNnm] = useState("");
  const [wealthPenetration, setWealthPenetration] = useState("");

  // 非財務指標狀態
  const [risk, setRisk] = useState("");
  const [quality, setQuality] = useState("");
  const [complaint, setComplaint] = useState("");
  const [clientAppointment, setClientAppointment] = useState("");
  const [nps, setNps] = useState("");

  const cardBg = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");
  const errorColor = useThemeColor({}, "error");

  // 計算財務指標
  const financialMetrics: FinancialMetrics = {
    investmentIncome: parseFloat(investmentIncome) || 0,
    insuranceIncome: parseFloat(insuranceIncome) || 0,
    ca: parseFloat(ca) || 0,
    nnm: parseFloat(nnm) || 0,
    wealthPenetration: parseFloat(wealthPenetration) || 0,
  };

  const financialRates = calculateFinancialRates(financialMetrics, targets);
  const financialScore = calculateFinancialScore(financialRates);

  // 計算原始達成率用於顯示（不限制上限）
  const rawFinancialRates = {
    investmentRate: (financialMetrics.investmentIncome / targets.investmentTarget) * 100 || 0,
    insuranceRate: (financialMetrics.insuranceIncome / targets.insuranceTarget) * 100 || 0,
    totalIncomeRate: ((financialMetrics.investmentIncome + financialMetrics.insuranceIncome) / targets.totalIncomeTarget) * 100 || 0,
    caRate: (financialMetrics.ca / targets.caTarget) * 100 || 0,
    nnmRate: (financialMetrics.nnm / targets.nnmTarget) * 100 || 0,
    wealthPenetrationRate: (financialMetrics.wealthPenetration / targets.wealthPenetrationTarget) * 100 || 0,
  };

  // 計算非財務指標
  const nonFinancialMetrics: NonFinancialMetrics = {
    risk: parseFloat(risk) || 0,
    quality: parseFloat(quality) || 0,
    complaint: parseFloat(complaint) || 0,
    clientAppointment: parseFloat(clientAppointment) || 0,
    nps: parseFloat(nps) || 0,
  };

  const nonFinancialRates = calculateNonFinancialRates(nonFinancialMetrics);
  const nonFinancialScore = calculateNonFinancialScore(nonFinancialRates);

  // 計算原始非財務指標達成率用於顯示（不限制上限）
  const rawNonFinancialRates = {
    riskRate: nonFinancialMetrics.risk === 0 ? 100.0 : 0.0,
    qualityRate: nonFinancialMetrics.quality === 0 ? 100.0 : 0.0,
    complaintRate: nonFinancialMetrics.complaint === 0 ? 100.0 : 0.0,
    clientAppointmentRate: (nonFinancialMetrics.clientAppointment / 3) * 100 || 0,
    npsRate: (nonFinancialMetrics.nps / 100) * 100 || 0,
  };

  // 計算獎金
  const bonusResult = calculateBonus(
    adjustedQTI,
    financialScore,
    nonFinancialScore,
    financialMetrics,
    targets
  );

  const totalIncome = financialMetrics.investmentIncome + financialMetrics.insuranceIncome;

  const getRateColor = (rate: number, cap?: number) => {
    if (cap && rate > cap) return errorColor;
    if (rate >= 100) return successColor;
    if (rate >= 70) return warningColor;
    return errorColor;
  };

  const getRateDisplay = (rate: number, cap?: number) => {
    if (cap && rate > cap) {
      return `${cap}% 超過Cap`;
    }
    return `${Math.min(rate, cap || rate).toFixed(2)}%`;
  };

  const getRateDisplayColor = (rate: number, cap?: number) => {
    if (cap && rate > cap) {
      return errorColor;
    }
    return getRateColor(rate, cap);
  };

  const handleSave = async () => {
    try {
      await saveRecord({
        position,
        recognitionRatio,
        financialMetrics,
        nonFinancialMetrics,
        financialScore,
        nonFinancialScore,
        finalBonus: bonusResult.finalBonus,
        penalties: bonusResult.penalties,
      });
      Alert.alert("成功", "紀錄已儲存", [
        {
          text: "確定",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      Alert.alert("錯誤", "儲存失敗，請稍後再試");
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>
          獎金計算
        </ThemedText>
        <ThemedText style={styles.subtitle}>
          {position} | 認列比例 {recognitionRatio}%
        </ThemedText>
      </ThemedView>

      {/* 財務指標 */}
      <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.cardHeader}>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            財務指標
          </ThemedText>
          <ThemedText
            style={[styles.scoreText, { color: getRateColor(financialScore, undefined) }]}
          >
            {financialScore.toFixed(2)}%
          </ThemedText>
        </View>

        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>投資手收</ThemedText>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
              value={investmentIncome}
              onChangeText={setInvestmentIncome}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
            />
            <ThemedText style={styles.targetText}>
              / {targets.investmentTarget.toLocaleString()}
            </ThemedText>
            <ThemedText
              style={[styles.rateText, { color: getRateColor(financialRates.investmentRate || 0, undefined) }]}
            >
              {(financialRates.investmentRate || 0).toFixed(2)}%
            </ThemedText>
          </View>
        </View>

        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>保險手收</ThemedText>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
              value={insuranceIncome}
              onChangeText={setInsuranceIncome}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
            />
            <ThemedText style={styles.targetText}>
              / {targets.insuranceTarget.toLocaleString()}
            </ThemedText>
            <ThemedText
              style={[styles.rateText, { color: getRateColor(financialRates.insuranceRate || 0, undefined) }]}
            >
              {(financialRates.insuranceRate || 0).toFixed(2)}%
            </ThemedText>
          </View>
        </View>

        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>總手收</ThemedText>
          <View style={styles.inputGroup}>
            <ThemedText style={styles.calculatedValue}>{totalIncome.toLocaleString()}</ThemedText>
            <ThemedText style={styles.targetText}>
              / {targets.totalIncomeTarget.toLocaleString()}
            </ThemedText>
            <ThemedText
              style={[styles.rateText, { color: getRateColor(financialRates.totalIncomeRate || 0, undefined) }]}
            >
              {(financialRates.totalIncomeRate || 0).toFixed(2)}%
            </ThemedText>
          </View>
        </View>

        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>CA</ThemedText>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
              value={ca}
              onChangeText={setCa}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
            />
            <ThemedText style={styles.targetText}>/ {targets.caTarget}</ThemedText>
            <ThemedText
              style={[styles.rateText, { color: getRateColor(financialRates.caRate || 0, undefined) }]}
            >
              {(financialRates.caRate || 0).toFixed(2)}%
            </ThemedText>
          </View>
        </View>

        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>NNM</ThemedText>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
              value={nnm}
              onChangeText={setNnm}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
            />
            <ThemedText style={styles.targetText}>
              / {targets.nnmTarget.toLocaleString()}
            </ThemedText>
            <ThemedText
              style={[styles.rateText, { color: getRateDisplayColor(rawFinancialRates.nnmRate || 0, 200) }]}
            >
              {getRateDisplay(rawFinancialRates.nnmRate || 0, 200)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>Wealth Penetration</ThemedText>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
              value={wealthPenetration}
              onChangeText={setWealthPenetration}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
            />
            <ThemedText style={styles.targetText}>
              / {targets.wealthPenetrationTarget}
            </ThemedText>
            <ThemedText
              style={[
                styles.rateText,
                { color: getRateDisplayColor(rawFinancialRates.wealthPenetrationRate || 0, 200) },
              ]}
            >
              {getRateDisplay(rawFinancialRates.wealthPenetrationRate || 0, 200)}
            </ThemedText>
          </View>
        </View>
      </ThemedView>

      {/* 非財務指標 */}
      <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.cardHeader}>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            非財務指標
          </ThemedText>
          <ThemedText
            style={[styles.scoreText, { color: getRateColor(nonFinancialScore, undefined) }]}
          >
            {nonFinancialScore.toFixed(2)}%
          </ThemedText>
        </View>

        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>Risk</ThemedText>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
              value={risk}
              onChangeText={setRisk}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
            />
            <ThemedText style={styles.targetText}>/ 0</ThemedText>
            <ThemedText
              style={[styles.rateText, { color: getRateDisplayColor(rawNonFinancialRates.riskRate || 0, 100) }]}
            >
              {getRateDisplay(rawNonFinancialRates.riskRate || 0, 100)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>Quality</ThemedText>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
              value={quality}
              onChangeText={setQuality}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
            />
            <ThemedText style={styles.targetText}>/ 0</ThemedText>
            <ThemedText
              style={[styles.rateText, { color: getRateDisplayColor(rawNonFinancialRates.qualityRate || 0, 100) }]}
            >
              {getRateDisplay(rawNonFinancialRates.qualityRate || 0, 100)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>Complaint</ThemedText>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
              value={complaint}
              onChangeText={setComplaint}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
            />
            <ThemedText style={styles.targetText}>/ 0</ThemedText>
            <ThemedText
              style={[
                styles.rateText,
                { color: getRateDisplayColor(rawNonFinancialRates.complaintRate || 0, 100) },
              ]}
            >
              {getRateDisplay(rawNonFinancialRates.complaintRate || 0, 100)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>Client Appointment</ThemedText>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
              value={clientAppointment}
              onChangeText={setClientAppointment}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
            />
            <ThemedText style={styles.targetText}>/ 3</ThemedText>
            <ThemedText
              style={[
                styles.rateText,
                { color: getRateDisplayColor(rawNonFinancialRates.clientAppointmentRate || 0, 100) },
              ]}
            >
              {getRateDisplay(rawNonFinancialRates.clientAppointmentRate || 0, 100)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>NPS</ThemedText>
          <View style={styles.inputGroup}>
            <TextInput
              style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
              value={nps}
              onChangeText={(value) => {
                const numValue = parseFloat(value) || 0;
                setNps(Math.min(numValue, 100).toString());
              }}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor="#999"
              maxLength={3}
            />
            <ThemedText style={styles.targetText}>/ 100</ThemedText>
            <ThemedText
              style={[styles.rateText, { color: getRateDisplayColor(rawNonFinancialRates.npsRate || 0, 100) }]}
            >
              {getRateDisplay(rawNonFinancialRates.npsRate || 0, 100)}
            </ThemedText>
          </View>
        </View>
      </ThemedView>

      {/* 獎金結果 */}
      <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
          預估獎金
        </ThemedText>
        <View style={styles.bonusRow}>
          <ThemedText style={styles.bonusLabel}>基礎獎金：</ThemedText>
          <ThemedText style={styles.bonusValue}>
            ${bonusResult.baseBonus.toLocaleString()}
          </ThemedText>
        </View>
        {bonusResult.penalties.length > 0 && (
          <View style={styles.penaltiesContainer}>
            <ThemedText style={[styles.penaltyText, { color: errorColor }]}>
              適用懲罰：
            </ThemedText>
            {bonusResult.penalties.map((penalty, index) => (
              <ThemedText key={index} style={[styles.penaltyItem, { color: errorColor }]}>
                • {penalty}
              </ThemedText>
            ))}
          </View>
        )}
        <View style={styles.finalBonusRow}>
          <View>
            <ThemedText style={styles.finalBonusLabel}>最終獎金：</ThemedText>
            <ThemedText style={[styles.disbursalRatio, { color: textColor }]}>
              提撥比: {totalIncome > 0 ? ((bonusResult.finalBonus / totalIncome) * 100).toFixed(2) : '0.00'}%
            </ThemedText>
          </View>
          <ThemedText style={[styles.finalBonusValue, { color: tintColor }]}>
            ${bonusResult.finalBonus.toLocaleString()}
          </ThemedText>
        </View>
      </ThemedView>

      {/* 儲存按鈕 */}
      <Pressable
        onPress={handleSave}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: tintColor },
          pressed && styles.buttonPressed,
        ]}
      >
        <ThemedText style={styles.buttonText}>儲存紀錄</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    gap: 16,
  },
  header: {
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
    opacity: 0.7,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  metricRow: {
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "500",
  },
  inputGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    height: 40,
  },
  targetText: {
    fontSize: 14,
    opacity: 0.6,
  },
  rateText: {
    fontSize: 14,
    fontWeight: "600",
    minWidth: 70,
    textAlign: "right",
  },
  calculatedValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 10,
  },
  bonusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  bonusLabel: {
    fontSize: 14,
  },
  bonusValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  penaltiesContainer: {
    marginVertical: 12,
    padding: 12,
    backgroundColor: "rgba(255, 59, 48, 0.1)",
    borderRadius: 8,
  },
  penaltyText: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  penaltyItem: {
    fontSize: 12,
    marginLeft: 8,
    marginTop: 2,
  },
  finalBonusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  finalBonusLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  finalBonusValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  disbursalRatio: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.7,
  },
  button: {
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
