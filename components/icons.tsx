/** Inline SVG icons (stroke-based), ported from the prototype. */
type P = { className?: string };
const base = (props: P) => ({
  className: props.className ?? "icon",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
});

export const DashboardIcon = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);

export const ProjectsIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
  </svg>
);

export const TasksIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 11l2 2 4-4" />
    <rect x="3" y="4" width="18" height="16" rx="2" />
  </svg>
);

export const UsersIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
    <path d="M16 6.5a3 3 0 0 1 0 6" />
    <path d="M17.5 19a5 5 0 0 0-3-4.6" />
  </svg>
);

export const ProfileIcon = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="9" r="3.2" />
    <circle cx="12" cy="12" r="9" />
    <path d="M5.5 19a6.6 6.6 0 0 1 13 0" />
  </svg>
);

export const LogoutIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M15 12H4m0 0l3.5-3.5M4 12l3.5 3.5" />
    <path d="M13 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" />
  </svg>
);

export const SearchIcon = (p: P) => (
  <svg {...base(p)} strokeWidth={1.8}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3-3" />
  </svg>
);

export const EditIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 20h4L18 10l-4-4L4 16z" />
    <path d="M14 6l4 4" />
  </svg>
);

export const TrashIcon = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 7h14M9 7V5h6v2m-8 0 1 13h8l1-13" />
  </svg>
);
