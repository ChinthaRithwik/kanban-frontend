import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';

/* ─── Color palette ─────────────────────────────────────────────── */
const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-blue-500',
  'bg-emerald-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-orange-500',
];

export function getAvatarColor(name = '') {
  const code = name ? name.charCodeAt(0) : 0;
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

export function getInitials(name = '') {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

/* ─── Avatar ─────────────────────────────────────────────────────
   Pure visual primitive — no tooltip logic here.
   For tooltip support use <AvatarWithTooltip />.               */
const Avatar = ({ name = '', size = 'md', ring = false, className = '' }) => (
  <div
    className={`
      flex items-center justify-center rounded-full
      text-white font-semibold select-none shrink-0
      ${SIZE_CLASSES[size] ?? SIZE_CLASSES.md}
      ${getAvatarColor(name)}
      ${ring ? 'ring-2 ring-white' : ''}
      ${className}
    `}
  >
    {getInitials(name)}
  </div>
);

/* ─── Portal tooltip ─────────────────────────────────────────────
   Renders above the avatar using position:fixed computed from
   getBoundingClientRect — fully escapes any parent overflow.    */
const TOOLTIP_OFFSET = 8; // px gap between avatar top and tooltip bottom

const AvatarTooltipPortal = ({ anchorRef, children }) => {
  const [pos, setPos] = useState(null);
  const [visible, setVisible] = useState(false);

  const computePos = useCallback(() => {
    if (!anchorRef.current) return;
    const r = anchorRef.current.getBoundingClientRect();
    setPos({
      // Centre horizontally on the avatar
      left: r.left + r.width / 2,
      // Place bottom of tooltip just above the avatar top
      bottom: window.innerHeight - r.top + TOOLTIP_OFFSET,
    });
  }, [anchorRef]);

  // Small delay lets the layout settle before measuring (avoids
  // the first-frame flash at wrong position).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      computePos();
      setVisible(true);
    });
    return () => cancelAnimationFrame(id);
  }, [computePos]);

  if (!pos) return null;

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        left: pos.left,
        bottom: pos.bottom,
        transform: 'translateX(-50%)',
        zIndex: 99999,
        // Entrance: slide up 4 px + fade in
        opacity:   visible ? 1 : 0,
        translate:  visible ? '0 0' : '0 4px',
        transition: 'opacity 140ms ease, translate 140ms ease',
        pointerEvents: 'none',
      }}
    >
      {children}
    </div>,
    document.body
  );
};

/* ─── AvatarWithTooltip ──────────────────────────────────────────
   Drop-in replacement for the old Avatar+title pattern.
   Hover lifts the WRAPPER (translateY + scale) so the stacked
   layout is not disturbed. Tooltip renders via portal.          */
export const AvatarWithTooltip = ({
  name = '',
  size = 'md',
  ring = false,
  className = '',
  tooltipContent,   // optional JSX / string; falls back to `name`
  stacked = false,  // true → negative-margin stacking mode
}) => {
  const [hovered, setHovered] = useState(false);
  const wrapperRef = useRef(null);

  const label = tooltipContent ?? name;

  return (
    <div
      ref={wrapperRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        // Lift + subtle scale on hover — applied to the wrapper so the
        // ring, green dot, etc. all move together without layout jitter
        transform: hovered ? 'translateY(-2px) scale(1.08)' : 'translateY(0) scale(1)',
        transition: 'transform 150ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        // Elevate over siblings in stacked layouts while hovered
        zIndex: hovered ? 20 : undefined,
        position: 'relative',
        display: 'inline-flex',
      }}
    >
      <Avatar name={name} size={size} ring={ring} className={className} />

      {hovered && label && (
        <AvatarTooltipPortal anchorRef={wrapperRef}>
          <div className="
            bg-gray-900 text-white text-xs font-medium
            px-2.5 py-1.5 rounded-lg shadow-lg
            whitespace-nowrap
          ">
            {typeof label === 'string'
              ? <span>{label}</span>
              : label
            }
          </div>
        </AvatarTooltipPortal>
      )}
    </div>
  );
};

export default Avatar;
