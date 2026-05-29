import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

import Header from "../components/Header";
import CreditCard from "../components/CreditCard";
import ProgramCard from "../components/ProgramCard";
import DashboardStatCard from "../components/DashboardStatCard";
import ServiceCard from "../components/ServiceCard";

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

import {
  getMessages,
  mapSupabaseMessageToAppMessage,
} from "../lib/messageApi";

import {
  getReviews,
  mapSupabaseReviewToAppReview,
} from "../lib/reviewApi";

export default function HomeScreen() {
  const { session } = useAuthContext();

  const { user, updateUser, notifications, favoriteServiceIds } =
    useAppContext();

  const isLoggedIn = !!session;

  const [homeUser, setHomeUser] = useState(user);
  const [myServicesCount, setMyServicesCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [conversationsCount, setConversationsCount] = useState(0);
  const [reviewsCount, setReviewsCount] = useState(0);
  const [recentServices, setRecentServices] = useState<any[]>([]);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(false);

  useEffect(() => {
    loadHomeData();
  }, [session]);

  const loadHomeData = async () => {
    try {
      setIsLoadingDashboard(true);

      const servicesData = await getServices();
      const mappedServices = servicesData.map(mapSupabaseServiceToAppService);

      if (!isLoggedIn || !session?.user?.id) {
        setRecentServices(mappedServices.slice(0, 3));
        return;
      }

      const profile = await getOrCreateProfileByUserId(
        session.user.id,
        session.user.email
      );

      const mappedUser = mapSupabaseProfileToAppUser(profile);

      setHomeUser(mappedUser);

      updateUser({
        ...mappedUser,
        offeredServices: user.offeredServices,
        neededServices: user.neededServices,
        history: user.history,
      });

      const myServices = mappedServices.filter(
        (service) => service.person === mappedUser.name
      );

      const publicServices = mappedServices.filter(
        (service) => service.person !== mappedUser.name
      );

      setMyServicesCount(myServices.length);
      setRecentServices(publicServices.slice(0, 3));

      const requestsData = await getRequests();
      const mappedRequests = requestsData.map(mapSupabaseRequestToAppRequest);

      const pendingRequests = mappedRequests.filter(
        (request) =>
          request.status === "pending" &&
          (request.requesterName === mappedUser.name ||
            request.providerName === mappedUser.name)
      );

      setPendingRequestsCount(pendingRequests.length);

      const messagesData = await getMessages();
      const mappedMessages = messagesData.map(mapSupabaseMessageToAppMessage);

      const uniqueConversations = new Set(
        mappedMessages.map((message) => message.conversationWith)
      );

      setConversationsCount(uniqueConversations.size);

      const reviewsData = await getReviews();
      const mappedReviews = reviewsData.map(mapSupabaseReviewToAppReview);

      const myProviderReviews = mappedReviews.filter(
        (review) => review.providerName === mappedUser.name
      );

      setReviewsCount(myProviderReviews.length);
    } catch (error) {
      console.log("Error cargando Home:", error);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const unreadNotificationsCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  return (
    <ScrollView style={styles.page}>
      <Header />

      <View style={styles.hero}>
        <Text style={styles.heroSmall}>A Path to a Helpful Community</Text>

        <Text style={styles.heroTitle}>Banco de Tiempo</Text>

        <Text style={styles.heroSubtitle}>
          Intercambia ayuda usando horas, no dinero.
        </Text>

        <View style={styles.heroButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/services")}
          >
            <Text style={styles.primaryButtonText}>Explorar servicios</Text>
          </TouchableOpacity>

          {isLoggedIn ? (
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => router.push("/add-service")}
            >
              <Text style={styles.outlineButtonText}>Publicar servicio</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.outlineButton}
              onPress={() => router.push("/signup")}
            >
              <Text style={styles.outlineButtonText}>Crear cuenta</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoggedIn ? (
        <>
          <View style={[styles.section, { paddingVertical: 38 }]}>
            <View
              style={{
                width: "100%",
                maxWidth: 980,
                flexDirection: "row",
                justifyContent: "space-between",
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
                    { textAlign: "left", marginBottom: 6 },
                  ]}
                >
                  Mi Dashboard
                </Text>

                <Text
                  style={[styles.sectionDescription, { textAlign: "left" }]}
                >
                  Resumen de actividad y créditos.
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: "#0D2240",
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderRadius: 999,
                }}
                onPress={() => router.push("/profile")}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
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
              <CreditCard credits={homeUser.credits} compact />
            </View>

            <View style={styles.statsGrid}>
              <DashboardStatCard
                label="Solicitudes pendientes"
                value={pendingRequestsCount}
              />

              <DashboardStatCard label="Mis servicios" value={myServicesCount} />

              <DashboardStatCard
                label="Favoritos"
                value={favoriteServiceIds.length}
              />

              <DashboardStatCard
                label="Conversaciones"
                value={conversationsCount}
              />

              <DashboardStatCard
                label="Reviews recibidas"
                value={reviewsCount}
              />

              <DashboardStatCard
                label="Notificaciones"
                value={unreadNotificationsCount}
              />
            </View>
          </View>

          <View style={[styles.section, { paddingVertical: 34 }]}>
            <Text style={styles.sectionTitle}>Accesos rápidos</Text>

            <View style={styles.heroButtons}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => router.push("/add-service")}
              >
                <Text style={styles.primaryButtonText}>Publicar servicio</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => router.push("/requests")}
              >
                <Text style={styles.primaryButtonText}>Solicitudes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => router.push("/conversations")}
              >
                <Text style={styles.primaryButtonText}>Mensajes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => router.push("/profile")}
              >
                <Text style={styles.primaryButtonText}>Mi perfil</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      ) : (
        <View style={[styles.section, { paddingVertical: 38 }]}>
          <Text style={styles.sectionTitle}>Bienvenido</Text>

          <Text style={styles.sectionDescription}>
            Explora servicios disponibles en la comunidad. Para contactar,
            guardar favoritos o solicitar servicios, crea una cuenta o inicia
            sesión desde el menú superior.
          </Text>
        </View>
      )}

      <View style={[styles.section, { paddingVertical: 42 }]}>
        <Text style={styles.sectionTitle}>Servicios recientes</Text>

        <Text style={styles.sectionDescription}>
          Últimos servicios publicados por la comunidad.
        </Text>

        <View style={styles.programGrid}>
          {recentServices.length === 0 ? (
            <View style={styles.emptyStateCard}>
              <Text style={styles.emptyStateTitle}>Sin servicios recientes</Text>
              <Text style={styles.emptyStateText}>
                Cuando usuarios publiquen servicios, aparecerán aquí.
              </Text>
            </View>
          ) : (
            recentServices.map((service) => (
              <ServiceCard
                key={service.supabaseId || service.id}
                item={service}
              />
            ))
          )}
        </View>
      </View>

      <View style={[styles.section, { paddingVertical: 42 }]}>
        <Text style={styles.sectionTitle}>Services & Programs</Text>

        <Text style={styles.sectionDescription}>
          Conecta con personas que ofrecen ayuda comunitaria, educación,
          tecnología y newcomer support.
        </Text>

        <View style={styles.programGrid}>
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