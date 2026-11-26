import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Analytics,
  AssistantResponse,
  Delivery,
  DeliveryInput,
  DeliveryListQuery,
  PaginatedData,
  RiskResult,
} from "@smart-logistics/shared";
import { api } from "../lib/api";

export function useAnalytics() {
  return useQuery<Analytics>({
    queryKey: ["analytics"],
    queryFn: () => api.get<Analytics>("/analytics"),
  });
}

export function useDeliveries(query: DeliveryListQuery) {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  if (query.carrier) params.set("carrier", query.carrier);
  if (query.q) params.set("q", query.q);
  params.set("page", String(query.page));
  params.set("pageSize", String(query.pageSize));
  return useQuery<PaginatedData<Delivery>>({
    queryKey: ["deliveries", query],
    queryFn: () => api.get<PaginatedData<Delivery>>(`/deliveries?${params.toString()}`),
  });
}

export function useDelivery(id: string | undefined) {
  return useQuery<Delivery>({
    queryKey: ["delivery", id],
    queryFn: () => api.get<Delivery>(`/deliveries/${id}`),
    enabled: Boolean(id),
  });
}

export function useCreateDelivery() {
  const qc = useQueryClient();
  return useMutation<Delivery, Error, DeliveryInput>({
    mutationFn: (input) => api.post<Delivery>("/deliveries", input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deliveries"] }),
  });
}

export function usePrediction() {
  return useMutation<RiskResult, Error, { deliveryId: string }>({
    mutationFn: (body) => api.post<RiskResult>("/predictions", body),
  });
}

export function useAssistant() {
  return useMutation<AssistantResponse, Error, { question: string }>({
    mutationFn: (body) => api.post<AssistantResponse>("/assistant", body),
  });
}
