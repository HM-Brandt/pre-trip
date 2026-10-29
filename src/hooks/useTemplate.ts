import { useQuery } from "@tanstack/react-query";
import { api } from "./apiConfig";
import type { Template } from "../types";

const queryTemplate = (): Promise<Template> => {
  return api
    .get(`v2/maintenance/checklist/template/1`)
    .then((response) => response.data);
};

export function useGetTemplate() {
  return useQuery({
    queryKey: ["template"],
    queryFn: queryTemplate,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });
}
