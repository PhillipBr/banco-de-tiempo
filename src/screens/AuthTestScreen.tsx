import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

import Header from "../components/Header";
import { styles } from "../theme/styles";
import { useAuthContext } from "../context/AuthContext";

export default function AuthTestScreen() {
  const { session, authUser, isAuthLoading, signOut } = useAuthContext();

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <ScrollView style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>Auth Test</Text>

        <View style={styles.profileCard}>
          <Text style={styles.cardTitle}>Estado</Text>

          <Text style={styles.profileLine}>
            Loading: {isAuthLoading ? "sí" : "no"}
          </Text>

          <Text style={styles.profileLine}>
            Session: {session ? "activa" : "sin sesión"}
          </Text>

          <Text style={styles.profileLine}>
            Email: {authUser?.email || "no disponible"}
          </Text>

          <Text style={styles.profileLine}>
            User ID: {authUser?.id || "no disponible"}
          </Text>
        </View>

        {session ? (
          <TouchableOpacity style={styles.dangerButton} onPress={handleLogout}>
            <Text style={styles.primaryButtonText}>Cerrar sesión</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.primaryButtonText}>Ir a Login</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}