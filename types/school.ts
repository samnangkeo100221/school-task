// types/school.ts - Core Data Models for MY SCHOOL TASK SYSTEM

export type UserRole = 'ADMIN' | 'SCHOOL_DIRECTOR' | 'TEACHER' | 'ATTENDANCE_STAFF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  teacherId?: string;
  phone?: string;
  avatar?: string;
}

export interface AcademicYear {
  id: string;
  yearName: string; // e.g. ២០២៦-២០២៧
  startDate: string; // ISO date YYYY-MM-DD
  endDate: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'UPCOMING';
  description?: string;
  totalWeeks?: number;
  semester1End?: string;
  semester2Start?: string;
}

export interface Teacher {
  id: string;
  teacherCode: string; // e.g. T-801
  fullName: string; // e.g. កែវ សំណាង
  gender: 'M' | 'F';
  phone: string;
  email: string;
  address?: string;
  subjects: string[]; // Subject IDs
  assignedClasses: string[]; // Class IDs
  employmentStatus: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
  pin: string; // Teacher PIN for login verification
  qualification?: string;
}

export interface ClassRoom {
  id: string;
  grade: number; // 7, 8, 9, 10, 11, 12
  className: string; // e.g. 8A, 8B, 8C, 8D
  academicYearId: string;
  homeroomTeacherId: string;
  capacity: number;
  roomNumber?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Subject {
  id: string;
  subjectCode: string; // e.g. MATH, PHYS, KHM, ENG
  subjectName: string; // គណិតវិទ្យា, រូបវិទ្យា, etc.
  description?: string;
  color: string; // Tailwind color hex/class
  status: 'ACTIVE' | 'INACTIVE';
  weeklyPeriods?: number;
}

export interface Student {
  id: string;
  studentCode: string; // e.g. S-8001
  fullName: string; // Khmer Name
  gender: 'M' | 'F';
  dateOfBirth: string;
  classId: string;
  guardianName: string;
  guardianPhone: string;
  address?: string;
  photo?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRANSFERRED';
}

export interface ClassEnrollment {
  id: string;
  studentId: string;
  classId: string;
  academicYearId: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'TRANSFERRED';
}

export interface CurriculumItem {
  id: string;
  academicYearId: string;
  grade: number;
  subjectId: string;
  chapterNumber: number;
  chapterTitle: string; // e.g. ជំពូកទី ១ ៖ ចំនួនសនិទាន
  lessonTitle: string; // e.g. មេរៀនទី ១ ៖ សញ្ញាណចំនួនសនិទាន
  topicTitle: string; // e.g. ១.១ សញ្ញាណចំនួនសនិទាន និង លក្ខណៈ
  lessonOrder: number; // Sequential index
  requiredPeriods: number; // Teaching hours required (e.g. 2, 3 periods)
  learningObjectives: string; // ចំណេះដឹង, បំណិន, ឥរិយាបថ
  description?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface TeachingPeriodSetting {
  id: string;
  periodNumber: number;
  shift: 'MORNING' | 'AFTERNOON';
  startTime: string; // e.g. "07:00"
  endTime: string; // e.g. "08:00"
  isBreak?: boolean;
}

export interface TimetableSlot {
  id: string;
  academicYearId: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  dayOfWeek: number; // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  periodNumber: number; // 1, 2, 3, 4, 5, 6, 7, 8
  startTime: string; // "07:00"
  endTime: string; // "08:00"
  room: string;
  effectiveStartDate: string;
  effectiveEndDate: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export type EventType =
  | 'HOLIDAY' // បុណ្យជាតិ / អន្តរជាតិ
  | 'ACADEMIC_OPENING' // បើកបវេសនកាល
  | 'ACADEMIC_CLOSING' // បិទបវេសនកាល
  | 'EXAM' // ប្រឡងឆមាស / ខែ
  | 'MEETING' // ប្រជុំគ្រូ
  | 'EVENT' // កម្មវិធីសាលា
  | 'SPECIAL'; // ផ្សេងៗ

export interface SchoolCalendarEvent {
  id: string;
  academicYearId: string;
  eventTitle: string;
  eventType: EventType;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isFullDay: boolean;
  isTeachingDay: boolean; // if false, automatically skipped by scheduler
  blockedPeriods?: number[]; // e.g. [5,6,7,8] for half-day closures
  description?: string;
}

export type TeachingStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'MISSED' | 'RESCHEDULED';
export type LessonPlanStatus = 'NOT_PREPARED' | 'DRAFT' | 'PREPARED' | 'TAUGHT' | 'CANCELLED';

export interface ScheduledLesson {
  id: string;
  academicYearId: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 1 to 6
  periodNumber: number;
  startTime: string;
  endTime: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  curriculumId?: string;
  chapterNumber?: number;
  chapterTitle?: string;
  lessonTitle?: string;
  topicTitle?: string;
  requiredPeriods?: number;
  periodIndexInLesson?: number; // 1 of 3, 2 of 3, etc.
  teachingStatus: TeachingStatus;
  actualDate?: string;
  actualPeriods?: number;
  lessonPlanStatus: LessonPlanStatus;
  attendanceRecorded: boolean;
  notes?: string;
  isMakeUp?: boolean;
  originalLessonId?: string;
  substituteTeacherId?: string;
}

export interface LessonPlanStep {
  stepNumber: number; // 1 to 5
  stepTitle: string; // ជំហានទី១: រដ្ឋបាលថ្នាក់, ជំហានទី២: រំលឹកមេរៀនចាស់, etc.
  teacherActivities: string;
  studentActivities: string;
  content: string;
}

export interface LessonPlan {
  id: string;
  scheduledLessonId: string;
  academicYearId: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  date: string;
  topic: string;
  objectives: {
    knowledge: string; // ចំណេះដឹង
    skill: string; // បំណិន
    attitude: string; // ឥរិយាបថ
  };
  teachingMaterials: string; // សម្ភារឧបទេស
  teachingMethods: string; // វិធីសាស្រ្តបង្រៀន
  steps: LessonPlanStep[];
  assessment: string; // ការវាយតម្លៃ
  homework: string; // កិច្ចការផ្ទះ
  notes?: string;
  status: LessonPlanStatus;
  updatedAt: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE' | 'LEFT_EARLY';

export interface AttendanceRecord {
  id: string;
  scheduledLessonId: string;
  studentId: string;
  classId: string;
  date: string;
  periodNumber: number;
  status: AttendanceStatus;
  reason?: string;
  notes?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface MakeUpLesson {
  id: string;
  originalScheduledLessonId: string;
  makeUpScheduledLessonId?: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  missedDate: string;
  rescheduledDate?: string;
  periodNumber?: number;
  reason: string;
  status: 'PENDING' | 'SCHEDULED' | 'COMPLETED';
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  collection: string;
  recordId: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
}
