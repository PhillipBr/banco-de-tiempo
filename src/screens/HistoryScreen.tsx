import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

import Header from "../components/Header";
import HistoryCard from "../components/HistoryCard";

import { styles } from "../theme/styles";
import { useAppContext } from "../context/AppContext";

export default function HistoryScreen() {
  const { user } = useAppContext();

  const earnedCredits = user.history
    .filter((item) => item.type === "earned")
    .reduce((total, item) => total + item.credits, 0);

  const spentCredits = user.history
    .filter((item) => item.type === "spent")
    .reduce((total, item) => total + item.credits, 0);

  return (
    <ScrollView style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>Historial</Text>

        <Text style={styles.screenSubtitle}>
          Revisa tus intercambios y movimientos de créditos de tiempo.
        </Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Ganados</Text>
            <Text style={styles.statValue}>+{earnedCredits}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Gastados</Text>
            <Text style={styles.statValue}>-{spentCredits}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Saldo actual</Text>
            <Text style={styles.statValue}>{user.credits}</Text>
          </View>
        </View>

        <View style={{ height: 24 }} />

        {user.history.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>Sin historial</Text>

            <Text style={styles.emptyStateText}>
              Cuando confirmes o entregues servicios, aparecerán aquí.
            </Text>
          </View>
        ) : (
          user.history.map((item) => (
            <HistoryCard key={item.id} item={item} />
          ))
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/profile")}
        >
          <Text style={styles.backButtonText}>← Volver al perfil</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}