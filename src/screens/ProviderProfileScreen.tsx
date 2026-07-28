import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";

import Header from "../components/Header";
import ServiceCard from "../components/ServiceCard";
import ReviewCard from "../components/ReviewCard";

import { styles } from "../theme/styles";

import {
  useAppContext,
} from "../context/AppContext";

import {
  useAuthContext,
} from "../context/AuthContext";

import {
  getProfiles,
  SupabaseProfile,
} from "../lib/profileApi";

import {
  getServices,
  mapSupabaseServiceToAppService,
  AppService,
} from "../lib/serviceApi";

import {
  getOrCreateConversation,
  isValidUuid,
} from "../lib/messageApi";

export default function ProviderProfileScreen() {
  const params =
    useLocalSearchParams<{
      name?: string | string[];
    }>();

  const providerNameParam =
    Array.isArray(params.name)
      ? params.name[0] || ""
      : params.name || "";

  const providerName =
    decodeURIComponent(
      providerNameParam
    ).trim();

  const {
    reviews,
  } = useAppContext();

  const {
    session,
    authUser,
  } = useAuthContext();

  const [
    providerProfile,
    setProviderProfile,
  ] = useState<SupabaseProfile | null>(
    null
  );

  const [
    providerServices,
    setProviderServices,
  ] = useState<AppService[]>([]);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isOpeningChat,
    setIsOpeningChat,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const normalizedProviderName =
    providerName
      .trim()
      .toLowerCase();

  const providerReviews =
    useMemo(() => {
      return reviews.filter(
        (review) =>
          String(
            review.providerName || ""
          )
            .trim()
            .toLowerCase() ===
          normalizedProviderName
      );
    }, [
      reviews,
      normalizedProviderName,
    ]);

  const averageRating =
    providerReviews.length === 0
      ? 0
      : providerReviews.reduce(
          (
            total,
            review
          ) =>
            total +
            Number(
              review.rating || 0
            ),
          0
        ) /
        providerReviews.length;

  const loadProvider =
    useCallback(async () => {
      if (!providerName) {
        setErrorMessage(
          "No se recibió el nombre del proveedor."
        );

        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const [
          profiles,
          servicesData,
        ] = await Promise.all([
          getProfiles(),
          getServices(),
        ]);

        const foundProfile =
          profiles.find(
            (profile) => {
              const profileName =
                String(
                  profile.name || ""
                )
                  .trim()
                  .toLowerCase();

              const email =
                String(
                  profile.email || ""
                )
                  .trim()
                  .toLowerCase();

              const emailPrefix =
                email.split("@")[0];

              return (
                profileName ===
                  normalizedProviderName ||
                email ===
                  normalizedProviderName ||
                emailPrefix ===
                  normalizedProviderName
              );
            }
          ) || null;

        if (!foundProfile) {
          setProviderProfile(null);
          setProviderServices([]);

          setErrorMessage(
            "No se encontró el perfil asociado a este proveedor."
          );

          return;
        }

        setProviderProfile(
          foundProfile
        );

        const mappedServices =
          servicesData.map(
            mapSupabaseServiceToAppService
          );

        const filteredServices =
          mappedServices.filter(
            (service) =>
              (
                foundProfile.user_id &&
                service.providerUserId ===
                  foundProfile.user_id
              ) ||
              String(
                service.person || ""
              )
                .trim()
                .toLowerCase() ===
                normalizedProviderName
          );

        setProviderServices(
          filteredServices
        );
      } catch (error: any) {
        console.error(
          "Error cargando proveedor:",
          error
        );

        setErrorMessage(
          error?.message ||
            "No se pudo cargar el perfil del proveedor."
        );
      } finally {
        setIsLoading(false);
      }
    }, [
      providerName,
      normalizedProviderName,
    ]);

  useFocusEffect(
    useCallback(() => {
      void loadProvider();
    }, [loadProvider])
  );

  const handleContactProvider =
    async () => {
      if (
        !session ||
        !authUser?.id
      ) {
        router.push("/login");
        return;
      }

      const providerUserId =
        providerProfile?.user_id ||
        "";

      if (
        !providerUserId ||
        !isValidUuid(
          providerUserId
        )
      ) {
        Alert.alert(
          "Proveedor no disponible",
          "No se encontró una cuenta válida asociada al proveedor."
        );

        return;
      }

      if (
        providerUserId ===
        authUser.id
      ) {
        Alert.alert(
          "Tu perfil",
          "No puedes iniciar una conversación contigo mismo."
        );

        return;
      }

      try {
        setIsOpeningChat(true);

        const conversation =
          await getOrCreateConversation({
            otherUserId:
              providerUserId,

            serviceId:
              null,

            requestId:
              null,

            serviceName:
              null,
          });

        if (
          !isValidUuid(
            conversation.id
          )
        ) {
          throw new Error(
            "No se recibió un ID válido para la conversación."
          );
        }

        router.push({
          pathname:
            "/chat/[id]",

          params: {
            id:
              conversation.id,

            name:
              providerProfile?.name ||
              providerName,

            serviceName:
              "",
          },
        });
      } catch (error: any) {
        Alert.alert(
          "No se pudo abrir el chat",
          error?.message ||
            "Ocurrió un error creando la conversación."
        );
      } finally {
        setIsOpeningChat(false);
      }
    };

  if (isLoading) {
    return (
      <ScrollView style={styles.page}>
        <Header />

        <View style={styles.formSection}>
          <ActivityIndicator />

          <Text
            style={
              styles.screenSubtitle
            }
          >
            Cargando perfil...
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (
    errorMessage ||
    !providerProfile
  ) {
    return (
      <ScrollView style={styles.page}>
        <Header />

        <View style={styles.formSection}>
          <Text
            style={styles.screenTitle}
          >
            Proveedor
          </Text>

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
              Perfil no disponible
            </Text>

            <Text
              style={
                styles.emptyStateText
              }
            >
              {errorMessage}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.push(
                "/services"
              )
            }
          >
            <Text
              style={
                styles.backButtonText
              }
            >
              ← Volver a servicios
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const isOwnProfile =
    providerProfile.user_id ===
    authUser?.id;

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{
        paddingBottom: 60,
      }}
    >
      <Header />

      <View style={styles.formSection}>
        <View
          style={{
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Image
            source={{
              uri:
                providerProfile.avatar ||
                "https://i.pravatar.cc/300",
            }}
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              marginBottom: 14,
            }}
          />

          <Text
            style={
              styles.screenTitle
            }
          >
            {providerProfile.name}
          </Text>

          <Text
            style={
              styles.screenSubtitle
            }
          >
            Perfil público del proveedor
          </Text>
        </View>

        <View
          style={styles.profileCard}
        >
          <Text
            style={styles.cardTitle}
          >
            Información
          </Text>

          {providerProfile.bio ? (
            <Text
              style={{
                color: "#E0E0E0",
                fontSize: 15,
                lineHeight: 22,
                marginBottom: 16,
              }}
            >
              {providerProfile.bio}
            </Text>
          ) : (
            <Text
              style={[
                styles.profileLine,
                {
                  color: "#888888",
                  fontStyle: "italic",
                },
              ]}
            >
              Este usuario todavía no ha agregado una biografía.
            </Text>
          )}

          <Text
            style={styles.profileLine}
          >
            Ciudad:{" "}
            {providerProfile.city ||
              "No especificada"}
          </Text>

          <Text
            style={styles.profileLine}
          >
            Comunidad:{" "}
            {providerProfile.community ||
              "No especificada"}
          </Text>

          <Text
            style={[
              styles.cardTitle,
              {
                marginTop: 20,
              },
            ]}
          >
            Habilidades
          </Text>

          {providerProfile.skills &&
          providerProfile.skills.length >
            0 ? (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 8,
              }}
            >
              {providerProfile.skills.map(
                (skill) => (
                  <View
                    key={skill}
                    style={{
                      backgroundColor:
                        "#0D2240",
                      borderRadius: 999,
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      {skill}
                    </Text>
                  </View>
                )
              )}
            </View>
          ) : (
            <Text
              style={
                styles.profileLine
              }
            >
              Sin habilidades publicadas.
            </Text>
          )}
        </View>

        <View
          style={styles.profileCard}
        >
          <Text
            style={styles.cardTitle}
          >
            Reputación
          </Text>

          <Text
            style={styles.profileLine}
          >
            Reviews recibidas:{" "}
            {providerReviews.length}
          </Text>

          <Text
            style={styles.profileLine}
          >
            Promedio:{" "}
            {providerReviews.length ===
            0
              ? "Sin reviews"
              : `${averageRating.toFixed(
                  1
                )} ⭐`}
          </Text>

          {!isOwnProfile ? (
            <TouchableOpacity
              style={[
                styles.contactButton,
                {
                  marginTop: 18,
                },
              ]}
              onPress={
                handleContactProvider
              }
              disabled={
                isOpeningChat
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                {isOpeningChat
                  ? "Abriendo chat..."
                  : `Contactar a ${providerProfile.name}`}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text
              style={[
                styles.screenSubtitle,
                {
                  marginTop: 16,
                },
              ]}
            >
              Este es tu perfil público.
            </Text>
          )}
        </View>

        <Text
          style={styles.cardTitle}
        >
          Servicios publicados
        </Text>

        {providerServices.length ===
        0 ? (
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
              Sin publicaciones
            </Text>

            <Text
              style={
                styles.emptyStateText
              }
            >
              Este proveedor no tiene ofertas o pedidos publicados actualmente.
            </Text>
          </View>
        ) : (
          providerServices.map(
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

        <Text
          style={[
            styles.cardTitle,
            {
              marginTop: 26,
            },
          ]}
        >
          Reviews
        </Text>

        {providerReviews.length ===
        0 ? (
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
              Sin reviews
            </Text>

            <Text
              style={
                styles.emptyStateText
              }
            >
              Este proveedor aún no ha recibido calificaciones.
            </Text>
          </View>
        ) : (
          providerReviews.map(
            (review) => (
              <ReviewCard
                key={review.id}
                item={review}
              />
            )
          )
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.push(
              "/services"
            )
          }
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            ← Volver a servicios
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}