import { Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";

import { styles } from "../theme/styles";

type ProfileShortcutCardProps = {
  title: string;
  description: string;
  route: string;
};

export default function ProfileShortcutCard({
  title,
  description,
  route,
}: ProfileShortcutCardProps) {
  return (
    <TouchableOpacity
      style={styles.shortcutCard}
      onPress={() => router.push(route as never)}
    >
      <Text style={styles.shortcutTitle}>{title}</Text>
      <Text style={styles.shortcutDescription}>{description}</Text>
    </TouchableOpacity>
  );
}