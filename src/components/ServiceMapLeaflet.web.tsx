import {
  useEffect,
  useMemo,
  useRef,
} from "react";

import {
  Text,
  View,
} from "react-native";

import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";

import {
  divIcon,
  LatLngBounds,
  Map as LeafletMap,
  Marker as LeafletMarker,
} from "leaflet";

import {
  AppService,
} from "../lib/serviceApi";

import {
  formatDistance,
} from "../lib/locationApi";

import {
  styles,
} from "../theme/styles";

import type {
  ServiceMapProps,
} from "./ServiceMap.web";

type MapBoundsControllerProps = {
  services: AppService[];

  userLatitude:
    | number
    | null;

  userLongitude:
    | number
    | null;
};

type SelectedServiceControllerProps = {
  selectedService:
    | AppService
    | null;

  markerRefs: React.MutableRefObject<
    Record<
      string,
      LeafletMarker | null
    >
  >;
};

function isValidCoordinate(
  value:
    | number
    | null
    | undefined
): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function getServiceKey(
  service: AppService
): string {
  return String(
    service.supabaseId ||
      service.id
  );
}

function MapBoundsController({
  services,
  userLatitude,
  userLongitude,
}: MapBoundsControllerProps) {
  const map =
    useMap();

  useEffect(() => {
    const positions: [
      number,
      number,
    ][] = [];

    if (
      isValidCoordinate(
        userLatitude
      ) &&
      isValidCoordinate(
        userLongitude
      )
    ) {
      positions.push([
        userLatitude,
        userLongitude,
      ]);
    }

    services.forEach(
      (service) => {
        if (
          isValidCoordinate(
            service.latitude
          ) &&
          isValidCoordinate(
            service.longitude
          )
        ) {
          positions.push([
            service.latitude,
            service.longitude,
          ]);
        }
      }
    );

    if (
      positions.length === 0
    ) {
      return;
    }

    if (
      positions.length === 1
    ) {
      map.setView(
        positions[0],
        14
      );

      return;
    }

    const bounds =
      new LatLngBounds(
        positions
      );

    map.fitBounds(
      bounds,
      {
        padding:
          [45, 45],

        maxZoom:
          15,
      }
    );
  }, [
    map,
    services,
    userLatitude,
    userLongitude,
  ]);

  return null;
}

