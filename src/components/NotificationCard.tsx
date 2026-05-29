import { Text, View } from "react-native";

import { NotificationItem } from "../context/AppContext";
import { styles } from "../theme/styles";

type NotificationCardProps = {
  item: NotificationItem;
};

export default function NotificationCard({ item }: NotificationCardProps) {
  return (
    <View
      style={[
        styles.notificationCard,
        !item.read && styles.notificationCardUnread,
      ]}
    >
      <Text style={styles.notificationTitle}>{item.title}</Text>

      <Text style={styles.notificationMessage}>{item.message}</Text>

      <Text style={styles.historyMeta}>
        {item.type} · {item.date} · {item.read ? "Leída" : "Nueva"}
      </Text>
    </View>
  );
}