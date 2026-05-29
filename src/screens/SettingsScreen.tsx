import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

import Header from "../components/Header";
import { styles } from "../theme/styles";
import { useAppContext } from "../context/AppContext";
import { getProfiles } from "../lib/profileApi";
import { getServices } from "../lib/serviceApi";
import { getRequests } from "../lib/requestApi";
import { getReviews } from "../lib/reviewApi";
import { getMessages } from "../lib/messageApi";
import { getNotifications } from "../lib/notificationApi";

export default function SettingsScreen() {
  const { user, resetLocalData } = useAppContext();

  const [stats, setStats] = useState({
    profiles: 0,
    services: 0,
    requests: 0,
    reviews: 0,
    messages: 0,
    notifications: 0,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCloudStats();
  }, []);

  const loadCloudStats = async () => {
    try {
      setIsLoading(true);

      const [
        profilesData,
        servicesData,
        requestsData,
        reviewsData,
        messagesData,
        notificationsData,
      ] = await Promise.all([
        getProfiles(),
        getServices(),
        getRequests(),
        getReviews(),
        getMessages(),
        getNotifications(),
      ]);

      setStats({
        profiles: profilesData.length,
        services: servicesData.length,
        requests: requestsData.length,
        reviews: reviewsData.length,
        messages: messagesData.length,
        notifications: notificationsData.length,
      });
    } catch (error) {
      console.log("Error cargando estadísticas cloud:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>Settings</Text>

        <Text style={styles.screenSubtitle}>
          Estado local y datos reales en Supabase.
        </Text>

        <View style={styles.profileCard}>
          <Text style={styles.cardTitle}>Usuario actual</Text>

          <Text style={styles.profileLine}>Nombre: {user.name}</Text>
          <Text style={styles.profileLine}>Ciudad: {user.city}</Text>
          <Text style={styles.profileLine}>Créditos locales: {user.credits}</Text>
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.cardTitle}>Supabase Cloud Stats</Text>

          <Text style={styles.profileLine}>Profiles: {stats.profiles}</Text>
          <Text style={styles.profileLine}>Services: {stats.services}</Text>
          <Text style={styles.profileLine}>Requests: {stats.requests}</Text>
          <Text style={styles.profileLine}>Reviews: {stats.reviews}</Text>
          <Text style={styles.profileLine}>Messages: {stats.messages}</Text>
          <Text style={styles.profileLine}>
            Notifications: {stats.notifications}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.contactButton}
          onPress={loadCloudStats}
          disabled={isLoading}
        >
          <Text style={styles.primaryButtonText}>
            {isLoading ? "Actualizando..." : "Actualizar estadísticas"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerButton} onPress={resetLocalData}>
          <Text style={styles.primaryButtonText}>
            Resetear datos locales solamente
          </Text>
        </TouchableOpacity>

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