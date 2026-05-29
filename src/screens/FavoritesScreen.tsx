import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

import Header from "../components/Header";
import ServiceCard from "../components/ServiceCard";

import { styles } from "../theme/styles";
import { useAppContext } from "../context/AppContext";
import { getFavoritesByUser } from "../lib/favoriteApi";
import {
  getServices,
  mapSupabaseServiceToAppService,
} from "../lib/serviceApi";

export default function FavoritesScreen() {
  const { user } = useAppContext();

  const [favoriteServices, setFavoriteServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const favorites = await getFavoritesByUser(user.name);
      const servicesData = await getServices();
      const mappedServices = servicesData.map(mapSupabaseServiceToAppService);

      const favoriteIds = favorites.map((favorite) => favorite.service_id);

      const filteredServices = mappedServices.filter(
        (service) =>
          service.supabaseId &&
          favoriteIds.includes(service.supabaseId) &&
          service.person !== user.name
      );

      setFavoriteServices(filteredServices);
    } catch (error: any) {
      setErrorMessage(error.message || "Error cargando favoritos.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>Favoritos</Text>

        <Text style={styles.screenSubtitle}>
          Servicios guardados desde Supabase.
        </Text>

        <TouchableOpacity style={styles.contactButton} onPress={loadFavorites}>
          <Text style={styles.primaryButtonText}>Recargar favoritos</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />

        {isLoading ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>Cargando favoritos...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>Error</Text>
            <Text style={styles.emptyStateText}>{errorMessage}</Text>
          </View>
        ) : favoriteServices.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>Sin favoritos</Text>

            <Text style={styles.emptyStateText}>
              Guarda servicios desde la pantalla de servicios para verlos aquí.
            </Text>
          </View>
        ) : (
          favoriteServices.map((item) => (
            <ServiceCard key={item.supabaseId || item.id} item={item} />
          ))
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/services")}
        >
          <Text style={styles.backButtonText}>← Volver a servicios</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}