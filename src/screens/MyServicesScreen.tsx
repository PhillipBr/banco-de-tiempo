import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

import Header from "../components/Header";
import MyServiceCard from "../components/MyServiceCard";

import { styles } from "../theme/styles";
import { useAppContext } from "../context/AppContext";
import {
  getServices,
  mapSupabaseServiceToAppService,
} from "../lib/serviceApi";

export default function MyServicesScreen() {
  const { user } = useAppContext();

  const [myServices, setMyServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadMyServices();
  }, []);

  const loadMyServices = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await getServices();

      const mappedServices = data
        .map(mapSupabaseServiceToAppService)
        .filter((service) => service.person === user.name);

      setMyServices(mappedServices);
    } catch (error: any) {
      setErrorMessage(error.message || "Error cargando tus servicios.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>Mis Servicios</Text>

        <Text style={styles.screenSubtitle}>
          Servicios publicados por ti desde Supabase.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push("/add-service")}
        >
          <Text style={styles.primaryButtonText}>Agregar nuevo servicio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.contactButton} onPress={loadMyServices}>
          <Text style={styles.primaryButtonText}>Recargar mis servicios</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />

        {isLoading && (
          <Text style={styles.screenSubtitle}>Cargando servicios...</Text>
        )}

        {errorMessage ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>Error</Text>
            <Text style={styles.emptyStateText}>{errorMessage}</Text>
          </View>
        ) : null}

        {!isLoading && myServices.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>Aún no tienes servicios</Text>

            <Text style={styles.emptyStateText}>
              Publica un servicio para que otras personas puedan contactarte.
            </Text>
          </View>
        ) : (
          myServices.map((item) => <MyServiceCard key={item.supabaseId} item={item} />)
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/profile")}
        >
          <Text style={styles.backButtonText}>← Volver al perfil</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}