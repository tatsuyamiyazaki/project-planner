import React from 'react';
import { HomeIcon, FolderIcon, CalendarIcon, ChartBarIcon } from './Icons';

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
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, onItemClick }) => {
  return (
    <aside className="w-56 bg-gray-800 border-r border-gray-700 flex flex-col flex-shrink-0">
      <nav className="flex-1 py-4">
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
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
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
    </aside>
  );
};

export default Sidebar;
