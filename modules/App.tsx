import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { AppLayout } from './components/layout/AppLayout';

// Page imports
import { DashboardPage } from './pages/DashboardPage';
import { AcademicYearsPage } from './pages/AcademicYearsPage';
import { TeachersPage } from './pages/TeachersPage';
import { StudentsPage } from './pages/StudentsPage';
import { ClassesPage } from './pages/ClassesPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { CurriculumPage } from './pages/CurriculumPage';
import { TimetablePage } from './pages/TimetablePage';
import { CalendarPage } from './pages/CalendarPage';
import { ClassCurriculumPage } from './pages/ClassCurriculumPage';
import { LessonPlansPage } from './pages/LessonPlansPage';
import { AttendancePage } from './pages/AttendancePage';
import { MakeUpLessonsPage } from './pages/MakeUpLessonsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="academic-years" element={<AcademicYearsPage />} />
            <Route path="teachers" element={<TeachersPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="classes" element={<ClassesPage />} />
            <Route path="subjects" element={<SubjectsPage />} />
            <Route path="curriculum" element={<CurriculumPage />} />
            <Route path="timetable" element={<TimetablePage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="class-curriculum" element={<ClassCurriculumPage />} />
            <Route path="lesson-plans" element={<LessonPlansPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="makeup-lessons" element={<MakeUpLessonsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
