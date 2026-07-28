import {
  useCallback,
  useState,
} from "react";

import {
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
import ProgramCard from "../components/ProgramCard";
import DashboardStatCard from "../components/DashboardStatCard";
import ServiceCard from "../components/ServiceCard";

import { styles } from "../theme/styles";

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
  getServices,
  mapSupabaseServiceToAppService,
} from "../lib/serviceApi";

import {
  getRequests,
  mapSupabaseRequestToAppRequest,
} from "../lib/requestApi";

import {
  getUserConversations,
} from "../lib/messageApi";

import {
  getReviews,
  mapSupabaseReviewToAppReview,
} from "../lib/reviewApi";

export default function HomeScreen() {
  const {
    session,
  } = useAuthContext();

  const {
    user,
    updateUser,
    notifications,
    favoriteServiceIds,
  } = useAppContext();

  const isLoggedIn =
    Boolean(session);

  const [
    homeUser,
    setHomeUser,
  ] = useState(user);

  const [
    myServicesCount,
    setMyServicesCount,
  ] = useState(0);

  const [
    pendingRequestsCount,
    setPendingRequestsCount,
  ] = useState(0);

  const [
    conversationsCount,
    setConversationsCount,
  ] = useState(0);

  const [
    unreadMessagesCount,
    setUnreadMessagesCount,
  ] = useState(0);

  const [
    reviewsCount,
    setReviewsCount,
  ] = useState(0);

  const [
    recentServices,
    setRecentServices,
  ] = useState<any[]>([]);

  const [
    isLoadingDashboard,
    setIsLoadingDashboard,
  ] = useState(false);

  const loadHomeData =
    async () => {
      try {
        setIsLoadingDashboard(true);

        const servicesData =
          await getServices();

        const mappedServices =
          servicesData.map(
            mapSupabaseServiceToAppService
          );

        console.log(
          "Publicaciones cargadas en Home:",
          mappedServices
        );

        /*
         * La API ya ordena por created_at.
         * Mostramos las tres publicaciones
         * más recientes.
         */
        setRecentServices(
          mappedServices.slice(0, 3)
        );

        /*
         * Un usuario sin sesión puede ver
         * publicaciones, pero no su dashboard.
         */
        if (!session?.user?.id) {
          setMyServicesCount(0);
          setPendingRequestsCount(0);
          setConversationsCount(0);
          setUnreadMessagesCount(0);
          setReviewsCount(0);

          return;
        }

        /*
         * Cargar o crear el perfil asociado
         * al usuario autenticado.
         */
        const profile =
          await getOrCreateProfileByUserId(
            session.user.id,
            session.user.email
          );

        const mappedUser =
          mapSupabaseProfileToAppUser(
            profile
          );

        setHomeUser(mappedUser);

        updateUser({
          ...mappedUser,

          offeredServices:
            user.offeredServices,

          neededServices:
            user.neededServices,

          history:
            user.history,
        });

        /*
         * Contar publicaciones propias.
         *
         * Se prioriza providerUserId porque es
         * más seguro que comparar nombres.
         *
         * La comparación por nombre queda como
         * respaldo para publicaciones antiguas.
         */
        const normalizedUserName =
          String(
            mappedUser.name ?? ""
          )
            .trim()
            .toLowerCase();

        const myServices =
          mappedServices.filter(
            (service) => {
              const belongsByUuid =
                Boolean(
                  service.providerUserId &&
                  service.providerUserId ===
                    session.user.id
                );

              const belongsByName =
                String(
                  service.person ?? ""
                )
                  .trim()
                  .toLowerCase() ===
                normalizedUserName;

              return (
                belongsByUuid ||
                belongsByName
              );
            }
          );

        setMyServicesCount(
          myServices.length
        );

        /*
         * Cargar solicitudes relacionadas
         * con el usuario.
         */
        const requestsData =
          await getRequests();

        const mappedRequests =
          requestsData.map(
            mapSupabaseRequestToAppRequest
          );

        const pendingRequests =
          mappedRequests.filter(
            (request) => {
              if (
                request.status !==
                "pending"
              ) {
                return false;
              }

              const belongsByUuid =
                request.providerUserId ===
                  session.user.id ||
                request.requesterUserId ===
                  session.user.id;

              const belongsByName =
                request.providerName ===
                  mappedUser.name ||
                request.requesterName ===
                  mappedUser.name;

              return (
                belongsByUuid ||
                belongsByName
              );
            }
          );

        setPendingRequestsCount(
          pendingRequests.length
        );

        /*
         * Nuevo sistema de chat.
         *
         * getUserConversations() devuelve
         * únicamente las conversaciones del
         * usuario autenticado.
         */
        const conversations =
          await getUserConversations();

        setConversationsCount(
          conversations.length
        );

        const unreadMessages =
          conversations.reduce(
            (
              total,
              conversation
            ) =>
              total +
              Number(
                conversation.unread_count ||
                  0
              ),
            0
          );

        setUnreadMessagesCount(
          unreadMessages
        );

        /*
         * Cargar reviews recibidas.
         */
        const reviewsData =
          await getReviews();

        const mappedReviews =
          reviewsData.map(
            mapSupabaseReviewToAppReview
          );

        const myProviderReviews =
          mappedReviews.filter(
            (review) =>
              review.providerName ===
              mappedUser.name
          );

        setReviewsCount(
          myProviderReviews.length
        );
      } catch (error) {
        console.log(
          "Error cargando Home:",
          error
        );
      } finally {
        setIsLoadingDashboard(false);
      }
    };

  /*
   * Se ejecuta cada vez que Home
   * vuelve a obtener el foco.
   */
  useFocusEffect(
    useCallback(() => {
      void loadHomeData();
    }, [session?.user?.id])
  );

  const unreadNotificationsCount =
    notifications.filter(
      (notification) =>
        !notification.read
    ).length;

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{
        paddingBottom: 50,
      }}
    >
      <Header />

      {/* HERO */}
      <View style={styles.hero}>
        <Text style={styles.heroSmall}>
          A Path to a Helpful Community
        </Text>

        <Text style={styles.heroTitle}>
          Banco de Tiempo
        </Text>

        <Text
          style={styles.heroSubtitle}
        >
          Intercambia ayuda usando horas,
          no dinero.
        </Text>

        <View
          style={styles.heroButtons}
        >
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.push("/services")
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Explorar servicios
            </Text>
          </TouchableOpacity>

          {isLoggedIn ? (
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() =>
                router.push(
                  "/add-service"
                )
              }
            >
              <Text
                style={
                  styles.outlineButtonText
                }
              >
                Publicar oferta o pedido
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() =>
                router.push("/signup")
              }
            >
              <Text
                style={
                  styles.outlineButtonText
                }
              >
                Crear cuenta
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoggedIn ? (
        <>
          {/* DASHBOARD */}
          <View
            style={[
              styles.section,
              {
                paddingVertical: 38,
              },
            ]}
          >
            <View
              style={{
                width: "100%",
                maxWidth: 980,

                flexDirection: "row",

                justifyContent:
                  "space-between",

                alignItems: "center",

                marginBottom: 18,

                gap: 16,

                flexWrap: "wrap",
              }}
            >
              <View>
                <Text
                  style={[
                    styles.sectionTitle,
                    {
                      textAlign: "left",
                      marginBottom: 6,
                    },
                  ]}
                >
                  Mi Dashboard
                </Text>

                <Text
                  style={[
                    styles.sectionDescription,
                    {
                      textAlign: "left",
                    },
                  ]}
                >
                  Resumen de actividad y
                  créditos.
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor:
                    "#0D2240",

                  paddingHorizontal: 18,
                  paddingVertical: 10,

                  borderRadius: 999,
                }}
                onPress={() =>
                  router.push("/profile")
                }
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontWeight: "700",
                  }}
                >
                  Ver perfil
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={{
                maxWidth: 360,
                width: "100%",
                alignSelf: "center",
                marginBottom: 22,
              }}
            >
              <CreditCard
                credits={
                  homeUser?.credits ?? 0
                }
                compact
              />
            </View>

            <View
              style={styles.statsGrid}
            >
              <DashboardStatCard
                label="Solicitudes pendientes"
                value={
                  pendingRequestsCount
                }
              />

              <DashboardStatCard
                label="Mis publicaciones"
                value={
                  myServicesCount
                }
              />

              <DashboardStatCard
                label="Favoritos"
                value={
                  favoriteServiceIds.length
                }
              />

              <DashboardStatCard
                label="Conversaciones"
                value={
                  conversationsCount
                }
              />

              <DashboardStatCard
                label="Mensajes no leídos"
                value={
                  unreadMessagesCount
                }
              />

              <DashboardStatCard
                label="Reviews recibidas"
                value={
                  reviewsCount
                }
              />

              <DashboardStatCard
                label="Notificaciones"
                value={
                  unreadNotificationsCount
                }
              />
            </View>

            {isLoadingDashboard ? (
              <Text
                style={[
                  styles.sectionDescription,
                  {
                    marginTop: 18,
                  },
                ]}
              >
                Actualizando dashboard...
              </Text>
            ) : null}
          </View>

          {/* ACCESOS RÁPIDOS */}
          <View
            style={[
              styles.section,
              {
                paddingVertical: 34,
              },
            ]}
          >
            <Text
              style={styles.sectionTitle}
            >
              Accesos rápidos
            </Text>

            <View
              style={styles.heroButtons}
            >
              <TouchableOpacity
                style={
                  styles.primaryButton
                }
                onPress={() =>
                  router.push(
                    "/add-service"
                  )
                }
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Publicar oferta o pedido
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.contactButton
                }
                onPress={() =>
                  router.push(
                    "/requests"
                  )
                }
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Solicitudes
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.contactButton
                }
                onPress={() =>
                  router.push(
                    "/conversations"
                  )
                }
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  {unreadMessagesCount > 0
                    ? `Mensajes (${unreadMessagesCount})`
                    : "Mensajes"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={
                  styles.contactButton
                }
                onPress={() =>
                  router.push("/profile")
                }
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Mi perfil
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <View
          style={[
            styles.section,
            {
              paddingVertical: 38,
            },
          ]}
        >
          <Text
            style={styles.sectionTitle}
          >
            Bienvenido
          </Text>

          <Text
            style={
              styles.sectionDescription
            }
          >
            Explora ofertas y pedidos
            disponibles en la comunidad.
            Para contactar, guardar
            favoritos o participar en un
            intercambio, crea una cuenta o
            inicia sesión desde el menú
            superior.
          </Text>
        </View>
      )}

      {/* PUBLICACIONES RECIENTES */}
      <View
        style={[
          styles.section,
          {
            paddingVertical: 42,
          },
        ]}
      >
        <Text
          style={styles.sectionTitle}
        >
          Publicaciones recientes
        </Text>

        <Text
          style={
            styles.sectionDescription
          }
        >
          Últimas ofertas y pedidos
          publicados por la comunidad.
        </Text>

        <View
          style={styles.programGrid}
        >
          {recentServices.length === 0 &&
          !isLoadingDashboard ? (
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
                Sin publicaciones recientes
              </Text>

              <Text
                style={
                  styles.emptyStateText
                }
              >
                Cuando los usuarios
                publiquen ofertas o pedidos,
                aparecerán aquí.
              </Text>
            </View>
          ) : (
            recentServices.map(
              (service) => (
                <ServiceCard
                  key={
                    service.supabaseId ||
                    service.id
                  }
                  item={service}
                />
              )
            )
          )}
        </View>
      </View>

      {/* PROGRAMAS */}
      <View
        style={[
          styles.section,
          {
            paddingVertical: 42,
          },
        ]}
      >
        <Text
          style={styles.sectionTitle}
        >
          Services & Programs
        </Text>

        <Text
          style={
            styles.sectionDescription
          }
        >
          Conecta con personas que ofrecen
          ayuda comunitaria, educación,
          tecnología y newcomer support.
        </Text>

        <View
          style={styles.programGrid}
        >
          <ProgramCard
            title="Newcomer Support"
            description="Ayuda para newcomers, orientación, traducción y adaptación."
          />

          <ProgramCard
            title="Education & Jobs"
            description="Clases, CV, entrevistas y apoyo laboral."
          />

          <ProgramCard
            title="Technology Help"
            description="Reparación de computadores y soporte técnico."
          />
        </View>
      </View>
    </ScrollView>
  );
}