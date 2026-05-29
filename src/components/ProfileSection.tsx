import { Text, View } from "react-native";

import { styles } from "../theme/styles";

type ProfileSectionProps = {
  title: string;
  items: string[];
  icon?: string;
};

export default function ProfileSection({
  title,
  items,
  icon = "•",
}: ProfileSectionProps) {
  return (
    <View>
      <Text style={styles.cardTitle}>{title}</Text>

      {items.map((item, index) => (
        <Text key={index} style={styles.profileLine}>
          {icon} {item}
        </Text>
      ))}
    </View>
  );
}