import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

import Header from "../components/Header";
import CreditCard from "../components/CreditCard";
import ProfileSection from "../components/ProfileSection";
import HistoryCard from "../components/HistoryCard";
import ProfileShortcutCard from "../components/ProfileShortcutCard";

import { styles } from "../theme/styles";
import { useAppContext } from "../context/AppContext";
import { useAuthContext } from "../context/AuthContext";

import {
  getOrCreateProfileByUserId,
  mapSupabaseProfileToAppUser,
} from "../lib/profileApi";

import {
  getServices,
  mapSupabaseServiceToAppService,
} from "../lib/serviceApi";

import {
  getRequests,
  mapSupabaseRequestToAppRequest,
} from "../lib/requestApi";

import { getFavoritesByUser } from "../lib/favoriteApi";

import {
  getNotifications,
  mapSupabaseNotificationToAppNotification,
} from "../lib/notificationApi";

export default function ProfileScreen() {
  const { session, authUser, isAuthLoading } = useAuthContext();
  const { user, updateUser, resetLocalData } = useAppContext();

  const [profileUser, setProfileUser] = useState(user);
  const [myServicesCount, setMyServicesCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  useEffect(() => {
    if (!isAuthLoading && !session) {
      router.replace("/login");
      return;
    }

    if (session && authUser?.id) {
      loadProfileDashboard();
    }
  }, [session, authUser?.id, isAuthLoading]);

  const loadProfileDashboard = async () => {
    if (!authUser?.id) return;

    try {
      setIsLoadingProfile(true);

      const profile = await getOrCreateProfileByUserId(
        authUser.id,
        authUser.email
      );

      const mappedUser = mapSupabaseProfileToAppUser(profile);

      setProfileUser(mappedUser);

      updateUser({
        ...mappedUser,
        offeredServices: user.offeredServices,
        neededServices: user.neededServices,
        history: user.history,
      });

      const servicesData = await getServices();
      const mappedServices = servicesData.map(mapSupabaseServiceToAppService);

      const myServices = mappedServices.filter(
        (service) => service.person === mappedUser.name
      );

      setMyServicesCount(myServices.length);

      const requestsData = await getRequests();
      const mappedRequests = requestsData.map(mapSupabaseRequestToAppRequest);

      const pendingRequests = mappedRequests.filter(
        (request) =>
          request.status === "pending" &&
          (request.requesterName === mappedUser.name ||
            request.providerName === mappedUser.name)
      );

      setPendingRequestsCount(pendingRequests.length);

      const favoritesData = await getFavoritesByUser(mappedUser.name);
      setFavoritesCount(favoritesData.length);

      const notificationsData = await getNotifications();
      const mappedNotifications = notificationsData.map(
        mapSupabaseNotificationToAppNotification
      );

      const unreadCount = mappedNotifications.filter(
        (notification) => !notification.read
      ).length;

      setUnreadNotificationsCount(unreadCount);
    } catch (error) {
      console.log("Error cargando perfil desde Supabase:", error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  if (isAuthLoading || isLoadingProfile) {
    return (
      <ScrollView style={styles.page}>
        <Header />

        <View style={styles.formSection}>
          <Text style={styles.screenTitle}>Cargando perfil...</Text>
        </View>
      </ScrollView>
    );
  }

  if (!session) {
    return (
      <ScrollView style={styles.page}>
        <Header />

        <View style={styles.formSection}>
          <Text style={styles.screenTitle}>Necesitas iniciar sesión</Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.primaryButtonText}>Ir a Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>Perfil</Text>

        <Text style={styles.screenSubtitle}>
          Sesión activa: {authUser?.email}
        </Text>

        <View style={styles.profileCard}>
          <Text style={styles.profileName}>{profileUser.name}</Text>

          <Text style={styles.profileLine}>
            Ciudad: {profileUser.city || "Sin ciudad"}
          </Text>

          <CreditCard
            credits={profileUser.credits}
            label="Créditos disponibles"
          />

          <Text style={styles.cardTitle}>Panel personal</Text>

          <View style={styles.shortcutGrid}>
            <ProfileShortcutCard
              title={`Mis Servicios (${myServicesCount})`}
              description="Editar, eliminar o simular solicitudes recibidas."
              route="/my-services"
            />

            <ProfileShortcutCard
              title={`Solicitudes (${pendingRequestsCount})`}
              description="Ver pendientes, recibidas, enviadas y completadas."
              route="/requests"
            />

            <ProfileShortcutCard
              title={`Favoritos (${favoritesCount})`}
              description="Servicios guardados para revisar después."
              route="/favorites"
            />

            <ProfileShortcutCard
              title="Historial"
              description="Movimientos de créditos ganados y gastados."
              route="/history"
            />

            <ProfileShortcutCard
              title={`Notificaciones (${unreadNotificationsCount})`}
              description="Actividad reciente de la app."
              route="/notifications"
            />

            <ProfileShortcutCard
              title="Settings"
              description="Estado de la cuenta y configuración."
              route="/settings"
            />
          </View>

          <ProfileSection
            title="Servicios que ofrece"
            items={profileUser.offeredServices}
          />

          <ProfileSection
            title="Servicios que necesita"
            items={profileUser.neededServices}
          />

          <Text style={styles.cardTitle}>Historial reciente</Text>

          {profileUser.history.slice(0, 3).map((item) => (
            <HistoryCard key={item.id} item={item} />
          ))}
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/register")}
        >
          <Text style={styles.primaryButtonText}>Editar perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.dangerButton} onPress={resetLocalData}>
          <Text style={styles.primaryButtonText}>Resetear datos locales</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/")}
        >
          <Text style={styles.backButtonText}>← Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}