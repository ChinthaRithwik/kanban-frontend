import React from 'react';

const CursorLayer = ({ cursors }) => {
  return (
    <>
      {Object.entries(cursors).map(([user, pos]) => (
        <div
          key={user}
          className="fixed pointer-events-none z-[9998]"
          style={{
            left: pos.x,
            top:  pos.y,
            transition: 'left 0.08s ease-out, top 0.08s ease-out',
          }}
        >
          {/* Cursor SVG arrow */}
          <svg
            width="20" height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="absolute -left-1 -top-1 drop-shadow"
          >
            <path
              d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.86a.5.5 0 00-.85.35z"
              fill="#3B82F6"
            />
            <path
              d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 01.35-.15h6.87c.45 0 .67-.54.35-.85L6.35 2.86a.5.5 0 00-.85.35z"
              stroke="white"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>

          {/* Name label — offset far enough from the arrow tip to never overlap dragged card */}
          <div
            className="absolute text-[11px] font-semibold bg-blue-500 text-white
              px-2 py-0.5 rounded-md shadow-md whitespace-nowrap
              pointer-events-none select-none"
            style={{
              left: 18,   /* push right past the arrow */
              top:  16,   /* push below the arrow tip  */
            }}
          >
            {user}
          </div>
        </div>
      ))}
    </>
  );
};

export default CursorLayer;
