import { useCallback, useMemo, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import Header from "../components/Header";
import ServiceCard from "../components/ServiceCard";

import { styles } from "../theme/styles";
import { useAuthContext } from "../context/AuthContext";
import { categories } from "../data/categories";

import {
  getServices,
  mapSupabaseServiceToAppService,
} from "../lib/serviceApi";

type PublicationFilter = "Todos" | "Ofertas" | "Pedidos";

export default function ServicesScreen() {
  const { session } = useAuthContext();

  const isLoggedIn = Boolean(session);

  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] =
    useState<PublicationFilter>("Todos");
  const [selectedMode, setSelectedMode] = useState("Todos");
  const [selectedCategory, setSelectedCategory] =
    useState("Todas");

  const loadServices = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await getServices();

      const mappedServices = data.map(
        mapSupabaseServiceToAppService
      );

      setServices(mappedServices);
    } catch (error: any) {
      console.error("Error cargando servicios:", error);

      setErrorMessage(
        error?.message || "Error cargando servicios."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadServices();
    }, [loadServices])
  );

  const filteredServices = useMemo(() => {
    const normalizedQuery = searchText
      .trim()
      .toLowerCase();

    return services.filter((item) => {
      const person = String(
        item?.person ?? ""
      ).toLowerCase();

      const service = String(
        item?.service ?? ""
      ).toLowerCase();

      const category = String(
        item?.category ?? ""
      ).toLowerCase();

      const mode = String(item?.mode ?? "");

      const serviceType =
        item?.serviceType === "request"
          ? "request"
          : "offer";

      const matchesText =
        normalizedQuery.length === 0 ||
        person.includes(normalizedQuery) ||
        service.includes(normalizedQuery) ||
        category.includes(normalizedQuery);

      const matchesType =
        selectedType === "Todos" ||
        (selectedType === "Ofertas" &&
          serviceType === "offer") ||
        (selectedType === "Pedidos" &&
          serviceType === "request");

      const matchesMode =
        selectedMode === "Todos" ||
        mode === selectedMode;

      const matchesCategory =
        selectedCategory === "Todas" ||
        item?.category === selectedCategory;

      return (
        matchesText &&
        matchesType &&
        matchesMode &&
        matchesCategory
      );
    });
  }, [
    services,
    searchText,
    selectedType,
    selectedMode,
    selectedCategory,
  ]);

  const clearFilters = () => {
    setSearchText("");
    setSelectedType("Todos");
    setSelectedMode("Todos");
    setSelectedCategory("Todas");
  };

  return (
    <ScrollView style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>
          Servicios disponibles
        </Text>

        <Text style={styles.screenSubtitle}>
          Explora ofertas y pedidos publicados por la comunidad.
        </Text>

        <TextInput
          placeholder="Buscar servicio, persona o categoría..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
          style={styles.input}
        />

        <Text style={styles.cardTitle}>
          Tipo de publicación
        </Text>

        <View style={styles.filterRow}>
          {(["Todos", "Ofertas", "Pedidos"] as PublicationFilter[]).map(
            (type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterButton,
                  selectedType === type &&
                    styles.filterButtonActive,
                ]}
                onPress={() => setSelectedType(type)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedType === type &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <Text style={styles.cardTitle}>Modalidad</Text>

        <View style={styles.filterRow}>
          {["Todos", "Remoto", "Presencial"].map(
            (mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.filterButton,
                  selectedMode === mode &&
                    styles.filterButtonActive,
                ]}
                onPress={() => setSelectedMode(mode)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedMode === mode &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  {mode}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <Text style={styles.cardTitle}>Categoría</Text>

        <View style={styles.filterRow}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.filterButton,
                selectedCategory === category &&
                  styles.filterButtonActive,
              ]}
              onPress={() =>
                setSelectedCategory(category)
              }
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

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={clearFilters}
        >
          <Text style={styles.secondaryButtonText}>
            Limpiar filtros
          </Text>
        </TouchableOpacity>

        {isLoggedIn ? (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.push("/add-service")
            }
          >
            <Text style={styles.primaryButtonText}>
              Publicar oferta o pedido
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={loadServices}
          disabled={isLoading}
        >
          <Text style={styles.secondaryButtonText}>
            {isLoading
              ? "Cargando servicios..."
              : "Recargar servicios"}
          </Text>
        </TouchableOpacity>

        {isLoading ? (
          <Text style={styles.screenSubtitle}>
            Cargando servicios...
          </Text>
        ) : null}

        {errorMessage ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>
              Error
            </Text>

            <Text style={styles.emptyStateText}>
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {!isLoading && !errorMessage ? (
          <Text style={styles.resultCount}>
            {filteredServices.length} publicaciones encontradas
          </Text>
        ) : null}

        {!isLoading &&
        !errorMessage &&
        filteredServices.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>
              No hay resultados
            </Text>

            <Text style={styles.emptyStateText}>
              Prueba con otra palabra o cambia los filtros.
            </Text>
          </View>
        ) : (
          !isLoading &&
          !errorMessage &&
          filteredServices.map((item) => (
            <ServiceCard
              key={item.supabaseId || item.id}
              item={item}
            />
          ))
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/")}
        >
          <Text style={styles.backButtonText}>
            ← Volver al inicio
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}