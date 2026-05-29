import { supabase } from "./supabase";

export type SupabaseRequest = {
  id: string;
  service_id: string | null;
  service_name: string;
  provider_name: string;
  requester_name: string;
  credits: number;
  status: "pending" | "completed" | "cancelled";
  created_at: string;
};

export type CreateRequestInput = {
  service_id: string;
  service_name: string;
  provider_name: string;
  requester_name: string;
  credits: number;
};

export async function getRequests() {
  const { data, error } = await supabase
    .from("service_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data as SupabaseRequest[];
}

export async function createRequestInSupabase(input: CreateRequestInput) {
  const { data, error } = await supabase
    .from("service_requests")
    .insert([
      {
        service_id: input.service_id,
        service_name: input.service_name,
        provider_name: input.provider_name,
        requester_name: input.requester_name,
        credits: input.credits,
        status: "pending",
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SupabaseRequest;
}

export async function updateRequestStatus(
  requestId: string,
  status: "pending" | "completed" | "cancelled"
) {
  const { data, error } = await supabase
    .from("service_requests")
    .update({ status })
    .eq("id", requestId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SupabaseRequest;
}

export function mapSupabaseRequestToAppRequest(item: SupabaseRequest) {
  return {
    id: Number(item.id.replace(/\D/g, "").slice(0, 10)) || Date.now(),
    supabaseId: item.id,
    serviceId: item.service_id || "",
    serviceName: item.service_name,
    providerName: item.provider_name,
    requesterName: item.requester_name,
    credits: item.credits,
    status: item.status,
    date: item.created_at.slice(0, 10),
  };
}