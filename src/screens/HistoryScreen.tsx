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

import { styles } from "../theme/styles";

import {
  useAuthContext,
} from "../context/AuthContext";

import {
  useAppContext,
} from "../context/AppContext";

import {
  getTransactionsByUserId,
  mapTransactionToHistoryItem,
  TransactionHistoryItem,
} from "../lib/transactionApi";

import {
  getOrCreateProfileByUserId,
  mapSupabaseProfileToAppUser,
} from "../lib/profileApi";

function formatDate(
  dateValue: string
): string {
  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return dateValue;
  }

  return new Intl.DateTimeFormat(
    "es-CA",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(date);
}

function getStatusLabel(
  status: TransactionHistoryItem["status"]
): string {
  switch (status) {
    case "completed":
      return "Completada";

    case "cancelled":
      return "Cancelada";

    case "pending":
      return "Pendiente";

    default:
      return status;
  }
}

export default function HistoryScreen() {
  const {
    session,
    authUser,
    isAuthLoading,
  } = useAuthContext();

  const {
    user,
    updateUser,
  } = useAppContext();

  const [
    history,
    setHistory,
  ] = useState<
    TransactionHistoryItem[]
  >([]);

  const [
    currentCredits,
    setCurrentCredits,
  ] = useState(
    user.credits
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadHistory =
    useCallback(async () => {
      if (!authUser?.id) {
        setHistory([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const [
          profile,
          transactions,
        ] = await Promise.all([
          getOrCreateProfileByUserId(
            authUser.id,
            authUser.email
          ),

          getTransactionsByUserId(
            authUser.id
          ),
        ]);

        const mappedProfile =
          mapSupabaseProfileToAppUser(
            profile
          );

        const mappedHistory =
          transactions.map(
            (transaction) =>
              mapTransactionToHistoryItem(
                transaction,
                authUser.id
              )
          );

        setHistory(
          mappedHistory
        );

        setCurrentCredits(
          mappedProfile.credits
        );

        const localHistory =
          mappedHistory.map(
            (
              item,
              index
            ) => ({
              id:
                Date.now() +
                index,

              type:
                item.type,

              description:
                `${item.serviceName}: ${item.description}`,

              credits:
                item.credits,

              date:
                item.date,
            })
          );

        updateUser({
          ...mappedProfile,

          offeredServices:
            user.offeredServices,

          neededServices:
            user.neededServices,

          history:
            localHistory,
        });
      } catch (error: any) {
        console.error(
          "Error cargando transacciones:",
          error
        );

        setErrorMessage(
          error?.message ||
            "No se pudo cargar el historial."
        );
      } finally {
        setIsLoading(false);
      }
    }, [
      authUser?.id,
      authUser?.email,
      updateUser,
    ]);

  useFocusEffect(
    useCallback(() => {
      if (
        !isAuthLoading &&
        !session
      ) {
        router.replace(
          "/login"
        );

        return;
      }

      if (
        session &&
        authUser?.id
      ) {
        void loadHistory();
      }
    }, [
      session,
      authUser?.id,
      isAuthLoading,
      loadHistory,
    ])
  );

  const completedHistory =
    useMemo(() => {
      return history.filter(
        (item) =>
          item.status ===
          "completed"
      );
    }, [history]);

  const earnedCredits =
    useMemo(() => {
      return completedHistory
        .filter(
          (item) =>
            item.type === "earned"
        )
        .reduce(
          (total, item) =>
            total +
            item.credits,
          0
        );
    }, [completedHistory]);

  const spentCredits =
    useMemo(() => {
      return completedHistory
        .filter(
          (item) =>
            item.type === "spent"
        )
        .reduce(
          (total, item) =>
            total +
            item.credits,
          0
        );
    }, [completedHistory]);

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
            Cargando historial...
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
            style={styles.primaryButton}
            onPress={() =>
              router.replace(
                "/login"
              )
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
          Historial
        </Text>

        <Text
          style={styles.screenSubtitle}
        >
          Revisa tus intercambios y
          movimientos de tiempo.
        </Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              Ganados
            </Text>

            <Text style={styles.statValue}>
              +{earnedCredits}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              Gastados
            </Text>

            <Text style={styles.statValue}>
              -{spentCredits}
            </Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statLabel}>
              Saldo actual
            </Text>

            <Text style={styles.statValue}>
              {currentCredits}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.contactButton}
          onPress={
            loadHistory
          }
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            Recargar historial
          </Text>
        </TouchableOpacity>

        <View
          style={{
            height: 24,
          }}
        />

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

        {!errorMessage &&
        history.length === 0 ? (
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
              Sin historial
            </Text>

            <Text
              style={
                styles.emptyStateText
              }
            >
              Cuando completes o recibas
              servicios, las transacciones
              aparecerán aquí.
            </Text>
          </View>
        ) : (
          history.map((item) => {
            const isEarned =
              item.type ===
              "earned";

            return (
              <View
                key={item.id}
                style={
                  styles.profileCard
                }
              >
                <Text
                  style={
                    styles.cardTitle
                  }
                >
                  {item.serviceName}
                </Text>

                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "700",
                    marginBottom: 8,
                  }}
                >
                  {isEarned
                    ? "+"
                    : "-"}
                  {item.credits}{" "}
                  {item.credits === 1
                    ? "hora"
                    : "horas"}
                </Text>

                <Text
                  style={
                    styles.profileLine
                  }
                >
                  {item.description}
                </Text>

                <Text
                  style={
                    styles.profileLine
                  }
                >
                  Persona relacionada:{" "}
                  {item.otherPerson}
                </Text>

                <Text
                  style={
                    styles.profileLine
                  }
                >
                  Fecha:{" "}
                  {formatDate(
                    item.createdAt
                  )}
                </Text>

                <Text
                  style={
                    styles.profileLine
                  }
                >
                  Estado:{" "}
                  {getStatusLabel(
                    item.status
                  )}
                </Text>
              </View>
            );
          })
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.push(
              "/profile"
            )
          }
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            ← Volver al perfil
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}