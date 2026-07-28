import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { useLocation } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import { useTenant } from "../hooks/useTenant";
import { getSeenNotificationIds, setSeenNotificationIds } from "../lib/notifications";
import { NOTIFICATIONS_QUERY } from "../lib/queries";

const publicPaths = new Set(["/", "/landing", "/login", "/first-access", "/plans", "/register/company", "/register/individual", "/billing/checkout"]);

export function NotificationsCenter() {
  const location = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [toastItems, setToastItems] = useState<Array<{ id: string; title: string; severity: string }>>([]);
  const [toastShownIds, setToastShownIds] = useState<string[]>([]);
  const { auth, isAuthenticated } = useAuth();
  const { activeTenant } = useTenant();
  const notificationPanelRef = useRef<HTMLDivElement | null>(null);
  const shouldPollNotifications = Boolean(isAuthenticated && activeTenant?.id && auth?.userId !== undefined && auth?.role !== "DRIVER");
  const notificationsQuery = useQuery<{
    notifications: Array<{ id: string; title: string; severity: string; createdAt: string }>;
  }>(NOTIFICATIONS_QUERY, {
    skip: !shouldPollNotifications,
    pollInterval: 15000,
    fetchPolicy: "network-only",
    variables: {
      tenantId: activeTenant?.id ?? ""
    }
  });
  const notifications = notificationsQuery.data?.notifications ?? [];
  const seenIds = useMemo(
    () => (auth?.userId && auth?.tenantId ? getSeenNotificationIds(auth.userId, auth.tenantId) : []),
    [auth?.tenantId, auth?.userId, notifications]
  );
  const unreadNotifications = notifications.filter((item) => !seenIds.includes(item.id));

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!notificationPanelRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }

    if (!notificationsOpen) {
      return;
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [notificationsOpen]);

  useEffect(() => {
    if (!isDesktop || !auth?.userId || !auth.tenantId || notifications.length === 0) {
      return;
    }

    const fresh = notifications.filter((item) => !toastShownIds.includes(item.id));
    if (fresh.length === 0) {
      return;
    }

    setToastItems((current) => {
      const next = [...fresh.map((item) => ({ id: item.id, title: item.title, severity: item.severity })), ...current];
      return next.slice(0, 3);
    });
    setToastShownIds((current) => [...new Set([...current, ...fresh.map((item) => item.id)])]);
  }, [auth?.tenantId, auth?.userId, isDesktop, notifications, toastShownIds]);

  useEffect(() => {
    if (!isDesktop || toastItems.length === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setToastItems((current) => current.slice(0, -1));
    }, 4500);

    return () => window.clearTimeout(timer);
  }, [toastItems]);

  if (!isAuthenticated || publicPaths.has(location.pathname) || auth?.role === "DRIVER") {
    return null;
  }

  return (
    <>
      <div style={isDesktop ? floatingWrapperStyle : mobileWrapperStyle} ref={notificationPanelRef}>
        <button
          type="button"
          style={notificationButtonStyle}
          onClick={() => {
            setNotificationsOpen((current) => !current);
            if (auth?.userId && auth.tenantId) {
              setSeenNotificationIds(auth.userId, auth.tenantId, notifications.map((item) => item.id));
            }
          }}
        >
          <span style={bellIconStyle}>🔔</span>
          {unreadNotifications.length > 0 ? (
            <span style={notificationBadgeStyle}>{unreadNotifications.length}</span>
          ) : null}
        </button>
        {notificationsOpen ? (
          <div style={notificationPanelStyle}>
            <div style={panelHeaderStyle}>
              <strong style={{ fontSize: "0.95rem" }}>Notificações</strong>
              <span style={panelSubtitleStyle}>Últimos abastecimentos</span>
            </div>
            {notifications.length > 0 ? (
              notifications.map((item) => (
                <article key={item.id} style={notificationItemStyle}>
                  <p style={notificationTitleStyle}>{item.title}</p>
                  <span style={notificationTimeStyle}>
                    {new Date(item.createdAt).toLocaleString("pt-BR")}
                  </span>
                </article>
              ))
            ) : (
              <p style={notificationEmptyStyle}>Nenhuma notificação recente.</p>
            )}
          </div>
        ) : null}
      </div>
      {isDesktop ? (
        <div style={toastStackStyle}>
          {toastItems.map((item) => (
            <div
              key={item.id}
              style={{
                ...toastStyle,
                borderColor: item.severity === "critical" ? "rgba(248, 113, 113, 0.35)" : "rgba(56, 189, 248, 0.35)"
              }}
            >
              <strong style={{ display: "block", marginBottom: "0.25rem" }}>Novo abastecimento</strong>
              <span style={{ color: "#cbd5e1" }}>{item.title}</span>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}

const floatingWrapperStyle: CSSProperties = {
  position: "fixed",
  top: "1.35rem",
  right: "1.25rem",
  zIndex: 45
};

const mobileWrapperStyle: CSSProperties = {
  position: "fixed",
  top: "0.9rem",
  right: "1rem",
  zIndex: 30
};

const notificationButtonStyle: CSSProperties = {
  width: "3.2rem",
  height: "3.2rem",
  borderRadius: "999px",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  background: "rgba(15, 23, 42, 0.9)",
  color: "#f8fafc",
  display: "grid",
  placeItems: "center",
  position: "relative",
  boxShadow: "0 16px 32px rgba(15, 23, 42, 0.28)"
};

const bellIconStyle: CSSProperties = {
  fontSize: "1.1rem"
};

const notificationBadgeStyle: CSSProperties = {
  position: "absolute",
  top: "-0.1rem",
  right: "-0.1rem",
  minWidth: "1.45rem",
  height: "1.45rem",
  borderRadius: "999px",
  display: "grid",
  placeItems: "center",
  background: "#fbbf24",
  color: "#0f172a",
  fontWeight: 800,
  fontSize: "0.75rem",
  padding: "0 0.3rem"
};

const notificationPanelStyle: CSSProperties = {
  position: "absolute",
  top: "calc(100% + 0.65rem)",
  right: 0,
  width: "min(380px, calc(100vw - 2rem))",
  maxHeight: "min(70vh, 560px)",
  overflowY: "auto",
  padding: "0.85rem",
  borderRadius: "1rem",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  background: "#0f172a",
  boxShadow: "0 18px 34px rgba(15, 23, 42, 0.36)",
  display: "grid",
  gap: "0.65rem"
};

const panelHeaderStyle: CSSProperties = {
  display: "grid",
  gap: "0.2rem"
};

const panelSubtitleStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: "0.82rem"
};

const notificationItemStyle: CSSProperties = {
  padding: "0.8rem",
  borderRadius: "0.9rem",
  background: "rgba(15, 23, 42, 0.72)",
  border: "1px solid rgba(148, 163, 184, 0.14)",
  display: "grid",
  gap: "0.35rem"
};

const notificationTitleStyle: CSSProperties = {
  margin: 0,
  color: "#e2e8f0"
};

const notificationTimeStyle: CSSProperties = {
  color: "#94a3b8",
  fontSize: "0.8rem"
};

const notificationEmptyStyle: CSSProperties = {
  margin: 0,
  color: "#94a3b8"
};

const toastStackStyle: CSSProperties = {
  position: "fixed",
  right: "1rem",
  bottom: "1rem",
  display: "grid",
  gap: "0.75rem",
  zIndex: 60
};

const toastStyle: CSSProperties = {
  width: "min(360px, calc(100vw - 2rem))",
  padding: "0.95rem 1rem",
  borderRadius: "1rem",
  border: "1px solid rgba(56, 189, 248, 0.35)",
  background: "rgba(15, 23, 42, 0.96)",
  boxShadow: "0 18px 38px rgba(15, 23, 42, 0.38)"
};
