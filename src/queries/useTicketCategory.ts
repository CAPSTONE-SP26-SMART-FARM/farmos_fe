import { QUERY_KEYS } from "@/constants";
import type {
  CreateTicketCategoryBodyType,
  ListTicketCategoriesQueryType,
  ToggleTicketCategoryBodyType,
  UpdateTicketCategoryBodyType,
} from "@/schemaValidatation/ticketCategory";
import ticketCategoryService from "@/services/ticketCategoryService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const useAdminTicketCategoryList = (
  query: ListTicketCategoriesQueryType,
  enabled = true,
) => {
  return useQuery({
    queryKey: QUERY_KEYS.ticketCategories.adminList(query),
    queryFn: () => ticketCategoryService.adminList(query),
    enabled,
  });
};

export const useAdminTicketCategoryDetail = (id: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.ticketCategories.adminDetail(id),
    queryFn: () => ticketCategoryService.adminDetail(id),
    enabled: enabled && Boolean(id),
  });
};

export const useActiveTicketCategoryList = (enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.ticketCategories.activeList(),
    queryFn: () => ticketCategoryService.activeList(),
    enabled,
  });
};

export const useCreateTicketCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTicketCategoryBodyType) =>
      ticketCategoryService.create(body),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.ticketCategories.root,
      });
    },
  });
};

export const useUpdateTicketCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdateTicketCategoryBodyType;
    }) => ticketCategoryService.update(id, body),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ticketCategories.root });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.ticketCategories.adminDetail(id),
      });
    },
  });
};

export const useToggleTicketCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: ToggleTicketCategoryBodyType;
    }) => ticketCategoryService.toggle(id, body),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.ticketCategories.root });
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.ticketCategories.adminDetail(id),
      });
    },
  });
};
