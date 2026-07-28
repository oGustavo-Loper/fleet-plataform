import { useMemo } from "react";
import { useQuery } from "@apollo/client/react";
import type { TenantSummary } from "@fleet/shared-types";

import { useAuth } from "../contexts/AuthContext";
import { TENANT_QUERY } from "../lib/queries";

export function useTenant() {
  const { auth } = useAuth();
  const { data, loading, error } = useQuery<{ tenant: TenantSummary | null }>(TENANT_QUERY, {
    skip: !auth?.tenantId,
    variables: {
      id: auth?.tenantId ?? ""
    },
    fetchPolicy: "network-only"
  });

  const activeTenant = useMemo(() => data?.tenant ?? null, [data?.tenant]);

  return {
    tenants: activeTenant ? [activeTenant] : [],
    activeTenant,
    loading,
    error
  };
}
