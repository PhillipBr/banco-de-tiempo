import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  router,
  useLocalSearchParams,
} from "expo-router";

import Header from "../components/Header";

import { styles } from "../theme/styles";

import {
  categories,
} from "../data/categories";

import {
  getServices,
  mapSupabaseServiceToAppService,
  updateService,
} from "../lib/serviceApi";

import {
  Service,
} from "../context/AppContext";

export default function EditServiceScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const serviceId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id ?? "";

  const [
    selectedService,
    setSelectedService,
  ] = useState<Service | null>(
    null
  );

  const [
    service,
    setService,
  ] = useState("");

  const [
    category,
    setCategory,
  ] = useState("Educación");

  const [
    mode,
    setMode,
  ] = useState("Remoto");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const loadSelectedService =
    useCallback(async () => {
      if (!serviceId) {
        setSelectedService(null);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const data =
          await getServices();

        const mappedServices =
          data.map(
            mapSupabaseServiceToAppService
          );

        const foundService =
          mappedServices.find(
            (item) =>
              item.supabaseId ===
                serviceId ||
              String(item.id) ===
                serviceId
          ) ?? null;

        setSelectedService(
          foundService
        );

        if (foundService) {
          setService(
            foundService.service
          );

          setCategory(
            foundService.category
          );

          setMode(
            foundService.mode
          );
        }
      } catch (error: any) {
        console.error(
          "Error cargando servicio:",
          error
        );

        Alert.alert(
          "Error",
          error?.message ||
            "No se pudo cargar el servicio."
        );

        setSelectedService(null);
      } finally {
        setIsLoading(false);
      }
    }, [serviceId]);

  useEffect(() => {
    void loadSelectedService();
  }, [loadSelectedService]);

  const handleUpdateService =
    async () => {
      if (
        !selectedService?.supabaseId
      ) {
        Alert.alert(
          "Error",
          "El servicio no tiene un ID válido de Supabase."
        );

        return;
      }

      const normalizedService =
        service.trim();

      if (
        !normalizedService ||
        !category ||
        !mode
      ) {
        Alert.alert(
          "Campos incompletos",
          "Completa servicio, categoría y modalidad."
        );

        return;
      }

      try {
        setIsSaving(true);

        await updateService(
          selectedService.supabaseId,
          {
            title:
              normalizedService,

            category,

            mode,

            credits:
              selectedService.credits ||
              1,
          }
        );

        Alert.alert(
          "Servicio actualizado",
          "El servicio fue actualizado en Supabase."
        );

        router.replace(
          "/my-services"
        );
      } catch (error: any) {
        console.error(
          "Error actualizando servicio:",
          error
        );

        Alert.alert(
          "Error",
          error?.message ||
            "No se pudo actualizar el servicio."
        );
      } finally {
        setIsSaving(false);
      }
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
          <Text
            style={styles.screenTitle}
          >
            Cargando servicio...
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (!selectedService) {
    return (
      <ScrollView
        style={styles.page}
      >
        <Header />

        <View
          style={styles.formSection}
        >
          <Text
            style={styles.screenTitle}
          >
            Servicio no encontrado
          </Text>

          <Text
            style={
              styles.screenSubtitle
            }
          >
            No se encontró una publicación
            asociada a este identificador.
          </Text>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.replace(
                "/my-services"
              )
            }
          >
            <Text
              style={
                styles.backButtonText
              }
            >
              ← Volver a mis servicios
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{
        paddingBottom: 50,
      }}
    >
      <Header />

      <View
        style={styles.formSection}
      >
        <Text
          style={styles.screenTitle}
        >
          Editar servicio
        </Text>

        <Text
          style={styles.screenSubtitle}
        >
          Actualiza tu servicio en
          Supabase.
        </Text>

        <Text
          style={styles.cardTitle}
        >
          Nombre del servicio
        </Text>

        <TextInput
          placeholder="Servicio"
          placeholderTextColor="#999"
          value={service}
          onChangeText={setService}
          style={styles.input}
          editable={!isSaving}
        />

        <Text
          style={styles.cardTitle}
        >
          Categoría
        </Text>

        <View style={styles.filterRow}>
          {categories
            .filter(
              (item) =>
                item !== "Todas"
            )
            .map((item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.filterButton,

                  category === item &&
                    styles.filterButtonActive,
                ]}
                onPress={() =>
                  setCategory(item)
                }
                disabled={isSaving}
              >
                <Text
                  style={[
                    styles.filterButtonText,

                    category === item &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
        </View>

        <Text
          style={styles.cardTitle}
        >
          Modalidad
        </Text>

        <View style={styles.filterRow}>
          {[
            "Remoto",
            "Presencial",
          ].map((item) => (
            <TouchableOpacity
              key={item}
              style={[
                styles.filterButton,

                mode === item &&
                  styles.filterButtonActive,
              ]}
              onPress={() =>
                setMode(item)
              }
              disabled={isSaving}
            >
              <Text
                style={[
                  styles.filterButtonText,

                  mode === item &&
                    styles.filterButtonTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            isSaving && {
              opacity: 0.6,
            },
          ]}
          onPress={
            handleUpdateService
          }
          disabled={isSaving}
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            {isSaving
              ? "Guardando..."
              : "Guardar cambios"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.replace(
              "/my-services"
            )
          }
          disabled={isSaving}
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            Cancelar
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}