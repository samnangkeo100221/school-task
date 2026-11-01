import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { AppLayout } from './components/layout/AppLayout';

// Page imports
import { DashboardPage } from './views/DashboardPage';
import { AcademicYearsPage } from './views/AcademicYearsPage';
import { TeachersPage } from './views/TeachersPage';
import { StudentsPage } from './views/StudentsPage';
import { ClassesPage } from './views/ClassesPage';
import { SubjectsPage } from './views/SubjectsPage';
import { CurriculumPage } from './views/CurriculumPage';
import { TimetablePage } from './views/TimetablePage';
import { CalendarPage } from './views/CalendarPage';
import { ClassCurriculumPage } from './views/ClassCurriculumPage';
import { LessonPlansPage } from './views/LessonPlansPage';
import { AttendancePage } from './views/AttendancePage';
import { MakeUpLessonsPage } from './views/MakeUpLessonsPage';
import { ReportsPage } from './views/ReportsPage';
import { SettingsPage } from './views/SettingsPage';

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
