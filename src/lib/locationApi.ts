import * as Location from "expo-location";

export type LocationVisibility =
  | "hidden"
  | "community"
  | "public";

export type UserCoordinates = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp: number;
};

function isValidLatitude(
  value: number
): boolean {
  return (
    Number.isFinite(value) &&
    value >= -90 &&
    value <= 90
  );
}

function isValidLongitude(
  value: number
): boolean {
  return (
    Number.isFinite(value) &&
    value >= -180 &&
    value <= 180
  );
}

export function validateCoordinates(
  latitude: number,
  longitude: number
): void {
  if (
    !isValidLatitude(latitude)
  ) {
    throw new Error(
      "La latitud recibida no es válida."
    );
  }

  if (
    !isValidLongitude(longitude)
  ) {
    throw new Error(
      "La longitud recibida no es válida."
    );
  }
}

export async function requestCurrentLocation(): Promise<UserCoordinates> {
  const servicesEnabled =
    await Location.hasServicesEnabledAsync();

  if (!servicesEnabled) {
    throw new Error(
      "Los servicios de ubicación están desactivados en este dispositivo."
    );
  }

  const permission =
    await Location.requestForegroundPermissionsAsync();

  if (
    permission.status !==
    Location.PermissionStatus.GRANTED
  ) {
    throw new Error(
      "Debes permitir el acceso a tu ubicación para usar esta función."
    );
  }

  const currentLocation =
    await Location.getCurrentPositionAsync({
      accuracy:
        Location.Accuracy.Balanced,
    });

  const latitude =
    Number(
      currentLocation.coords.latitude
    );

  const longitude =
    Number(
      currentLocation.coords.longitude
    );

  validateCoordinates(
    latitude,
    longitude
  );

  return {
    latitude,
    longitude,

    accuracy:
      Number.isFinite(
        currentLocation.coords
          .accuracy
      )
        ? currentLocation.coords
            .accuracy
        : null,

    timestamp:
      currentLocation.timestamp ||
      Date.now(),
  };
}

export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number
): Promise<{
  city: string;
  community: string;
  region: string;
  country: string;
} | null> {
  validateCoordinates(
    latitude,
    longitude
  );

  try {
    const results =
      await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

    const firstResult =
      results[0];

    if (!firstResult) {
      return null;
    }

    const city =
      firstResult.city ||
      firstResult.subregion ||
      firstResult.region ||
      "";

    const community =
      firstResult.district ||
      firstResult.street ||
      firstResult.subregion ||
      "";

    return {
      city,

      community,

      region:
        firstResult.region || "",

      country:
        firstResult.country || "",
    };
  } catch (error) {
    console.warn(
      "No se pudo obtener la dirección aproximada:",
      error
    );

    return null;
  }
}

export function formatCoordinate(
  value?: number | null
): string {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "";
  }

  return value.toFixed(5);
}

export function formatDistance(
  distanceKm?: number | null
): string {
  if (
    distanceKm === null ||
    distanceKm === undefined ||
    !Number.isFinite(distanceKm)
  ) {
    return "";
  }

  if (distanceKm < 1) {
    return `${Math.round(
      distanceKm * 1000
    )} m`;
  }

  return `${distanceKm.toFixed(
    distanceKm < 10 ? 1 : 0
  )} km`;
}