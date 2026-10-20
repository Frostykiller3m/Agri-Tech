const drawings = {
  dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  farms: <><path d="M3 20c8 0 15-5 17-16C10 4 5 9 5 16" /><path d="M3 21c4-5 8-8 13-11" /></>,
  resources: <><path d="m3 7 9-4 9 4-9 4-9-4Z" /><path d="M3 7v10l9 4 9-4V7M12 11v10" /></>,
  cart: <><path d="M3 3h2l2.5 12h11l2-8H6" /><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></>,
  orders: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4.5h6M8 10h8M8 14h8M8 18h5" /></>,
  forum: <><path d="M4 5h16v11H9l-5 4V5Z" /><path d="M8 9h8M8 12h5" /></>,
  consultations: <><path d="M4 5h16v12H9l-5 3V5Z" /><path d="M8 9h8M8 13h5" /></>,
  alerts: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" /></>,
  admin: <><circle cx="12" cy="12" r="3" /><path d="m19.4 15 .1.1 1.4 1.1-1.5 2.6-1.7-.7a8 8 0 0 1-1.6.9l-.3 1.8h-3l-.3-1.8a8 8 0 0 1-1.6-.9l-1.7.7-1.5-2.6 1.4-1.1A7 7 0 0 1 8.8 13l-1.7-.8v-3l1.8-.3a8 8 0 0 1 .9-1.6L9 5.6 11.6 4l1.1 1.4a8 8 0 0 1 1.8 0L15.6 4l2.6 1.5-.7 1.7a8 8 0 0 1 .9 1.6l1.8.3v3l-1.7.8a7 7 0 0 1-.1 2.1Z" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  back: <><path d="m14 5-7 7 7 7M7 12h14" /></>,
  arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
  check: <><path d="m5 12 4 4L19 6" /></>,
  login: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M13 4h6a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6" /></>,
  logout: <><path d="M14 17l5-5-5-5M19 12H7" /><path d="M11 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0M19 8v6M16 11h6" /></>,
};

function ActionIcon({ name, className = '' }) {
  return (
    <svg className={`action-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {drawings[name] || drawings.check}
    </svg>
  );
}

export default ActionIcon;
