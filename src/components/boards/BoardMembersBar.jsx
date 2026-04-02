import React from 'react';
import { AvatarWithTooltip } from '../common/Avatar';

const BoardMembersBar = ({ members = [], isAdmin, onInviteClick }) => {
  const MAX_VISIBLE = 4;

  // Safety-net dedup — state should already be deduplicated upstream
  const uniqueMembers = Array.from(
    new Map(
      (members || []).map(m => [String(m.user_id ?? m.userId ?? ''), m])
    ).values()
  ).filter(m => (m.user_id ?? m.userId) != null);

  const visible  = uniqueMembers.slice(0, MAX_VISIBLE);
  const overflow = uniqueMembers.length - MAX_VISIBLE;

  return (
    <div className="flex items-center gap-2">
      {/* Stacked avatar row */}
      <div className="flex items-center -space-x-2">
        {visible.map((member, idx) => {
          const displayName = member.name || member.username || '?';

          // Rich tooltip: name + email + role
          const tooltipContent = (
            <div>
              <div className="font-semibold">{displayName}</div>
              {member.email && (
                <div className="text-gray-400 text-[10px] mt-0.5">{member.email}</div>
              )}
              {member.role && (
                <div className="text-violet-300 text-[10px] capitalize mt-0.5">
                  {member.role.toLowerCase()}
                </div>
              )}
            </div>
          );

          return (
            <AvatarWithTooltip
              key={`member-${String(member.user_id ?? member.userId)}-${idx}`}
              name={displayName}
              size="md"
              ring
              stacked
              tooltipContent={tooltipContent}
            />
          );
        })}

        {/* Overflow badge */}
        {overflow > 0 && (
          <AvatarWithTooltip
            name=""
            size="md"
            ring
            stacked
            tooltipContent={`${overflow} more member${overflow > 1 ? 's' : ''}`}
            // Override the avatar visually with the +N badge via className trick
            className="!bg-gray-200 !text-gray-600 !text-xs"
          />
        )}
      </div>

      {/* Invite button */}
      {isAdmin && (
        <button
          type="button"
          onClick={onInviteClick}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg
            bg-violet-600 hover:bg-violet-700 active:bg-violet-800
            text-white text-xs font-semibold transition-colors duration-150
            focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-1
            whitespace-nowrap shadow-sm"
        >
          <span aria-hidden="true">+</span> Invite
        </button>
      )}
    </div>
  );
};

export default BoardMembersBar;