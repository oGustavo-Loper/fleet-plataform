import type { CSSProperties } from "react";
import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { DriverListItem, UserRole } from "@fleet/shared-types";

import { useAuth } from "../contexts/AuthContext";
import { useTenant } from "../hooks/useTenant";
import { DRIVERS_QUERY } from "../lib/queries";
import { resolveMediaUrl } from "../lib/media";
import { planLabel } from "../lib/plans";

type NavLink = {
  to: string;
  label: string;
  roles?: UserRole[];
};

const links: NavLink[] = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/vehicles", label: "Veículos", roles: ["ADMIN", "COMPANY", "INDIVIDUAL"] },
  { to: "/drivers", label: "Motoristas", roles: ["ADMIN", "COMPANY", "INDIVIDUAL"] },
  { to: "/fuels", label: "Abastecimentos" },
  { to: "/maintenance", label: "Manutenções" },
  { to: "/reports", label: "Relatórios" },
  { to: "/team", label: "Equipe", roles: ["ADMIN", "MANAGER"] },
  { to: "/plans", label: "Planos" },
  { to: "/super-admin", label: "Todas as contas", roles: ["SUPER_ADMIN"] }
];

export function AppNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const { auth, isAuthenticated, logout } = useAuth();
  const { activeTenant } = useTenant();
  const driversQuery = useQuery<{ drivers: DriverListItem[] }>(DRIVERS_QUERY, {
    skip: !auth?.tenantId || !auth?.driverId,
    variables: { tenantId: auth?.tenantId ?? "" }
  });
  const ownDriver = driversQuery.data?.drivers.find((driver) => driver.id === auth?.driverId);
  const hasPendingCnh = Boolean(auth?.driverId && ownDriver && !ownDriver.cnh);
  const publicPaths = new Set(["/", "/landing", "/login", "/first-access", "/plans", "/register/company", "/register/individual", "/billing/checkout"]);
  const visibleLinks = links.filter((link) => {
    if (!auth) {
      return false;
    }

    if (auth.role === "DRIVER") {
      return ["/dashboard", "/fuels", "/maintenance"].includes(link.to);
    }

    if (link.roles) {
      return link.roles.includes(auth.role);
    }

    return true;
  });

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const update = () => {
      setIsDesktop(media.matches);
      setOpen(media.matches);
    };

    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const shouldReserveSidebarSpace =
      isDesktop && isAuthenticated && !publicPaths.has(location.pathname);
    document.body.style.paddingLeft = shouldReserveSidebarSpace ? "320px" : "0";
    document.body.style.transition = "padding-left 180ms ease";

    return () => {
      document.body.style.paddingLeft = "0";
    };
  }, [isAuthenticated, isDesktop, location.pathname]);

  useEffect(() => {
    const shouldReserveTopSpace =
      !isDesktop && isAuthenticated && !publicPaths.has(location.pathname);
    document.body.style.paddingTop = shouldReserveTopSpace ? "5.5rem" : "0";

    return () => {
      document.body.style.paddingTop = "0";
    };
  }, [isAuthenticated, isDesktop, location.pathname]);

  useEffect(() => {
    if (isDesktop || !open) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDesktop, open]);

  if (!isAuthenticated || publicPaths.has(location.pathname)) {
    return null;
  }

  return (
    <>
      {!isDesktop ? (
        <>
          <div style={mobileTopBarStyle}>
            <button
              type="button"
              className="app-sidebar-control"
              style={toggleButtonStyle}
              onClick={() => setOpen((current) => !current)}
            >
              <span style={toggleLineStyle} />
              <span style={toggleLineStyle} />
              <span style={toggleLineStyle} />
            </button>
            <div style={mobileBrandStyle}>
              <strong style={mobileBrandTitleStyle}>Fleet Platform</strong>
              <span style={mobileBrandBadgeStyle}>Beta</span>
            </div>
          </div>
          {open ? <div style={overlayStyle} onClick={() => setOpen(false)} /> : null}
        </>
      ) : null}
      <aside
        className="app-sidebar"
        style={{
          ...sidebarStyle,
          transform: isDesktop ? "translateX(0)" : open ? "translateX(0)" : "translateX(-108%)",
          width: isDesktop ? "320px" : "min(320px, 88vw)"
        }}
      >
        <div style={sidebarHeaderStyle}>
          {ownDriver?.photoDataUrl || activeTenant?.photoDataUrl ? (
            <img
              src={resolveMediaUrl(ownDriver?.photoDataUrl ?? activeTenant?.photoDataUrl)}
              alt={ownDriver?.fullName ?? activeTenant?.name}
              style={tenantAvatarStyle}
            />
          ) : (
            <div style={tenantAvatarFallbackStyle}>{activeTenant?.name?.slice(0, 1).toUpperCase() ?? "F"}</div>
          )}
          <div style={tenantInfoStyle}>
            <p style={sidebarEyebrowStyle}>Fleet Platform</p>
            <span style={betaBadgeStyle}>Beta</span>
            <p style={tenantMetaStyle}>
              {activeTenant?.accountType === "INDIVIDUAL" ? "Pessoa física" : "Empresa"}
            </p>
            <strong>{activeTenant?.name ?? "Conta"}</strong>
          </div>
        </div>
        <nav style={linksStyle}>
          {visibleLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="app-sidebar-link"
              aria-current={location.pathname === link.to ? "page" : undefined}
              onClick={() => setOpen(false)}
              style={{
                ...linkStyle,
                ...(location.pathname === link.to ? activeLinkStyle : null)
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div style={userBoxStyle}>
          <span>
            {auth?.fullName} • {auth?.email}
          </span>
          {auth?.driverId ? (
            <Link
              to="/profile"
              className="app-sidebar-control"
              style={profileLinkStyle}
              onClick={() => setOpen(false)}
            >
              Meu perfil
              {hasPendingCnh ? (
                <span
                  style={pendingDotStyle}
                  title="Dados da CNH pendentes — complete seu perfil"
                />
              ) : null}
            </Link>
          ) : null}
          {activeTenant?.accountType === "INDIVIDUAL" ? (
            <span style={planBadgeStyle}>
              {planLabel(activeTenant.planCode)} •{" "}
              {activeTenant.vehicleLimit ? `${activeTenant.vehicleLimit} veículos` : "Ilimitado"}
            </span>
          ) : auth?.role === "DRIVER" ? (
            <span style={planBadgeStyle}>Perfil Motorista</span>
          ) : (
            <span style={planBadgeStyle}>{planLabel(activeTenant?.planCode)}</span>
          )}
        </div>
          <button
            type="button"
            className="app-sidebar-control"
            style={logoutButtonStyle}
            onClick={() => {
              setOpen(false);
              logout();
              navigate("/landing", { replace: true });
            }}
          >
            Sair
        </button>
      </aside>
    </>
  );
}

const toggleButtonStyle: CSSProperties = {
  border: "1px solid rgba(148, 163, 184, 0.18)",
  background: "rgba(15, 23, 42, 0.92)",
  width: "3rem",
  height: "3rem",
  borderRadius: "999px",
  display: "grid",
  placeItems: "center",
  gap: "0.2rem",
  padding: "0.7rem",
  outline: "none",
  boxShadow: "none",
  WebkitTapHighlightColor: "transparent"
};

const toggleLineStyle: CSSProperties = {
  width: "100%",
  height: 2,
  background: "#f8fafc",
  display: "block"
};

const overlayStyle: CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(2, 6, 23, 0.55)",
  zIndex: 31
};

const mobileTopBarStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 28,
  display: "grid",
  gridTemplateColumns: "3rem 1fr 3rem",
  alignItems: "center",
  gap: "0.75rem",
  padding: "0.9rem 1rem 0.75rem",
  background: "rgba(2, 6, 23, 0.92)",
  backdropFilter: "blur(18px)",
  borderBottom: "1px solid rgba(148, 163, 184, 0.12)"
};

