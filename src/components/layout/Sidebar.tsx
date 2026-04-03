import React from 'react';
import { NavLink } from 'react-router-dom';
import { Image, BookImage, Users, Map, Folder, Trash2, Settings } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';

const Sidebar: React.FC = () => {
  const { isSidebarCollapsed } = useUiStore();

  const navItems = [
    { to: '/gallery', icon: Image, label: 'Galería' },
    { to: '/albums', icon: BookImage, label: 'Álbumes' },
    { to: '/faces', icon: Users, label: 'Personas' },
    { to: '/map', icon: Map, label: 'Mapa' },
    { to: '/directories', icon: Folder, label: 'Directorios' },
    { to: '/trash', icon: Trash2, label: 'Papelera' },
  ];

  return (
    <aside className={`flex flex-col bg-[var(--bg-secondary)] border-r border-[var(--border)] transition-all duration-150 h-full ${isSidebarCollapsed ? 'w-0 overflow-hidden border-none' : 'w-[var(--sidebar-width)]'}`}>
      <nav className="flex-1 py-4 flex flex-col items-center gap-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-12 h-12 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors ${
                isActive ? 'bg-[var(--accent-subtle)] !text-[var(--accent)]' : ''
              }`
            }
            title={item.label}
          >
            <item.icon size={20} />
            <span className="text-[9px] mt-1 font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="py-4 flex flex-col items-center gap-4">
        <button
          className="w-12 h-12 flex items-center justify-center rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors"
          title="Configuración"
        >
          <Settings size={20} />
        </button>

        {/* Owner Avatar Placeholder */}
        <div 
          className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] border-2 border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] font-bold cursor-pointer hover:border-[var(--accent)] transition-colors"
          title="Perfil"
        >
          US
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
