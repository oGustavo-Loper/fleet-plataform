import { useEffect, useMemo, useState } from "react";

type UsePaginatedItemsOptions<TItem> = {
  items: TItem[];
  pageSize: number;
  resetDependencies?: ReadonlyArray<unknown>;
};

export function usePaginatedItems<TItem>({
  items,
  pageSize,
  resetDependencies = []
}: UsePaginatedItemsOptions<TItem>) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const pagedItems = useMemo(
    () => items.slice((page - 1) * pageSize, page * pageSize),
    [items, page, pageSize]
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, resetDependencies);

  return {
    page,
    setPage,
    totalPages,
    pagedItems
  };
}