const mobileBrandStyle: CSSProperties = {
  display: "grid",
  justifyItems: "center",
  gap: "0.18rem",
  textAlign: "center"
};

const mobileBrandTitleStyle: CSSProperties = {
  fontSize: "0.95rem",
  letterSpacing: "0.03em"
};

const mobileBrandBadgeStyle: CSSProperties = {
  display: "inline-flex",
  padding: "0.18rem 0.48rem",
  borderRadius: "999px",
  background: "rgba(251, 191, 36, 0.14)",
  color: "#fbbf24",
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.12em"
};

const sidebarStyle: CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  bottom: 0,
  width: "min(320px, 88vw)",
  padding: "5rem 1rem 1.25rem",
  background: "linear-gradient(180deg, #0b1120 0%, #101827 100%)",
  borderRight: "1px solid rgba(148, 163, 184, 0.16)",
  zIndex: 35,
  transition: "transform 180ms ease",
  display: "flex",
  flexDirection: "column",
  overflowY: "auto",
  overscrollBehavior: "contain",
  WebkitOverflowScrolling: "touch"
};

const sidebarHeaderStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  alignItems: "center",
  textAlign: "center"
};

const tenantInfoStyle: CSSProperties = {
  display: "grid",
  gap: "0.25rem",
  justifyItems: "center"
};

