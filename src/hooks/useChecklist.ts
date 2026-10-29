import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "./apiConfig";
import type { Checklist } from "../types";

const saveChecklist = async ({ data }: { data: Checklist }) => {
  return api.post(`v2/maintenance/checklist`, data);
};

export function useSaveChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveChecklist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist"] });
    },
  });
}
