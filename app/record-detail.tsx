import { useLocalSearchParams, useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { getRecord, deleteRecord, type CalculationRecord } from "@/lib/storage";
import { POSITIONS } from "@/constants/positions";

export default function RecordDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const [record, setRecord] = useState<CalculationRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const cardBg = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  const tintColor = useThemeColor({}, "tint");
  const errorColor = useThemeColor({}, "error");
  const successColor = useThemeColor({}, "success");
  const warningColor = useThemeColor({}, "warning");

  useEffect(() => {
    const fetchRecord = async () => {
      const id = params.id as string;
      const data = await getRecord(id);
      setRecord(data);
      setLoading(false);
    };
    fetchRecord();
  }, [params.id]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const handleDelete = () => {
    Alert.alert("確認刪除", "確定要刪除此紀錄嗎？", [
      { text: "取消", style: "cancel" },
      {
        text: "刪除",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteRecord(params.id as string);
            Alert.alert("成功", "紀錄已刪除", [
              {
                text: "確定",
                onPress: () => router.back(),
              },
            ]);
          } catch (error) {
            Alert.alert("錯誤", "刪除失敗，請稍後再試");
          }
        },
      },
    ]);
  };

  const getRateColor = (rate: number) => {
    if (rate >= 100) return successColor;
    if (rate >= 70) return warningColor;
    return errorColor;
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText>載入中...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!record) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ThemedText>找不到紀錄</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const positionData = POSITIONS[record.position];
  const adjustedRatio = record.recognitionRatio / 100;
  const adjustedMonthlyTarget = Math.round(positionData.monthlyTarget * adjustedRatio);
  const adjustedQTI = Math.round(positionData.qti * adjustedRatio);

  const totalIncome = record.financialMetrics.investmentIncome + record.financialMetrics.insuranceIncome;

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
          紀錄詳情
        </ThemedText>
        <ThemedText style={styles.date}>{formatDate(record.timestamp)}</ThemedText>
      </ThemedView>

      {/* 基本資訊 */}
      <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
          基本資訊
        </ThemedText>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>職級：</ThemedText>
          <ThemedText style={styles.infoValue}>{record.position}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>認列比例：</ThemedText>
          <ThemedText style={styles.infoValue}>{record.recognitionRatio}%</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>調整後月目標：</ThemedText>
          <ThemedText style={styles.infoValue}>
            ${adjustedMonthlyTarget.toLocaleString()}
          </ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>調整後 QTI：</ThemedText>
          <ThemedText style={styles.infoValue}>${adjustedQTI.toLocaleString()}</ThemedText>
        </View>
      </ThemedView>

      {/* 財務指標 */}
      <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.cardHeader}>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            財務指標
          </ThemedText>
          <ThemedText
            style={[styles.scoreText, { color: getRateColor(record.financialScore) }]}
          >
            {record.financialScore.toFixed(2)}%
          </ThemedText>
        </View>
        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>投資手收：</ThemedText>
          <ThemedText style={styles.metricValue}>
            ${record.financialMetrics.investmentIncome.toLocaleString()}
          </ThemedText>
        </View>
        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>保險手收：</ThemedText>
          <ThemedText style={styles.metricValue}>
            ${record.financialMetrics.insuranceIncome.toLocaleString()}
          </ThemedText>
        </View>
        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>總手收：</ThemedText>
          <ThemedText style={styles.metricValue}>${totalIncome.toLocaleString()}</ThemedText>
        </View>
        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>CA：</ThemedText>
          <ThemedText style={styles.metricValue}>{record.financialMetrics.ca}</ThemedText>
        </View>
        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>NNM：</ThemedText>
          <ThemedText style={styles.metricValue}>
            ${record.financialMetrics.nnm.toLocaleString()}
          </ThemedText>
        </View>
        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>Wealth Penetration：</ThemedText>
          <ThemedText style={styles.metricValue}>
            {record.financialMetrics.wealthPenetration}
          </ThemedText>
        </View>
      </ThemedView>

      {/* 非財務指標 */}
      <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <View style={styles.cardHeader}>
          <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
            非財務指標
          </ThemedText>
          <ThemedText
            style={[styles.scoreText, { color: getRateColor(record.nonFinancialScore) }]}
          >
            {record.nonFinancialScore.toFixed(2)}%
          </ThemedText>
        </View>
        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>Risk：</ThemedText>
          <ThemedText style={styles.metricValue}>{record.nonFinancialMetrics.risk}</ThemedText>
        </View>
        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>Quality：</ThemedText>
          <ThemedText style={styles.metricValue}>{record.nonFinancialMetrics.quality}</ThemedText>
        </View>
        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>Complaint：</ThemedText>
          <ThemedText style={styles.metricValue}>
            {record.nonFinancialMetrics.complaint}
          </ThemedText>
        </View>
        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>Client Appointment：</ThemedText>
          <ThemedText style={styles.metricValue}>
            {record.nonFinancialMetrics.clientAppointment}
          </ThemedText>
        </View>
        <View style={styles.metricRow}>
          <ThemedText style={styles.metricLabel}>NPS：</ThemedText>
          <ThemedText style={styles.metricValue}>{record.nonFinancialMetrics.nps}</ThemedText>
        </View>
      </ThemedView>

      {/* 獎金結果 */}
      <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
          獎金結果
        </ThemedText>
        {record.penalties.length > 0 && (
          <View style={styles.penaltiesContainer}>
            <ThemedText style={[styles.penaltyText, { color: errorColor }]}>
              適用懲罰：
            </ThemedText>
            {record.penalties.map((penalty, index) => (
              <ThemedText key={index} style={[styles.penaltyItem, { color: errorColor }]}>
                • {penalty}
              </ThemedText>
            ))}
          </View>
        )}
        <View style={styles.finalBonusRow}>
          <ThemedText style={styles.finalBonusLabel}>最終獎金：</ThemedText>
          <ThemedText style={[styles.finalBonusValue, { color: tintColor }]}>
            ${record.finalBonus.toLocaleString()}
          </ThemedText>
        </View>
      </ThemedView>

      {/* 刪除按鈕 */}
      <Pressable
        onPress={handleDelete}
        style={({ pressed }) => [
          styles.deleteButton,
          { backgroundColor: errorColor },
          pressed && styles.buttonPressed,
        ]}
      >
        <ThemedText style={styles.buttonText}>刪除紀錄</ThemedText>
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
  date: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
    opacity: 0.6,
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
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  penaltiesContainer: {
    marginBottom: 12,
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
  deleteButton: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
