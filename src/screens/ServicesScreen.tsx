import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";

import Header from "../components/Header";
import ServiceCard from "../components/ServiceCard";

import { styles } from "../theme/styles";
import { useAppContext } from "../context/AppContext";
import { useAuthContext } from "../context/AuthContext";
import { categories } from "../data/categories";
import {
  getServices,
  mapSupabaseServiceToAppService,
} from "../lib/serviceApi";

export default function ServicesScreen() {
  const { user } = useAppContext();
  const { session } = useAuthContext();

  const isLoggedIn = !!session;

  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchText, setSearchText] = useState("");
  const [selectedMode, setSelectedMode] = useState("Todos");
  const [selectedCategory, setSelectedCategory] = useState("Todas");

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await getServices();
      const mappedServices = data.map(mapSupabaseServiceToAppService);

      setServices(mappedServices);
    } catch (error: any) {
      setErrorMessage(error.message || "Error cargando servicios.");
    } finally {
      setIsLoading(false);
    }
  };

  const publicServices = useMemo(() => {
    if (!isLoggedIn) {
      return services;
    }

    return services.filter((item) => item.person !== user.name);
  }, [services, user.name, isLoggedIn]);

  const filteredServices = useMemo(() => {
    return publicServices.filter((item) => {
      const query = searchText.toLowerCase();

      const matchesText =
        item.person.toLowerCase().includes(query) ||
        item.service.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query);

      const matchesMode =
        selectedMode === "Todos" || item.mode === selectedMode;

      const matchesCategory =
        selectedCategory === "Todas" || item.category === selectedCategory;

      return matchesText && matchesMode && matchesCategory;
    });
  }, [publicServices, searchText, selectedMode, selectedCategory]);

  return (
    <ScrollView style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>Servicios Disponibles</Text>

        <Text style={styles.screenSubtitle}>
          Explora servicios publicados por la comunidad.
        </Text>

        <TextInput
          placeholder="Buscar servicio, persona o categoría..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
          style={styles.input}
        />

        <Text style={styles.cardTitle}>Modalidad</Text>

        <View style={styles.filterRow}>
          {["Todos", "Remoto", "Presencial"].map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.filterButton,
                selectedMode === mode && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedMode(mode)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedMode === mode && styles.filterButtonTextActive,
                ]}
              >
                {mode}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.cardTitle}>Categoría</Text>

        <View style={styles.filterRow}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                selectedCategory === category && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedCategory === category &&
                    styles.filterButtonTextActive,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoggedIn ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/add-service")}
          >
            <Text style={styles.primaryButtonText}>Publicar mi servicio</Text>
          </TouchableOpacity>
        ) : null}

        {isLoading && (
          <Text style={styles.screenSubtitle}>Cargando servicios...</Text>
        )}

        {errorMessage ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>Error</Text>
            <Text style={styles.emptyStateText}>{errorMessage}</Text>
          </View>
        ) : null}

        <Text style={styles.resultCount}>
          {filteredServices.length} servicios encontrados
        </Text>

        {!isLoading && filteredServices.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>No hay resultados</Text>

            <Text style={styles.emptyStateText}>
              Prueba con otra palabra o cambia los filtros.
            </Text>
          </View>
        ) : (
          filteredServices.map((item) => (
            <ServiceCard key={item.supabaseId || item.id} item={item} />
          ))
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/")}
        >
          <Text style={styles.backButtonText}>← Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}