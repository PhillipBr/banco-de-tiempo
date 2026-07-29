import { supabase } from "./supabase";

export type SupabaseReview = {
  id: string;

  service_id: string | null;
  request_id: string | null;

  provider_user_id: string | null;
  reviewer_user_id: string | null;

  provider_name: string;
  reviewer_name: string;

  rating: number;
  comment: string | null;

  created_at: string;
  updated_at: string | null;
};

export type CreateReviewInput = {
  service_id?: string | null;
  request_id: string;

  provider_user_id: string;
  reviewer_user_id: string;

  provider_name: string;
  reviewer_name: string;

  rating: number;
  comment: string;
};

export type UpdateReviewInput = {
  rating: number;
  comment: string;
};

export type AppReview = {
  id: number;
  supabaseId: string;

  serviceId: string;
  requestId: string;

  providerUserId: string;
  reviewerUserId: string;

  providerName: string;
  reviewerName: string;

  rating: number;
  comment: string;

  date: string;
  createdAt: string;
  updatedAt: string;
};

export type ReviewStats = {
  providerUserId: string;

  reviewsCount: number;
  averageRating: number;

  fiveStars: number;
  fourStars: number;
  threeStars: number;
  twoStars: number;
  oneStar: number;
};

type SupabaseReviewStats = {
  provider_user_id: string;

  reviews_count: number | string | null;
  average_rating: number | string | null;

  five_stars: number | string | null;
  four_stars: number | string | null;
  three_stars: number | string | null;
  two_stars: number | string | null;
  one_star: number | string | null;
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

function requireUuid(
  value: string,
  fieldName: string
): void {
  if (!isValidUuid(value)) {
    throw new Error(
      `${fieldName} no contiene un UUID válido.`
    );
  }
}

function validateRating(
  rating: number
): void {
  if (
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  ) {
    throw new Error(
      "La calificación debe estar entre 1 y 5."
    );
  }
}

function createNumericId(
  uuid: string
): number {
  const hexadecimal =
    uuid
      .replace(/-/g, "")
      .slice(0, 12);

  const parsed =
    Number.parseInt(
      hexadecimal,
      16
    );

  if (
    Number.isFinite(parsed) &&
    parsed > 0
  ) {
    return parsed;
  }

  return Date.now();
}

function normalizeError(
  error: any
): Error {
  if (
    error?.code === "23505"
  ) {
    return new Error(
      "Esta solicitud ya tiene una reseña."
    );
  }

  if (
    error?.code === "42501"
  ) {
    return new Error(
      "No tienes permisos para realizar esta acción."
    );
  }

  return new Error(
    error?.message ||
      "Ocurrió un error con la reseña."
  );
}

export function canEditReview(
  review: Pick<
    SupabaseReview,
    "created_at"
  >
): boolean {
  const createdTime =
    new Date(
      review.created_at
    ).getTime();

  if (
    !Number.isFinite(
      createdTime
    )
  ) {
    return false;
  }

  const twentyFourHours =
    24 * 60 * 60 * 1000;

  return (
    Date.now() -
      createdTime <=
    twentyFourHours
  );
}

export function getReviewEditDeadline(
  review: Pick<
    SupabaseReview,
    "created_at"
  >
): Date | null {
  const createdTime =
    new Date(
      review.created_at
    ).getTime();

  if (
    !Number.isFinite(
      createdTime
    )
  ) {
    return null;
  }

  return new Date(
    createdTime +
      24 * 60 * 60 * 1000
  );
}

export async function getReviews(): Promise<
  SupabaseReview[]
> {
  const {
    data,
    error,
  } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw normalizeError(
      error
    );
  }

  return (
    data ?? []
  ) as SupabaseReview[];
}

export async function getReviewById(
  reviewId: string
): Promise<SupabaseReview | null> {
  requireUuid(
    reviewId,
    "reviewId"
  );

  const {
    data,
    error,
  } = await supabase
    .from("reviews")
    .select("*")
    .eq(
      "id",
      reviewId
    )
    .maybeSingle();

  if (error) {
    throw normalizeError(
      error
    );
  }

  return (
    data as SupabaseReview | null
  ) ?? null;
}

export async function getReviewsByProviderUserId(
  providerUserId: string
): Promise<SupabaseReview[]> {
  if (!providerUserId) {
    return [];
  }

  requireUuid(
    providerUserId,
    "providerUserId"
  );

  const {
    data,
    error,
  } = await supabase
    .from("reviews")
    .select("*")
    .eq(
      "provider_user_id",
      providerUserId
    )
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw normalizeError(
      error
    );
  }

  return (
    data ?? []
  ) as SupabaseReview[];
}

export async function getReviewsByReviewerUserId(
  reviewerUserId: string
): Promise<SupabaseReview[]> {
  if (!reviewerUserId) {
    return [];
  }

  requireUuid(
    reviewerUserId,
    "reviewerUserId"
  );

  const {
    data,
    error,
  } = await supabase
    .from("reviews")
    .select("*")
    .eq(
      "reviewer_user_id",
      reviewerUserId
    )
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw normalizeError(
      error
    );
  }

  return (
    data ?? []
  ) as SupabaseReview[];
}

