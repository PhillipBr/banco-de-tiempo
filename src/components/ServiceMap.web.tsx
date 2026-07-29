import {
  ComponentType,
  useEffect,
  useState,
} from "react";

import {
  Text,
  View,
} from "react-native";

import {
  AppService,
} from "../lib/serviceApi";

import {
  styles,
} from "../theme/styles";

export type ServiceMapProps = {
  services: AppService[];

  userLatitude:
    | number
    | null;

  userLongitude:
    | number
    | null;

  selectedServiceId?:
    | string
    | null;

  onSelectService?: (
    service: AppService
  ) => void;
};

const LEAFLET_CSS_ID =
  "banco-tiempo-leaflet-css";

const LEAFLET_CSS_URL =
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

function loadLeafletCss(): void {
  if (
    typeof document ===
    "undefined"
  ) {
    return;
  }

  const existingStylesheet =
    document.getElementById(
      LEAFLET_CSS_ID
    );

  if (existingStylesheet) {
    return;
  }

  const link =
    document.createElement(
      "link"
    );

  link.id =
    LEAFLET_CSS_ID;

  link.rel =
    "stylesheet";

  link.href =
    LEAFLET_CSS_URL;

  link.crossOrigin =
    "";

  document.head.appendChild(
    link
  );
}

export default function ServiceMap(
  props: ServiceMapProps
) {
  const [
    MapComponent,
    setMapComponent,
  ] = useState<ComponentType<ServiceMapProps> | null>(
    null
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  useEffect(() => {
    let isMounted =
      true;

    async function loadMap() {
      if (
        typeof window ===
          "undefined" ||
        typeof document ===
          "undefined"
      ) {
        return;
      }

      try {
        setIsLoading(true);
        setErrorMessage("");

        loadLeafletCss();

        const importedModule =
          await import(
            "./ServiceMapLeaflet.web"
          );

        if (!isMounted) {
          return;
        }

        setMapComponent(
          () =>
            importedModule.default
        );
      } catch (error: any) {
        console.error(
          "Error cargando Leaflet:",
          error
        );

        if (!isMounted) {
          return;
        }

        setErrorMessage(
          error?.message ||
            "No se pudo cargar el mapa."
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadMap();

    return () => {
      isMounted =
        false;
    };
  }, []);

  if (errorMessage) {
    return (
      <View
        style={[
          styles.emptyStateCard,
          {
            marginTop: 16,
            marginBottom: 20,
          },
        ]}
      >
        <Text
          style={
            styles.emptyStateTitle
          }
        >
          No se pudo cargar el mapa
        </Text>

        <Text
          style={
            styles.emptyStateText
          }
        >
          {errorMessage}
        </Text>
      </View>
    );
  }

  if (
    isLoading ||
    !MapComponent
  ) {
    return (
      <View
        style={[
          styles.emptyStateCard,
          {
            marginTop: 16,
            marginBottom: 20,
            minHeight: 240,
            justifyContent:
              "center",
          },
        ]}
      >
        <Text
          style={
            styles.emptyStateTitle
          }
        >
          Cargando mapa...
        </Text>

        <Text
          style={
            styles.emptyStateText
          }
        >
          Preparando las ubicaciones de los servicios.
        </Text>
      </View>
    );
  }

  return (
    <MapComponent
      {...props}
    />
  );
}