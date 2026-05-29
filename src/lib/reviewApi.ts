import { supabase } from "./supabase";

export type SupabaseReview = {
  id: string;
  service_id: string | null;
  provider_name: string;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type CreateReviewInput = {
  service_id: string;
  provider_name: string;
  reviewer_name: string;
  rating: number;
  comment: string;
};

export async function getReviews() {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data as SupabaseReview[];
}

export async function createReviewInSupabase(input: CreateReviewInput) {
  const { data, error } = await supabase
    .from("reviews")
    .insert([
      {
        service_id: input.service_id,
        provider_name: input.provider_name,
        reviewer_name: input.reviewer_name,
        rating: input.rating,
        comment: input.comment,
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SupabaseReview;
}

export function mapSupabaseReviewToAppReview(item: SupabaseReview) {
  return {
    id: Number(item.id.replace(/\D/g, "").slice(0, 10)) || Date.now(),
    supabaseId: item.id,
    serviceId: item.service_id || "",
    providerName: item.provider_name,
    reviewerName: item.reviewer_name,
    rating: item.rating,
    comment: item.comment || "",
    date: item.created_at.slice(0, 10),
  };
}