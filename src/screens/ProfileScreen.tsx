import {
  useCallback,
  useEffect,
  useRef,
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
import TrustCard from "../components/TrustCard";

import {
  styles,
} from "../theme/styles";

import {
  useAppContext,
} from "../context/AppContext";

import {
  useAuthContext,
} from "../context/AuthContext";

import {
  getOrCreateProfileByUserId,
  mapSupabaseProfileToAppUser,
} from "../lib/profileApi";

import {
  getServicesByProviderUserId,
  mapSupabaseServiceToAppService,
} from "../lib/serviceApi";

import {
  getRequests,
  mapSupabaseRequestToAppRequest,
} from "../lib/requestApi";

import {
  getFavoritesByUser,
} from "../lib/favoriteApi";

import {
  getNotifications,
  mapSupabaseNotificationToAppNotification,
} from "../lib/notificationApi";

import {
  getTransactionsByUserId,
  mapTransactionToHistoryItem,
} from "../lib/transactionApi";

import {
  getUserTrustStats,
  TrustStats,
} from "../lib/trustApi";

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

  const currentUserId =
    authUser?.id ?? "";

  const currentUserEmail =
    authUser?.email ?? "";

  const updateUserRef =
    useRef(updateUser);

  const isLoadingRef =
    useRef(false);

  const hasLoadedRef =
    useRef(false);

  const [
    profileUser,
    setProfileUser,
  ] = useState(user);

  const [
    trustStats,
    setTrustStats,
  ] = useState<TrustStats | null>(
    null
  );

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
    isInitialLoading,
    setIsInitialLoading,
  ] = useState(true);

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    updateUserRef.current =
      updateUser;
  }, [updateUser]);

  useEffect(() => {
    setProfileUser(user);
  }, [user]);

  const loadProfileDashboard =
    useCallback(
      async (
        showFullLoading = false
      ) => {
        if (!currentUserId) {
          setIsInitialLoading(false);
          return;
        }

        if (isLoadingRef.current) {
          return;
        }

        try {
          isLoadingRef.current = true;

          setErrorMessage("");

          if (
            showFullLoading ||
            !hasLoadedRef.current
          ) {
            setIsInitialLoading(true);
          } else {
            setIsRefreshing(true);
          }

          const profile =
            await getOrCreateProfileByUserId(
              currentUserId,
              currentUserEmail
            );

          const mappedUser =
            mapSupabaseProfileToAppUser(
              profile
            );

          const [
            servicesData,
            requestsData,
            favoritesData,
            notificationsData,
            transactionsData,
            trustData,
          ] = await Promise.all([
            getServicesByProviderUserId(
              currentUserId
            ),

            getRequests(),

            getFavoritesByUser(
              mappedUser.name
            ),

            getNotifications(),

            getTransactionsByUserId(
              currentUserId
            ),

            getUserTrustStats(
              currentUserId
            ),
          ]);

          const mappedServices =
            servicesData.map(
              mapSupabaseServiceToAppService
            );

          const mappedRequests =
            requestsData.map(
              mapSupabaseRequestToAppRequest
            );

          const mappedNotifications =
            notificationsData.map(
              mapSupabaseNotificationToAppNotification
            );

          const mappedHistory =
            transactionsData.map(
              (transaction) =>
                mapTransactionToHistoryItem(
                  transaction,
                  currentUserId
                )
            );

          const localHistory =
            mappedHistory.map(
              (
                item,
                index
              ) => ({
                id:
                  Date.now() +
                  index,

                type:
                  item.type,

                description:
                  `${item.serviceName}: ${item.description}`,

                credits:
                  item.credits,

                date:
                  item.date,
              })
            );

          const completeMappedUser = {
            ...mappedUser,

            offeredServices:
              user.offeredServices,

            neededServices:
              user.neededServices,

            history:
              localHistory,
          };

          setProfileUser(
            completeMappedUser
          );

          setTrustStats(
            trustData
          );

          updateUserRef.current(
            completeMappedUser
          );

          setMyServicesCount(
            mappedServices.length
          );

          setMyOffersCount(
            mappedServices.filter(
              (service) =>
                service.serviceType ===
                "offer"
            ).length
          );

          setMyRequestsCount(
            mappedServices.filter(
              (service) =>
                service.serviceType ===
                "request"
            ).length
          );

          const pendingRequests =
            mappedRequests.filter(
              (request) =>
                request.status ===
                  "pending" &&
                (
                  request.requesterUserId ===
                    currentUserId ||
                  request.providerUserId ===
                    currentUserId
                )
            );

          setPendingRequestsCount(
            pendingRequests.length
          );

          setFavoritesCount(
            favoritesData.length
          );

          setUnreadNotificationsCount(
            mappedNotifications.filter(
              (notification) =>
                !notification.read
            ).length
          );

          hasLoadedRef.current = true;
        } catch (error: any) {
          console.error(
            "Error cargando perfil:",
            error
          );

          setErrorMessage(
            error?.message ||
              "No se pudo cargar el perfil."
          );
        } finally {
          isLoadingRef.current = false;
          setIsInitialLoading(false);
          setIsRefreshing(false);
        }
      },
      [
        currentUserId,
        currentUserEmail,
        user.offeredServices,
        user.neededServices,
      ]
    );

  useFocusEffect(
    useCallback(() => {
      if (
        !isAuthLoading &&
        !session
      ) {
        router.replace(
          "/login"
        );

        return;
      }

      if (
        session &&
        currentUserId &&
        !hasLoadedRef.current
      ) {
        void loadProfileDashboard(
          true
        );
      }
    }, [
      session,
      currentUserId,
      isAuthLoading,
      loadProfileDashboard,
    ])
  );

  const handleRefresh =
    useCallback(() => {
      void loadProfileDashboard(
        false
      );
    }, [loadProfileDashboard]);

  if (
    isAuthLoading ||
    isInitialLoading
  ) {
    return (
      <ScrollView
        style={styles.page}
      >
        <Header />

        <View
          style={
            styles.formSection
          }
        >
          <Text
            style={
              styles.screenTitle
            }
          >
            Cargando perfil...
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (
    !session ||
    !currentUserId
  ) {
    return (
      <ScrollView
        style={styles.page}
      >
        <Header />

        <View
          style={
            styles.formSection
          }
        >
          <Text
            style={
              styles.screenTitle
            }
          >
            Necesitas iniciar sesión
          </Text>

          <TouchableOpacity
            style={
              styles.primaryButton
            }
            onPress={() =>
              router.push(
                "/login"
              )
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
    <ScrollView
      style={styles.page}
      contentContainerStyle={{
        paddingBottom: 50,
      }}
    >
      <Header />

      <View
        style={
          styles.formSection
        }
      >
        <Text
          style={
            styles.screenTitle
          }
        >
          Mi perfil
        </Text>

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

            <TouchableOpacity
              style={
                styles.contactButton
              }
              onPress={
                handleRefresh
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Reintentar
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View
          style={
            styles.profileCard
          }
        >
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
            style={
              styles.profileName
            }
          >
            {profileUser.name}
          </Text>

          <Text
            style={
              styles.profileLine
            }
          >
            {profileUser.city ||
              "Ciudad no indicada"}

            {profileUser.community
              ? ` · ${profileUser.community}`
              : ""}
          </Text>

          {profileUser.email ? (
            <Text
              style={
                styles.profileLine
              }
            >
              {profileUser.email}
            </Text>
          ) : null}

          <Text
            style={[
              styles.cardTitle,
              {
                marginTop: 22,
              },
            ]}
          >
            Sobre mí
          </Text>

          <Text
            style={
              styles.profileLine
            }
          >
            {profileUser.bio ||
              "Todavía no has agregado una biografía."}
          </Text>

          <Text
            style={[
              styles.cardTitle,
              {
                marginTop: 22,
              },
            ]}
          >
            Habilidades
          </Text>

          {skills.length === 0 ? (
            <Text
              style={
                styles.profileLine
              }
            >
              Todavía no has agregado habilidades.
            </Text>
          ) : (
            <View
              style={
                styles.filterRow
              }
            >
              {skills.map(
                (skill) => (
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
                )
              )}
            </View>
          )}

          <View
            style={{
              marginTop: 24,
            }}
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
            style={
              styles.primaryButton
            }
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

          <TouchableOpacity
            style={[
              styles.contactButton,
              isRefreshing && {
                opacity: 0.6,
              },
            ]}
            onPress={
              handleRefresh
            }
            disabled={
              isRefreshing
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              {isRefreshing
                ? "Actualizando..."
                : "Actualizar perfil"}
            </Text>
          </TouchableOpacity>
        </View>

        {trustStats ? (
          <TrustCard
            stats={
              trustStats
            }
          />
        ) : null}

        <View
          style={
            styles.profileCard
          }
        >
          <Text
            style={
              styles.cardTitle
            }
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
              {
                marginTop: 24,
              },
            ]}
          >
            Historial reciente
          </Text>

          {profileUser.history.length ===
          0 ? (
            <Text
              style={
                styles.profileLine
              }
            >
              Todavía no hay movimientos recientes.
            </Text>
          ) : (
            profileUser.history
              .slice(0, 3)
              .map(
                (item) => (
                  <HistoryCard
                    key={item.id}
                    item={item}
                  />
                )
              )
          )}
        </View>

        <TouchableOpacity
          style={
            styles.dangerButton
          }
          onPress={
            resetLocalData
          }
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
          style={
            styles.backButton
          }
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