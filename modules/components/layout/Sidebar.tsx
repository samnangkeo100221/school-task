import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  GraduationCap,
  Users,
  School,
  BookOpen,
  CalendarCheck,
  CalendarRange,
  BookMarked,
  FileText,
  UserCheck,
  RotateCcw,
  BarChart3,
  Settings,
  BookCopy,
  Award
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface SidebarProps {
  isOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onCloseMobile }) => {
  const { schoolSettings } = useApp();

  const navItems = [
    { to: '/', label: 'ផ្ទាំងគ្រប់គ្រងការបង្រៀន', icon: LayoutDashboard, badge: null },
    { to: '/timetable', label: 'កាលវិភាគបង្រៀន (១៦ ម៉ោង)', icon: CalendarDays, badge: '៨ក-៨ឃ' },
    { to: '/class-curriculum', label: 'កម្មវិធីសិក្សាតាមថ្នាក់ (៨ក-៨ឃ)', icon: BookCopy, badge: 'តាមកាលវិភាគ' },
    { to: '/curriculum', label: 'កម្មវិធីសិក្សាគណិតវិទ្យា', icon: BookMarked, badge: '៣៨ សប្តាហ៍' },
    { to: '/lesson-plans', label: 'កិច្ចតែងការបង្រៀន ៥ ជំហាន', icon: FileText, badge: 'MoEYS' },
    { to: '/attendance', label: 'ស្រង់អវត្តមានសិស្សប្រចាំថ្ងៃ', icon: UserCheck, badge: 'ប្រចាំថ្ងៃ' },
    { to: '/student-tests', label: 'កត់ត្រាតេស្តសិស្សប្រចាំថ្ងៃ', icon: Award, badge: 'ពិន្ទុតេស្ត' },
    { to: '/students', label: 'បញ្ជីសិស្សតាមថ្នាក់', icon: Users, badge: null },
    { to: '/makeup-lessons', label: 'ម៉ោងបង្រៀនសង', icon: RotateCcw, badge: null },
    { to: '/calendar', label: 'ប្រតិទិនសាលា និងបុណ្យជាតិ', icon: CalendarCheck, badge: null },
    { to: '/reports', label: 'របាយការណ៍បង្រៀន', icon: BarChart3, badge: null },
    { to: '/settings', label: 'ការកំណត់', icon: Settings, badge: null },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white/95 dark:bg-slate-950/95 warm:bg-[#fffdf9]/95 backdrop-blur-md border-r border-slate-200/80 dark:border-slate-800/80 warm:border-[#dfd4bf] flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* App Brand Header */}
        <div className="p-4 border-b border-slate-200/70 dark:border-slate-800/80 warm:border-[#dfd4bf] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-700 to-slate-800 dark:from-indigo-600 dark:to-blue-600 warm:from-[#92400e] warm:to-[#b45309] flex items-center justify-center text-white shadow-xs">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-wide text-slate-900 dark:text-slate-100 warm:text-[#2b251f] leading-tight">
                MY SCHOOL TASK
              </h1>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 warm:text-[#b45309] font-medium truncate max-w-[170px]">
                {schoolSettings?.schoolNameKm || 'វិទ្យាល័យ ហ៊ុន សែន បាត់ដឹង'}
              </p>
            </div>
          </div>
        </div>

        {/* Solo Teacher Profile Badge */}
        <div className="px-4 py-3 bg-slate-50/60 dark:bg-slate-900/60 warm:bg-[#f7f3e9]/80 border-b border-slate-200/70 dark:border-slate-800/80 warm:border-[#dfd4bf]">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 warm:bg-[#b45309] text-white font-bold flex items-center justify-center text-xs shadow-xs">
              ស
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 warm:text-[#2b251f] truncate">
                លោកគ្រូ កែវ សំណាង
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-100/70 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 warm:bg-[#eee6d3] warm:text-[#78350f]">
                  គណិតវិទ្យា ថ្នាក់ទី៨
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  គ្រប់គ្រង
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors group ${
                    isActive
                      ? 'bg-indigo-600 dark:bg-indigo-600 warm:bg-[#b45309] text-white shadow-xs font-bold'
                      : 'text-slate-600 dark:text-slate-300 warm:text-[#524a3e] hover:bg-slate-100/70 dark:hover:bg-slate-900/60 warm:hover:bg-[#eee6d3] hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-white/20 text-white group-hover:bg-indigo-100 group-hover:text-indigo-700 dark:group-hover:bg-indigo-900/40">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 text-center">
          <p>ប្រព័ន្ធគ្រប់គ្រងការងារសិក្សា ២០២៥-២០២៦</p>
          <p className="mt-0.5 font-medium text-slate-500 dark:text-slate-400">វិទ្យាល័យ ហ៊ុន សែន បាត់ដឹង</p>
        </div>
      </aside>
    </>
  );
};
