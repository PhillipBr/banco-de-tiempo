import {
  useCallback,
  useMemo,
  useRef,
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
  useFocusEffect,
} from "expo-router";

import Header from "../components/Header";
import ServiceCard from "../components/ServiceCard";
import ServiceMap from "../components/ServiceMap";

import {
  styles,
} from "../theme/styles";

import {
  useAuthContext,
} from "../context/AuthContext";

import {
  categories,
} from "../data/categories";

import {
  AppService,
  getNearbyServices,
  getServices,
  mapNearbyServiceToAppService,
  mapSupabaseServiceToAppService,
} from "../lib/serviceApi";

import {
  getProfileByUserId,
} from "../lib/profileApi";

import {
  requestCurrentLocation,
} from "../lib/locationApi";

type PublicationFilter =
  | "Todos"
  | "Ofertas"
  | "Pedidos";

type DistanceRadius =
  | 2
  | 5
  | 10
  | 25
  | 50;

const distanceOptions: DistanceRadius[] = [
  2,
  5,
  10,
  25,
  50,
];

function getServiceKey(
  service: AppService
): string {
  return String(
    service.supabaseId ||
      service.id
  );
}

export default function ServicesScreen() {
  const {
    session,
    authUser,
  } = useAuthContext();

  const scrollViewRef =
    useRef<ScrollView | null>(
      null
    );

  const cardPositionsRef =
    useRef<
      Record<
        string,
        number
      >
    >({});

  const isLoggedIn =
    Boolean(session);

  const currentUserId =
    authUser?.id ?? "";

  const [
    services,
    setServices,
  ] = useState<AppService[]>(
    []
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isLocating,
    setIsLocating,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    selectedType,
    setSelectedType,
  ] =
    useState<PublicationFilter>(
      "Todos"
    );

  const [
    selectedMode,
    setSelectedMode,
  ] = useState("Todos");

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState("Todas");

  const [
    selectedRadius,
    setSelectedRadius,
  ] =
    useState<DistanceRadius>(
      10
    );

  const [
    nearbyMode,
    setNearbyMode,
  ] = useState(false);

  const [
    locationLabel,
    setLocationLabel,
  ] = useState("");

  const [
    searchLatitude,
    setSearchLatitude,
  ] = useState<
    number | null
  >(null);

  const [
    searchLongitude,
    setSearchLongitude,
  ] = useState<
    number | null
  >(null);

  const [
    selectedServiceId,
    setSelectedServiceId,
  ] = useState<
    string | null
  >(null);

  const loadAllServices =
    useCallback(async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const data =
          await getServices();

        setServices(
          data.map(
            mapSupabaseServiceToAppService
          )
        );

        setNearbyMode(false);
        setLocationLabel("");

        setSearchLatitude(
          null
        );

        setSearchLongitude(
          null
        );

        setSelectedServiceId(
          null
        );

        cardPositionsRef.current =
          {};
      } catch (error: any) {
        console.error(
          "Error cargando servicios:",
          error
        );

        setErrorMessage(
          error?.message ||
            "Error cargando servicios."
        );
      } finally {
        setIsLoading(false);
      }
    }, []);

  const loadNearbyServices =
    useCallback(
      async (
        radius:
          DistanceRadius =
          selectedRadius
      ) => {
        try {
          setIsLocating(
            true
          );

          setErrorMessage("");

          let latitude:
            | number
            | null =
            null;

          let longitude:
            | number
            | null =
            null;

          let sourceLabel =
            "tu ubicación actual";

          if (currentUserId) {
            const profile =
              await getProfileByUserId(
                currentUserId
              );

            if (
              profile?.latitude !==
                null &&
              profile?.latitude !==
                undefined &&
              profile?.longitude !==
                null &&
              profile?.longitude !==
                undefined
            ) {
              latitude =
                Number(
                  profile.latitude
                );

              longitude =
                Number(
                  profile.longitude
                );

              sourceLabel =
                profile.community ||
                profile.city ||
                "tu ubicación guardada";
            }
          }

          if (
            latitude === null ||
            longitude === null
          ) {
            const currentLocation =
              await requestCurrentLocation();

            latitude =
              currentLocation.latitude;

            longitude =
              currentLocation.longitude;

            sourceLabel =
              "tu ubicación actual";
          }

          const nearbyData =
            await getNearbyServices(
              latitude,
              longitude,
              radius,
              200
            );

          const mappedServices =
            nearbyData.map(
              mapNearbyServiceToAppService
            );

          setServices(
            mappedServices
          );

          setNearbyMode(
            true
          );

          setSelectedRadius(
            radius
          );

          setLocationLabel(
            sourceLabel
          );

          setSearchLatitude(
            latitude
          );

          setSearchLongitude(
            longitude
          );

          setSelectedServiceId(
            null
          );

          cardPositionsRef.current =
            {};
        } catch (error: any) {
          console.error(
            "Error cargando servicios cercanos:",
            error
          );

          setErrorMessage(
            error?.message ||
              "No se pudieron buscar servicios cercanos."
          );

          Alert.alert(
            "Ubicación no disponible",
            error?.message ||
              "No se pudieron buscar servicios cercanos."
          );
        } finally {
          setIsLocating(
            false
          );
        }
      },
      [
        currentUserId,
        selectedRadius,
      ]
    );

  useFocusEffect(
    useCallback(() => {
      void loadAllServices();
    }, [loadAllServices])
  );

  const filteredServices =
    useMemo(() => {
      const normalizedQuery =
        searchText
          .trim()
          .toLowerCase();

      const result =
        services.filter(
          (item) => {
            const person =
              String(
                item.person ?? ""
              ).toLowerCase();

            const service =
              String(
                item.service ?? ""
              ).toLowerCase();

            const category =
              String(
                item.category ?? ""
              ).toLowerCase();

            const city =
              String(
                item.city ?? ""
              ).toLowerCase();

            const community =
              String(
                item.community ?? ""
              ).toLowerCase();

            const mode =
              String(
                item.mode ?? ""
              );

            const serviceType =
              item.serviceType ===
              "request"
                ? "request"
                : "offer";

            const matchesText =
              normalizedQuery.length ===
                0 ||
              person.includes(
                normalizedQuery
              ) ||
              service.includes(
                normalizedQuery
              ) ||
              category.includes(
                normalizedQuery
              ) ||
              city.includes(
                normalizedQuery
              ) ||
              community.includes(
                normalizedQuery
              );

            const matchesType =
              selectedType ===
                "Todos" ||
              (
                selectedType ===
                  "Ofertas" &&
                serviceType ===
                  "offer"
              ) ||
              (
                selectedType ===
                  "Pedidos" &&
                serviceType ===
                  "request"
              );

            const matchesMode =
              selectedMode ===
                "Todos" ||
              mode ===
                selectedMode;

            const matchesCategory =
              selectedCategory ===
                "Todas" ||
              item.category ===
                selectedCategory;

            return (
              matchesText &&
              matchesType &&
              matchesMode &&
              matchesCategory
            );
          }
        );

      if (nearbyMode) {
        result.sort(
          (first, second) => {
            const firstDistance =
              first.distanceKm ??
              Number.MAX_SAFE_INTEGER;

            const secondDistance =
              second.distanceKm ??
              Number.MAX_SAFE_INTEGER;

            return (
              firstDistance -
              secondDistance
            );
          }
        );
      }

      return result;
    }, [
      services,
      searchText,
      selectedType,
      selectedMode,
      selectedCategory,
      nearbyMode,
    ]);

  const clearFilters =
    () => {
      setSearchText("");

      setSelectedType(
        "Todos"
      );

      setSelectedMode(
        "Todos"
      );

      setSelectedCategory(
        "Todas"
      );

      setSelectedServiceId(
        null
      );
    };

  const handleRadiusChange =
    (
      radius:
        DistanceRadius
    ) => {
      setSelectedRadius(
        radius
      );

      if (nearbyMode) {
        void loadNearbyServices(
          radius
        );
      }
    };

  const scrollToServiceCard =
    (
      service:
        AppService
    ) => {
      const serviceKey =
        getServiceKey(
          service
        );

      const cardY =
        cardPositionsRef.current[
          serviceKey
        ];

      if (
        typeof cardY !==
        "number"
      ) {
        return;
      }

      window.setTimeout(
        () => {
          scrollViewRef.current?.scrollTo({
            y:
              Math.max(
                cardY - 24,
                0
              ),

            animated:
              true,
          });
        },
        180
      );
    };

  const handleMapSelectService =
    (
      service:
        AppService
    ) => {
      const serviceKey =
        getServiceKey(
          service
        );

      setSelectedServiceId(
        serviceKey
      );

      scrollToServiceCard(
        service
      );
    };

  const handleCardSelectService =
    (
      service:
        AppService
    ) => {
      const serviceKey =
        getServiceKey(
          service
        );

      setSelectedServiceId(
        serviceKey
      );
    };

  return (
    <ScrollView
      ref={
        scrollViewRef
      }
      style={styles.page}
      contentContainerStyle={{
        paddingBottom:
          50,
      }}
    >
      <Header />

      <View
        style={
          styles.formSection
        }
      >
        <Text
          style={
            styles.screenTitle
          }
        >
          Servicios disponibles
        </Text>

        <Text
          style={
            styles.screenSubtitle
          }
        >
          Explora ofertas y pedidos publicados por la comunidad.
        </Text>

        <View
          style={[
            styles.profileCard,
            {
              marginTop:
                18,
            },
          ]}
        >
          <Text
            style={
              styles.cardTitle
            }
          >
            Servicios cercanos
          </Text>

          <Text
            style={
              styles.screenSubtitle
            }
          >
            Busca publicaciones según tu ubicación guardada o la ubicación actual del dispositivo.
          </Text>

          <Text
            style={[
              styles.cardTitle,
              {
                marginTop:
                  18,
              },
            ]}
          >
            Radio de búsqueda
          </Text>

          <View
            style={
              styles.filterRow
            }
          >
            {distanceOptions.map(
              (radius) => {
                const selected =
                  selectedRadius ===
                  radius;

                return (
                  <TouchableOpacity
                    key={
                      radius
                    }
                    style={[
                      styles.filterButton,

                      selected &&
                        styles.filterButtonActive,
                    ]}
                    onPress={() =>
                      handleRadiusChange(
                        radius
                      )
                    }
                    disabled={
                      isLocating
                    }
                  >
                    <Text
                      style={[
                        styles.filterButtonText,

                        selected &&
                          styles.filterButtonTextActive,
                      ]}
                    >
                      {radius} km
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,

              isLocating && {
                opacity:
                  0.6,
              },
            ]}
            onPress={() =>
              void loadNearbyServices()
            }
            disabled={
              isLocating
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              {isLocating
                ? "Buscando servicios..."
                : `Buscar dentro de ${selectedRadius} km`}
            </Text>
          </TouchableOpacity>

          {nearbyMode ? (
            <>
              <Text
                style={[
                  styles.profileLine,
                  {
                    textAlign:
                      "center",

                    marginTop:
                      12,
                  },
                ]}
              >
                Mostrando servicios cerca de{" "}
                {locationLabel ||
                  "tu ubicación"}.
              </Text>

              <TouchableOpacity
                style={
                  styles.contactButton
                }
                onPress={() =>
                  void loadAllServices()
                }
                disabled={
                  isLoading
                }
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Mostrar todos los servicios
                </Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        <TextInput
          placeholder="Buscar servicio, persona, barrio o categoría..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={
            setSearchText
          }
          style={
            styles.input
          }
        />

        <Text
          style={
            styles.cardTitle
          }
        >
          Tipo de publicación
        </Text>

        <View
          style={
            styles.filterRow
          }
        >
          {(
            [
              "Todos",
              "Ofertas",
              "Pedidos",
            ] as PublicationFilter[]
          ).map(
            (type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterButton,

                  selectedType ===
                    type &&
                    styles.filterButtonActive,
                ]}
                onPress={() =>
                  setSelectedType(
                    type
                  )
                }
              >
                <Text
                  style={[
                    styles.filterButtonText,

                    selectedType ===
                      type &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <Text
          style={
            styles.cardTitle
          }
        >
          Modalidad
        </Text>

        <View
          style={
            styles.filterRow
          }
        >
          {[
            "Todos",
            "Remoto",
            "Presencial",
          ].map(
            (mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.filterButton,

                  selectedMode ===
                    mode &&
                    styles.filterButtonActive,
                ]}
                onPress={() =>
                  setSelectedMode(
                    mode
                  )
                }
              >
                <Text
                  style={[
                    styles.filterButtonText,

                    selectedMode ===
                      mode &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  {mode}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <Text
          style={
            styles.cardTitle
          }
        >
          Categoría
        </Text>

        <View
          style={
            styles.filterRow
          }
        >
          {categories.map(
            (category) => (
              <TouchableOpacity
                key={
                  category
                }
                style={[
                  styles.filterButton,

                  selectedCategory ===
                    category &&
                    styles.filterButtonActive,
                ]}
                onPress={() =>
                  setSelectedCategory(
                    category
                  )
                }
              >
                <Text
                  style={[
                    styles.filterButtonText,

                    selectedCategory ===
                      category &&
                      styles.filterButtonTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <TouchableOpacity
          style={
            styles.contactButton
          }
          onPress={
            clearFilters
          }
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            Limpiar filtros
          </Text>
        </TouchableOpacity>

        {isLoggedIn ? (
          <TouchableOpacity
            style={
              styles.primaryButton
            }
            onPress={() =>
              router.push(
                "/add-service"
              )
            }
          >
            <Text
              style={
                styles.primaryButtonText
              }
            >
              Publicar oferta o pedido
            </Text>
          </TouchableOpacity>
        ) : null}

        <TouchableOpacity
          style={[
            styles.contactButton,

            (
              isLoading ||
              isLocating
            ) && {
              opacity:
                0.6,
            },
          ]}
          onPress={() =>
            void (
              nearbyMode
                ? loadNearbyServices()
                : loadAllServices()
            )
          }
          disabled={
            isLoading ||
            isLocating
          }
        >
          <Text
            style={
              styles.primaryButtonText
            }
          >
            {isLoading ||
            isLocating
              ? "Cargando servicios..."
              : "Recargar servicios"}
          </Text>
        </TouchableOpacity>

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

        {!isLoading &&
        !isLocating &&
        !errorMessage ? (
          <View>
            <Text
              style={
                styles.resultCount
              }
            >
              {filteredServices.length}{" "}
              publicaciones encontradas
            </Text>

            {nearbyMode &&
            filteredServices.length >
              0 ? (
              <>
                <View
                  style={{
                    marginTop:
                      8,

                    marginBottom:
                      4,
                  }}
                >
                  <Text
                    style={
                      styles.cardTitle
                    }
                  >
                    Mapa de servicios
                  </Text>

                  <Text
                    style={
                      styles.screenSubtitle
                    }
                  >
                    Selecciona un marcador para localizar su publicación en la lista.
                  </Text>
                </View>

                <ServiceMap
                  services={
                    filteredServices
                  }
                  userLatitude={
                    searchLatitude
                  }
                  userLongitude={
                    searchLongitude
                  }
                  selectedServiceId={
                    selectedServiceId
                  }
                  onSelectService={
                    handleMapSelectService
                  }
                />

                <Text
                  style={[
                    styles.cardTitle,
                    {
                      marginTop:
                        4,

                      marginBottom:
                        12,
                    },
                  ]}
                >
                  Publicaciones cercanas
                </Text>
              </>
            ) : null}

            {filteredServices.length ===
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
                  No hay resultados
                </Text>

                <Text
                  style={
                    styles.emptyStateText
                  }
                >
                  {nearbyMode
                    ? `No se encontraron servicios dentro de ${selectedRadius} km.`
                    : "Prueba con otra palabra o cambia los filtros."}
                </Text>
              </View>
            ) : (
              filteredServices.map(
                (item) => {
                  const serviceKey =
                    getServiceKey(
                      item
                    );

                  return (
                    <View
                      key={
                        serviceKey
                      }
                      onLayout={(
                        event
                      ) => {
                        cardPositionsRef.current[
                          serviceKey
                        ] =
                          event.nativeEvent.layout.y;
                      }}
                    >
                      <ServiceCard
                        item={
                          item
                        }
                        isSelected={
                          selectedServiceId ===
                          serviceKey
                        }
                        onPressCard={() =>
                          handleCardSelectService(
                            item
                          )
                        }
                      />
                    </View>
                  );
                }
              )
            )}
          </View>
        ) : null}

        {(isLoading ||
          isLocating) ? (
          <Text
            style={
              styles.screenSubtitle
            }
          >
            {isLocating
              ? "Buscando servicios cercanos..."
              : "Cargando servicios..."}
          </Text>
        ) : null}

        <TouchableOpacity
          style={
            styles.backButton
          }
          onPress={() =>
            router.push("/")
          }
        >
          <Text
            style={
              styles.backButtonText
            }
          >
            ← Volver al inicio
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}