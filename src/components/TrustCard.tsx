import {
  Text,
  View,
} from "react-native";

import {
  TrustStats,
} from "../lib/trustApi";

import {
  styles,
} from "../theme/styles";

type TrustCardProps = {
  stats: TrustStats;
  title?: string;
};

function formatMemberSince(
  dateValue: string
): string {
  if (!dateValue) {
    return "Fecha no disponible";
  }

  const date =
    new Date(dateValue);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return dateValue.slice(
      0,
      10
    );
  }

  return new Intl.DateTimeFormat(
    "es-CA",
    {
      year: "numeric",
      month: "long",
    }
  ).format(date);
}

function getTrustDescription(
  trustLevel: TrustStats["trustLevel"]
): string {
  switch (trustLevel) {
    case "Destacado":
      return "Usuario con amplia experiencia y excelente nivel de cumplimiento.";

    case "Confiable":
      return "Usuario con varios intercambios y buen nivel de cumplimiento.";

    case "Activo":
      return "Usuario que ya ha completado intercambios en la comunidad.";

    default:
      return "Usuario nuevo o todavía sin intercambios completados.";
  }
}

export default function TrustCard({
  stats,
  title = "Confianza y reputación",
}: TrustCardProps) {
  return (
    <View
      style={[
        styles.profileCard,
        {
          marginTop: 18,
        },
      ]}
    >
      <Text
        style={
          styles.cardTitle
        }
      >
        {title}
      </Text>

      <View
        style={{
          marginTop: 14,
          marginBottom: 16,
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "800",
            color: "#FFFFFF",
          }}
        >
          {stats.trustLevel}
        </Text>

        <Text
          style={[
            styles.screenSubtitle,
            {
              textAlign: "center",
              marginTop: 6,
            },
          ]}
        >
          {getTrustDescription(
            stats.trustLevel
          )}
        </Text>
      </View>

      <Text
        style={
          styles.profileLine
        }
      >
        Verificación:{" "}
        {stats.isVerified
          ? "Perfil verificado"
          : "Perfil no verificado"}
      </Text>

      <Text
        style={
          styles.profileLine
        }
      >
        Intercambios completados:{" "}
        {stats.completedExchanges}
      </Text>

      <Text
        style={
          styles.profileLine
        }
      >
        Solicitudes pendientes:{" "}
        {stats.pendingExchanges}
      </Text>

      <Text
        style={
          styles.profileLine
        }
      >
        Cancelaciones:{" "}
        {stats.cancelledExchanges}
      </Text>

      <Text
        style={
          styles.profileLine
        }
      >
        Cumplimiento:{" "}
        {stats.completedExchanges +
          stats.cancelledExchanges ===
        0
          ? "Sin datos"
          : `${stats.completionRate.toFixed(
              1
            )}%`}
      </Text>

      <Text
        style={
          styles.profileLine
        }
      >
        Reseñas recibidas:{" "}
        {stats.reviewsCount}
      </Text>

      <Text
        style={
          styles.profileLine
        }
      >
        Promedio:{" "}
        {stats.reviewsCount === 0
          ? "Sin reseñas"
          : `${stats.averageRating.toFixed(
              1
            )} ⭐`}
      </Text>

      <Text
        style={
          styles.profileLine
        }
      >
        Miembro desde:{" "}
        {formatMemberSince(
          stats.memberSince
        )}
      </Text>

      <Text
        style={[
          styles.cardTitle,
          {
            marginTop: 20,
          },
        ]}
      >
        Insignias
      </Text>

      {stats.badges.length === 0 ? (
        <Text
          style={
            styles.profileLine
          }
        >
          Todavía no hay insignias obtenidas.
        </Text>
      ) : (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginTop: 10,
          }}
        >
          {stats.badges.map(
            (badge) => (
              <View
                key={badge}
                style={{
                  backgroundColor:
                    "#0D2240",

                  borderRadius: 999,

                  paddingHorizontal: 12,
                  paddingVertical: 7,
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: "700",
                  }}
                >
                  {badge}
                </Text>
              </View>
            )
          )}
        </View>
      )}
    </View>
  );
}