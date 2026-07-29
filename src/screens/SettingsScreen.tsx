import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";

import Header from "../components/Header";

import { styles } from "../theme/styles";

import {
  useAppContext,
} from "../context/AppContext";

import {
  getProfiles,
} from "../lib/profileApi";

import {
  getServices,
} from "../lib/serviceApi";

import {
  getRequests,
} from "../lib/requestApi";

import {
  getReviews,
} from "../lib/reviewApi";

import {
  getNotifications,
} from "../lib/notificationApi";

import {
  supabase,
} from "../lib/supabase";

type CloudStats = {
  profiles: number;
  services: number;
  requests: number;
  reviews: number;
  messages: number;
  notifications: number;
};

const initialStats: CloudStats = {
  profiles: 0,
  services: 0,
  requests: 0,
  reviews: 0,
  messages: 0,
  notifications: 0,
};

async function getMessagesCount(): Promise<number> {
  const {
    count,
    error,
  } = await supabase
    .from("messages")
    .select("id", {
      count: "exact",
      head: true,
    });

  if (error) {
    throw error;
  }

  return count ?? 0;
}

export default function SettingsScreen() {
  const {
    user,
    resetLocalData,
  } = useAppContext();

  const [
    stats,
    setStats,
  ] = useState<CloudStats>(
    initialStats
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadCloudStats =
    useCallback(async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const [
          profilesData,
          servicesData,
          requestsData,
          reviewsData,
          messagesCount,
          notificationsData,
        ] = await Promise.all([
          getProfiles(),
          getServices(),
          getRequests(),
          getReviews(),
          getMessagesCount(),
          getNotifications(),
        ]);

        setStats({
          profiles:
            profilesData.length,

          services:
            servicesData.length,

          requests:
            requestsData.length,

          reviews:
            reviewsData.length,

          messages:
            messagesCount,

          notifications:
            notificationsData.length,
        });
      } catch (error: any) {
        console.error(
          "Error cargando estadísticas cloud:",
          error
        );

        setErrorMessage(
          error?.message ||
            "No se pudieron cargar las estadísticas."
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadCloudStats();
  }, [loadCloudStats]);

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{
        paddingBottom: 50,
      }}
    >
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>
          Configuración
        </Text>

        <Text
          style={styles.screenSubtitle}
        >
          Estado local y datos reales en
          Supabase.
        </Text>

        <View style={styles.profileCard}>
          <Text style={styles.cardTitle}>
            Usuario actual
          </Text>

          <Text
            style={styles.profileLine}
          >
            Nombre:{" "}
            {user.name ||
              "No indicado"}
          </Text>

          <Text
            style={styles.profileLine}
          >
            Ciudad:{" "}
            {user.city ||
              "No indicada"}
          </Text>

          <Text
            style={styles.profileLine}
          >
            Créditos locales:{" "}
            {user.credits}
          </Text>
        </View>

        <View style={styles.profileCard}>
          <Text style={styles.cardTitle}>
            Estadísticas de Supabase
          </Text>

          <Text
            style={styles.profileLine}
          >
            Perfiles: {stats.profiles}
          </Text>

          <Text
            style={styles.profileLine}
          >
            Servicios: {stats.services}
          </Text>

          <Text
            style={styles.profileLine}
          >
            Solicitudes:{" "}
            {stats.requests}
          </Text>

          <Text
            style={styles.profileLine}
          >
            Reseñas: {stats.reviews}
          </Text>

          <Text
            style={styles.profileLine}
          >
            Mensajes: {stats.messages}
          </Text>

          <Text
            style={styles.profileLine}
          >
            Notificaciones:{" "}
            {stats.notifications}
          </Text>
        </View>

        {errorMessage ? (
          <View
            style={
              styles.emptyStateCard
            }
          >
            <Text
              style={
                styles.emptyStateTitle
              }
            >
              Error
            </Text>

            <Text
              style={
                styles.emptyStateText
              }
            >
              {errorMessage}
            </Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.contactButton,

            isLoading && {
              opacity: 0.6,
            },
          ]}
          onPress={() => {
            void loadCloudStats();
          }}
          disabled={isLoading}
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            {isLoading
              ? "Actualizando..."
              : "Actualizar estadísticas"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dangerButton}
          onPress={resetLocalData}
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            Resetear datos locales
            solamente
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.push("/profile")
          }
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            ← Volver al perfil
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}