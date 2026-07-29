import {
  useCallback,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  ScrollView,
  Text,
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
  AppReview,
  getProviderReviewStats,
  getReviewsByProviderUserId,
  mapSupabaseReviewToAppReview,
  ReviewStats,
} from "../lib/reviewApi";

type RatingFilter =
  | "Todas"
  | "5"
  | "4"
  | "3"
  | "2"
  | "1";

type OrderFilter =
  | "Recientes"
  | "Antiguas";

const ratingFilters: RatingFilter[] = [
  "Todas",
  "5",
  "4",
  "3",
  "2",
  "1",
];

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

function formatDate(
  value: string
): string {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  return date.toLocaleDateString(
    "es-CA",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );
}

function renderStars(
  rating: number
): string {
  const validRating =
    Math.max(
      0,
      Math.min(
        5,
        Math.round(rating)
      )
    );

  return (
    "★".repeat(validRating) +
    "☆".repeat(
      5 - validRating
    )
  );
}

export default function ReviewsScreen() {
  const params =
    useLocalSearchParams<{
      userId?:
        | string
        | string[];

      name?:
        | string
        | string[];
    }>();

  const providerUserId =
    Array.isArray(
      params.userId
    )
      ? params.userId[0] || ""
      : params.userId || "";

  const providerNameParam =
    Array.isArray(
      params.name
    )
      ? params.name[0] || ""
      : params.name || "";

  const providerName =
    decodeURIComponent(
      providerNameParam
    );

  const [
    reviews,
    setReviews,
  ] = useState<AppReview[]>([]);

  const [
    stats,
    setStats,
  ] = useState<ReviewStats | null>(
    null
  );

  const [
    ratingFilter,
    setRatingFilter,
  ] = useState<RatingFilter>(
    "Todas"
  );

  const [
    orderFilter,
    setOrderFilter,
  ] = useState<OrderFilter>(
    "Recientes"
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const loadReviews =
    useCallback(async () => {
      if (
        !isValidUuid(
          providerUserId
        )
      ) {
        setErrorMessage(
          "No se recibió un UUID válido para el proveedor."
        );

        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        const [
          reviewsData,
          statsData,
        ] = await Promise.all([
          getReviewsByProviderUserId(
            providerUserId
          ),

          getProviderReviewStats(
            providerUserId
          ),
        ]);

        setReviews(
          reviewsData.map(
            mapSupabaseReviewToAppReview
          )
        );

        setStats(
          statsData
        );
      } catch (error: any) {
        console.error(
          "Error cargando reseñas:",
          error
        );

        setErrorMessage(
          error?.message ||
            "No se pudieron cargar las reseñas."
        );
      } finally {
        setIsLoading(false);
      }
    }, [providerUserId]);

  useFocusEffect(
    useCallback(() => {
      void loadReviews();
    }, [loadReviews])
  );

  const filteredReviews =
    useMemo(() => {
      let result =
        [...reviews];

      if (
        ratingFilter !==
        "Todas"
      ) {
        const selectedRating =
          Number(
            ratingFilter
          );

        result =
          result.filter(
            (review) =>
              review.rating ===
              selectedRating
          );
      }

      result.sort(
        (a, b) => {
          const first =
            new Date(
              a.createdAt
            ).getTime();

          const second =
            new Date(
              b.createdAt
            ).getTime();

          if (
            orderFilter ===
            "Antiguas"
          ) {
            return (
              first - second
            );
          }

          return (
            second - first
          );
        }
      );

      return result;
    }, [
      reviews,
      ratingFilter,
      orderFilter,
    ]);

  if (isLoading) {
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
            Cargando reseñas...
          </Text>
        </View>
      </ScrollView>
    );
  }

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
          Reseñas
        </Text>

        <Text
          style={
            styles.screenSubtitle
          }
        >
          {providerName
            ? `Calificaciones de ${providerName}`
            : "Calificaciones del proveedor"}
        </Text>

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

            <TouchableOpacity
              style={[
                styles.contactButton,
                {
                  marginTop:
                    14,
                },
              ]}
              onPress={() =>
                void loadReviews()
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Reintentar
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {stats ? (
          <View
            style={styles.profileCard}
          >
            <Text
              style={{
                color:
                  "#FFFFFF",

                fontSize:
                  34,

                fontWeight:
                  "700",

                textAlign:
                  "center",
              }}
            >
              {stats.averageRating.toFixed(
                1
              )}
            </Text>

            <Text
              style={{
                color:
                  "#F5C451",

                fontSize:
                  24,

                textAlign:
                  "center",

                marginTop:
                  6,
              }}
            >
              {renderStars(
                stats.averageRating
              )}
            </Text>

            <Text
              style={[
                styles.screenSubtitle,
                {
                  textAlign:
                    "center",

                  marginTop:
                    8,
                },
              ]}
            >
              {stats.reviewsCount}{" "}
              {stats.reviewsCount ===
              1
                ? "reseña"
                : "reseñas"}
            </Text>

            {[
              {
                rating: 5,
                value:
                  stats.fiveStars,
              },
              {
                rating: 4,
                value:
                  stats.fourStars,
              },
              {
                rating: 3,
                value:
                  stats.threeStars,
              },
              {
                rating: 2,
                value:
                  stats.twoStars,
              },
              {
                rating: 1,
                value:
                  stats.oneStar,
              },
            ].map((row) => {
              const percentage =
                stats.reviewsCount >
                0
                  ? Math.round(
                      (
                        row.value /
                        stats.reviewsCount
                      ) * 100
                    )
                  : 0;

              return (
                <View
                  key={row.rating}
                  style={{
                    flexDirection:
                      "row",

                    alignItems:
                      "center",

                    marginTop:
                      10,
                  }}
                >
                  <Text
                    style={{
                      color:
                        "#FFFFFF",

                      width:
                        34,
                    }}
                  >
                    {row.rating}★
                  </Text>

                  <View
                    style={{
                      flex:
                        1,

                      height:
                        8,

                      borderRadius:
                        999,

                      backgroundColor:
                        "#303030",

                      overflow:
                        "hidden",

                      marginHorizontal:
                        10,
                    }}
                  >
                    <View
                      style={{
                        width:
                          `${percentage}%`,

                        height:
                          "100%",

                        backgroundColor:
                          "#F5C451",
                      }}
                    />
                  </View>

                  <Text
                    style={{
                      color:
                        "#BDBDBD",

                      width:
                        32,

                      textAlign:
                        "right",
                    }}
                  >
                    {row.value}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : null}

        <Text
          style={[
            styles.cardTitle,
            {
              marginTop:
                22,
            },
          ]}
        >
          Filtrar por calificación
        </Text>

        <View
          style={styles.filterRow}
        >
          {ratingFilters.map(
            (filter) => {
              const selected =
                ratingFilter ===
                filter;

              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterButton,

                    selected &&
                      styles.filterButtonActive,
                  ]}
                  onPress={() =>
                    setRatingFilter(
                      filter
                    )
                  }
                >
                  <Text
                    style={[
                      styles.filterButtonText,

                      selected &&
                        styles.filterButtonTextActive,
                    ]}
                  >
                    {filter ===
                    "Todas"
                      ? filter
                      : `${filter}★`}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </View>

        <Text
          style={[
            styles.cardTitle,
            {
              marginTop:
                22,
            },
          ]}
        >
          Orden
        </Text>

        <View
          style={styles.filterRow}
        >
          {(
            [
              "Recientes",
              "Antiguas",
            ] as OrderFilter[]
          ).map((filter) => {
            const selected =
              orderFilter ===
              filter;

            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,

                  selected &&
                    styles.filterButtonActive,
                ]}
                onPress={() =>
                  setOrderFilter(
                    filter
                  )
                }
              >
                <Text
                  style={[
                    styles.filterButtonText,

                    selected &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text
          style={styles.resultCount}
        >
          {filteredReviews.length}{" "}
          {filteredReviews.length ===
          1
            ? "reseña encontrada"
            : "reseñas encontradas"}
        </Text>

        {filteredReviews.length ===
        0 ? (
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
              Sin reseñas
            </Text>

            <Text
              style={
                styles.emptyStateText
              }
            >
              No hay reseñas para este filtro.
            </Text>
          </View>
        ) : (
          filteredReviews.map(
            (review) => (
              <View
                key={
                  review.supabaseId
                }
                style={
                  styles.profileCard
                }
              >
                <View
                  style={{
                    flexDirection:
                      "row",

                    justifyContent:
                      "space-between",

                    alignItems:
                      "flex-start",

                    gap:
                      12,
                  }}
                >
                  <View
                    style={{
                      flex:
                        1,
                    }}
                  >
                    <Text
                      style={
                        styles.cardTitle
                      }
                    >
                      {review.reviewerName ||
                        "Usuario"}
                    </Text>

                    <Text
                      style={{
                        color:
                          "#F5C451",

                        fontSize:
                          20,

                        marginTop:
                          5,
                      }}
                    >
                      {renderStars(
                        review.rating
                      )}
                    </Text>
                  </View>

                  <Text
                    style={{
                      color:
                        "#929292",

                      fontSize:
                        12,

                      textAlign:
                        "right",
                    }}
                  >
                    {formatDate(
                      review.createdAt
                    )}
                  </Text>
                </View>

                <Text
                  style={{
                    color:
                      "#E0E0E0",

                    fontSize:
                      15,

                    lineHeight:
                      22,

                    marginTop:
                      16,
                  }}
                >
                  {review.comment ||
                    "El usuario no escribió un comentario."}
                </Text>

                {review.updatedAt !==
                review.createdAt ? (
                  <Text
                    style={{
                      color:
                        "#777777",

                      fontSize:
                        12,

                      marginTop:
                        12,

                      fontStyle:
                        "italic",
                    }}
                  >
                    Reseña editada
                  </Text>
                ) : null}
              </View>
            )
          )
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.back()
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