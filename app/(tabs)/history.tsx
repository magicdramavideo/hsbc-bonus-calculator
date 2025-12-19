import { useRouter } from "expo-router";
import { useState, useEffect } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { loadRecords, type CalculationRecord } from "@/lib/storage";

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [records, setRecords] = useState<CalculationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const cardBg = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");

  const fetchRecords = async () => {
    setLoading(true);
    const data = await loadRecords();
    setRecords(data);
    setLoading(false);
  };

  // 當畫面獲得焦點時重新載入紀錄
  useFocusEffect(
    useCallback(() => {
      fetchRecords();
    }, [])
  );

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };

  const renderItem = ({ item }: { item: CalculationRecord }) => (
    <Pressable
      onPress={() => router.push(`/record-detail?id=${item.id}` as any)}
      style={({ pressed }) => [
        styles.recordCard,
        { backgroundColor: cardBg, borderColor },
        pressed && styles.recordCardPressed,
      ]}
    >
      <View style={styles.recordHeader}>
        <ThemedText style={styles.recordPosition}>{item.position}</ThemedText>
        <ThemedText style={[styles.recordBonus, { color: tintColor }]}>
          ${item.finalBonus.toLocaleString()}
        </ThemedText>
      </View>
      <View style={styles.recordInfo}>
        <ThemedText style={styles.recordDate}>{formatDate(item.timestamp)}</ThemedText>
        <ThemedText style={styles.recordRatio}>認列比例 {item.recognitionRatio}%</ThemedText>
      </View>
      <View style={styles.recordScores}>
        <ThemedText style={styles.scoreItem}>
          財務: {item.financialScore.toFixed(2)}%
        </ThemedText>
        <ThemedText style={styles.scoreItem}>
          非財務: {item.nonFinancialScore.toFixed(2)}%
        </ThemedText>
      </View>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16),
          },
        ]}
      >
        <ThemedText type="title" style={styles.title}>
          歷史紀錄
        </ThemedText>
      </View>

      {loading ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>載入中...</ThemedText>
        </View>
      ) : records.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>尚無紀錄</ThemedText>
          <ThemedText style={styles.emptyHint}>完成計算後儲存即可查看紀錄</ThemedText>
        </View>
      ) : (
        <FlatList
          data={records}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    lineHeight: 36,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  recordCard: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  recordCardPressed: {
    opacity: 0.7,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recordPosition: {
    fontSize: 18,
    fontWeight: "600",
  },
  recordBonus: {
    fontSize: 20,
    fontWeight: "bold",
  },
  recordInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  recordDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  recordRatio: {
    fontSize: 12,
    opacity: 0.6,
  },
  recordScores: {
    flexDirection: "row",
    gap: 16,
  },
  scoreItem: {
    fontSize: 14,
    opacity: 0.8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 18,
    opacity: 0.6,
  },
  emptyHint: {
    fontSize: 14,
    opacity: 0.4,
    marginTop: 8,
  },
});
