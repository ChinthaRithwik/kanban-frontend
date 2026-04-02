import React from 'react';
import { useNavigate } from 'react-router-dom';

const BoardCard = ({ board }) => {
  const navigate = useNavigate();

  return (
    <div 
      onClick={() => navigate(`/boards/${board.id}`)}
      className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-200 p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 group relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
      <h3 className="text-lg font-bold text-gray-800 mb-2 truncate">{board.name}</h3>
      <p className="text-sm text-gray-500 mb-4 line-clamp-2">{board.description || 'No description provided.'}</p>
      
      <div className="flex justify-between items-center mt-auto pt-4 border-t border-gray-100">
        <span className="text-xs font-semibold text-gray-400 uppercase">Kanban Board</span>
        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
          →
        </div>
      </div>
    </div>
  );
};

export default BoardCard;
