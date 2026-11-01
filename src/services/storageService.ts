import {
  SchoolSettings,
  AcademicYear,
  Teacher,
  Student,
  ClassRoom,
  Subject,
  CurriculumItem,
  TimetableSlot,
  SchoolCalendarEvent,
  ScheduledLesson,
  LessonPlan,
  AttendanceRecord,
  MakeUpLesson,
  AuditLog
} from '../types';

import {
  initialSchoolSettings,
  initialAcademicYears,
  initialTeachers,
  initialStudents,
  initialClasses,
  initialSubjects,
  initialCurriculum,
  initialTimetable,
  initialCalendarEvents,
  sampleLessonPlanGrade8Math
} from '../data/initialData';

import { getFirebaseClient } from './firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where
} from 'firebase/firestore';

const STORAGE_KEYS = {
  SETTINGS: 'msts_school_settings',
  ACADEMIC_YEARS: 'msts_academic_years',
  TEACHERS: 'msts_teachers',
  STUDENTS: 'msts_students',
  CLASSES: 'msts_classes',
  SUBJECTS: 'msts_subjects',
  CURRICULUM: 'msts_curriculum',
  TIMETABLES: 'msts_timetables',
  CALENDAR: 'msts_calendar',
  SCHEDULED_LESSONS: 'msts_scheduled_lessons',
  LESSON_PLANS: 'msts_lesson_plans',
  ATTENDANCE: 'msts_attendance',
  MAKEUP_LESSONS: 'msts_makeup_lessons',
  AUDIT_LOGS: 'msts_audit_logs',
};

