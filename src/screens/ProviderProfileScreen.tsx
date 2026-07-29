import {
  useCallback,
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
import TrustCard from "../components/TrustCard";

import {
  styles,
} from "../theme/styles";

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
  getProviderReviewStats,
  getReviewsByProviderUserId,
  mapSupabaseReviewToAppReview,
  AppReview,
  ReviewStats,
} from "../lib/reviewApi";

import {
  getUserTrustStats,
  TrustStats,
} from "../lib/trustApi";

import {
  getOrCreateConversation,
  isValidUuid,
} from "../lib/messageApi";

function renderStars(
  rating: number
): string {
  const validRating =
    Math.max(
      0,
      Math.min(
        5,
        Math.round(rating)
      )
    );

  return (
    "★".repeat(validRating) +
    "☆".repeat(
      5 - validRating
    )
  );
}

export default function ProviderProfileScreen() {
  const params =
    useLocalSearchParams<{
      name?: string | string[];
    }>();

  const providerNameParam =
    Array.isArray(
      params.name
    )
      ? params.name[0] || ""
      : params.name || "";

  const providerName =
    decodeURIComponent(
      providerNameParam
    ).trim();

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
    providerReviews,
    setProviderReviews,
  ] = useState<AppReview[]>([]);

  const [
    reviewStats,
    setReviewStats,
  ] = useState<ReviewStats | null>(
    null
  );

  const [
    trustStats,
    setTrustStats,
  ] = useState<TrustStats | null>(
    null
  );

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

  const loadProvider =
    useCallback(
      async () => {
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
            ) ?? null;

          if (
            !foundProfile ||
            !foundProfile.user_id
          ) {
            setProviderProfile(
              null
            );

            setProviderServices(
              []
            );

            setProviderReviews(
              []
            );

            setReviewStats(
              null
            );

            setTrustStats(
              null
            );

            setErrorMessage(
              "No se encontró el perfil asociado a este proveedor."
            );

            return;
          }

          if (
            !isValidUuid(
              foundProfile.user_id
            )
          ) {
            throw new Error(
              "El perfil del proveedor no contiene un UUID válido."
            );
          }

          setProviderProfile(
            foundProfile
          );

          const [
            reviewsData,
            reviewStatsData,
            trustData,
          ] = await Promise.all([
            getReviewsByProviderUserId(
              foundProfile.user_id
            ),

            getProviderReviewStats(
              foundProfile.user_id
            ),

            getUserTrustStats(
              foundProfile.user_id
            ),
          ]);

          const mappedServices =
            servicesData.map(
              mapSupabaseServiceToAppService
            );

          const filteredServices =
            mappedServices.filter(
              (service) =>
                service.providerUserId ===
                foundProfile.user_id
            );

          const mappedReviews =
            reviewsData.map(
              mapSupabaseReviewToAppReview
            );

          setProviderServices(
            filteredServices
          );

          setProviderReviews(
            mappedReviews
          );

          setReviewStats(
            reviewStatsData
          );

          setTrustStats(
            trustData
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
      },
      [
        providerName,
        normalizedProviderName,
      ]
    );

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
        router.push(
          "/login"
        );

        return;
      }

      const providerUserId =
        providerProfile?.user_id ??
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
        setIsOpeningChat(
          true
        );

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
        setIsOpeningChat(
          false
        );
      }
    };

  const handleOpenAllReviews =
    () => {
      if (
        !providerProfile?.user_id
      ) {
        return;
      }

      router.push({
        pathname:
          "/reviews/[userId]",

        params: {
          userId:
            providerProfile.user_id,

          name:
            providerProfile.name ||
            providerName,
        },
      });
    };

  if (isLoading) {
    return (
      <ScrollView
        style={styles.page}
      >
        <Header />

        <View
          style={styles.formSection}
        >
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
      <ScrollView
        style={styles.page}
      >
        <Header />

        <View
          style={styles.formSection}
        >
          <Text
            style={
              styles.screenTitle
            }
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

  const latestReviews =
    providerReviews.slice(
      0,
      3
    );

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{
        paddingBottom: 60,
      }}
    >
      <Header />

      <View
        style={styles.formSection}
      >
        <View
          style={{
            alignItems:
              "center",

            marginBottom:
              24,
          }}
        >
          <Image
            source={{
              uri:
                providerProfile.avatar ||
                "https://i.pravatar.cc/300",
            }}
            style={{
              width:
                100,

              height:
                100,

              borderRadius:
                50,

              marginBottom:
                14,
            }}
          />

          <Text
            style={styles.screenTitle}
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

        {reviewStats ? (
          <TouchableOpacity
            style={
              styles.profileCard
            }
            onPress={
              handleOpenAllReviews
            }
            activeOpacity={0.8}
          >
            <Text
              style={styles.cardTitle}
            >
              Reputación
            </Text>

            <Text
              style={{
                color:
                  "#F5C451",

                fontSize:
                  24,

                marginTop:
                  8,
              }}
            >
              {renderStars(
                reviewStats.averageRating
              )}
            </Text>

            <Text
              style={{
                color:
                  "#FFFFFF",

                fontSize:
                  22,

                fontWeight:
                  "700",

                marginTop:
                  8,
              }}
            >
              {reviewStats.averageRating.toFixed(
                1
              )}{" "}
              de 5
            </Text>

            <Text
              style={[
                styles.screenSubtitle,
                {
                  marginTop:
                    6,
                },
              ]}
            >
              {reviewStats.reviewsCount}{" "}
              {reviewStats.reviewsCount ===
              1
                ? "reseña"
                : "reseñas"}
            </Text>

            <Text
              style={{
                color:
                  "#9FC5FF",

                fontSize:
                  14,

                fontWeight:
                  "600",

                marginTop:
                  14,
              }}
            >
              Ver todas las reseñas →
            </Text>
          </TouchableOpacity>
        ) : null}

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
                color:
                  "#E0E0E0",

                fontSize:
                  15,

                lineHeight:
                  22,

                marginBottom:
                  16,
              }}
            >
              {providerProfile.bio}
            </Text>
          ) : (
            <Text
              style={[
                styles.profileLine,
                {
                  color:
                    "#888888",

                  fontStyle:
                    "italic",
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
                marginTop:
                  20,
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
                flexDirection:
                  "row",

                flexWrap:
                  "wrap",

                gap:
                  8,

                marginTop:
                  8,
              }}
            >
              {providerProfile.skills.map(
                (skill) => (
                  <View
                    key={skill}
                    style={{
                      backgroundColor:
                        "#0D2240",

                      borderRadius:
                        999,

                      paddingHorizontal:
                        12,

                      paddingVertical:
                        7,
                    }}
                  >
                    <Text
                      style={{
                        color:
                          "#FFFFFF",

                        fontSize:
                          13,

                        fontWeight:
                          "600",
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
              style={styles.profileLine}
            >
              Sin habilidades publicadas.
            </Text>
          )}
        </View>

        {trustStats ? (
          <TrustCard
            stats={trustStats}
            title="Confianza del proveedor"
          />
        ) : null}

        <View
          style={styles.profileCard}
        >
          <Text
            style={styles.cardTitle}
          >
            Contacto
          </Text>

          {!isOwnProfile ? (
            <TouchableOpacity
              style={[
                styles.contactButton,
                {
                  marginTop:
                    12,
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
              style={
                styles.screenSubtitle
              }
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

        <View
          style={{
            flexDirection:
              "row",

            justifyContent:
              "space-between",

            alignItems:
              "center",

            marginTop:
              26,

            marginBottom:
              10,
          }}
        >
          <Text
            style={styles.cardTitle}
          >
            Últimas reseñas
          </Text>

          {providerReviews.length >
          0 ? (
            <TouchableOpacity
              onPress={
                handleOpenAllReviews
              }
            >
              <Text
                style={{
                  color:
                    "#9FC5FF",

                  fontSize:
                    14,

                  fontWeight:
                    "600",
                }}
              >
                Ver todas
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {latestReviews.length ===
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
              Sin reseñas
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
          latestReviews.map(
            (review) => (
              <ReviewCard
                key={
                  review.supabaseId ||
                  review.id
                }
                item={review}
              />
            )
          )
        )}

        {providerReviews.length >
        3 ? (
          <TouchableOpacity
            style={
              styles.contactButton
            }
            onPress={
              handleOpenAllReviews
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Ver las{" "}
              {providerReviews.length}{" "}
              reseñas
            </Text>
          </TouchableOpacity>
        ) : null}

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