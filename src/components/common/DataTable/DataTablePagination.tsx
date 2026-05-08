import { useSearchParams } from "react-router";
import ProPagination from "@/components/common/pro-pagination";

interface DataTablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  rowCount: number;
  pageParam?: string;
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalItems,
  rowCount,
  pageParam = "page",
}: DataTablePaginationProps) {
  const [searchParam] = useSearchParams();

  return (
    <div className="flex items-center justify-end space-x-2 py-4">
      <div className="text-xs text-muted-foreground py-4 flex-1">
        Hiển thị <strong>{rowCount}</strong> / <strong>{totalItems}</strong> kết
        quả
      </div>
      {totalPages > 1 && (
        <div>
          <ProPagination
            currentPage={currentPage}
            totalPages={totalPages}
            buildHref={(p) => {
              const params = new URLSearchParams(searchParam);
              if (p) params.set(pageParam, String(p));
              else params.delete(pageParam);
              return {
                pathname: location.pathname,
                search: params.toString(),
              };
            }}
          />
        </div>
      )}
    </div>
  );
}

export default DataTablePagination;
