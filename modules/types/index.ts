export type UserRole = 'ADMIN' | 'SCHOOL_DIRECTOR' | 'TEACHER' | 'ATTENDANCE_STAFF';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  teacherId?: string;
  avatarUrl?: string;
  phone?: string;
}

export interface SchoolSettings {
  schoolId: string;
  schoolNameKm: string;
  schoolNameEn: string;
  schoolCode: string;
  academicYearActiveId: string;
  currentSemester: 1 | 2;
  principalName: string;
  location: string;
  logoUrl?: string;
  contactPhone: string;
  contactEmail: string;
  periodDurationMinutes: number;
  periodsPerDay: number;
  morningPeriods: number;
  afternoonPeriods: number;
  breakBetweenPeriodsMinutes: number;
  longBreakMinutes: number;
}

export interface AcademicYear {
  academicYearId: string;
  yearName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: 'active' | 'upcoming' | 'archived';
  description?: string;
  totalWeeks: number;
  semester1StartDate: string;
  semester1EndDate: string;
  semester2StartDate: string;
  semester2EndDate: string;
}

export interface Teacher {
  teacherId: string;
  teacherCode: string;
  fullName: string;
  gender: 'M' | 'F';
  phone: string;
  email: string;
  address: string;
  subjects: string[]; // Subject IDs
  assignedClasses: string[]; // Class IDs
  employmentStatus: 'active' | 'leave' | 'transferred' | 'retired';
  userId?: string;
  qualification?: string;
  position?: string;
  hireDate?: string;
}

export interface Student {
  studentId: string;
  studentCode: string;
  fullName: string;
  gender: 'M' | 'F';
  dateOfBirth: string; // YYYY-MM-DD
  classId: string;
  guardianName: string;
  guardianPhone: string;
  status: 'active' | 'transferred' | 'dropped_out' | 'graduated';
  address?: string;
  enrollmentDate?: string;
}

export interface ClassRoom {
  classId: string;
  grade: number; // e.g. 7, 8, 9, 10, 11, 12
  className: string; // e.g. 8A, 8B, 8C, 8D
  academicYearId: string;
  homeroomTeacherId?: string;
  capacity: number;
  status: 'active' | 'archived';
  roomNumber?: string;
  totalStudents?: number;
}

export interface Subject {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  description?: string;
  color: string;
  status: 'active' | 'inactive';
  weeklyPeriods: number;
  gradeLevels: number[];
}

export interface ClassEnrollment {
  enrollmentId: string;
  studentId: string;
  classId: string;
  academicYearId: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'transferred' | 'completed';
}

export interface CurriculumItem {
  curriculumId: string;
  academicYearId: string;
  grade: number;
  subjectId: string;
  chapterNumber: number;
  chapterTitle: string;
  lessonTitle: string;
  topicTitle: string;
  lessonOrder: number;
  requiredPeriods: number;
  learningObjectives: string;
  description?: string;
  status: 'planned' | 'in_progress' | 'completed';
  completedPeriods: number;
  expectedCompletionDate?: string;
  actualCompletionDate?: string;
  weekNumber?: number;
}

export interface TeachingPeriod {
  periodNumber: number;
  periodNameKm: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  session: 'morning' | 'afternoon';
}

export interface TimetableSlot {
  timetableId: string;
  academicYearId: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  dayOfWeek: number; // 1 = Monday, 6 = Saturday, 0 = Sunday
  periodNumber: number;
  startTime: string;
  endTime: string;
  room?: string;
  effectiveStartDate: string;
  effectiveEndDate: string;
  status: 'active' | 'cancelled' | 'substituted';
}

export interface SchoolCalendarEvent {
  eventId: string;
  academicYearId: string;
  eventTitle: string;
  eventType: 
    | 'academic_opening'
    | 'academic_closing'
    | 'weekly_holiday'
    | 'national_holiday'
    | 'traditional_festival'
    | 'school_holiday'
    | 'examination'
    | 'teacher_meeting'
    | 'school_event'
    | 'emergency_closure';
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  isFullDay: boolean;
  isTeachingDay: boolean;
  affectedPeriods?: number[]; // for half-day closures
  description?: string;
  createdBy?: string;
  color?: string;
}

export interface ScheduledLesson {
  scheduledLessonId: string;
  curriculumId: string;
  academicYearId: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  room?: string;
  chapterTitle: string;
  lessonTitle: string;
  topicTitle: string;
  periodIndexForLesson: number; // e.g. 1 of 3
  totalPeriodsForLesson: number; // e.g. 3
  status: 'planned' | 'prepared' | 'completed' | 'missed' | 'rescheduled';
  lessonPlanId?: string;
  attendanceRecorded?: boolean;
  notes?: string;
  completedDate?: string;
  missedReason?: string;
}

export interface LessonPlan {
  lessonPlanId: string;
  scheduledLessonId: string;
  academicYearId: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  date: string;
  topic: string;
  objectives: {
    knowledge: string;
    skills: string;
    attitude: string;
  };
  teachingMaterials: string;
  teachingMethods: string;
  steps: {
    step1Introduction: { teacherActivity: string; studentActivity: string; timeMinutes: number };
    step2Review: { teacherActivity: string; studentActivity: string; timeMinutes: number };
    step3NewLesson: { teacherActivity: string; studentActivity: string; timeMinutes: number };
    step4Strengthening: { teacherActivity: string; studentActivity: string; timeMinutes: number };
    step5AssessmentHomework: { teacherActivity: string; studentActivity: string; timeMinutes: number };
  };
  assessment: string;
  homework: string;
  notes?: string;
  status: 'not_prepared' | 'draft' | 'prepared' | 'taught' | 'cancelled' | 'rescheduled';
  updatedAt: string;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE' | 'LEFT_EARLY';

export interface AttendanceRecord {
  attendanceId: string;
  scheduledLessonId: string;
  academicYearId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  date: string;
  periodNumber: number;
  studentId: string;
  studentCode: string;
  studentName: string;
  gender: 'M' | 'F';
  status: AttendanceStatus;
  reason?: string;
  notes?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface MakeUpLesson {
  makeUpId: string;
  originalScheduledLessonId: string;
  academicYearId?: string;
  curriculumId: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  originalDate: string;
  newDate: string;
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  room?: string;
  substituteTeacherId?: string;
  reason: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
}

export interface AuditLog {
  logId: string;
  userId: string;
  userEmail: string;
  action: string;
  collection: string;
  recordId: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
  details?: string;
}
