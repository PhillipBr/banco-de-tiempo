import { Text, View } from "react-native";

import { styles } from "../theme/styles";

type ProgramCardProps = {
  title: string;
  description: string;
};

export default function ProgramCard({
  title,
  description,
}: ProgramCardProps) {
  return (
    <View style={styles.programCard}>
      <Text style={styles.programTitle}>{title}</Text>
      <Text style={styles.programText}>{description}</Text>
    </View>
  );
}