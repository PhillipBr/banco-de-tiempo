import { Text, View } from "react-native";

import { styles } from "../theme/styles";

type HistoryCardProps = {
  item: {
    id: number;
    type: string;
    description: string;
    credits: number;
    date: string;
  };
};

export default function HistoryCard({ item }: HistoryCardProps) {
  const sign = item.type === "earned" ? "+" : "-";

  return (
    <View style={styles.historyCard}>
      <Text style={styles.historyDescription}>{item.description}</Text>

      <Text style={styles.historyMeta}>
        {item.date} · {sign}
        {item.credits} crédito
      </Text>
    </View>
  );
}