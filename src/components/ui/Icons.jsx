export function IconBase({ children, size = 22, strokeWidth = 2, style }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", overflow: "visible", ...style }}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function BellIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6.002 6.002 0 0 0-4-5.659V4a2 2 0 1 0-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5" />
      <path d="M9 17a3 3 0 0 0 6 0" />
    </IconBase>
  );
}

export function ChatIcon(props) {
  return (
    <IconBase {...props}>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </IconBase>
  );
}

export function SettingsIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-1.41 3.41h-0.2a1.65 1.65 0 0 0-1.58 1.12 2 2 0 0 1-3.8 0 1.65 1.65 0 0 0-1.58-1.12H10a2 2 0 0 1-1.41-3.41l.06-.06A1.65 1.65 0 0 0 9 15.4a1.65 1.65 0 0 0-1.82-.33l-.06.06A2 2 0 0 1 3.7 13.7v-.2A1.65 1.65 0 0 0 2.58 11.9a2 2 0 0 1 0-3.8A1.65 1.65 0 0 0 3.7 6.6v-.2A2 2 0 0 1 6.1 4.59l.06.06A1.65 1.65 0 0 0 7.98 5a1.65 1.65 0 0 0 1.4-1.06l.02-.08A2 2 0 0 1 11.3 2h.4a2 2 0 0 1 1.9 1.86l.02.08A1.65 1.65 0 0 0 15.02 5a1.65 1.65 0 0 0 1.82-.33l.06-.06A2 2 0 0 1 19.41 6.1v.2A1.65 1.65 0 0 0 20.53 8.1a2 2 0 0 1 0 3.8A1.65 1.65 0 0 0 19.41 13.7v.2A1.65 1.65 0 0 0 19.4 15z" />
    </IconBase>
  );
}

export function LoginIcon(props) {
  // arrow into bracket
  return (
    <IconBase {...props}>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
    </IconBase>
  );
}

export function LogoutIcon(props) {
  // arrow out of bracket
  return (
    <IconBase {...props}>
      <path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4" />
      <path d="M14 17l5-5-5-5" />
      <path d="M19 12H7" />
    </IconBase>
  );
}

// ====== CATEGORY ICONS (SVG) ======
export function CatIcon({ name, size = 28, color = "currentColor" }) {
  const common = { size, style: { color } };

  switch (name) {
    case "law":
      return (
        <IconBase {...common}>
          <path d="M6 21h12" />
          <path d="M12 3v18" />
          <path d="M7 7h10" />
          <path d="M8 7l-3 5h6l-3-5z" />
          <path d="M16 7l-3 5h6l-3-5z" />
        </IconBase>
      );
    case "health":
      return (
        <IconBase {...common}>
          <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.5-7 10-7 10z" />
          <path d="M12 10v4" />
          <path d="M10 12h4" />
        </IconBase>
      );
    case "restaurant":
      return (
        <IconBase {...common}>
          <path d="M4 3v7" />
          <path d="M6 3v7" />
          <path d="M5 10v11" />
          <path d="M13 3v8" />
          <path d="M13 11c0 3 2 3 2 3v7" />
          <path d="M17 3v8c0 3-2 3-2 3" />
        </IconBase>
      );
    case "realestate":
      return (
        <IconBase {...common}>
          <path d="M3 11l9-7 9 7" />
          <path d="M5 10v11h14V10" />
          <path d="M9 21v-6h6v6" />
        </IconBase>
      );
    case "autoservice":
      return (
        <IconBase {...common}>
          <path d="M6 9l2-4h8l2 4" />
          <path d="M5 9h14l-1 8H6L5 9z" />
          <path d="M7 17v2" />
          <path d="M17 17v2" />
          <circle cx="8" cy="13" r="1" />
          <circle cx="16" cy="13" r="1" />
        </IconBase>
      );
    case "salon":
      return (
        <IconBase {...common}>
          <path d="M4 20c2-6 6-6 8-10" />
          <path d="M12 10c2 4 6 4 8 10" />
          <path d="M8 6l8 8" />
          <path d="M16 6l-8 8" />
        </IconBase>
      );
    case "barber":
      return (
        <IconBase {...common}>
          <path d="M8 3v18" />
          <path d="M16 3v18" />
          <path d="M8 7h8" />
          <path d="M8 11h8" />
          <path d="M8 15h8" />
        </IconBase>
      );
    case "rental":
      return (
        <IconBase {...common}>
          <path d="M7 17l5-5 5 5" />
          <path d="M12 12V3" />
          <path d="M4 21h16" />
        </IconBase>
      );
    case "dealership":
      return (
        <IconBase {...common}>
          <path d="M3 20h18" />
          <path d="M5 20V8l7-4 7 4v12" />
          <path d="M9 20v-6h6v6" />
        </IconBase>
      );
    case "market":
      return (
        <IconBase {...common}>
          <path d="M6 6h15l-1.5 8H8L6 6z" />
          <path d="M6 6l-2-2" />
          <circle cx="9" cy="18" r="1" />
          <circle cx="18" cy="18" r="1" />
        </IconBase>
      );
    case "education":
      return (
        <IconBase {...common}>
          <path d="M3 8l9-4 9 4-9 4-9-4z" />
          <path d="M7 10v6c0 1 5 3 5 3s5-2 5-3v-6" />
        </IconBase>
      );
    case "handyman":
      return (
        <IconBase {...common}>
          <path d="M14 7l3 3" />
          <path d="M7 14l-3 3" />
          <path d="M10 10l4 4" />
          <path d="M9 21l3-3" />
          <path d="M3 21l6-6" />
        </IconBase>
      );
    case "cleaning":
      return (
        <IconBase {...common}>
          <path d="M7 21h10" />
          <path d="M9 21V7h6v14" />
          <path d="M8 7l1-4h6l1 4" />
        </IconBase>
      );
    default:
      return (
        <IconBase {...common}>
          <circle cx="12" cy="12" r="8" />
        </IconBase>
      );
  }
}
