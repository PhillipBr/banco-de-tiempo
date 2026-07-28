import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  Alert,
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
import { useAppContext } from "../context/AppContext";
import { useAuthContext } from "../context/AuthContext";

import { getProfiles } from "../lib/profileApi";

import {
  getOrCreateConversation,
  isValidUuid,
} from "../lib/messageApi";

export default function ProviderProfileScreen() {
  const params = useLocalSearchParams<{
    name?: string | string[];
  }>();

  const providerName = Array.isArray(params.name)
    ? params.name[0] ?? ""
    : params.name ?? "";

  const { services, reviews } = useAppContext();

  const {
    session,
    authUser,
  } = useAuthContext();

  const [
    providerUserId,
    setProviderUserId,
  ] = useState("");

  const [
    isLoadingProfile,
    setIsLoadingProfile,
  ] = useState(true);

  const [
    isOpeningChat,
    setIsOpeningChat,
  ] = useState(false);

  const providerServices = useMemo(() => {
    const normalizedProviderName =
      providerName.trim().toLowerCase();

    return services.filter(
      (service) =>
        service.person
          .trim()
          .toLowerCase() ===
        normalizedProviderName
    );
  }, [services, providerName]);

  const providerReviews = useMemo(() => {
    const normalizedProviderName =
      providerName.trim().toLowerCase();

    return reviews.filter(
      (review) =>
        review.providerName
          .trim()
          .toLowerCase() ===
        normalizedProviderName
    );
  }, [reviews, providerName]);

  const averageRating =
    providerReviews.length === 0
      ? 0
      : providerReviews.reduce(
          (total, review) =>
            total + review.rating,
          0
        ) / providerReviews.length;

  const loadProviderProfile =
    useCallback(async () => {
      if (!providerName) {
        setProviderUserId("");
        setIsLoadingProfile(false);
        return;
      }

      try {
        setIsLoadingProfile(true);

        const profiles =
          await getProfiles();

        const normalizedValue =
          providerName
            .trim()
            .toLowerCase();

        const foundProfile =
          profiles.find((profile) => {
            const normalizedName =
              profile.name
                ?.trim()
                .toLowerCase();

            const normalizedEmail =
              profile.email
                ?.trim()
                .toLowerCase();

            const emailPrefix =
              normalizedEmail
                ?.split("@")[0];

            return (
              normalizedName ===
                normalizedValue ||
              normalizedEmail ===
                normalizedValue ||
              emailPrefix ===
                normalizedValue
            );
          });

        const resolvedUserId =
          foundProfile?.user_id || "";

        console.log(
          "PROVIDER PROFILE:",
          {
            providerName,
            resolvedUserId,
          }
        );

        setProviderUserId(
          resolvedUserId
        );
      } catch (error) {
        console.error(
          "Error buscando proveedor:",
          error
        );

        setProviderUserId("");
      } finally {
        setIsLoadingProfile(false);
      }
    }, [providerName]);

  useFocusEffect(
    useCallback(() => {
      void loadProviderProfile();
    }, [loadProviderProfile])
  );

  const handleContactProvider =
    async () => {
      if (!session || !authUser?.id) {
        router.push("/login");
        return;
      }

      if (!providerUserId) {
        Alert.alert(
          "Proveedor no disponible",
          "No se encontró una cuenta asociada a este proveedor."
        );

        return;
      }

      if (!isValidUuid(providerUserId)) {
        Alert.alert(
          "ID inválido",
          "El proveedor no tiene un UUID válido en profiles.user_id."
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

            serviceId: null,
            requestId: null,
            serviceName: null,
          });

        console.log(
          "CONVERSATION CREATED:",
          conversation
        );

        if (
          !conversation?.id ||
          !isValidUuid(conversation.id)
        ) {
          throw new Error(
            "Supabase no devolvió un UUID válido para la conversación."
          );
        }

        const encodedName =
          encodeURIComponent(
            providerName
          );

        router.push(
          `/chat/${conversation.id}?name=${encodedName}`
        );
      } catch (error: any) {
        console.error(
          "Error abriendo conversación:",
          error
        );

        Alert.alert(
          "No se pudo abrir el chat",
          error?.message ||
            "Ocurrió un error creando la conversación."
        );
      } finally {
        setIsOpeningChat(false);
      }
    };

  const isOwnProfile =
    Boolean(
      authUser?.id &&
      providerUserId === authUser.id
    );

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
          {providerName ||
            "Proveedor"}
        </Text>

        <Text
          style={styles.screenSubtitle}
        >
          Perfil público del proveedor.
        </Text>

        <View style={styles.profileCard}>
          <Text style={styles.cardTitle}>
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
            {providerReviews.length === 0
              ? "Sin reviews"
              : `${averageRating.toFixed(
                  1
                )} ⭐`}
          </Text>

          {!isOwnProfile ? (
            <TouchableOpacity
              style={
                styles.contactButton
              }
              onPress={
                handleContactProvider
              }
              disabled={
                isLoadingProfile ||
                isOpeningChat ||
                !providerUserId
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                {isLoadingProfile
                  ? "Cargando perfil..."
                  : isOpeningChat
                    ? "Abriendo chat..."
                    : `Contactar a ${providerName}`}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text
              style={[
                styles.screenSubtitle,
                {
                  marginTop: 14,
                },
              ]}
            >
              Este es tu perfil público.
            </Text>
          )}
        </View>

        <Text style={styles.cardTitle}>
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
              Sin servicios
            </Text>

            <Text
              style={
                styles.emptyStateText
              }
            >
              Este proveedor no tiene
              servicios publicados
              actualmente.
            </Text>
          </View>
        ) : (
          providerServices.map(
            (service) => (
              <ServiceCard
                key={service.id}
                item={service}
              />
            )
          )
        )}

        <Text style={styles.cardTitle}>
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
              Este proveedor aún no ha
              recibido calificaciones.
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
            router.push("/services")
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