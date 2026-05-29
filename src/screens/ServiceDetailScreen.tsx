import { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import Header from "../components/Header";
import ReviewCard from "../components/ReviewCard";

import { styles } from "../theme/styles";
import { useAppContext } from "../context/AppContext";
import { useAuthContext } from "../context/AuthContext";

import {
  getServices,
  mapSupabaseServiceToAppService,
} from "../lib/serviceApi";

import {
  getReviews,
  mapSupabaseReviewToAppReview,
} from "../lib/reviewApi";

export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams();

  const { session } = useAuthContext();
  const { favoriteServiceIds, toggleFavorite } = useAppContext();

  const serviceId = String(id);
  const isLoggedIn = !!session;

  const [service, setService] = useState<any>(null);
  const [serviceReviews, setServiceReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadServiceDetail();
  }, []);

  const loadServiceDetail = async () => {
    try {
      setIsLoading(true);

      const servicesData = await getServices();
      const mappedServices = servicesData.map(mapSupabaseServiceToAppService);

      const foundService = mappedServices.find(
        (item) =>
          item.supabaseId === serviceId ||
          item.id.toString() === serviceId
      );

      if (foundService) {
        setService(foundService);

        const reviewsData = await getReviews();
        const mappedReviews = reviewsData.map(mapSupabaseReviewToAppReview);

        const filteredReviews = mappedReviews.filter(
          (review) => String(review.serviceId) === String(foundService.supabaseId)
        );

        setServiceReviews(filteredReviews);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <ScrollView style={styles.page}>
        <Header />

        <View style={styles.formSection}>
          <Text style={styles.screenTitle}>Cargando detalle...</Text>
        </View>
      </ScrollView>
    );
  }

  if (!service) {
    return (
      <ScrollView style={styles.page}>
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
      </ScrollView>
    );
  }

  const isFavorite = favoriteServiceIds.includes(service.id);

  return (
    <ScrollView style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>Detalle del Servicio</Text>

        <View style={styles.confirmCard}>
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: "/provider-profile/[name]",
                params: {
                  name: service.person,
                },
              })
            }
          >
            <Text style={styles.servicePerson}>{service.person}</Text>
          </TouchableOpacity>

          <Text style={styles.serviceName}>{service.service}</Text>

          <Text style={styles.serviceDetail}>
            Categoría: {service.category}
          </Text>

          <Text style={styles.serviceDetail}>
            Modalidad: {service.mode}
          </Text>

          <Text style={styles.serviceCost}>
            Costo: {service.credits} crédito / hora
          </Text>

          <Text style={styles.cardTitle}>Descripción</Text>

          <Text style={styles.profileLine}>
            Este es un servicio comunitario disponible en Banco de Tiempo.
            Inicia sesión para contactar, guardar favoritos o solicitar el servicio.
          </Text>

          <Text style={styles.cardTitle}>Reviews</Text>

          {serviceReviews.length === 0 ? (
            <Text style={styles.profileLine}>
              Este servicio aún no tiene reviews.
            </Text>
          ) : (
            serviceReviews.map((review) => (
              <ReviewCard key={review.supabaseId || review.id} item={review} />
            ))
          )}
        </View>

        {isLoggedIn ? (
          <>
            <TouchableOpacity
              style={styles.outlineActionButton}
              onPress={() => toggleFavorite(service.id)}
            >
              <Text style={styles.outlineActionButtonText}>
                {isFavorite ? "Quitar de favoritos" : "Guardar favorito"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactButton}
              onPress={() =>
                router.push({
                  pathname: "/chat/[name]",
                  params: {
                    name: service.person,
                  },
                })
              }
            >
              <Text style={styles.primaryButtonText}>Contactar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={() =>
                router.push({
                  pathname: "/confirm-service/[id]",
                  params: {
                    id: service.supabaseId || service.id.toString(),
                  },
                })
              }
            >
              <Text style={styles.primaryButtonText}>Solicitar servicio</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push("/login")}
          >
            <Text style={styles.primaryButtonText}>
              Iniciar sesión para solicitar
            </Text>
          </TouchableOpacity>
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