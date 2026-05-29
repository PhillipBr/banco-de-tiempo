import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";

import Header from "../components/Header";
import RequestCard from "../components/RequestCard";

import { styles } from "../theme/styles";
import { useAppContext } from "../context/AppContext";
import {
  getRequests,
  mapSupabaseRequestToAppRequest,
} from "../lib/requestApi";

type RequestFilter =
  | "Todas"
  | "Pendientes"
  | "Recibidas"
  | "Enviadas"
  | "Completadas"
  | "Canceladas";

export default function RequestsScreen() {
  const { user } = useAppContext();

  const [requests, setRequests] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] =
    useState<RequestFilter>("Todas");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await getRequests();
      const mappedRequests = data.map(mapSupabaseRequestToAppRequest);

      setRequests(mappedRequests);
    } catch (error: any) {
      setErrorMessage(error.message || "Error cargando solicitudes.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const isIncoming = request.providerName === user.name;
      const isOutgoing = request.requesterName === user.name;

      if (selectedFilter === "Todas") return true;
      if (selectedFilter === "Pendientes") return request.status === "pending";
      if (selectedFilter === "Recibidas") return isIncoming;
      if (selectedFilter === "Enviadas") return isOutgoing;
      if (selectedFilter === "Completadas")
        return request.status === "completed";
      if (selectedFilter === "Canceladas")
        return request.status === "cancelled";

      return true;
    });
  }, [requests, selectedFilter, user.name]);

  const pendingCount = requests.filter(
    (request) => request.status === "pending"
  ).length;

  return (
    <ScrollView style={styles.page}>
      <Header />

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>Solicitudes</Text>

        <Text style={styles.screenSubtitle}>
          Solicitudes reales cargadas desde Supabase.
        </Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{requests.length}</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pendientes</Text>
            <Text style={styles.statValue}>{pendingCount}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.contactButton} onPress={loadRequests}>
          <Text style={styles.primaryButtonText}>Recargar solicitudes</Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />

        <View style={styles.filterRow}>
          {[
            "Todas",
            "Pendientes",
            "Recibidas",
            "Enviadas",
            "Completadas",
            "Canceladas",
          ].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter as RequestFilter)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedFilter === filter && styles.filterButtonTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading && (
          <Text style={styles.screenSubtitle}>Cargando solicitudes...</Text>
        )}

        {errorMessage ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>Error</Text>
            <Text style={styles.emptyStateText}>{errorMessage}</Text>
          </View>
        ) : null}

        <Text style={styles.resultCount}>
          {filteredRequests.length} solicitudes encontradas
        </Text>

        {!isLoading && filteredRequests.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>Sin solicitudes</Text>

            <Text style={styles.emptyStateText}>
              No hay solicitudes para este filtro.
            </Text>
          </View>
        ) : (
          filteredRequests.map((item) => (
            <RequestCard
              key={item.supabaseId || item.id}
              item={item}
              onStatusChange={loadRequests}
            />
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