const tenantAvatarStyle: CSSProperties = {
  width: "76px",
  height: "76px",
  borderRadius: "24px",
  objectFit: "cover",
  border: "1px solid rgba(148, 163, 184, 0.18)"
};

const tenantAvatarFallbackStyle: CSSProperties = {
  ...tenantAvatarStyle,
  display: "grid",
  placeItems: "center",
  background: "rgba(251, 191, 36, 0.14)",
  color: "#fbbf24",
  fontWeight: 800
};

const sidebarEyebrowStyle: CSSProperties = {
  margin: 0,
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  fontSize: "0.7rem",
  color: "#fbbf24"
};

const betaBadgeStyle: CSSProperties = {
  display: "inline-flex",
  padding: "0.18rem 0.5rem",
  borderRadius: "999px",
  background: "rgba(56, 189, 248, 0.14)",
  color: "#7dd3fc",
  fontSize: "0.7rem",
  textTransform: "uppercase",
  letterSpacing: "0.14em"
};

const tenantMetaStyle: CSSProperties = {
  margin: "0.4rem 0 0",
  color: "#94a3b8"
};

const closeButtonStyle: CSSProperties = {
  borderRadius: "999px",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  background: "transparent",
  color: "#f8fafc",
  padding: "0.5rem 0.75rem"
};

const linksStyle: CSSProperties = {
  display: "grid",
  gap: "0.75rem",
  marginTop: "1.5rem"
};

const linkStyle: CSSProperties = {
  padding: "0.9rem 1rem",
  borderRadius: "1rem",
  background: "rgba(15, 23, 42, 0.56)",
  border: "1px solid rgba(148, 163, 184, 0.18)",
  color: "#cbd5e1",
  outline: "none",
  boxShadow: "none",
  WebkitTapHighlightColor: "transparent"
};

const activeLinkStyle: CSSProperties = {
  color: "#0f172a",
  background: "#fbbf24",
  borderColor: "#fbbf24"
};

const userBoxStyle: CSSProperties = {
  display: "grid",
  gap: "0.5rem",
  color: "#cbd5e1",
  marginTop: "auto",
  paddingTop: "1.5rem",
  justifyItems: "center",
  textAlign: "center"
};

const profileLinkStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
  color: "#94a3b8",
  fontSize: "0.82rem",
  textDecoration: "underline",
  textUnderlineOffset: "0.2rem"
};

const pendingDotStyle: CSSProperties = {
  width: "0.5rem",
  height: "0.5rem",
  borderRadius: "999px",
  background: "#fbbf24",
  display: "inline-block"
};

const planBadgeStyle: CSSProperties = {
  display: "inline-flex",
  width: "fit-content",
  padding: "0.35rem 0.6rem",
  borderRadius: "999px",
  background: "rgba(251, 191, 36, 0.12)",
  color: "#fbbf24",
  fontSize: "0.82rem"
};

const logoutButtonStyle: CSSProperties = {
  borderRadius: "1rem",
  border: "1px solid rgba(248, 250, 252, 0.16)",
  background: "transparent",
  color: "#f8fafc",
  padding: "0.8rem 0.95rem",
  marginTop: "0.75rem",
  outline: "none",
  boxShadow: "none",
  WebkitTapHighlightColor: "transparent"
};
