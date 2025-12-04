import React from 'react';
import { HomeIcon, FolderIcon, CalendarIcon, ChartBarIcon, SunIcon, MoonIcon } from './Icons';
import { useTheme } from '../contexts/ThemeContext';

export type MenuItemId = 'home' | 'projects' | 'timeline' | 'reports';

interface MenuItem {
  id: MenuItemId;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const menuItems: MenuItem[] = [
  { id: 'home', label: 'ホーム', icon: HomeIcon },
  { id: 'projects', label: 'プロジェクト', icon: FolderIcon },
  { id: 'timeline', label: 'タイムライン', icon: CalendarIcon },
  { id: 'reports', label: 'レポート', icon: ChartBarIcon },
];

interface SidebarProps {
  activeItem: MenuItemId;
  onItemClick: (id: MenuItemId) => void;
  extraContent?: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, onItemClick, extraContent }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0 transition-colors duration-200">
      <div className="px-4 py-4 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Project Planner</h1>
      </div>
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onItemClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {extraContent && (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          {extraContent}
        </div>
      )}

      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-colors"
          title={theme === 'dark' ? 'ライトモードに切り替え' : 'ダークモードに切り替え'}
        >
          {theme === 'dark' ? (
            <>
              <SunIcon className="w-5 h-5 text-yellow-400" />
            </>
          ) : (
            <>
              <MoonIcon className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
