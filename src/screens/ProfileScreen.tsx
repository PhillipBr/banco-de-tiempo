import {
  useCallback,
  useState,
} from "react";
import {
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  router,
  useFocusEffect,
} from "expo-router";

import Header from "../components/Header";
import CreditCard from "../components/CreditCard";
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
  const {
    session,
    authUser,
    isAuthLoading,
  } = useAuthContext();

  const {
    user,
    updateUser,
    resetLocalData,
  } = useAppContext();

  const [profileUser, setProfileUser] =
    useState(user);

  const [
    myServicesCount,
    setMyServicesCount,
  ] = useState(0);

  const [
    myOffersCount,
    setMyOffersCount,
  ] = useState(0);

  const [
    myRequestsCount,
    setMyRequestsCount,
  ] = useState(0);

  const [
    pendingRequestsCount,
    setPendingRequestsCount,
  ] = useState(0);

  const [
    favoritesCount,
    setFavoritesCount,
  ] = useState(0);

  const [
    unreadNotificationsCount,
    setUnreadNotificationsCount,
  ] = useState(0);

  const [
    isLoadingProfile,
    setIsLoadingProfile,
  ] = useState(false);

  const loadProfileDashboard =
    useCallback(async () => {
      if (!authUser?.id) {
        return;
      }

      try {
        setIsLoadingProfile(true);

        const profile =
          await getOrCreateProfileByUserId(
            authUser.id,
            authUser.email
          );

        const mappedUser =
          mapSupabaseProfileToAppUser(
            profile
          );

        setProfileUser(mappedUser);

        updateUser({
          ...mappedUser,
          offeredServices:
            user.offeredServices,
          neededServices:
            user.neededServices,
          history: user.history,
        });

        const servicesData =
          await getServices();

        const mappedServices =
          servicesData.map(
            mapSupabaseServiceToAppService
          );

        const normalizedUserName =
          mappedUser.name
            .trim()
            .toLowerCase();

        const myServices =
          mappedServices.filter(
            (service) =>
              service.person
                .trim()
                .toLowerCase() ===
              normalizedUserName
          );

        setMyServicesCount(
          myServices.length
        );

        setMyOffersCount(
          myServices.filter(
            (service) =>
              service.serviceType !==
              "request"
          ).length
        );

        setMyRequestsCount(
          myServices.filter(
            (service) =>
              service.serviceType ===
              "request"
          ).length
        );

        const requestsData =
          await getRequests();

        const mappedRequests =
          requestsData.map(
            mapSupabaseRequestToAppRequest
          );

        const pendingRequests =
          mappedRequests.filter(
            (request) =>
              request.status ===
                "pending" &&
              (request.requesterName ===
                mappedUser.name ||
                request.providerName ===
                  mappedUser.name)
          );

        setPendingRequestsCount(
          pendingRequests.length
        );

        const favoritesData =
          await getFavoritesByUser(
            mappedUser.name
          );

        setFavoritesCount(
          favoritesData.length
        );

        const notificationsData =
          await getNotifications();

        const mappedNotifications =
          notificationsData.map(
            mapSupabaseNotificationToAppNotification
          );

        setUnreadNotificationsCount(
          mappedNotifications.filter(
            (notification) =>
              !notification.read
          ).length
        );
      } catch (error) {
        console.log(
          "Error cargando perfil:",
          error
        );
      } finally {
        setIsLoadingProfile(false);
      }
    }, [authUser?.id]);

  useFocusEffect(
    useCallback(() => {
      if (
        !isAuthLoading &&
        !session
      ) {
        router.replace("/login");
        return;
      }

      if (
        session &&
        authUser?.id
      ) {
        loadProfileDashboard();
      }
    }, [
      session,
      authUser?.id,
      isAuthLoading,
      loadProfileDashboard,
    ])
  );

  if (
    isAuthLoading ||
    isLoadingProfile
  ) {
    return (
      <ScrollView style={styles.page}>
        <Header />

        <View style={styles.formSection}>
          <Text
            style={styles.screenTitle}
          >
            Cargando perfil...
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (!session) {
    return (
      <ScrollView style={styles.page}>
        <Header />

        <View style={styles.formSection}>
          <Text
            style={styles.screenTitle}
          >
            Necesitas iniciar sesión
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.push("/login")
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Ir a Login
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const skills =
    profileUser.skills ?? [];

  return (
    <ScrollView style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>
          Mi perfil
        </Text>

        <View style={styles.profileCard}>
          <Image
            source={{
              uri:
                profileUser.avatar ||
                "https://i.pravatar.cc/300?img=12",
            }}
            style={{
              width: 110,
              height: 110,
              borderRadius: 55,
              alignSelf: "center",
              marginBottom: 18,
            }}
          />

          <Text
            style={styles.profileName}
          >
            {profileUser.name}
          </Text>

          <Text
            style={styles.profileLine}
          >
            {profileUser.city ||
              "Ciudad no indicada"}
            {profileUser.community
              ? ` · ${profileUser.community}`
              : ""}
          </Text>

          {profileUser.email ? (
            <Text
              style={styles.profileLine}
            >
              {profileUser.email}
            </Text>
          ) : null}

          <Text
            style={[
              styles.cardTitle,
              { marginTop: 22 },
            ]}
          >
            Sobre mí
          </Text>

          <Text
            style={styles.profileLine}
          >
            {profileUser.bio ||
              "Todavía no has agregado una biografía."}
          </Text>

          <Text
            style={[
              styles.cardTitle,
              { marginTop: 22 },
            ]}
          >
            Habilidades
          </Text>

          {skills.length === 0 ? (
            <Text
              style={styles.profileLine}
            >
              Todavía no has agregado
              habilidades.
            </Text>
          ) : (
            <View
              style={
                styles.filterRow
              }
            >
              {skills.map((skill) => (
                <View
                  key={skill}
                  style={
                    styles.filterButton
                  }
                >
                  <Text
                    style={
                      styles.filterButtonText
                    }
                  >
                    {skill}
                  </Text>
                </View>
              ))}
            </View>
          )}

          <View
            style={{ marginTop: 24 }}
          >
            <CreditCard
              credits={
                profileUser.credits
              }
              label="Balance de horas"
            />
          </View>

          <Text
            style={[
              styles.profileLine,
              {
                textAlign: "center",
                marginTop: 8,
              },
            ]}
          >
            {profileUser.credits}{" "}
            {profileUser.credits === 1
              ? "crédito equivale"
              : "créditos equivalen"}{" "}
            a {profileUser.credits}{" "}
            {profileUser.credits === 1
              ? "hora"
              : "horas"}{" "}
            de ayuda.
          </Text>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.push(
                "/edit-profile"
              )
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Editar perfil
            </Text>
          </TouchableOpacity>

          <Text
            style={[
              styles.cardTitle,
              { marginTop: 28 },
            ]}
          >
            Actividad
          </Text>

          <View
            style={
              styles.shortcutGrid
            }
          >
            <ProfileShortcutCard
              title={`Mis publicaciones (${myServicesCount})`}
              description={`${myOffersCount} ofertas y ${myRequestsCount} pedidos.`}
              route="/my-services"
            />

            <ProfileShortcutCard
              title={`Solicitudes (${pendingRequestsCount})`}
              description="Ver solicitudes pendientes, enviadas y recibidas."
              route="/requests"
            />

            <ProfileShortcutCard
              title={`Favoritos (${favoritesCount})`}
              description="Publicaciones guardadas para revisar después."
              route="/favorites"
            />

            <ProfileShortcutCard
              title="Historial"
              description="Movimientos de créditos ganados y gastados."
              route="/history"
            />

            <ProfileShortcutCard
              title={`Notificaciones (${unreadNotificationsCount})`}
              description="Actividad reciente de la aplicación."
              route="/notifications"
            />

            <ProfileShortcutCard
              title="Configuración"
              description="Estado de la cuenta y preferencias."
              route="/settings"
            />
          </View>

          <Text
            style={[
              styles.cardTitle,
              { marginTop: 24 },
            ]}
          >
            Historial reciente
          </Text>

          {profileUser.history.length ===
          0 ? (
            <Text
              style={styles.profileLine}
            >
              Todavía no hay movimientos
              recientes.
            </Text>
          ) : (
            profileUser.history
              .slice(0, 3)
              .map((item) => (
                <HistoryCard
                  key={item.id}
                  item={item}
                />
              ))
          )}
        </View>

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
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.push("/")
          }
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            ← Volver al inicio
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}