import React, { useState } from 'react';
import {
  Menu,
  Sun,
  Moon,
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
    toggleTheme
  } = useApp();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [yearMenuOpen, setYearMenuOpen] = useState(false);

  const roleLabels: { [key in UserRole]: { label: string; desc: string } } = {
    ADMIN: { label: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ (Admin)', desc: 'សិទ្ធិពេញលេញលើគ្រប់មុខងារ' },
    SCHOOL_DIRECTOR: { label: 'នាយកសាលា (Director)', desc: 'មើល និងអនុម័តកាលវិភាគ របាយការណ៍' },
    TEACHER: { label: 'គ្រូបង្រៀន (Teacher)', desc: 'កិច្ចតែងការ វត្តមាន កាលវិភាគផ្ទាល់ខ្លួន' },
    ATTENDANCE_STAFF: { label: 'បុគ្គលិកកត់ត្រាវត្តមាន (Staff)', desc: 'កត់ត្រាវត្តមានសិស្ស' }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 lg:px-6">
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
        {/* Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline font-bold">{currentUser.role}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                ប្តូរតួនាទីសាកល្បង (Role Switch)
              </div>
              {(['ADMIN', 'SCHOOL_DIRECTOR', 'TEACHER', 'ATTENDANCE_STAFF'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    switchUserRole(r);
                    setRoleMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-xs transition-colors border-b border-slate-100 dark:border-slate-800/60 last:border-b-0 ${
                    currentUser.role === r
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <p className="font-bold flex items-center justify-between">
                    <span>{roleLabels[r].label}</span>
                    {currentUser.role === r && <UserCheck className="w-3.5 h-3.5 text-blue-600" />}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{roleLabels[r].desc}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>

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
