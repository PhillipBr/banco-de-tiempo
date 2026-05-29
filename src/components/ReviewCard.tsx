import { Text, View } from "react-native";

import { Review } from "../context/AppContext";
import { styles } from "../theme/styles";

type ReviewCardProps = {
  item: Review;
};

export default function ReviewCard({ item }: ReviewCardProps) {
  return (
    <View style={styles.reviewCard}>
      <Text style={styles.reviewRating}>{"⭐".repeat(item.rating)}</Text>
      <Text style={styles.reviewComment}>{item.comment}</Text>
      <Text style={styles.historyMeta}>
        {item.reviewerName} · {item.date}
      </Text>
    </View>
  );
}