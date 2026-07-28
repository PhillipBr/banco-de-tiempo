import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  router,
  useFocusEffect,
} from "expo-router";

import Header from "../components/Header";
import RequestCard from "../components/RequestCard";

import { styles } from "../theme/styles";

import { useAuthContext } from "../context/AuthContext";

import {
  AppRequest,
  getRequestsByUserId,
  mapSupabaseRequestToAppRequest,
} from "../lib/requestApi";

type RequestFilter =
  | "Todas"
  | "Pendientes"
  | "Recibidas"
  | "Enviadas"
  | "Completadas"
  | "Canceladas";

const filters: RequestFilter[] = [
  "Todas",
  "Pendientes",
  "Recibidas",
  "Enviadas",
  "Completadas",
  "Canceladas",
];

export default function RequestsScreen() {
  const {
    session,
    authUser,
    isAuthLoading,
  } = useAuthContext();

  const [
    requests,
    setRequests,
  ] = useState<AppRequest[]>([]);

  const [
    selectedFilter,
    setSelectedFilter,
  ] = useState<RequestFilter>(
    "Todas"
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadRequests =
    useCallback(async () => {
      if (!authUser?.id) {
        setRequests([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const data =
          await getRequestsByUserId(
            authUser.id
          );

        const mappedRequests =
          data.map(
            mapSupabaseRequestToAppRequest
          );

        setRequests(mappedRequests);
      } catch (error: any) {
        console.error(
          "Error cargando solicitudes:",
          error
        );

        setErrorMessage(
          error?.message ||
            "Error cargando solicitudes."
        );
      } finally {
        setIsLoading(false);
      }
    }, [authUser?.id]);

  useFocusEffect(
    useCallback(() => {
      if (
        !isAuthLoading &&
        !session
      ) {
        router.replace("/login");
        return;
      }

      if (
        session &&
        authUser?.id
      ) {
        loadRequests();
      }
    }, [
      session,
      authUser?.id,
      isAuthLoading,
      loadRequests,
    ])
  );

  const filteredRequests =
    useMemo(() => {
      if (!authUser?.id) {
        return [];
      }

      return requests.filter(
        (request) => {
          const isIncoming =
            request.providerUserId ===
            authUser.id;

          const isOutgoing =
            request.requesterUserId ===
            authUser.id;

          switch (selectedFilter) {
            case "Todas":
              return true;

            case "Pendientes":
              return (
                request.status ===
                "pending"
              );

            case "Recibidas":
              return isIncoming;

            case "Enviadas":
              return isOutgoing;

            case "Completadas":
              return (
                request.status ===
                "completed"
              );

            case "Canceladas":
              return (
                request.status ===
                "cancelled"
              );

            default:
              return true;
          }
        }
      );
    }, [
      requests,
      selectedFilter,
      authUser?.id,
    ]);

  const pendingCount =
    requests.filter(
      (request) =>
        request.status === "pending"
    ).length;

  const incomingCount =
    requests.filter(
      (request) =>
        request.providerUserId ===
        authUser?.id
    ).length;

  const outgoingCount =
    requests.filter(
      (request) =>
        request.requesterUserId ===
        authUser?.id
    ).length;

  if (
    isAuthLoading ||
    isLoading
  ) {
    return (
      <ScrollView style={styles.page}>
        <Header />

        <View style={styles.formSection}>
          <Text
            style={styles.screenTitle}
          >
            Cargando solicitudes...
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (!session) {
    return (
      <ScrollView style={styles.page}>
        <Header />

        <View style={styles.formSection}>
          <Text
            style={styles.screenTitle}
          >
            Necesitas iniciar sesión
          </Text>

          <TouchableOpacity
            style={
              styles.primaryButton
            }
            onPress={() =>
              router.replace("/login")
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Ir a Login
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

      <View style={styles.formSection}>
        <Text style={styles.screenTitle}>
          Solicitudes
        </Text>

        <Text
          style={styles.screenSubtitle}
        >
          Administra las solicitudes
          recibidas y enviadas.
        </Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              Total
            </Text>

            <Text style={styles.statValue}>
              {requests.length}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              Pendientes
            </Text>

            <Text style={styles.statValue}>
              {pendingCount}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              Recibidas
            </Text>

            <Text style={styles.statValue}>
              {incomingCount}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              Enviadas
            </Text>

            <Text style={styles.statValue}>
              {outgoingCount}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.contactButton}
          onPress={loadRequests}
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            Recargar solicitudes
          </Text>
        </TouchableOpacity>

        <View style={{ height: 20 }} />

        <View style={styles.filterRow}>
          {filters.map((filter) => {
            const isSelected =
              selectedFilter === filter;

            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  isSelected &&
                    styles.filterButtonActive,
                ]}
                onPress={() =>
                  setSelectedFilter(
                    filter
                  )
                }
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    isSelected &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {errorMessage ? (
          <View
            style={
              styles.emptyStateCard
            }
          >
            <Text
              style={
                styles.emptyStateTitle
              }
            >
              Error
            </Text>

            <Text
              style={
                styles.emptyStateText
              }
            >
              {errorMessage}
            </Text>
          </View>
        ) : null}

        <Text style={styles.resultCount}>
          {filteredRequests.length}{" "}
          solicitudes encontradas
        </Text>

        {filteredRequests.length === 0 ? (
          <View
            style={
              styles.emptyStateCard
            }
          >
            <Text
              style={
                styles.emptyStateTitle
              }
            >
              Sin solicitudes
            </Text>

            <Text
              style={
                styles.emptyStateText
              }
            >
              No hay solicitudes para
              este filtro.
            </Text>
          </View>
        ) : (
          filteredRequests.map(
            (item) => (
              <RequestCard
                key={item.supabaseId}
                item={item}
                currentUserId={
                  authUser.id
                }
                onStatusChange={
                  loadRequests
                }
              />
            )
          )
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.push("/services")
          }
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            ← Volver a servicios
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}