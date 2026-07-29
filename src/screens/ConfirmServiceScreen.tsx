import {
  useCallback,
  useState,
} from "react";

import {
  Alert,
  Platform,
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

import { useAppContext } from "../context/AppContext";
import { useAuthContext } from "../context/AuthContext";

import {
  createRequestInSupabase,
} from "../lib/requestApi";

import {
  AppService,
  getServiceById,
  mapSupabaseServiceToAppService,
} from "../lib/serviceApi";

import {
  isValidUuid,
} from "../lib/messageApi";

function getFirstParam(
  value?: string | string[]
): string {
  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

function showMessage(
  title: string,
  message: string
): void {
  if (
    Platform.OS === "web" &&
    typeof window !== "undefined"
  ) {
    window.alert(
      `${title}\n\n${message}`
    );

    return;
  }

  Alert.alert(title, message);
}

export default function ConfirmServiceScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const serviceId =
    getFirstParam(params.id);

  const {
    user,
  } = useAppContext();

  const {
    session,
    authUser,
    isAuthLoading,
  } = useAuthContext();

  const [
    selectedService,
    setSelectedService,
  ] = useState<AppService | null>(
    null
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadSelectedService =
    useCallback(async () => {
      if (!serviceId) {
        setErrorMessage(
          "No se recibió el ID de la publicación."
        );

        setIsLoading(false);
        return;
      }

      if (!isValidUuid(serviceId)) {
        setErrorMessage(
          "El ID de la publicación no es válido."
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
          setSelectedService(null);

          setErrorMessage(
            "La publicación no existe."
          );

          return;
        }

        setSelectedService(
          mapSupabaseServiceToAppService(
            data
          )
        );
      } catch (error: any) {
        console.error(
          "Error cargando publicación:",
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
      void loadSelectedService();
    }, [loadSelectedService])
  );

  const handleCreateRequest =
    async () => {
      if (
        !session ||
        !authUser?.id
      ) {
        showMessage(
          "Sesión requerida",
          "Debes iniciar sesión para crear una solicitud."
        );

        router.push("/login");
        return;
      }

      if (!selectedService) {
        showMessage(
          "Error",
          "No se encontró la publicación."
        );

        return;
      }

      if (
        !selectedService.supabaseId ||
        !isValidUuid(
          selectedService.supabaseId
        )
      ) {
        showMessage(
          "Error",
          "La publicación no tiene un UUID válido."
        );

        return;
      }

      if (
        !selectedService.providerUserId ||
        !isValidUuid(
          selectedService.providerUserId
        )
      ) {
        console.error(
          "Provider UUID inválido:",
          selectedService.providerUserId
        );

        showMessage(
          "Publicación incompleta",
          "Esta publicación no está vinculada a una cuenta real. Vuelve a publicarla después de corregir el UUID."
        );

        return;
      }

      if (
        selectedService.providerUserId ===
        authUser.id
      ) {
        showMessage(
          "Tu publicación",
          "No puedes crear una solicitud para tu propia publicación."
        );

        return;
      }

      if (!user?.name?.trim()) {
        showMessage(
          "Perfil incompleto",
          "No se encontró tu nombre de usuario."
        );

        return;
      }

      if (
        user.credits <
        selectedService.credits
      ) {
        showMessage(
          "Créditos insuficientes",
          "No tienes créditos suficientes para solicitar este servicio."
        );

        return;
      }

      try {
        setIsSaving(true);

        console.log(
          "CREANDO SOLICITUD:",
          {
            serviceId:
              selectedService.supabaseId,

            providerUserId:
              selectedService.providerUserId,

            requesterUserId:
              authUser.id,
          }
        );

        await createRequestInSupabase({
          service_id:
            selectedService.supabaseId,

          service_name:
            selectedService.service,

          provider_user_id:
            selectedService.providerUserId,

          requester_user_id:
            authUser.id,

          provider_name:
            selectedService.person,

          requester_name:
            user.name.trim(),

          credits:
            selectedService.credits,
        });

        showMessage(
          "Solicitud creada",
          "La solicitud fue guardada en Supabase como pendiente."
        );

        router.replace("/requests");
      } catch (error: any) {
        console.error(
          "Error creando solicitud:",
          error
        );

        showMessage(
          "No se pudo crear",
          error?.message ||
            "No se pudo crear la solicitud."
        );
      } finally {
        setIsSaving(false);
      }
    };

  if (
    isAuthLoading ||
    isLoading
  ) {
    return (
      <View style={styles.page}>
        <Header />

        <View style={styles.formSection}>
          <Text style={styles.screenTitle}>
            Cargando publicación...
          </Text>
        </View>
      </View>
    );
  }

  if (
    errorMessage ||
    !selectedService
  ) {
    return (
      <View style={styles.page}>
        <Header />

        <View style={styles.formSection}>
          <Text style={styles.screenTitle}>
            Publicación no encontrada
          </Text>

          <Text style={styles.screenSubtitle}>
            {errorMessage}
          </Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.replace("/services")
            }
          >
            <Text style={styles.backButtonText}>
              ← Volver a servicios
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const isRequest =
    selectedService.serviceType ===
    "request";

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
          {isRequest
            ? "Ofrecer ayuda"
            : "Solicitar servicio"}
        </Text>

        <Text style={styles.screenSubtitle}>
          {isRequest
            ? `¿Quieres ofrecer ayuda a ${selectedService.person}?`
            : `¿Quieres crear una solicitud con ${selectedService.person}?`}
        </Text>

        <View style={styles.confirmCard}>
          <Text style={styles.servicePerson}>
            {selectedService.person}
          </Text>

          <Text style={styles.serviceName}>
            {selectedService.service}
          </Text>

          <Text style={styles.serviceDetail}>
            Categoría:{" "}
            {selectedService.category}
          </Text>

          <Text style={styles.serviceDetail}>
            Modalidad:{" "}
            {selectedService.mode}
          </Text>

          {selectedService.description ? (
            <Text
              style={[
                styles.serviceDetail,
                {
                  marginTop: 12,
                },
              ]}
            >
              {selectedService.description}
            </Text>
          ) : null}

          <Text style={styles.serviceCost}>
            Costo al completar:{" "}
            {selectedService.credits}{" "}
            {selectedService.credits === 1
              ? "crédito"
              : "créditos"}
          </Text>

          <Text style={styles.profileLine}>
            Tu saldo actual:{" "}
            {user.credits} créditos
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,

            isSaving
              ? {
                  opacity: 0.6,
                }
              : null,
          ]}
          onPress={
            handleCreateRequest
          }
          disabled={isSaving}
        >
          <Text style={styles.primaryButtonText}>
            {isSaving
              ? "Creando..."
              : isRequest
                ? "Crear oferta de ayuda pendiente"
                : "Crear solicitud pendiente"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.replace("/services")
          }
          disabled={isSaving}
        >
          <Text style={styles.backButtonText}>
            Cancelar
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}