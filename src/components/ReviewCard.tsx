import { Text, View } from "react-native";

import { AppReview } from "../lib/reviewApi";
import { styles } from "../theme/styles";

type ReviewCardProps = {
  item: AppReview;
};

function renderStars(rating: number): string {
  const value = Math.max(1, Math.min(5, Math.round(rating)));

  return "★".repeat(value) + "☆".repeat(5 - value);
}

function formatDate(date: string): string {
  if (!date) {
    return "";
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleDateString("en-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ReviewCard({
  item,
}: ReviewCardProps) {
  const edited =
    item.updatedAt &&
    item.updatedAt !== item.createdAt;

  return (
    <View style={styles.reviewCard}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 8,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>
            {item.reviewerName}
          </Text>

          <Text
            style={{
              color: "#F5C451",
              fontSize: 18,
              marginTop: 4,
            }}
          >
            {renderStars(item.rating)}
          </Text>
        </View>

        <Text
          style={{
            color: "#999999",
            fontSize: 12,
          }}
        >
          {formatDate(item.createdAt)}
        </Text>
      </View>

      <Text
        style={[
          styles.reviewComment,
          {
            marginTop: 8,
            lineHeight: 22,
          },
        ]}
      >
        {item.comment || "Sin comentario."}
      </Text>

      {edited ? (
        <Text
          style={{
            color: "#888888",
            fontSize: 12,
            marginTop: 12,
            fontStyle: "italic",
          }}
        >
          Reseña editada
        </Text>
      ) : null}
    </View>
  );
}