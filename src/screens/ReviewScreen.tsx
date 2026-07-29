import {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";

import Header from "../components/Header";

import {
  styles,
} from "../theme/styles";

import {
  useAuthContext,
} from "../context/AuthContext";

import {
  getOrCreateProfileByUserId,
} from "../lib/profileApi";

import {
  AppRequest,
  getRequestById,
  mapSupabaseRequestToAppRequest,
} from "../lib/requestApi";

import {
  canEditReview,
  createReviewInSupabase,
  getReviewByRequestId,
  getReviewEditDeadline,
  SupabaseReview,
  updateReviewInSupabase,
} from "../lib/reviewApi";

function isValidUuid(
  value?: string | null
): boolean {
  if (!value) {
    return false;
  }

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function showMessage(
  title: string,
  message: string
): void {
  if (
    Platform.OS === "web" &&
    typeof window !== "undefined"
  ) {
    window.alert(
      `${title}\n\n${message}`
    );

    return;
  }

  Alert.alert(
    title,
    message
  );
}

function formatDateTime(
  value: Date | null
): string {
  if (!value) {
    return "";
  }

  return value.toLocaleString(
    "es-CA",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
}

export default function ReviewScreen() {
  const params =
    useLocalSearchParams<{
      id?: string | string[];
    }>();

  const requestId =
    Array.isArray(params.id)
      ? params.id[0] ?? ""
      : params.id ?? "";

  const {
    session,
    authUser,
    isAuthLoading,
  } = useAuthContext();

  const [
    request,
    setRequest,
  ] = useState<AppRequest | null>(
    null
  );

  const [
    existingReview,
    setExistingReview,
  ] = useState<SupabaseReview | null>(
    null
  );

  const [
    rating,
    setRating,
  ] = useState(5);

  const [
    comment,
    setComment,
  ] = useState("");

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadRequest =
    useCallback(async () => {
      if (
        !requestId ||
        !isValidUuid(requestId)
      ) {
        setRequest(null);

        setErrorMessage(
          "No se recibió un UUID válido para la solicitud."
        );

        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const requestData =
          await getRequestById(
            requestId
          );

        if (!requestData) {
          setRequest(null);

          setErrorMessage(
            "No se encontró la solicitud."
          );

          return;
        }

        const mappedRequest =
          mapSupabaseRequestToAppRequest(
            requestData
          );

        setRequest(
          mappedRequest
        );

        const review =
          await getReviewByRequestId(
            requestId
          );

        setExistingReview(
          review
        );

        if (review) {
          setRating(
            Number(
              review.rating
            ) || 5
          );

          setComment(
            review.comment ?? ""
          );
        } else {
          setRating(5);
          setComment("");
        }
      } catch (error: any) {
        console.error(
          "Error cargando solicitud:",
          error
        );

        setRequest(null);

        setErrorMessage(
          error?.message ||
            "No se pudo cargar la solicitud."
        );
      } finally {
        setIsLoading(false);
      }
    }, [requestId]);

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
        void loadRequest();
      }
    }, [
      session,
      authUser?.id,
      isAuthLoading,
      loadRequest,
    ])
  );

  const handleSubmitReview =
    async () => {
      if (
        !request ||
        !authUser?.id
      ) {
        showMessage(
          "No se pudo guardar",
          "No se encontró la solicitud o el usuario autenticado."
        );

        return;
      }

      if (
        request.status !==
        "completed"
      ) {
        showMessage(
          "Intercambio pendiente",
          "Solo puedes calificar después de completar el intercambio."
        );

        return;
      }

      if (
        request.requesterUserId !==
        authUser.id
      ) {
        showMessage(
          "Acceso denegado",
          "Solo el solicitante puede calificar al proveedor."
        );

        return;
      }

      if (
        !isValidUuid(
          request.supabaseId
        )
      ) {
        showMessage(
          "Solicitud no válida",
          "La solicitud no contiene un UUID válido."
        );

        return;
      }

      if (
        !isValidUuid(
          request.providerUserId
        )
      ) {
        showMessage(
          "Proveedor no válido",
          "El proveedor no contiene un UUID válido."
        );

        return;
      }

      if (
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
      ) {
        showMessage(
          "Calificación no válida",
          "Selecciona una calificación entre 1 y 5."
        );

        return;
      }

      if (
        existingReview &&
        existingReview.reviewer_user_id !==
          authUser.id
      ) {
        showMessage(
          "Acceso denegado",
          "La reseña existente pertenece a otro usuario."
        );

        return;
      }

      if (
        existingReview &&
        !canEditReview(
          existingReview
        )
      ) {
        showMessage(
          "Edición no disponible",
          "El plazo de 24 horas para editar esta reseña ya terminó."
        );

        return;
      }

      try {
        setIsSubmitting(true);

        if (existingReview) {
          const updatedReview =
            await updateReviewInSupabase(
              existingReview.id,
              authUser.id,
              {
                rating,
                comment:
                  comment.trim(),
              }
            );

          setExistingReview(
            updatedReview
          );

          showMessage(
            "Reseña actualizada",
            "Los cambios fueron guardados correctamente."
          );

          router.replace(
            "/requests"
          );

          return;
        }

        const reviewerProfile =
          await getOrCreateProfileByUserId(
            authUser.id,
            authUser.email
          );

        const newReview =
          await createReviewInSupabase({
            service_id:
              request.serviceId ||
              null,

            request_id:
              request.supabaseId,

            provider_user_id:
              request.providerUserId,

            reviewer_user_id:
              authUser.id,

            provider_name:
              request.providerName,

            reviewer_name:
              reviewerProfile.name,

            rating,

            comment:
              comment.trim(),
          });

        setExistingReview(
          newReview
        );

        showMessage(
          "Reseña publicada",
          `Calificaste a ${request.providerName} con ${rating} de 5 estrellas.`
        );

        router.replace(
          "/requests"
        );
      } catch (error: any) {
        console.error(
          "Error guardando reseña:",
          error
        );

        showMessage(
          "No se pudo guardar",
          error?.message ||
            "Ocurrió un error guardando la reseña."
        );
      } finally {
        setIsSubmitting(false);
      }
    };

  if (
    isAuthLoading ||
    isLoading
  ) {
    return (
      <ScrollView
        style={styles.page}
      >
        <Header />

        <View
          style={styles.formSection}
        >
          <ActivityIndicator />

          <Text
            style={
              styles.screenSubtitle
            }
          >
            Cargando reseña...
          </Text>
        </View>
      </ScrollView>
    );
  }

  if (
    !session ||
    !authUser?.id
  ) {
    return (
      <ScrollView
        style={styles.page}
      >
        <Header />

        <View
          style={styles.formSection}
        >
          <Text
            style={
              styles.screenTitle
            }
          >
            Necesitas iniciar sesión
          </Text>

          <TouchableOpacity
            style={
              styles.primaryButton
            }
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

  if (
    errorMessage ||
    !request
  ) {
    return (
      <ScrollView
        style={styles.page}
      >
        <Header />

        <View
          style={styles.formSection}
        >
          <Text
            style={
              styles.screenTitle
            }
          >
            Reseña
          </Text>

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
              Solicitud no disponible
            </Text>

            <Text
              style={
                styles.emptyStateText
              }
            >
              {errorMessage}
            </Text>
          </View>
        </View>
      </ScrollView>
    );
  }

  const isRequester =
    request.requesterUserId ===
    authUser.id;

  const reviewIsEditable =
    existingReview
      ? canEditReview(
          existingReview
        )
      : true;

  const editDeadline =
    existingReview
      ? getReviewEditDeadline(
          existingReview
        )
      : null;

  const canUseForm =
    request.status ===
      "completed" &&
    isRequester &&
    reviewIsEditable;

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{
        paddingBottom: 60,
      }}
    >
      <Header />

      <View
        style={styles.formSection}
      >
        <Text
          style={styles.screenTitle}
        >
          {existingReview
            ? "Tu reseña"
            : "Escribir reseña"}
        </Text>

        <View
          style={styles.profileCard}
        >
          <Text
            style={styles.cardTitle}
          >
            {request.serviceName}
          </Text>

          <Text
            style={styles.profileLine}
          >
            Proveedor:{" "}
            {request.providerName}
          </Text>

          <Text
            style={styles.profileLine}
          >
            Tiempo:{" "}
            {request.credits}{" "}
            {request.credits === 1
              ? "hora"
              : "horas"}
          </Text>

          <Text
            style={styles.profileLine}
          >
            Estado:{" "}
            {request.status ===
            "completed"
              ? "Completado"
              : request.status ===
                  "cancelled"
                ? "Cancelado"
                : "Pendiente"}
          </Text>
        </View>

        {existingReview &&
        !reviewIsEditable ? (
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
              Reseña publicada
            </Text>

            <Text
              style={
                styles.emptyStateText
              }
            >
              La reseña ya no puede editarse porque pasaron más de 24 horas.
            </Text>
          </View>
        ) : null}

        {existingReview &&
        reviewIsEditable ? (
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
              Edición disponible
            </Text>

            <Text
              style={
                styles.emptyStateText
              }
            >
              Puedes editarla hasta{" "}
              {formatDateTime(
                editDeadline
              )}.
            </Text>
          </View>
        ) : null}

        {!isRequester ? (
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
              Reseña no disponible
            </Text>

            <Text
              style={
                styles.emptyStateText
              }
            >
              Solo el solicitante puede calificar al proveedor.
            </Text>
          </View>
        ) : null}

        {request.status !==
        "completed" ? (
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
              Intercambio pendiente
            </Text>

            <Text
              style={
                styles.emptyStateText
              }
            >
              Debes completar el intercambio antes de publicar una reseña.
            </Text>
          </View>
        ) : null}

        {(canUseForm ||
          existingReview) ? (
          <View
            style={styles.profileCard}
          >
            <Text
              style={styles.cardTitle}
            >
              Calificación
            </Text>

            <View
              style={{
                flexDirection:
                  "row",

                flexWrap:
                  "wrap",

                gap:
                  10,

                marginTop:
                  16,

                marginBottom:
                  22,
              }}
            >
              {[1, 2, 3, 4, 5].map(
                (value) => (
                  <TouchableOpacity
                    key={value}
                    style={[
                      styles.filterButton,

                      {
                        opacity:
                          rating === value
                            ? 1
                            : 0.45,
                      },
                    ]}
                    onPress={() =>
                      setRating(
                        value
                      )
                    }
                    disabled={
                      !canUseForm ||
                      isSubmitting
                    }
                  >
                    <Text
                      style={
                        styles.filterButtonText
                      }
                    >
                      {value} ⭐
                    </Text>
                  </TouchableOpacity>
                )
              )}
            </View>

            <Text
              style={styles.cardTitle}
            >
              Comentario
            </Text>

            <TextInput
              value={comment}
              onChangeText={
                setComment
              }
              placeholder="Describe tu experiencia..."
              placeholderTextColor="#888888"
              style={[
                styles.input,
                {
                  minHeight: 120,
                  textAlignVertical:
                    "top",
                  paddingTop: 14,
                },
              ]}
              multiline
              maxLength={1000}
              editable={
                canUseForm &&
                !isSubmitting
              }
            />

            <Text
              style={[
                styles.screenSubtitle,
                {
                  textAlign:
                    "right",

                  marginTop:
                    6,
                },
              ]}
            >
              {comment.length}/1000
            </Text>

            {canUseForm ? (
              <TouchableOpacity
                style={[
                  styles.primaryButton,

                  isSubmitting
                    ? {
                        opacity:
                          0.6,
                      }
                    : null,
                ]}
                onPress={
                  handleSubmitReview
                }
                disabled={
                  isSubmitting
                }
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  {isSubmitting
                    ? "Guardando..."
                    : existingReview
                      ? "Guardar cambios"
                      : "Publicar reseña"}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.replace(
              "/requests"
            )
          }
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            ← Volver a solicitudes
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}