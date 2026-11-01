import { APP_VERSION, APP_RELEASE_NAME } from '../../version';
import React from 'react';
import { Menu, Sparkles, Sun, Moon, Calendar, User, Shield, Bell } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

interface NavbarProps {
  onToggleMobile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobile }) => {
  const {
    currentUser,
    activeAcademicYear,
    academicYears,
    setActiveAcademicYearId,
    theme,
    toggleTheme,
    schoolSettings
  } = useApp();

  // Khmer Date Display
  const getKhmerDateString = () => {
    const daysKm = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍'];
    const monthsKm = [
      'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
      'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
    ];
    const toKhmerNumber = (num: number) => {
      const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
      return num.toString().split('').map(d => khmerDigits[parseInt(d, 10)] || d).join('');
    };

    const now = new Date();
    const dayName = daysKm[now.getDay()];
    const dateNum = toKhmerNumber(now.getDate());
    const monthName = monthsKm[now.getMonth()];
    const yearNum = toKhmerNumber(now.getFullYear());

    return `ថ្ងៃ${dayName} ទី${dateNum} ខែ${monthName} ឆ្នាំ${yearNum}`;
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left: Mobile Toggle & Title */}
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <button
            onClick={onToggleMobile}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none"
            aria-label="Toggle Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:block">
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium block">
              {getKhmerDateString()}
            </span>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {schoolSettings?.schoolNameKm || 'វិទ្យាល័យ ហ៊ុន សែន បាត់ដឹង'}
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          {/* Version Pill */}
          <div className="hidden sm:flex items-center">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-sm cursor-default"
              title={`កំណែកម្មវិធី៖ ${APP_VERSION} (${APP_RELEASE_NAME})`}
            >
              <Sparkles className="w-3 h-3 text-emerald-500" />
              {APP_VERSION}
            </span>
          </div>

          {/* Academic Year Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-slate-700">
            <Calendar className="w-4 h-4 text-primary-600 dark:text-primary-400 mr-2 flex-shrink-0" />
            <select
              value={activeAcademicYear?.academicYearId || ''}
              onChange={(e) => setActiveAcademicYearId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              {academicYears.map((ay) => (
                <option key={ay.academicYearId} value={ay.academicYearId} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                  ឆ្នាំសិក្សា {ay.yearName} {ay.status === 'ACTIVE' ? '★' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={theme === 'light' ? 'ប្តូរទៅ Dark Mode' : 'ប្តូរទៅ Light Mode'}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* User Profile Badge */}
          <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {currentUser.displayName.charAt(0)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                {currentUser.displayName}
              </p>
              <p className="text-[10px] text-primary-600 dark:text-primary-400 font-medium">
                {currentUser.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

