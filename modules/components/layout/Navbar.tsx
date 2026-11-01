import React, { useState } from 'react';
import {
  Menu,
  Sun,
  Moon,
  Eye,
  CalendarRange,
  Shield,
  ChevronDown,
  UserCheck,
  GraduationCap
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { UserRole } from '../../types';

interface NavbarProps {
  onToggleMobile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleMobile }) => {
  const {
    currentUser,
    switchUserRole,
    activeAcademicYear,
    academicYears,
    setActiveAcademicYearId,
    theme,
    setThemeMode,
    toggleTheme
  } = useApp();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [yearMenuOpen, setYearMenuOpen] = useState(false);
  const [themeMenuOpen, setThemeMenuOpen] = useState(false);

  const roleLabels: { [key in UserRole]: { label: string; desc: string } } = {
    ADMIN: { label: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ (Admin)', desc: 'សិទ្ធិពេញលេញលើគ្រប់មុខងារ' },
    SCHOOL_DIRECTOR: { label: 'នាយកសាលា (Director)', desc: 'មើល និងអនុម័តកាលវិភាគ របាយការណ៍' },
    TEACHER: { label: 'គ្រូបង្រៀន (Teacher)', desc: 'កិច្ចតែងការ វត្តមាន កាលវិភាគផ្ទាល់ខ្លួន' },
    ATTENDANCE_STAFF: { label: 'បុគ្គលិកកត់ត្រាវត្តមាន (Staff)', desc: 'កត់ត្រាវត្តមានសិស្ស' }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 warm:bg-[#fffdf9]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 warm:border-[#dfd4bf] h-16 flex items-center justify-between px-4 lg:px-6 transition-colors">
      {/* Left: Mobile Toggle & Page context */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setYearMenuOpen(!yearMenuOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <CalendarRange className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{activeAcademicYear?.yearName || 'ជ្រើសរើសឆ្នាំសិក្សា'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {yearMenuOpen && (
            <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                ជ្រើសរើសឆ្នាំសិក្សា
              </div>
              {academicYears.map((year) => (
                <button
                  key={year.academicYearId}
                  onClick={() => {
                    setActiveAcademicYearId(year.academicYearId);
                    setYearMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                    activeAcademicYear?.academicYearId === year.academicYearId
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{year.yearName}</span>
                  {year.status === 'active' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">
                      សកម្ម
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Solo Teacher Identity Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/50 warm:bg-[#eee6d3] border border-indigo-100 dark:border-indigo-900/40 warm:border-[#dfd4bf]">
          <GraduationCap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 warm:text-[#b45309]" />
          <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 warm:text-[#78350f]">
            លោកគ្រូ កែវ សំណាង (គណិតវិទ្យា ៨)
          </span>
        </div>

        {/* Eye-Care & Theme Selector */}
        <div className="relative">
          <button
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-700/80 warm:border-[#dfd4bf] bg-slate-100/70 dark:bg-slate-800/70 warm:bg-[#eee6d3] text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
            title="ប្តូររបៀបពន្លឺថែទាំភ្នែក (Eye-Care Theme)"
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : theme === 'warm' ? (
              <Eye className="w-4 h-4 text-amber-600" />
            ) : (
              <Sun className="w-4 h-4 text-amber-500" />
            )}
            <span className="hidden sm:inline text-[11px] font-bold">
              {theme === 'dark' ? 'រាត្រីស្ងប់' : theme === 'warm' ? 'ថែទាំភ្នែក' : 'ពន្លឺស្រទន់'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {themeMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 warm:bg-[#fffdf9] rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 warm:border-[#dfd4bf] py-2 z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                កម្រិតពន្លឺ និងផាសុកភាពភ្នែក
              </div>
              
              <button
                onClick={() => {
                  setThemeMode('light');
                  setThemeMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                  theme === 'light'
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <div>
                    <p className="font-semibold">ពន្លឺស្រទន់ (Soft Light)</p>
                    <p className="text-[10px] text-slate-400">កាត់បន្ថយពន្លឺចាំង</p>
                  </div>
                </div>
                {theme === 'light' && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
              </button>

              <button
                onClick={() => {
                  setThemeMode('warm');
                  setThemeMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                  theme === 'warm'
                    ? 'bg-amber-100/60 text-amber-900 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-amber-600" />
                  <div>
                    <p className="font-semibold">ថែទាំភ្នែក (Warm Sepia)</p>
                    <p className="text-[10px] text-slate-400">ពណ៌ក្រដាស គ្មានពន្លឺខៀវ</p>
                  </div>
                </div>
                {theme === 'warm' && <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />}
              </button>

              <button
                onClick={() => {
                  setThemeMode('dark');
                  setThemeMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors ${
                  theme === 'dark'
                    ? 'bg-indigo-950/50 text-indigo-300 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <div>
                    <p className="font-semibold">រាត្រីស្ងប់ភ្នែក (Calm Dark)</p>
                    <p className="text-[10px] text-slate-400">ងងឹតស្រាល មិនចាំងភ្នែក</p>
                  </div>
                </div>
                {theme === 'dark' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
              </button>
            </div>
          )}
        </div>

        {/* User Avatar & Name */}
        <div className="flex items-center space-x-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
            {currentUser.displayName ? currentUser.displayName.charAt(0) : 'ក'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
              {currentUser.displayName}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500">
              {currentUser.email}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