class StorageService {
  private getLocal<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue;
      }
      return JSON.parse(data) as T;
    } catch {
      return defaultValue;
    }
  }

  private setLocal<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }

  // Initial Seed
  private static DATA_VERSION = 'v5_exact_docs_verified_2025_2026';

  public initStorage(): void {
    if (typeof window === 'undefined') return;
    const currentVer = localStorage.getItem('msts_data_version');
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS) || currentVer !== StorageService.DATA_VERSION) {
      this.resetToInitialData();
      localStorage.setItem('msts_data_version', StorageService.DATA_VERSION);
    }
  }

  public resetToInitialData(): void {
    this.setLocal(STORAGE_KEYS.SETTINGS, initialSchoolSettings);
    this.setLocal(STORAGE_KEYS.ACADEMIC_YEARS, initialAcademicYears);
    this.setLocal(STORAGE_KEYS.TEACHERS, initialTeachers);
    this.setLocal(STORAGE_KEYS.STUDENTS, initialStudents);
    this.setLocal(STORAGE_KEYS.CLASSES, initialClasses);
    this.setLocal(STORAGE_KEYS.SUBJECTS, initialSubjects);
    this.setLocal(STORAGE_KEYS.CURRICULUM, initialCurriculum);
    this.setLocal(STORAGE_KEYS.TIMETABLES, initialTimetable);
    this.setLocal(STORAGE_KEYS.CALENDAR, initialCalendarEvents);
    this.setLocal(STORAGE_KEYS.LESSON_PLANS, [sampleLessonPlanGrade8Math]);
    this.setLocal(STORAGE_KEYS.SCHEDULED_LESSONS, []);
    this.setLocal(STORAGE_KEYS.ATTENDANCE, []);
    this.setLocal(STORAGE_KEYS.MAKEUP_LESSONS, []);
    this.setLocal(STORAGE_KEYS.AUDIT_LOGS, [
      {
        logId: 'LOG-INIT',
        userId: 'samnang.keo@school.edu.kh',
        userEmail: 'samnang.keo@school.edu.kh',
        action: 'SYSTEM_INITIALIZATION',
        collection: 'system',
        recordId: 'INIT',
        details: 'Initial system seed with Grade 8 Mathematics Curriculum and Hun Sen Batdoeng High School timetable for Keo Samnang',
        timestamp: new Date().toISOString()
      }
    ]);
  }

  public async updateAcademicOpeningDate(newStartDate: string): Promise<void> {
    const years = await this.getAcademicYears();
    const settings = await this.getSettings();
    const activeYear = years.find(y => y.academicYearId === settings.academicYearActiveId) || years[0];
    if (activeYear) {
      activeYear.startDate = newStartDate;
      await this.saveAcademicYear(activeYear);
    }
    const events = await this.getCalendarEvents(activeYear?.academicYearId);
    const openingEv = events.find(e => e.eventType === 'ACADEMIC_OPENING');
    if (openingEv) {
      openingEv.startDate = newStartDate;
      openingEv.endDate = newStartDate;
      await this.saveCalendarEvent(openingEv);
    }
  }

  // --- Settings ---
  public async getSettings(): Promise<SchoolSettings> {
    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'schoolSettings'));
        if (!snap.empty) {
          return snap.docs[0].data() as SchoolSettings;
        }
      } catch (err) {
        console.warn('Firestore fetch failed, fallback to local', err);
      }
    }
    return this.getLocal(STORAGE_KEYS.SETTINGS, initialSchoolSettings);
  }

  public async updateSettings(settings: SchoolSettings): Promise<void> {
    this.setLocal(STORAGE_KEYS.SETTINGS, settings);
    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'schoolSettings', settings.schoolId || 'HS-DEFAULT'), settings);
      } catch (err) {
        console.warn('Firestore write failed', err);
      }
    }
    await this.logAction('UPDATE', 'schoolSettings', settings.schoolId, 'Updated school settings');
  }

  // --- Academic Years ---
  public async getAcademicYears(): Promise<AcademicYear[]> {
    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'academicYears'));
        if (!snap.empty) {
          return snap.docs.map(d => d.data() as AcademicYear);
        }
      } catch (err) {
        console.warn('Firestore fetch error', err);
      }
    }
    return this.getLocal(STORAGE_KEYS.ACADEMIC_YEARS, initialAcademicYears);
  }

  public async saveAcademicYear(year: AcademicYear): Promise<void> {
    const list = await this.getAcademicYears();
    const index = list.findIndex(y => y.academicYearId === year.academicYearId);
    if (index >= 0) {
      list[index] = year;
    } else {
      list.push(year);
    }
    this.setLocal(STORAGE_KEYS.ACADEMIC_YEARS, list);

    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'academicYears', year.academicYearId), year);
      } catch (err) {
        console.warn('Firestore write failed', err);
      }
    }
    await this.logAction(index >= 0 ? 'UPDATE' : 'CREATE', 'academicYears', year.academicYearId, year.yearName);
  }

  // --- Teachers ---
  public async getTeachers(): Promise<Teacher[]> {
    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'teachers'));
        if (!snap.empty) {
          return snap.docs.map(d => d.data() as Teacher);
        }
      } catch (err) {
        console.warn('Firestore error', err);
      }
    }
    return this.getLocal(STORAGE_KEYS.TEACHERS, initialTeachers);
  }

  public async saveTeacher(teacher: Teacher): Promise<void> {
    const list = await this.getTeachers();
    const index = list.findIndex(t => t.teacherId === teacher.teacherId);
    if (index >= 0) {
      list[index] = teacher;
    } else {
      list.push(teacher);
    }
    this.setLocal(STORAGE_KEYS.TEACHERS, list);

    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'teachers', teacher.teacherId), teacher);
      } catch (err) {
        console.warn('Firestore write failed', err);
      }
    }
    await this.logAction(index >= 0 ? 'UPDATE' : 'CREATE', 'teachers', teacher.teacherId, teacher.fullName);
  }

  public async deleteTeacher(teacherId: string): Promise<void> {
    let list = await this.getTeachers();
    list = list.filter(t => t.teacherId !== teacherId);
    this.setLocal(STORAGE_KEYS.TEACHERS, list);

    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        await deleteDoc(doc(db, 'teachers', teacherId));
      } catch (err) {
        console.warn('Firestore delete error', err);
      }
    }
    await this.logAction('DELETE', 'teachers', teacherId, 'Deleted teacher');
  }

  // --- Students ---
  public async getStudents(): Promise<Student[]> {
    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'students'));
        if (!snap.empty) {
          return snap.docs.map(d => d.data() as Student);
        }
      } catch (err) {
        console.warn('Firestore error', err);
      }
    }
    return this.getLocal(STORAGE_KEYS.STUDENTS, initialStudents);
  }

  public async saveStudent(student: Student): Promise<void> {
    const list = await this.getStudents();
    const index = list.findIndex(s => s.studentId === student.studentId);
    if (index >= 0) {
      list[index] = student;
    } else {
      list.push(student);
    }
    this.setLocal(STORAGE_KEYS.STUDENTS, list);

    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'students', student.studentId), student);
      } catch (err) {
        console.warn('Firestore write failed', err);
      }
    }
    await this.logAction(index >= 0 ? 'UPDATE' : 'CREATE', 'students', student.studentId, student.fullName);
  }

  public async deleteStudent(studentId: string): Promise<void> {
    let list = await this.getStudents();
    list = list.filter(s => s.studentId !== studentId);
    this.setLocal(STORAGE_KEYS.STUDENTS, list);

    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        await deleteDoc(doc(db, 'students', studentId));
      } catch (err) {
        console.warn('Firestore error', err);
      }
    }
    await this.logAction('DELETE', 'students', studentId, 'Deleted student');
  }

  // --- Classes ---
  public async getClasses(): Promise<ClassRoom[]> {
    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'classes'));
        if (!snap.empty) {
          return snap.docs.map(d => d.data() as ClassRoom);
        }
      } catch (err) {
        console.warn('Firestore error', err);
      }
    }
    return this.getLocal(STORAGE_KEYS.CLASSES, initialClasses);
  }

  public async saveClass(cls: ClassRoom): Promise<void> {
    const list = await this.getClasses();
    const index = list.findIndex(c => c.classId === cls.classId);
    if (index >= 0) {
      list[index] = cls;
    } else {
      list.push(cls);
    }
    this.setLocal(STORAGE_KEYS.CLASSES, list);

    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'classes', cls.classId), cls);
      } catch (err) {
        console.warn('Firestore write failed', err);
      }
    }
    await this.logAction(index >= 0 ? 'UPDATE' : 'CREATE', 'classes', cls.classId, cls.className);
  }

  // --- Subjects ---
  public async getSubjects(): Promise<Subject[]> {
    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'subjects'));
        if (!snap.empty) {
          return snap.docs.map(d => d.data() as Subject);
        }
      } catch (err) {
        console.warn('Firestore error', err);
      }
    }
    return this.getLocal(STORAGE_KEYS.SUBJECTS, initialSubjects);
  }

  public async saveSubject(subject: Subject): Promise<void> {
    const list = await this.getSubjects();
    const index = list.findIndex(s => s.subjectId === subject.subjectId);
    if (index >= 0) {
      list[index] = subject;
    } else {
      list.push(subject);
    }
    this.setLocal(STORAGE_KEYS.SUBJECTS, list);

    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'subjects', subject.subjectId), subject);
      } catch (err) {
        console.warn('Firestore write failed', err);
      }
    }
    await this.logAction(index >= 0 ? 'UPDATE' : 'CREATE', 'subjects', subject.subjectId, subject.subjectName);
  }

  // --- Curriculum ---
  public async getCurriculum(academicYearId?: string): Promise<CurriculumItem[]> {
    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        const q = academicYearId
          ? query(collection(db, 'curriculum'), where('academicYearId', '==', academicYearId))
          : collection(db, 'curriculum');
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => d.data() as CurriculumItem);
        }
      } catch (err) {
        console.warn('Firestore error', err);
      }
    }
    const list = this.getLocal<CurriculumItem[]>(STORAGE_KEYS.CURRICULUM, initialCurriculum);
    if (academicYearId) {
      return list.filter(c => c.academicYearId === academicYearId);
    }
    return list;
  }

  public async saveCurriculumItem(item: CurriculumItem): Promise<void> {
    const list = this.getLocal<CurriculumItem[]>(STORAGE_KEYS.CURRICULUM, initialCurriculum);
    const index = list.findIndex(c => c.curriculumId === item.curriculumId);
    if (index >= 0) {
      list[index] = item;
    } else {
      list.push(item);
    }
    this.setLocal(STORAGE_KEYS.CURRICULUM, list);

    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'curriculum', item.curriculumId), item);
      } catch (err) {
        console.warn('Firestore write failed', err);
      }
    }
    await this.logAction(index >= 0 ? 'UPDATE' : 'CREATE', 'curriculum', item.curriculumId, item.lessonTitle);
  }

  public async bulkSaveCurriculum(items: CurriculumItem[]): Promise<void> {
    this.setLocal(STORAGE_KEYS.CURRICULUM, items);
    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      for (const item of items) {
        try {
          await setDoc(doc(db, 'curriculum', item.curriculumId), item);
        } catch (e) {
          console.warn('Batch item failed', e);
        }
      }
    }
    await this.logAction('BULK_IMPORT', 'curriculum', 'ALL', 'Imported ' + items.length + ' curriculum items');
  }

  // --- Timetables ---
  public async getTimetables(academicYearId?: string): Promise<TimetableSlot[]> {
    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        const q = academicYearId
          ? query(collection(db, 'timetables'), where('academicYearId', '==', academicYearId))
          : collection(db, 'timetables');
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => d.data() as TimetableSlot);
        }
      } catch (err) {
        console.warn('Firestore error', err);
      }
    }
    const list = this.getLocal<TimetableSlot[]>(STORAGE_KEYS.TIMETABLES, initialTimetable);
    if (academicYearId) {
      return list.filter(t => t.academicYearId === academicYearId);
    }
    return list;
  }

  public async saveTimetableSlot(slot: TimetableSlot): Promise<void> {
    const list = this.getLocal<TimetableSlot[]>(STORAGE_KEYS.TIMETABLES, initialTimetable);
    const index = list.findIndex(t => t.timetableId === slot.timetableId);
    if (index >= 0) {
      list[index] = slot;
    } else {
      list.push(slot);
    }
    this.setLocal(STORAGE_KEYS.TIMETABLES, list);

    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'timetables', slot.timetableId), slot);
      } catch (err) {
        console.warn('Firestore write failed', err);
      }
    }
    await this.logAction(index >= 0 ? 'UPDATE' : 'CREATE', 'timetables', slot.timetableId, 'Day ' + slot.dayOfWeek + ' P' + slot.periodNumber);
  }

  public async deleteTimetableSlot(timetableId: string): Promise<void> {
    let list = this.getLocal<TimetableSlot[]>(STORAGE_KEYS.TIMETABLES, initialTimetable);
    list = list.filter(t => t.timetableId !== timetableId);
    this.setLocal(STORAGE_KEYS.TIMETABLES, list);

    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        await deleteDoc(doc(db, 'timetables', timetableId));
      } catch (err) {
        console.warn('Firestore delete error', err);
      }
    }
    await this.logAction('DELETE', 'timetables', timetableId, 'Deleted timetable slot');
  }

  // --- Calendar Events ---
  public async getCalendarEvents(academicYearId?: string): Promise<SchoolCalendarEvent[]> {
    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'schoolCalendar'));
        if (!snap.empty) {
          return snap.docs.map(d => d.data() as SchoolCalendarEvent);
        }
      } catch (err) {
        console.warn('Firestore calendar error', err);
      }
    }
    const list = this.getLocal<SchoolCalendarEvent[]>(STORAGE_KEYS.CALENDAR, initialCalendarEvents);
    if (academicYearId) {
      return list.filter(e => e.academicYearId === academicYearId);
    }
    return list;
  }

  public async saveCalendarEvent(event: SchoolCalendarEvent): Promise<void> {
    const list = this.getLocal<SchoolCalendarEvent[]>(STORAGE_KEYS.CALENDAR, initialCalendarEvents);
    const index = list.findIndex(e => e.eventId === event.eventId);
    if (index >= 0) {
      list[index] = event;
    } else {
      list.push(event);
    }
    this.setLocal(STORAGE_KEYS.CALENDAR, list);

    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'schoolCalendar', event.eventId), event);
      } catch (err) {
        console.warn('Firestore write failed', err);
      }
    }
    await this.logAction(index >= 0 ? 'UPDATE' : 'CREATE', 'schoolCalendar', event.eventId, event.eventTitle);
  }

  public async deleteCalendarEvent(eventId: string): Promise<void> {
    let list = this.getLocal<SchoolCalendarEvent[]>(STORAGE_KEYS.CALENDAR, initialCalendarEvents);
    list = list.filter(e => e.eventId !== eventId);
    this.setLocal(STORAGE_KEYS.CALENDAR, list);

    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        await deleteDoc(doc(db, 'schoolCalendar', eventId));
      } catch (err) {
        console.warn('Firestore delete error', err);
      }
    }
    await this.logAction('DELETE', 'schoolCalendar', eventId, 'Deleted calendar event');
  }

  // --- Scheduled Lessons ---
  public async getScheduledLessons(academicYearId?: string): Promise<ScheduledLesson[]> {
    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'scheduledLessons'));
        if (!snap.empty) {
          return snap.docs.map(d => d.data() as ScheduledLesson);
        }
      } catch (err) {
        console.warn('Firestore scheduledLessons error', err);
      }
    }
    const list = this.getLocal<ScheduledLesson[]>(STORAGE_KEYS.SCHEDULED_LESSONS, []);
    if (academicYearId) {
      return list.filter(s => s.academicYearId === academicYearId);
    }
    return list;
  }

  public async saveScheduledLesson(lesson: ScheduledLesson): Promise<void> {
    const list = this.getLocal<ScheduledLesson[]>(STORAGE_KEYS.SCHEDULED_LESSONS, []);
    const index = list.findIndex(s => s.scheduledLessonId === lesson.scheduledLessonId);
    if (index >= 0) {
      list[index] = lesson;
    } else {
      list.push(lesson);
    }
    this.setLocal(STORAGE_KEYS.SCHEDULED_LESSONS, list);

    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'scheduledLessons', lesson.scheduledLessonId), lesson);
      } catch (err) {
        console.warn('Firestore save lesson error', err);
      }
    }
  }

  public async bulkSaveScheduledLessons(lessons: ScheduledLesson[]): Promise<void> {
    this.setLocal(STORAGE_KEYS.SCHEDULED_LESSONS, lessons);
    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      for (const lesson of lessons) {
        try {
          await setDoc(doc(db, 'scheduledLessons', lesson.scheduledLessonId), lesson);
        } catch (e) {
          console.warn('Firestore save lesson error', e);
        }
      }
    }
    await this.logAction('GENERATE_SCHEDULE', 'scheduledLessons', 'ALL', 'Generated ' + lessons.length + ' teaching sessions');
  }

  // --- Lesson Plans ---
  public async getLessonPlans(): Promise<LessonPlan[]> {
    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'lessonPlans'));
        if (!snap.empty) {
          return snap.docs.map(d => d.data() as LessonPlan);
        }
      } catch (err) {
        console.warn('Firestore lessonPlans error', err);
      }
    }
    return this.getLocal<LessonPlan[]>(STORAGE_KEYS.LESSON_PLANS, [sampleLessonPlanGrade8Math]);
  }

  public async saveLessonPlansBatch(newPlans: LessonPlan[]): Promise<void> {
    const list = this.getLocal<LessonPlan[]>(STORAGE_KEYS.LESSON_PLANS, [sampleLessonPlanGrade8Math]);
    const planMap = new Map<string, LessonPlan>();
    for (const p of list) {
      planMap.set(p.lessonPlanId, p);
    }
    for (const p of newPlans) {
      planMap.set(p.lessonPlanId, p);
    }
    const combined = Array.from(planMap.values());
    this.setLocal(STORAGE_KEYS.LESSON_PLANS, combined);
  }

  async saveLessonPlan(plan: LessonPlan): Promise<void> {
    const list = this.getLocal<LessonPlan[]>(STORAGE_KEYS.LESSON_PLANS, [sampleLessonPlanGrade8Math]);
    const index = list.findIndex(p => p.lessonPlanId === plan.lessonPlanId);
    if (index >= 0) {
      list[index] = plan;
    } else {
      list.push(plan);
    }
    this.setLocal(STORAGE_KEYS.LESSON_PLANS, list);

    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        await setDoc(doc(db, 'lessonPlans', plan.lessonPlanId), plan);
      } catch (err) {
        console.warn('Firestore save lesson plan error', err);
      }
    }
    await this.logAction(index >= 0 ? 'UPDATE' : 'CREATE', 'lessonPlans', plan.lessonPlanId, plan.topic);
  }

  // --- Attendance ---
  public async getAttendance(scheduledLessonId?: string): Promise<AttendanceRecord[]> {
    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        const q = scheduledLessonId
          ? query(collection(db, 'attendance'), where('scheduledLessonId', '==', scheduledLessonId))
          : collection(db, 'attendance');
        const snap = await getDocs(q);
        if (!snap.empty) {
          return snap.docs.map(d => d.data() as AttendanceRecord);
        }
      } catch (err) {
        console.warn('Firestore attendance error', err);
      }
    }
    const list = this.getLocal<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
    if (scheduledLessonId) {
      return list.filter(a => a.scheduledLessonId === scheduledLessonId);
    }
    return list;
  }

  public async bulkSaveAttendance(records: AttendanceRecord[]): Promise<void> {
    const list = this.getLocal<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
    for (const rec of records) {
      const idx = list.findIndex(a => a.attendanceId === rec.attendanceId);
      if (idx >= 0) {
        list[idx] = rec;
      } else {
        list.push(rec);
      }
    }
    this.setLocal(STORAGE_KEYS.ATTENDANCE, list);

    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      for (const rec of records) {
        try {
          await setDoc(doc(db, 'attendance', rec.attendanceId), rec);
        } catch (e) {
          console.warn('Attendance sync error', e);
        }
      }
    }
    if (records.length > 0) {
      await this.logAction('SAVE_ATTENDANCE', 'attendance', records[0].scheduledLessonId, 'Recorded attendance for ' + records.length + ' students');
    }
  }

  // --- Make-up Lessons ---
  public async getMakeUpLessons(): Promise<MakeUpLesson[]> {
    return this.getLocal<MakeUpLesson[]>(STORAGE_KEYS.MAKEUP_LESSONS, []);
  }

  public async deleteLessonPlan(planId: string): Promise<void> {
    let list = await this.getLessonPlans();
    list = list.filter(p => p.lessonPlanId !== planId);
    this.setLocal(STORAGE_KEYS.LESSON_PLANS, list);

    const { db, isConfigured } = getFirebaseClient();
    if (isConfigured && db) {
      try {
        await deleteDoc(doc(db, 'lessonPlans', planId));
      } catch (err) {
        console.warn('Firestore delete error', err);
      }
    }
    await this.logAction('DELETE', 'lessonPlans', planId, 'Deleted lesson plan');
  }

  public async saveMakeUpLesson(item: MakeUpLesson): Promise<void> {
    const list = await this.getMakeUpLessons();
    const idx = list.findIndex(m => m.makeUpId === item.makeUpId);
    if (idx >= 0) {
      list[idx] = item;
    } else {
      list.push(item);
    }
    this.setLocal(STORAGE_KEYS.MAKEUP_LESSONS, list);
    await this.logAction('MAKEUP_LESSON', 'makeUpLessons', item.makeUpId, 'Scheduled makeup on ' + item.rescheduledDate);
  }

  public async deleteMakeUpLesson(makeUpId: string): Promise<void> {
    let list = await this.getMakeUpLessons();
    list = list.filter(m => m.makeUpId !== makeUpId);
    this.setLocal(STORAGE_KEYS.MAKEUP_LESSONS, list);
    await this.logAction('DELETE', 'makeUpLessons', makeUpId, 'Deleted makeup lesson');
  }

  // --- Audit Logs ---
  public async getAuditLogs(): Promise<AuditLog[]> {
    return this.getLocal<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  public async logAction(action: string, collectionName: string, recordId: string, details: string): Promise<void> {
    const user = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('msts_current_user') || '{"uid":"ADMIN-01","email":"admin@school.edu.kh"}')
      : { uid: 'ADMIN-01', email: 'admin@school.edu.kh' };
    const newLog: AuditLog = {
      logId: 'LOG-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      userId: user.uid || 'ADMIN',
      userEmail: user.email || 'admin@school.edu.kh',
      action,
      collection: collectionName,
      recordId,
      details,
      timestamp: new Date().toISOString()
    };
    const list = this.getLocal<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
    list.unshift(newLog);
    if (list.length > 500) list.pop();
    this.setLocal(STORAGE_KEYS.AUDIT_LOGS, list);
  }
}

export const storageService = new StorageService();
storageService.initStorage();

