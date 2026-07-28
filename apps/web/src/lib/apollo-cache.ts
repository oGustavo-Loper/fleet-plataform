import type { ApolloCache, DocumentNode } from "@apollo/client";

type QueryListShape<TItem> = Record<string, TItem[]>;

export function appendQueryListItem<TItem>({
  cache,
  query,
  variables,
  field,
  item
}: {
  cache: ApolloCache<unknown>;
  query: DocumentNode;
  variables: Record<string, unknown>;
  field: string;
  item: TItem;
}) {
  cache.updateQuery<QueryListShape<TItem>>({ query, variables }, (current) => {
    if (!current) {
      return current;
    }

    const currentItems = current[field] ?? [];
    return {
      ...current,
      [field]: [item, ...currentItems]
    };
  });
}

export function upsertQueryListItem<TItem extends { id: string }>({
  cache,
  query,
  variables,
  field,
  item
}: {
  cache: ApolloCache<unknown>;
  query: DocumentNode;
  variables: Record<string, unknown>;
  field: string;
  item: TItem;
}) {
  cache.updateQuery<QueryListShape<TItem>>({ query, variables }, (current) => {
    if (!current) {
      return current;
    }

    const currentItems = current[field] ?? [];
    const existingIndex = currentItems.findIndex((entry) => entry.id === item.id);
    const nextItems = [...currentItems];

    if (existingIndex >= 0) {
      nextItems[existingIndex] = item;
    } else {
      nextItems.unshift(item);
    }

    return {
      ...current,
      [field]: nextItems
    };
  });
}

export function removeQueryListItem({
  cache,
  query,
  variables,
  field,
  id
}: {
  cache: ApolloCache<unknown>;
  query: DocumentNode;
  variables: Record<string, unknown>;
  field: string;
  id: string;
}) {
  cache.updateQuery<QueryListShape<{ id: string }>>({ query, variables }, (current) => {
    if (!current) {
      return current;
    }

    return {
      ...current,
      [field]: (current[field] ?? []).filter((item) => item.id !== id)
    };
  });
}
