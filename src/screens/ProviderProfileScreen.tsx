import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import Header from "../components/Header";
import ServiceCard from "../components/ServiceCard";
import ReviewCard from "../components/ReviewCard";

import { styles } from "../theme/styles";
import { useAppContext } from "../context/AppContext";

export default function ProviderProfileScreen() {
  const { name } = useLocalSearchParams();

  const { services, reviews } = useAppContext();

  const providerName = String(name);

  const providerServices = services.filter(
    (service) => service.person === providerName
  );

  const providerReviews = reviews.filter(
    (review) => review.providerName === providerName
  );

  const averageRating =
    providerReviews.length === 0
      ? 0
      : providerReviews.reduce(
          (total, review) => total + review.rating,
          0
        ) / providerReviews.length;

  return (
    <ScrollView style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>
          {providerName}
        </Text>

        <Text style={styles.screenSubtitle}>
          Perfil público del proveedor.
        </Text>

        <View style={styles.profileCard}>
          <Text style={styles.cardTitle}>
            Reputación
          </Text>

          <Text style={styles.profileLine}>
            Reviews recibidas: {providerReviews.length}
          </Text>

          <Text style={styles.profileLine}>
            Promedio:{" "}
            {providerReviews.length === 0
              ? "Sin reviews"
              : `${averageRating.toFixed(1)} ⭐`}
          </Text>

          <TouchableOpacity
            style={styles.contactButton}
            onPress={() =>
              router.push({
                pathname: "/chat/[name]",
                params: {
                  name: providerName,
                },
              })
            }
          >
            <Text style={styles.primaryButtonText}>
              Contactar a {providerName}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.cardTitle}>
          Servicios publicados
        </Text>

        {providerServices.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>
              Sin servicios
            </Text>

            <Text style={styles.emptyStateText}>
              Este proveedor no tiene servicios
              publicados actualmente.
            </Text>
          </View>
        ) : (
          providerServices.map((service) => (
            <ServiceCard
              key={service.id}
              item={service}
            />
          ))
        )}

        <Text style={styles.cardTitle}>
          Reviews
        </Text>

        {providerReviews.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>
              Sin reviews
            </Text>

            <Text style={styles.emptyStateText}>
              Este proveedor aún no ha recibido
              calificaciones.
            </Text>
          </View>
        ) : (
          providerReviews.map((review) => (
            <ReviewCard
              key={review.id}
              item={review}
            />
          ))
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.push("/services")}
        >
          <Text style={styles.backButtonText}>
            ← Volver a servicios
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}