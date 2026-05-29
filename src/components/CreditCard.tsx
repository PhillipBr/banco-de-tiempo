import { Text, View } from "react-native";

import { styles } from "../theme/styles";

type CreditCardProps = {
  credits: number;
  label?: string;
  compact?: boolean;
};

export default function CreditCard({
  credits,
  label = "Saldo disponible",
  compact = false,
}: CreditCardProps) {
  return (
    <View
      style={[
        styles.creditCard,
        compact && {
          marginTop: 18,
          padding: 22,
          maxWidth: 360,
        },
      ]}
    >
      <Text style={styles.creditLabel}>{label}</Text>

      <Text
        style={[
          styles.creditValue,
          compact && {
            fontSize: 34,
            marginVertical: 4,
          },
        ]}
      >
        {credits} créditos
      </Text>

      <Text style={styles.creditNote}>1 crédito = 1 hora de ayuda</Text>
    </View>
  );
}