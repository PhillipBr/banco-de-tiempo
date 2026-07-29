import {
  Text,
  View,
} from "react-native";

import {
  styles,
} from "../theme/styles";

import {
  AppService,
} from "../lib/serviceApi";

type ServiceMapProps = {
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

export default function ServiceMap({
  services,
}: ServiceMapProps) {
  const servicesWithLocation =
    services.filter(
      (service) =>
        service.latitude !== null &&
        service.longitude !== null
    );

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
        Mapa disponible en web
      </Text>

      <Text
        style={
          styles.emptyStateText
        }
      >
        La aplicación encontró{" "}
        {servicesWithLocation.length}{" "}
        {servicesWithLocation.length === 1
          ? "publicación con ubicación."
          : "publicaciones con ubicación."}
      </Text>

      <Text
        style={[
          styles.emptyStateText,
          {
            marginTop: 8,
          },
        ]}
      >
        En Android y iOS puedes continuar
        utilizando la lista ordenada por
        distancia.
      </Text>
    </View>
  );
}