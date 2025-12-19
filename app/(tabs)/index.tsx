import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { POSITIONS, POSITION_KEYS, getQuarterlyTarget, getInvestmentTarget, getInsuranceTarget } from "@/constants/positions";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPosition, setSelectedPosition] = useState<string>(POSITION_KEYS[0]);
  const [recognitionRatio, setRecognitionRatio] = useState<string>("100");

  const cardBg = useThemeColor({}, "card");
  const borderColor = useThemeColor({}, "border");
  const tintColor = useThemeColor({}, "tint");
  const textColor = useThemeColor({}, "text");

  const position = POSITIONS[selectedPosition];
  const ratio = parseFloat(recognitionRatio) || 100;
  const adjustedRatio = Math.min(Math.max(ratio, 0), 100) / 100;

  // 計算折扣後的目標
  const adjustedMonthlyTarget = Math.round(position.monthlyTarget * adjustedRatio);
  const adjustedQTI = Math.round(position.qti * adjustedRatio);
  const adjustedQuarterlyTarget = getQuarterlyTarget(adjustedMonthlyTarget);
  const adjustedInvestmentTarget = getInvestmentTarget(adjustedMonthlyTarget);
  const adjustedInsuranceTarget = getInsuranceTarget(adjustedMonthlyTarget);
  const adjustedNNM = Math.round(position.nnm * adjustedRatio);
  const adjustedCA = Math.round(position.ca * adjustedRatio * 3); // CA季目標

  const handleStartCalculation = () => {
    router.push({
      pathname: "/calculator",
      params: {
        position: selectedPosition,
        recognitionRatio: ratio.toString(),
      },
    });
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
          HSBC 2026
        </ThemedText>
        <ThemedText type="subtitle" style={styles.subtitle}>
          理專獎金計算系統
        </ThemedText>
      </ThemedView>

      {/* 職級選擇 */}
      <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
          選擇職級
        </ThemedText>
        <View style={[styles.pickerContainer, { borderColor, backgroundColor: cardBg }]}>
          <Picker
            selectedValue={selectedPosition}
            onValueChange={(value) => setSelectedPosition(value)}
            style={[styles.picker, { color: textColor }]}
          >
            {POSITION_KEYS.map((key) => (
              <Picker.Item key={key} label={POSITIONS[key].name} value={key} />
            ))}
          </Picker>
        </View>
      </ThemedView>

      {/* 認列比例 */}
      <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
          認列比例（%）
        </ThemedText>
        <TextInput
          style={[styles.input, { borderColor, color: textColor, backgroundColor: cardBg }]}
          value={recognitionRatio}
          onChangeText={setRecognitionRatio}
          keyboardType="numeric"
          placeholder="100"
          placeholderTextColor="#999"
        />
        <ThemedText style={styles.hint}>請輸入 0-100 之間的數值</ThemedText>
      </ThemedView>

      {/* 目標資訊 */}
      <ThemedView style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
        <ThemedText type="defaultSemiBold" style={styles.cardTitle}>
          目標資訊
        </ThemedText>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>月目標：</ThemedText>
          <ThemedText style={styles.infoValue}>
            ${adjustedMonthlyTarget.toLocaleString()}
          </ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>季目標：</ThemedText>
          <ThemedText style={styles.infoValue}>
            ${adjustedQuarterlyTarget.toLocaleString()}
          </ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>QTI：</ThemedText>
          <ThemedText style={styles.infoValue}>${adjustedQTI.toLocaleString()}</ThemedText>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>投資手收季目標：</ThemedText>
          <ThemedText style={styles.infoValue}>
            ${(adjustedInvestmentTarget * 3).toLocaleString()}
          </ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>保險手收季目標：</ThemedText>
          <ThemedText style={styles.infoValue}>
            ${(adjustedInsuranceTarget * 3).toLocaleString()}
          </ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>CA 季目標：</ThemedText>
          <ThemedText style={styles.infoValue}>{adjustedCA}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>NNM 季目標：</ThemedText>
          <ThemedText style={styles.infoValue}>${adjustedNNM.toLocaleString()}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Wealth Penetration 季目標：</ThemedText>
          <ThemedText style={styles.infoValue}>{position.wealthPenetration * 3}</ThemedText>
        </View>
      </ThemedView>

      {/* 開始計算按鈕 */}
      <Pressable
        onPress={handleStartCalculation}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: tintColor },
          pressed && styles.buttonPressed,
        ]}
      >
        <ThemedText style={styles.buttonText}>開始計算獎金</ThemedText>
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
    fontSize: 28,
    fontWeight: "bold",
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 18,
    lineHeight: 24,
    marginTop: 4,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    height: 50,
  },
  hint: {
    fontSize: 12,
    marginTop: 8,
    opacity: 0.6,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginVertical: 8,
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
