import type { Table } from "@tanstack/react-table";

type ParsedFilter = {
  id: string;
  value: unknown;
  variant?: string;
  options?: { label: string; value: string }[];
};

export const parsedFilters = <TData>(table: Table<TData>): ParsedFilter[] => {
  const filters = table.getState().columnFilters;
  const sortFilters = table.getState().sorting;
  console.log("🚀 ~ parsedFilters ~ sortFilters:", sortFilters);

  return filters.map((filter) => {
    const column = table.getColumn(filter.id);

    return {
      id: filter.id,
      value: filter.value,
      variant: column?.columnDef?.meta?.variant,
      options: column?.columnDef?.meta?.options,
    };
  });
};

export function buildFilterQueryParams(filters: ParsedFilter[]): URLSearchParams {
  const params = new URLSearchParams();

  filters.forEach(({ id, value, variant }) => {
    if (value === undefined || value === null) return;

    // 🔹 Skip empty arrays
    if (Array.isArray(value) && value.length === 0) return;

    switch (variant) {
      // 🔸 Text / Search
      case "text":
      case "number":
        params.append(id, String(value));
        break;

      // 🔸 Select (single value but UI may send array)
      case "select":
        if (Array.isArray(value)) {
          // Dice UI sometimes returns array for select
          params.append(`${id}`, String(value));
        } else {
          params.append(`${id}`, String(value));
        }
        break;

      // 🔸 Multi Select
      case "multiSelect":
        params.append(id, String(value));
        break;

      // 🔸 Date
      case "date":
        params.append(id, String(value));
        break;

      // 🔸 Date / Number Range
      case "dateRange":
        if (Array.isArray(value)) {
          params.append(`[${id}][from]`, String(value?.[0]));
          params.append(`[${id}][to]`, String(value?.[1]));
        }

        break;

      case "range":
        if (Array.isArray(value)) {
          params.append(`[${id}][from]`, String(value?.[0]));
          params.append(`[${id}][to]`, String(value?.[1]));
        }

        break;

      // 🔸 Fallback (safe auto-detect)
      default:
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(`filters[${id}]`, String(v)));
        } else if (typeof value === "object") {
          Object.entries(value).forEach(([k, v]) => {
            if (v != null) {
              params.append(`filters[${id}][${k}]`, String(v));
            }
          });
        } else {
          params.append(`filters[${id}]`, String(value));
        }
    }
  });

  return params;
}

export function cleanFilters<T extends Record<string, unknown>>(filters: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== null && value !== "";
    })
  ) as Partial<T>;
}
