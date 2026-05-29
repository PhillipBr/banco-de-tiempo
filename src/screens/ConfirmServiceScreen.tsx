import { Alert, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import Header from "../components/Header";
import { styles } from "../theme/styles";
import { useAppContext } from "../context/AppContext";
import {
  createRequestInSupabase,
} from "../lib/requestApi";
import {
  getServices,
  mapSupabaseServiceToAppService,
} from "../lib/serviceApi";

import { useEffect, useState } from "react";

export default function ConfirmServiceScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAppContext();

  const serviceId = String(id);

  const [selectedService, setSelectedService] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSelectedService();
  }, []);

  const loadSelectedService = async () => {
    try {
      setIsLoading(true);

      const data = await getServices();
      const mappedServices = data.map(mapSupabaseServiceToAppService);

      const foundService = mappedServices.find(
        (service) =>
          service.supabaseId === serviceId ||
          service.id.toString() === serviceId
      );

      if (foundService) {
        setSelectedService(foundService);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo cargar el servicio.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!selectedService?.supabaseId) {
      Alert.alert("Error", "Este servicio no tiene ID de Supabase.");
      return;
    }

    if (user.credits < selectedService.credits) {
      Alert.alert(
        "Créditos insuficientes",
        "No tienes créditos suficientes para solicitar este servicio."
      );
      return;
    }

    try {
      setIsSaving(true);

      await createRequestInSupabase({
        service_id: selectedService.supabaseId,
        service_name: selectedService.service,
        provider_name: selectedService.person,
        requester_name: user.name,
        credits: selectedService.credits,
      });

      Alert.alert(
        "Solicitud creada",
        "La solicitud fue guardada en Supabase como pendiente."
      );

      router.push("/requests");
    } catch (error: any) {
      Alert.alert("Error", error.message || "No se pudo crear la solicitud.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.page}>
        <Header />
        <View style={styles.formSection}>
          <Text style={styles.screenTitle}>Cargando servicio...</Text>
        </View>
      </View>
    );
  }

  if (!selectedService) {
    return (
      <View style={styles.page}>
        <Header />
        <View style={styles.formSection}>
          <Text style={styles.screenTitle}>Servicio no encontrado</Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.push("/services")}
          >
            <Text style={styles.backButtonText}>← Volver a servicios</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>Solicitar Servicio</Text>

        <Text style={styles.screenSubtitle}>
          ¿Quieres crear una solicitud con {selectedService.person}?
        </Text>

        <View style={styles.confirmCard}>
          <Text style={styles.servicePerson}>{selectedService.person}</Text>
          <Text style={styles.serviceName}>{selectedService.service}</Text>

          <Text style={styles.serviceDetail}>
            Categoría: {selectedService.category}
          </Text>

          <Text style={styles.serviceDetail}>
            Modalidad: {selectedService.mode}
          </Text>

          <Text style={styles.serviceCost}>
            Costo al completar: {selectedService.credits} crédito
          </Text>

          <Text style={styles.profileLine}>
            Tu saldo actual: {user.credits} créditos
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleCreateRequest}
          disabled={isSaving}
        >
          <Text style={styles.primaryButtonText}>
            {isSaving ? "Creando..." : "Crear solicitud pendiente"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/services")}
        >
          <Text style={styles.backButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}