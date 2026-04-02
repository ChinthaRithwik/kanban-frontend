import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard } from 'lucide-react';
import { getCurrentUser } from '../../api/userApi';
import { AvatarWithTooltip } from '../common/Avatar';

const Navbar = () => {
  const { logout }  = useContext(AuthContext);
  const navigate    = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    getCurrentUser()
      .then(res => setUser({ name: res?.data?.name ?? res?.name, email: res?.data?.email ?? res?.email }))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="
      bg-white/95 backdrop-blur-sm
      border-b border-gray-200
      px-6 py-3 flex justify-between items-center
      shadow-[0_1px_3px_0_rgb(0,0,0,0.06)]
      z-30 relative shrink-0
    ">
      {/* Logo */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center gap-2 group"
      >
        <div className="bg-blue-600 text-white p-1.5 rounded-lg
          group-hover:bg-blue-700 transition-colors duration-200 shadow-sm">
          <LayoutDashboard size={18} />
        </div>
        <span className="text-lg font-extrabold text-gray-800 tracking-tight
          group-hover:text-blue-600 transition-colors duration-200">
          KanbanFlow
        </span>
      </button>

      {/* Right side */}
      <div className="flex items-center gap-2.5">
        {user?.name && (
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl
            bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors">
            <AvatarWithTooltip name={user.name} size="xs" tooltipContent={user.email} />
            <span className="text-sm font-semibold text-gray-700">{user.name}</span>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="
            flex items-center gap-1.5 text-gray-500 hover:text-gray-800
            hover:bg-gray-100 px-3 py-1.5 rounded-xl
            font-semibold text-sm transition-all duration-200
          "
        >
          <LogOut size={15} />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
