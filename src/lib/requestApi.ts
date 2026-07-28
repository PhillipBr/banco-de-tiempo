import { supabase } from "./supabase";

export type RequestStatus =
  | "pending"
  | "completed"
  | "cancelled";

export type SupabaseRequest = {
  id: string;

  service_id: string | null;
  service_name: string;

  provider_user_id: string | null;
  requester_user_id: string | null;

  provider_name: string;
  requester_name: string;

  credits: number;
  status: RequestStatus;

  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
};

export type CreateRequestInput = {
  service_id: string;

  service_name: string;

  provider_user_id: string;
  requester_user_id: string;

  provider_name: string;
  requester_name: string;

  credits: number;
};

export type AppRequest = {
  id: number;
  supabaseId: string;

  serviceId: string;
  serviceName: string;

  providerUserId: string;
  requesterUserId: string;

  providerName: string;
  requesterName: string;

  credits: number;
  status: RequestStatus;

  date: string;
  completedAt?: string;
  cancelledAt?: string;
};

function createNumericId(uuid: string): number {
  const hexadecimal = uuid
    .replace(/-/g, "")
    .slice(0, 12);

  const parsed = Number.parseInt(
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

export async function getRequests(): Promise<
  SupabaseRequest[]
> {
  const { data, error } = await supabase
    .from("service_requests")
    .select("*")
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as SupabaseRequest[];
}

export async function getRequestsByUserId(
  userId: string
): Promise<SupabaseRequest[]> {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("service_requests")
    .select("*")
    .or(
      `provider_user_id.eq.${userId},requester_user_id.eq.${userId}`
    )
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return (data ?? []) as SupabaseRequest[];
}

export async function getRequestById(
  requestId: string
): Promise<SupabaseRequest | null> {
  const { data, error } = await supabase
    .from("service_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (
    (data as SupabaseRequest | null) ??
    null
  );
}

export async function createRequestInSupabase(
  input: CreateRequestInput
): Promise<SupabaseRequest> {
  if (!input.service_id) {
    throw new Error(
      "El servicio no tiene un ID válido."
    );
  }

  if (!input.provider_user_id) {
    throw new Error(
      "No se encontró el usuario proveedor."
    );
  }

  if (!input.requester_user_id) {
    throw new Error(
      "No se encontró el usuario solicitante."
    );
  }

  if (
    input.provider_user_id ===
    input.requester_user_id
  ) {
    throw new Error(
      "No puedes solicitar tu propio servicio."
    );
  }

  if (
    !Number.isFinite(input.credits) ||
    input.credits <= 0
  ) {
    throw new Error(
      "La cantidad de créditos debe ser mayor que cero."
    );
  }

  const { data, error } = await supabase
    .from("service_requests")
    .insert([
      {
        service_id: input.service_id,

        service_name:
          input.service_name.trim(),

        provider_user_id:
          input.provider_user_id,

        requester_user_id:
          input.requester_user_id,

        provider_name:
          input.provider_name.trim(),

        requester_name:
          input.requester_name.trim(),

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
  status: RequestStatus
): Promise<SupabaseRequest> {
  const payload: {
    status: RequestStatus;
    completed_at?: string | null;
    cancelled_at?: string | null;
  } = {
    status,
  };

  if (status === "completed") {
    payload.completed_at =
      new Date().toISOString();

    payload.cancelled_at = null;
  }

  if (status === "cancelled") {
    payload.cancelled_at =
      new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("service_requests")
    .update(payload)
    .eq("id", requestId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as SupabaseRequest;
}

export async function cancelRequestInSupabase(
  requestId: string
): Promise<SupabaseRequest> {
  const { data, error } =
    await supabase.rpc(
      "cancel_service_request",
      {
        p_request_id: requestId,
      }
    );

  if (error) {
    throw error;
  }

  return data as SupabaseRequest;
}

export function mapSupabaseRequestToAppRequest(
  item: SupabaseRequest
): AppRequest {
  return {
    id: createNumericId(item.id),

    supabaseId: item.id,

    serviceId:
      item.service_id ?? "",

    serviceName:
      item.service_name,

    providerUserId:
      item.provider_user_id ?? "",

    requesterUserId:
      item.requester_user_id ?? "",

    providerName:
      item.provider_name,

    requesterName:
      item.requester_name,

    credits:
      Number(item.credits) || 0,

    status:
      item.status,

    date:
      item.created_at?.slice(0, 10) ??
      "",

    completedAt:
      item.completed_at ??
      undefined,

    cancelledAt:
      item.cancelled_at ??
      undefined,
  };
}