
import React from 'react';
import { DashboardIcon, UsersIcon, CalendarIcon, CloseIcon, PostIcon, LeaveIcon, ReportIcon, DocumentChartBarIcon } from './Icons';
import type { View } from '../App';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isOpen, setIsOpen }) => {
  const navItems = [
    { id: 'dashboard', label: 'داشبورد', icon: DashboardIcon },
    { id: 'personnel', label: 'مدیریت پرسنل', icon: UsersIcon },
    { id: 'calendar', label: 'تقویم شیفت', icon: CalendarIcon },
    { id: 'posts', label: 'مدیریت پست‌ها', icon: PostIcon },
    { id: 'leaves', label: 'مدیریت مرخصی‌ها', icon: LeaveIcon },
    { id: 'analytics', label: 'تحلیل و بررسی', icon: DocumentChartBarIcon },
    { id: 'reports', label: 'گزارش‌ها', icon: ReportIcon },
    { id: 'status-report', label: 'گزارش وضعیت', icon: DocumentChartBarIcon },
  ];

  const handleNavClick = (view: View) => {
    setActiveView(view);
    setIsOpen(false);
  }

  return (
    <>
      <div 
        className={`fixed inset-0 bg-black bg-opacity-60 z-30 md:hidden transition-opacity print:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      ></div>
      <aside className={`fixed top-0 right-0 h-full bg-indigo-50 dark:bg-slate-800 w-64 p-4 z-40 transform transition-all duration-300 print:hidden md:border-l border-slate-200 dark:border-slate-700 ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0`}>
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-2xl font-bold text-indigo-600 dark:bg-clip-text dark:text-transparent dark:bg-gradient-to-r from-indigo-400 to-cyan-400">حراست</h2>
          <button className="md:hidden p-2 text-slate-500 dark:text-slate-300" onClick={() => setIsOpen(false)}>
            <CloseIcon className="w-6 h-6" />
          </button>
        </div>
        <nav>
          <ul>
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              const inactiveClasses = 'text-slate-600 dark:text-slate-300 hover:bg-indigo-100 dark:hover:bg-slate-700/50 hover:text-indigo-600 dark:hover:text-white';
              const activeClasses = 'bg-white text-indigo-600 dark:bg-gradient-to-r from-indigo-600 to-indigo-500 dark:text-white font-semibold shadow-sm dark:shadow-lg';
              
              return (
                <li key={item.id} className="mb-2">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(item.id as View);
                    }}
                    className={`flex items-center p-3 rounded-lg font-medium transition-colors duration-200 relative ${isActive ? activeClasses : inactiveClasses}`}
                  >
                    {isActive && <div className="absolute right-0 top-0 bottom-0 w-1 bg-indigo-500 dark:bg-cyan-400 rounded-r-full"></div>}
                    <item.icon className={`w-5 h-5 me-3 transition-transform ${isActive ? 'scale-110' : ''}`} />
                    <span>{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
