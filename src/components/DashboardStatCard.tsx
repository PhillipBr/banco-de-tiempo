import { Text, View } from "react-native";
import { styles } from "../theme/styles";

type DashboardStatCardProps = {
  label: string;
  value: string | number;
};

export default function DashboardStatCard({
  label,
  value,
}: DashboardStatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}