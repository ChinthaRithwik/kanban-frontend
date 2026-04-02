import React from 'react';
import { AvatarWithTooltip } from '../common/Avatar';

const PresenceBar = ({ users = [] }) => {
  if (!users.length) return null;

  return (
    <div className="flex items-center gap-3 py-2">
      {/* Green dot + count */}
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
        <span className="text-xs font-semibold text-gray-500">
          {users.length} online
        </span>
      </div>

      {/* Avatar row */}
      <div className="flex items-center gap-1.5">
        {users.map((user, idx) => {
          const displayName = user.name || user.username || user.email || '?';

          // Tooltip: name + email if both present
          const tooltipContent = (user.email && (user.name || user.username))
            ? (
              <div>
                <div>{user.name || user.username}</div>
                <div className="text-gray-400 text-[10px] mt-0.5">{user.email}</div>
              </div>
            )
            : displayName;

          return (
            <div key={idx} className="relative">
              <AvatarWithTooltip
                name={displayName}
                size="sm"
                ring
                tooltipContent={tooltipContent}
              />
              {/* Online green dot */}
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-green-500
                rounded-full ring-1 ring-white pointer-events-none" />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PresenceBar;
