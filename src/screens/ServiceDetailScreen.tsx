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

import { styles } from "../theme/styles";

import {
  useAuthContext,
} from "../context/AuthContext";

import {
  AppService,
  getServiceById,
  mapSupabaseServiceToAppService,
} from "../lib/serviceApi";

import {
  getOrCreateConversation,
  isValidUuid,
} from "../lib/messageApi";

export default function ServiceDetailScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const serviceId =
    Array.isArray(params.id)
      ? params.id[0] || ""
      : params.id || "";

  const {
    session,
    authUser,
  } = useAuthContext();

  const [
    service,
    setService,
  ] = useState<AppService | null>(
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

  const loadService =
    useCallback(async () => {
      if (!serviceId) {
        setErrorMessage(
          "No se encontró el ID de la publicación."
        );

        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const data =
          await getServiceById(
            serviceId
          );

        if (!data) {
          setService(null);

          setErrorMessage(
            "La publicación no existe."
          );

          return;
        }

        setService(
          mapSupabaseServiceToAppService(
            data
          )
        );
      } catch (error: any) {
        console.error(
          "Error cargando detalle:",
          error
        );

        setErrorMessage(
          error?.message ||
            "No se pudo cargar la publicación."
        );
      } finally {
        setIsLoading(false);
      }
    }, [serviceId]);

  useFocusEffect(
    useCallback(() => {
      void loadService();
    }, [loadService])
  );

  const openProviderProfile = () => {
    if (!service?.person) {
      return;
    }

    router.push(
      `/provider-profile/${encodeURIComponent(
        service.person
      )}`
    );
  };

  const handleContact =
    async () => {
      if (
        !session ||
        !authUser?.id
      ) {
        router.push("/login");
        return;
      }

      if (!service) {
        return;
      }

      if (
        !service.providerUserId ||
        !isValidUuid(
          service.providerUserId
        )
      ) {
        Alert.alert(
          "Proveedor no disponible",
          "La publicación no contiene un usuario válido."
        );

        return;
      }

      if (
        service.providerUserId ===
        authUser.id
      ) {
        Alert.alert(
          "Tu publicación",
          "No puedes iniciar una conversación contigo mismo."
        );

        return;
      }

      try {
        setIsOpeningChat(true);

        const conversation =
          await getOrCreateConversation({
            otherUserId:
              service.providerUserId,

            serviceId:
              service.supabaseId,

            requestId:
              null,

            serviceName:
              service.service,
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
              service.person,

            serviceName:
              service.service,
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
            Cargando publicación...
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (
    errorMessage ||
    !service
  ) {
    return (
      <ScrollView style={styles.page}>
        <Header />

        <View style={styles.formSection}>
          <Text
            style={styles.screenTitle}
          >
            Publicación no encontrada
          </Text>

          <Text
            style={
              styles.screenSubtitle
            }
          >
            {errorMessage}
          </Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.replace(
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

  const isRequest =
    service.serviceType ===
    "request";

  const isOwnService =
    service.providerUserId ===
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
        <Text
          style={styles.screenTitle}
        >
          {isRequest
            ? "Detalle del pedido"
            : "Detalle del servicio"}
        </Text>

        <View style={styles.serviceCard}>
          <View
            style={{
              alignSelf: "flex-start",
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 999,
              marginBottom: 18,

              backgroundColor:
                isRequest
                  ? "#A30716"
                  : "#0D2240",
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontWeight: "800",
              }}
            >
              {isRequest
                ? "PEDIDO"
                : "OFERTA"}
            </Text>
          </View>

          <TouchableOpacity
            onPress={
              openProviderProfile
            }
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 14,
                marginBottom: 18,
              }}
            >
              <Image
                source={{
                  uri:
                    service.avatar ||
                    "https://i.pravatar.cc/300",
                }}
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 29,
                }}
              />

              <View style={{ flex: 1 }}>
                <Text
                  style={
                    styles.servicePerson
                  }
                >
                  {service.person}
                </Text>

                <Text
                  style={
                    styles.ratingText
                  }
                >
                  ⭐ {service.rating ?? 4.8}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          <Text
            style={styles.serviceName}
          >
            {service.service}
          </Text>

          <Text
            style={styles.serviceDetail}
          >
            Categoría: {service.category}
          </Text>

          <Text
            style={styles.serviceDetail}
          >
            Modalidad: {service.mode}
          </Text>

          <Text
            style={styles.serviceCost}
          >
            {service.credits}{" "}
            {service.credits === 1
              ? "crédito / hora"
              : "créditos / hora"}
          </Text>

          <Text
            style={[
              styles.cardTitle,
              {
                marginTop: 24,
                marginBottom: 10,
              },
            ]}
          >
            Descripción
          </Text>

          <Text
            style={{
              color: "#E0E0E0",
              fontSize: 15,
              lineHeight: 23,
            }}
          >
            {service.description ||
              "Esta publicación todavía no tiene una descripción detallada."}
          </Text>

          <TouchableOpacity
            style={[
              styles.outlineActionButton,
              {
                marginTop: 22,
              },
            ]}
            onPress={
              openProviderProfile
            }
          >
            <Text
              style={
                styles.outlineActionButtonText
              }
            >
              Ver perfil de{" "}
              {service.person}
            </Text>
          </TouchableOpacity>

          {!isOwnService ? (
            <TouchableOpacity
              style={[
                styles.contactButton,
                {
                  marginTop: 12,
                },
              ]}
              onPress={
                handleContact
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
                  : `Contactar a ${service.person}`}
              </Text>
            </TouchableOpacity>
          ) : (
            <View
              style={[
                styles.emptyStateCard,
                {
                  marginTop: 18,
                },
              ]}
            >
              <Text
                style={
                  styles.emptyStateText
                }
              >
                Esta publicación pertenece a tu cuenta.
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.replace(
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