export async function getReviewByRequestId(
  requestId: string
): Promise<SupabaseReview | null> {
  requireUuid(
    requestId,
    "requestId"
  );

  const {
    data,
    error,
  } = await supabase
    .from("reviews")
    .select("*")
    .eq(
      "request_id",
      requestId
    )
    .maybeSingle();

  if (error) {
    throw normalizeError(
      error
    );
  }

  return (
    data as SupabaseReview | null
  ) ?? null;
}

export async function getProviderReviewStats(
  providerUserId: string
): Promise<ReviewStats> {
  requireUuid(
    providerUserId,
    "providerUserId"
  );

  const {
    data,
    error,
  } = await supabase.rpc(
    "get_provider_review_stats",
    {
      p_provider_user_id:
        providerUserId,
    }
  );

  if (error) {
    throw normalizeError(
      error
    );
  }

  const rows =
    (data ?? []) as SupabaseReviewStats[];

  const row =
    rows[0];

  if (!row) {
    return {
      providerUserId,

      reviewsCount: 0,
      averageRating: 0,

      fiveStars: 0,
      fourStars: 0,
      threeStars: 0,
      twoStars: 0,
      oneStar: 0,
    };
  }

  return {
    providerUserId:
      row.provider_user_id ||
      providerUserId,

    reviewsCount:
      Number(
        row.reviews_count
      ) || 0,

    averageRating:
      Number(
        row.average_rating
      ) || 0,

    fiveStars:
      Number(
        row.five_stars
      ) || 0,

    fourStars:
      Number(
        row.four_stars
      ) || 0,

    threeStars:
      Number(
        row.three_stars
      ) || 0,

    twoStars:
      Number(
        row.two_stars
      ) || 0,

    oneStar:
      Number(
        row.one_star
      ) || 0,
  };
}

export async function createReviewInSupabase(
  input: CreateReviewInput
): Promise<SupabaseReview> {
  requireUuid(
    input.request_id,
    "request_id"
  );

  requireUuid(
    input.provider_user_id,
    "provider_user_id"
  );

  requireUuid(
    input.reviewer_user_id,
    "reviewer_user_id"
  );

  if (
    input.provider_user_id ===
    input.reviewer_user_id
  ) {
    throw new Error(
      "No puedes calificarte a ti mismo."
    );
  }

  validateRating(
    input.rating
  );

  if (
    input.service_id &&
    !isValidUuid(
      input.service_id
    )
  ) {
    throw new Error(
      "service_id no contiene un UUID válido."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("reviews")
    .insert([
      {
        service_id:
          input.service_id || null,

        request_id:
          input.request_id,

        provider_user_id:
          input.provider_user_id,

        reviewer_user_id:
          input.reviewer_user_id,

        provider_name:
          input.provider_name.trim(),

        reviewer_name:
          input.reviewer_name.trim(),

        rating:
          input.rating,

        comment:
          input.comment.trim() ||
          null,

        updated_at:
          new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    throw normalizeError(
      error
    );
  }

  return data as SupabaseReview;
}

export async function updateReviewInSupabase(
  reviewId: string,
  reviewerUserId: string,
  input: UpdateReviewInput
): Promise<SupabaseReview> {
  requireUuid(
    reviewId,
    "reviewId"
  );

  requireUuid(
    reviewerUserId,
    "reviewerUserId"
  );

  validateRating(
    input.rating
  );

  const existingReview =
    await getReviewById(
      reviewId
    );

  if (!existingReview) {
    throw new Error(
      "No se encontró la reseña."
    );
  }

  if (
    existingReview.reviewer_user_id !==
    reviewerUserId
  ) {
    throw new Error(
      "Solo el autor puede editar esta reseña."
    );
  }

  if (
    !canEditReview(
      existingReview
    )
  ) {
    throw new Error(
      "El plazo de 24 horas para editar esta reseña ya terminó."
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from("reviews")
    .update({
      rating:
        input.rating,

      comment:
        input.comment.trim() ||
        null,

      updated_at:
        new Date().toISOString(),
    })
    .eq(
      "id",
      reviewId
    )
    .eq(
      "reviewer_user_id",
      reviewerUserId
    )
    .select()
    .single();

  if (error) {
    throw normalizeError(
      error
    );
  }

  return data as SupabaseReview;
}

export function mapSupabaseReviewToAppReview(
  item: SupabaseReview
): AppReview {
  return {
    id:
      createNumericId(
        item.id
      ),

    supabaseId:
      item.id,

    serviceId:
      item.service_id ?? "",

    requestId:
      item.request_id ?? "",

    providerUserId:
      item.provider_user_id ?? "",

    reviewerUserId:
      item.reviewer_user_id ?? "",

    providerName:
      item.provider_name,

    reviewerName:
      item.reviewer_name,

    rating:
      Number(
        item.rating
      ) || 0,

    comment:
      item.comment ?? "",

    date:
      item.created_at
        ?.slice(0, 10) ?? "",

    createdAt:
      item.created_at,

    updatedAt:
      item.updated_at ||
      item.created_at,
  };
}