import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UserCircleIcon,
  ChartPieIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const toggleProfileMenu = () => setShowProfileMenu(!showProfileMenu);

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/dashboard" className="flex items-center">
              <img src="/logo-placeholder.png" alt="Wyzer Logo" className="h-8 w-8" />
              <span className="ml-2 text-xl font-semibold text-text">Wyzer</span>
            </Link>
            
            <div className="hidden md:flex ml-10 space-x-8">
              <Link to="/dashboard" className="text-text hover:text-primary transition-colors px-3 py-2 rounded-md">
                Dashboard
              </Link>
              <Link to="/transactions" className="text-text hover:text-primary transition-colors px-3 py-2 rounded-md">
                Transactions
              </Link>
              <Link to="/categories" className="text-text hover:text-primary transition-colors px-3 py-2 rounded-md">
                Categories
              </Link>
              <Link to="/reports" className="text-text hover:text-primary transition-colors px-3 py-2 rounded-md">
                Reports
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            <div className="relative">
              <button
                onClick={toggleProfileMenu}
                className="flex items-center text-text hover:text-primary transition-colors"
              >
                <UserCircleIcon className="h-8 w-8" />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-text hover:bg-primary hover:bg-opacity-10 transition-colors"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-text hover:bg-primary hover:bg-opacity-10 transition-colors"
                  >
                    Settings
                  </Link>
                  <hr className="my-1" />
                  <Link
                    to="/logout"
                    className="block px-4 py-2 text-text hover:bg-primary hover:bg-opacity-10 transition-colors"
                  >
                    Logout
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
