/** Marker colors players can choose. Markers are drawn at MARKER_OPACITY so the number shows through. */
export const MARKER_COLORS = [
  { id: '#ff5d73', name: 'Coral' },
  { id: '#e5383b', name: 'Red' },
  { id: '#ff8a1f', name: 'Orange' },
  { id: '#ffc94a', name: 'Gold' },
  { id: '#9be15d', name: 'Lime' },
  { id: '#22c55e', name: 'Green' },
  { id: '#14b8a6', name: 'Teal' },
  { id: '#38bdf8', name: 'Sky' },
  { id: '#3b82f6', name: 'Blue' },
  { id: '#6366f1', name: 'Indigo' },
  { id: '#a855f7', name: 'Purple' },
  { id: '#ec4899', name: 'Pink' },
] as const;

export const MARKER_OPACITY = 0.55;
export const DEFAULT_MARKER = MARKER_COLORS[0].id;
