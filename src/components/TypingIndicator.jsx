import React from "react";

const TypingIndicator = ({ users = [] }) => {
  if (!users || !users.length) return null;

  return (
    <div className="text-sm text-gray-500 px-2 py-1 italic animate-pulse">
      {users.join(", ")} {users.length === 1 ? "is" : "are"} typing...
    </div>
  );
};

export default TypingIndicator;
