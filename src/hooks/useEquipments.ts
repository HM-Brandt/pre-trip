import { useQuery } from "@tanstack/react-query";
import type { EquipmentDetail } from "../types";
import { api } from "./apiConfig";

const queryGetEquipmentById = (id: number): Promise<EquipmentDetail> => {
  return api.get(`v1/equipment/${id}`).then((response) => response.data);
};

export function useGetEquipmentById(id: number) {
  return useQuery({
    // ¡AQUÍ ESTÁ LA CORRECCIÓN! Agregar el id a la key
    queryKey: ["equipments", "details", id],
    queryFn: () => queryGetEquipmentById(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });
}
