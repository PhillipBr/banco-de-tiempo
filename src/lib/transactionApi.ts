import { supabase } from "./supabase";

export type TransactionStatus =
  | "pending"
  | "completed"
  | "cancelled";

export type SupabaseTransaction = {
  id: string;

  request_id: string;
  service_id: string | null;

  provider_user_id: string;
  requester_user_id: string;

  provider_name: string;
  requester_name: string;

  service_name: string;

  hours: number;
  status: TransactionStatus;

  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
};

export type AppTransaction = {
  id: string;

  requestId: string;
  serviceId: string;

  providerUserId: string;
  requesterUserId: string;

  providerName: string;
  requesterName: string;

  serviceName: string;

  hours: number;
  status: TransactionStatus;

  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
};

export type TransactionHistoryItem = {
  id: string;

  type: "earned" | "spent";

  description: string;

  credits: number;

  date: string;

  serviceName: string;

  otherPerson: string;

  status: TransactionStatus;
};

export async function getTransactionsByUserId(
  userId: string
): Promise<SupabaseTransaction[]> {
  if (!userId) {
    return [];
  }

  const { data, error } = await supabase
    .from("transactions")
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

  return (
    data ?? []
  ) as SupabaseTransaction[];
}

export async function getTransactionByRequestId(
  requestId: string
): Promise<SupabaseTransaction | null> {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("request_id", requestId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (
    (data as SupabaseTransaction | null) ??
    null
  );
}

export async function completeRequestTransaction(
  requestId: string
): Promise<SupabaseTransaction> {
  if (!requestId) {
    throw new Error(
      "La solicitud no tiene un ID válido."
    );
  }

  const { data, error } =
    await supabase.rpc(
      "complete_service_request",
      {
        p_request_id: requestId,
      }
    );

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error(
      "Supabase no devolvió la transacción creada."
    );
  }

  return data as SupabaseTransaction;
}

export function mapSupabaseTransactionToAppTransaction(
  item: SupabaseTransaction
): AppTransaction {
  return {
    id: item.id,

    requestId:
      item.request_id,

    serviceId:
      item.service_id ?? "",

    providerUserId:
      item.provider_user_id,

    requesterUserId:
      item.requester_user_id,

    providerName:
      item.provider_name,

    requesterName:
      item.requester_name,

    serviceName:
      item.service_name,

    hours:
      Number(item.hours) || 0,

    status:
      item.status,

    createdAt:
      item.created_at,

    completedAt:
      item.completed_at ??
      undefined,

    cancelledAt:
      item.cancelled_at ??
      undefined,
  };
}

export function mapTransactionToHistoryItem(
  transaction: SupabaseTransaction,
  currentUserId: string
): TransactionHistoryItem {
  const isProvider =
    transaction.provider_user_id ===
    currentUserId;

  const transactionDate =
    transaction.completed_at ||
    transaction.created_at;

  return {
    id: transaction.id,

    type: isProvider
      ? "earned"
      : "spent",

    description: isProvider
      ? `Ayudaste a ${transaction.requester_name}`
      : `Recibiste ayuda de ${transaction.provider_name}`,

    credits:
      Number(transaction.hours) || 0,

    date:
      transactionDate.slice(0, 10),

    serviceName:
      transaction.service_name,

    otherPerson: isProvider
      ? transaction.requester_name
      : transaction.provider_name,

    status:
      transaction.status,
  };
}