function SelectedServiceController({
  selectedService,
  markerRefs,
}: SelectedServiceControllerProps) {
  const map =
    useMap();

  useEffect(() => {
    if (
      !selectedService ||
      !isValidCoordinate(
        selectedService.latitude
      ) ||
      !isValidCoordinate(
        selectedService.longitude
      )
    ) {
      return;
    }

    const serviceKey =
      getServiceKey(
        selectedService
      );

    const position: [
      number,
      number,
    ] = [
      selectedService.latitude,
      selectedService.longitude,
    ];

    map.flyTo(
      position,
      Math.max(
        map.getZoom(),
        15
      ),
      {
        animate:
          true,

        duration:
          0.65,
      }
    );

    const timeout =
      window.setTimeout(
        () => {
          markerRefs.current[
            serviceKey
          ]?.openPopup();
        },
        500
      );

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [
    map,
    markerRefs,
    selectedService,
  ]);

  return null;
}

function createServiceMarkerIcon(
  serviceType:
    | "offer"
    | "request",
  selected: boolean
) {
  const backgroundColor =
    serviceType ===
    "request"
      ? "#A30716"
      : "#0D2240";

  const symbol =
    serviceType ===
    "request"
      ? "?"
      : "✓";

  const size =
    selected
      ? 46
      : 36;

  return divIcon({
    className:
      "banco-tiempo-map-marker",

    html: `
      <div
        style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50% 50% 50% 0;
          background: ${backgroundColor};
          border: ${
            selected
              ? "4px"
              : "3px"
          } solid #ffffff;
          box-shadow: ${
            selected
              ? "0 0 0 5px rgba(47,129,247,0.35), 0 4px 14px rgba(0,0,0,0.55)"
              : "0 3px 10px rgba(0,0,0,0.45)"
          };
          transform: rotate(-45deg);
          display: flex;
          justify-content: center;
          align-items: center;
          transition: all 0.2s ease;
        "
      >
        <span
          style="
            color: #ffffff;
            font-size: ${
              selected
                ? "21px"
                : "17px"
            };
            font-weight: 900;
            transform: rotate(45deg);
          "
        >
          ${symbol}
        </span>
      </div>
    `,

    iconSize: [
      size,
      size,
    ],

    iconAnchor: [
      Math.round(
        size / 2
      ),
      size,
    ],

    popupAnchor: [
      0,
      -size,
    ],
  });
}

function createUserMarkerIcon() {
  return divIcon({
    className:
      "banco-tiempo-user-marker",

    html: `
      <div
        style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #2F81F7;
          border: 4px solid #ffffff;
          box-shadow: 0 0 0 5px rgba(47,129,247,0.25);
        "
      ></div>
    `,

    iconSize:
      [24, 24],

    iconAnchor:
      [12, 12],

    popupAnchor:
      [0, -14],
  });
}

function MapReadyController() {
  const map =
    useMap();

  useEffect(() => {
    const timeout =
      window.setTimeout(
        () => {
          map.invalidateSize();
        },
        150
      );

    return () => {
      window.clearTimeout(
        timeout
      );
    };
  }, [map]);

  return null;
}

export default function ServiceMapLeaflet({
  services,
  userLatitude,
  userLongitude,
  selectedServiceId,
  onSelectService,
}: ServiceMapProps) {
  const markerRefs =
    useRef<
      Record<
        string,
        LeafletMarker | null
      >
    >({});

  const servicesWithLocation =
    useMemo(
      () =>
        services.filter(
          (service) =>
            isValidCoordinate(
              service.latitude
            ) &&
            isValidCoordinate(
              service.longitude
            )
        ),
      [services]
    );

  const selectedService =
    useMemo(
      () =>
        servicesWithLocation.find(
          (service) =>
            getServiceKey(
              service
            ) ===
            String(
              selectedServiceId ||
                ""
            )
        ) ?? null,
      [
        servicesWithLocation,
        selectedServiceId,
      ]
    );

  const center: [
    number,
    number,
  ] = useMemo(() => {
    if (
      isValidCoordinate(
        userLatitude
      ) &&
      isValidCoordinate(
        userLongitude
      )
    ) {
      return [
        userLatitude,
        userLongitude,
      ];
    }

    const firstService =
      servicesWithLocation[0];

    if (
      firstService &&
      isValidCoordinate(
        firstService.latitude
      ) &&
      isValidCoordinate(
        firstService.longitude
      )
    ) {
      return [
        firstService.latitude,
        firstService.longitude,
      ];
    }

    return [
      43.6532,
      -79.3832,
    ];
  }, [
    userLatitude,
    userLongitude,
    servicesWithLocation,
  ]);

  if (
    servicesWithLocation.length ===
    0
  ) {
    return (
      <View
        style={[
          styles.emptyStateCard,
          {
            marginTop:
              16,

            marginBottom:
              20,
          },
        ]}
      >
        <Text
          style={
            styles.emptyStateTitle
          }
        >
          No hay ubicaciones para mostrar
        </Text>

        <Text
          style={
            styles.emptyStateText
          }
        >
          Los proveedores deben guardar una ubicación visible para aparecer en el mapa.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        width:
          "100%",

        height:
          480,

        marginTop:
          16,

        marginBottom:
          22,

        borderRadius:
          16,

        overflow:
          "hidden",

        backgroundColor:
          "#171717",

        borderWidth:
          1,

        borderColor:
          "#30363D",
      }}
    >
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        style={{
          width:
            "100%",

          height:
            "100%",
        }}
      >
        <TileLayer
          attribution={
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapReadyController />

        <MapBoundsController
          services={
            servicesWithLocation
          }
          userLatitude={
            userLatitude
          }
          userLongitude={
            userLongitude
          }
        />

        <SelectedServiceController
          selectedService={
            selectedService
          }
          markerRefs={
            markerRefs
          }
        />

        {isValidCoordinate(
          userLatitude
        ) &&
        isValidCoordinate(
          userLongitude
        ) ? (
          <>
            <Circle
              center={[
                userLatitude,
                userLongitude,
              ]}
              radius={120}
              pathOptions={{
                color:
                  "#2F81F7",

                fillColor:
                  "#2F81F7",

                fillOpacity:
                  0.12,

                weight:
                  1,
              }}
            />

            <Marker
              position={[
                userLatitude,
                userLongitude,
              ]}
              icon={
                createUserMarkerIcon()
              }
            >
              <Popup>
                <div
                  style={{
                    minWidth:
                      150,

                    color:
                      "#111111",
                  }}
                >
                  <strong>
                    Tu ubicación
                  </strong>

                  <div
                    style={{
                      marginTop:
                        5,

                      fontSize:
                        13,
                    }}
                  >
                    Ubicación aproximada utilizada para calcular distancias.
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        ) : null}

        {servicesWithLocation.map(
          (service) => {
            const serviceKey =
              getServiceKey(
                service
              );

            const selected =
              serviceKey ===
              String(
                selectedServiceId ||
                  ""
              );

            const latitude =
              service.latitude as number;

            const longitude =
              service.longitude as number;

            return (
              <Marker
                key={
                  serviceKey
                }
                ref={(
                  marker
                ) => {
                  markerRefs.current[
                    serviceKey
                  ] = marker;
                }}
                position={[
                  latitude,
                  longitude,
                ]}
                icon={
                  createServiceMarkerIcon(
                    service.serviceType,
                    selected
                  )
                }
                eventHandlers={{
                  click: () => {
                    onSelectService?.(
                      service
                    );
                  },
                }}
              >
                <Popup>
                  <div
                    style={{
                      width:
                        220,

                      color:
                        "#111111",

                      lineHeight:
                        1.4,
                    }}
                  >
                    <div
                      style={{
                        display:
                          "inline-block",

                        padding:
                          "4px 8px",

                        marginBottom:
                          8,

                        borderRadius:
                          999,

                        background:
                          service.serviceType ===
                          "request"
                            ? "#A30716"
                            : "#0D2240",

                        color:
                          "#FFFFFF",

                        fontSize:
                          11,

                        fontWeight:
                          800,
                      }}
                    >
                      {service.serviceType ===
                      "request"
                        ? "PEDIDO"
                        : "OFERTA"}
                    </div>

                    <div
                      style={{
                        fontSize:
                          17,

                        fontWeight:
                          800,

                        marginBottom:
                          5,
                      }}
                    >
                      {service.service}
                    </div>

                    <div
                      style={{
                        fontSize:
                          14,

                        fontWeight:
                          700,
                      }}
                    >
                      {service.person}
                    </div>

                    <div
                      style={{
                        marginTop:
                          5,

                        fontSize:
                          13,
                      }}
                    >
                      ⭐{" "}
                      {Number(
                        service.rating
                      ).toFixed(1)}
                    </div>

                    {service.distanceKm !==
                      null &&
                    service.distanceKm !==
                      undefined ? (
                      <div
                        style={{
                          marginTop:
                            5,

                          fontSize:
                            13,
                        }}
                      >
                        📍{" "}
                        {formatDistance(
                          service.distanceKm
                        )}
                      </div>
                    ) : null}

                    {service.community ||
                    service.city ? (
                      <div
                        style={{
                          marginTop:
                            5,

                          fontSize:
                            13,
                        }}
                      >
                        {[
                          service.community,
                          service.city,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    ) : null}

                    <div
                      style={{
                        marginTop:
                          5,

                        fontSize:
                          13,
                      }}
                    >
                      {service.credits}{" "}
                      {service.credits === 1
                        ? "crédito"
                        : "créditos"}{" "}
                      por hora
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onSelectService?.(
                          service
                        )
                      }
                      style={{
                        width:
                          "100%",

                        marginTop:
                          12,

                        padding:
                          "9px 12px",

                        border:
                          "none",

                        borderRadius:
                          7,

                        background:
                          "#111111",

                        color:
                          "#FFFFFF",

                        cursor:
                          "pointer",

                        fontWeight:
                          700,
                      }}
                    >
                      Ver en la lista
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          }
        )}
      </MapContainer>
    </View>
  );
}