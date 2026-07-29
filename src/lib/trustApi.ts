import { supabase } from "./supabase";

export type TrustLevel =
  | "Nuevo"
  | "Activo"
  | "Confiable"
  | "Destacado";

export type SupabaseTrustStats = {
  user_id: string;

  is_verified: boolean;
  verified_at: string | null;
  member_since: string;

  completed_exchanges: number;
  cancelled_exchanges: number;
  pending_exchanges: number;
  total_requests: number;

  reviews_count: number;
  average_rating: number;

  completion_rate: number;
  trust_level: TrustLevel;
};

export type TrustStats = {
  userId: string;

  isVerified: boolean;
  verifiedAt?: string;
  memberSince: string;

  completedExchanges: number;
  cancelledExchanges: number;
  pendingExchanges: number;
  totalRequests: number;

  reviewsCount: number;
  averageRating: number;

  completionRate: number;
  trustLevel: TrustLevel;

  badges: string[];
};

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

function normalizeRpcResponse(
  data:
    | SupabaseTrustStats
    | SupabaseTrustStats[]
    | null
): SupabaseTrustStats {
  const stats =
    Array.isArray(data)
      ? data[0]
      : data;

  if (!stats) {
    throw new Error(
      "Supabase no devolvió estadísticas de confianza."
    );
  }

  return stats;
}

export function getTrustBadges(
  stats: Omit<
    TrustStats,
    "badges"
  >
): string[] {
  const badges: string[] = [];

  if (
    stats.isVerified
  ) {
    badges.push(
      "Perfil verificado"
    );
  }

  if (
    stats.completedExchanges >= 1
  ) {
    badges.push(
      "Primer intercambio"
    );
  }

  if (
    stats.completedExchanges >= 5
  ) {
    badges.push(
      "5 intercambios"
    );
  }

  if (
    stats.completedExchanges >= 10
  ) {
    badges.push(
      "10 intercambios"
    );
  }

  if (
    stats.completedExchanges >= 20
  ) {
    badges.push(
      "20 intercambios"
    );
  }

  if (
    stats.reviewsCount >= 3 &&
    stats.averageRating >= 4.5
  ) {
    badges.push(
      "Excelente reputación"
    );
  }

  if (
    stats.completedExchanges >= 3 &&
    stats.cancelledExchanges === 0
  ) {
    badges.push(
      "Sin cancelaciones"
    );
  }

  if (
    stats.completionRate >= 90 &&
    stats.completedExchanges >= 5
  ) {
    badges.push(
      "Alta confiabilidad"
    );
  }

  return badges;
}

export async function getUserTrustStats(
  userId: string
): Promise<TrustStats> {
  if (
    !isValidUuid(
      userId
    )
  ) {
    throw new Error(
      "No se recibió un UUID válido para calcular la confianza."
    );
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_user_trust_stats",
    {
      p_user_id:
        userId,
    }
  );

  if (error) {
    throw error;
  }

  const raw =
    normalizeRpcResponse(
      data as
        | SupabaseTrustStats
        | SupabaseTrustStats[]
        | null
    );

  const statsWithoutBadges: Omit<
    TrustStats,
    "badges"
  > = {
    userId:
      raw.user_id,

    isVerified:
      Boolean(
        raw.is_verified
      ),

    verifiedAt:
      raw.verified_at ??
      undefined,

    memberSince:
      raw.member_since,

    completedExchanges:
      Number(
        raw.completed_exchanges
      ) || 0,

    cancelledExchanges:
      Number(
        raw.cancelled_exchanges
      ) || 0,

    pendingExchanges:
      Number(
        raw.pending_exchanges
      ) || 0,

    totalRequests:
      Number(
        raw.total_requests
      ) || 0,

    reviewsCount:
      Number(
        raw.reviews_count
      ) || 0,

    averageRating:
      Number(
        raw.average_rating
      ) || 0,

    completionRate:
      Number(
        raw.completion_rate
      ) || 0,

    trustLevel:
      raw.trust_level ||
      "Nuevo",
  };

  return {
    ...statsWithoutBadges,

    badges:
      getTrustBadges(
        statsWithoutBadges
      ),
  };
}