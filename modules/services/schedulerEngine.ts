import {
  AcademicYear,
  CurriculumItem,
  TimetableSlot,
  SchoolCalendarEvent,
  ScheduledLesson,
  LessonPlan
} from '../types';
import { storageService } from './storageService';

export interface ScheduleGenerationResult {
  totalGenerated: number;
  totalPreserved: number;
  completedLessons: number;
  unallocatedCurriculumItems: CurriculumItem[];
  expectedCompletionDates: { [curriculumId: string]: string };
  insufficientCapacityWarnings: string[];
  sessionsByClass: { [classId: string]: ScheduledLesson[] };
}

export class SchedulerEngine {
  /**
   * Automatically converts annual curriculum into actual teaching dates.
   * Follows the 12-step algorithm in PART 8.
   */
  public async generateSchedule(
    academicYearId: string,
    options?: {
      preserveCompleted?: boolean;
      regenerateFromDate?: string;
    }
  ): Promise<ScheduleGenerationResult> {
    const preserveCompleted = options?.preserveCompleted !== false; // default true
    const cutoffDate = options?.regenerateFromDate;

    // STEP 1: Load selected academic year
    const academicYears = await storageService.getAcademicYears();
    const academicYear = academicYears.find(y => y.academicYearId === academicYearId);
    if (!academicYear) {
      throw new Error(`Academic year ${academicYearId} not found`);
    }

    // STEP 2: Load annual curriculum sorted by lesson order
    const curriculum = (await storageService.getCurriculum(academicYearId))
      .sort((a, b) => a.lessonOrder - b.lessonOrder);

    // STEP 3: Load timetable slots
    const timetables = await storageService.getTimetables(academicYearId);
    const activeTimetables = timetables.filter(t => t.status === 'active');

    // Load existing scheduled lessons to preserve completed/attendance-recorded ones
    const existingLessons = await storageService.getScheduledLessons(academicYearId);
    const completedOrRecordedMap = new Map<string, ScheduledLesson>();

    if (preserveCompleted) {
      for (const lesson of existingLessons) {
        if (lesson.status === 'completed' || lesson.attendanceRecorded) {
          // Key by date + class + period
          const key = `${lesson.date}_${lesson.classId}_${lesson.periodNumber}`;
          completedOrRecordedMap.set(key, lesson);
        }
      }
    }

    // STEP 5 & 6: Load school calendar and identify non-teaching dates & half-days
    const calendarEvents = await storageService.getCalendarEvents(academicYearId);
    const fullDayClosureDates = new Set<string>();
    const halfDayClosures = new Map<string, number[]>(); // date -> affected period numbers

    for (const event of calendarEvents) {
      if (!event.isTeachingDay) {
        const start = new Date(event.startDate);
        const end = new Date(event.endDate);

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          if (event.isFullDay) {
            fullDayClosureDates.add(dateStr);
          } else if (event.affectedPeriods && event.affectedPeriods.length > 0) {
            const existing = halfDayClosures.get(dateStr) || [];
            halfDayClosures.set(dateStr, Array.from(new Set([...existing, ...event.affectedPeriods])));
          }
        }
      }
    }

    // Group curriculum by class & subject (or grade & subject)
    // For Grade 8 Math, it applies to all Grade 8 classes (8A, 8B, 8C, 8D)
    const classes = await storageService.getClasses();
    const activeClasses = classes.filter(c => c.status === 'active');

    const generatedLessons: ScheduledLesson[] = [];
    const expectedCompletionDates: { [curriculumId: string]: string } = {};
    const insufficientCapacityWarnings: string[] = [];
    const unallocatedCurriculumItems: CurriculumItem[] = [];

    // STEP 4: Generate teaching slots per class
    for (const cls of activeClasses) {
      // Find timetable slots for this class
      const classTimetable = activeTimetables.filter(t => t.classId === cls.classId);
      if (classTimetable.length === 0) continue;

      // Filter curriculum for this class's grade
      const gradeCurriculum = curriculum.filter(c => c.grade === cls.grade);
      if (gradeCurriculum.length === 0) continue;

      // Generate all calendar dates between academic year start and end dates
      const startDate = new Date(academicYear.startDate);
      const endDate = new Date(academicYear.endDate);
      const validSlots: {
        dateStr: string;
        dayOfWeek: number;
        slot: TimetableSlot;
      }[] = [];

      for (let cur = new Date(startDate); cur <= endDate; cur.setDate(cur.getDate() + 1)) {
        const dateStr = cur.toISOString().split('T')[0];
        const dayOfWeek = cur.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

        // Check Sunday weekly holiday
        if (dayOfWeek === 0) continue;

        // Check full-day holiday
        if (fullDayClosureDates.has(dateStr)) continue;

        // Find timetable slots on this dayOfWeek
        const slotsOnDay = classTimetable.filter(t => t.dayOfWeek === dayOfWeek);

        for (const slot of slotsOnDay) {
          // Check half-day closure blocking this period
          const blockedPeriods = halfDayClosures.get(dateStr);
          if (blockedPeriods && blockedPeriods.includes(slot.periodNumber)) {
            continue;
          }

          validSlots.push({
            dateStr,
            dayOfWeek,
            slot
          });
        }
      }

      // STEP 7: Sort valid sessions chronologically
      validSlots.sort((a, b) => {
        if (a.dateStr !== b.dateStr) return a.dateStr.localeCompare(b.dateStr);
        return a.slot.periodNumber - b.slot.periodNumber;
      });

      // STEP 8 & 9: Allocate curriculum topics sequentially according to requiredPeriods
      let slotIndex = 0;

      for (const currItem of gradeCurriculum) {
        let periodsAllocated = 0;
        let lastDateForThisItem = '';

        while (periodsAllocated < currItem.requiredPeriods && slotIndex < validSlots.length) {
          const { dateStr, dayOfWeek, slot } = validSlots[slotIndex];
          slotIndex++;

          // Check if this slot was previously completed or had attendance recorded
          const existingKey = `${dateStr}_${cls.classId}_${slot.periodNumber}`;
          const existing = completedOrRecordedMap.get(existingKey);

          if (existing && preserveCompleted) {
            generatedLessons.push(existing);
            periodsAllocated++;
            lastDateForThisItem = dateStr;
            continue;
          }

          // Create scheduled lesson
          const scheduledLessonId = `SCH-${cls.classId}-${dateStr}-P${slot.periodNumber}`;
          const scheduledLesson: ScheduledLesson = {
            scheduledLessonId,
            curriculumId: currItem.curriculumId,
            academicYearId,
            teacherId: slot.teacherId,
            classId: cls.classId,
            subjectId: slot.subjectId,
            date: dateStr,
            dayOfWeek,
            periodNumber: slot.periodNumber,
            startTime: slot.startTime,
            endTime: slot.endTime,
            room: slot.room || cls.roomNumber || 'បន្ទប់ ១២',
            chapterTitle: currItem.chapterTitle,
            lessonTitle: currItem.lessonTitle,
            topicTitle: currItem.topicTitle,
            periodIndexForLesson: periodsAllocated + 1,
            totalPeriodsForLesson: currItem.requiredPeriods,
            status: 'planned',
            attendanceRecorded: false,
            lessonPlanId: `LP-${scheduledLessonId}`
          };

          generatedLessons.push(scheduledLesson);
          periodsAllocated++;
          lastDateForThisItem = dateStr;
        }

        if (lastDateForThisItem) {
          expectedCompletionDates[currItem.curriculumId] = lastDateForThisItem;
        }

        if (periodsAllocated < currItem.requiredPeriods) {
          insufficientCapacityWarnings.push(
            `ថ្នាក់ ${cls.className}: មិនមានម៉ោងបង្រៀនគ្រប់គ្រាន់សម្រាប់ "${currItem.lessonTitle}" (ខ្វះ ${currItem.requiredPeriods - periodsAllocated} ម៉ោង)`
          );
          if (!unallocatedCurriculumItems.find(u => u.curriculumId === currItem.curriculumId)) {
            unallocatedCurriculumItems.push(currItem);
          }
        }
      }
    }

    // STEP 10: Save all generated sessions in ScheduledLessons
    await storageService.saveScheduledLessons(generatedLessons);

    // Group sessions by class for result
    const sessionsByClass: { [classId: string]: ScheduledLesson[] } = {};
    for (const lesson of generatedLessons) {
      if (!sessionsByClass[lesson.classId]) {
        sessionsByClass[lesson.classId] = [];
      }
      sessionsByClass[lesson.classId].push(lesson);
    }

    return {
      totalGenerated: generatedLessons.length,
      totalPreserved: completedOrRecordedMap.size,
      completedLessons: generatedLessons.filter(l => l.status === 'completed').length,
      unallocatedCurriculumItems,
      expectedCompletionDates,
      insufficientCapacityWarnings,
      sessionsByClass
    };
  }

  /**
   * Reschedules a missed lesson to an available future date.
   */
  public async rescheduleMissedLesson(
    missedLessonId: string,
    newDate: string,
    newPeriodNumber: number,
    substituteTeacherId?: string
  ): Promise<ScheduledLesson> {
    const lessons = await storageService.getScheduledLessons();
    const missedIndex = lessons.findIndex(l => l.scheduledLessonId === missedLessonId);
    if (missedIndex < 0) {
      throw new Error(`Scheduled lesson ${missedLessonId} not found`);
    }

    const originalLesson = lessons[missedIndex];
    lessons[missedIndex] = {
      ...originalLesson,
      status: 'missed',
      missedReason: 'គ្រូបង្រៀនបានស្នើសុំបង្រៀនសង'
    };

    // Create make-up lesson record
    const makeUpId = `MKP-${Date.now()}`;
    await storageService.saveMakeUpLesson({
      makeUpId,
      originalScheduledLessonId: originalLesson.scheduledLessonId,
      curriculumId: originalLesson.curriculumId,
      teacherId: substituteTeacherId || originalLesson.teacherId,
      classId: originalLesson.classId,
      subjectId: originalLesson.subjectId,
      originalDate: originalLesson.date,
      newDate,
      dayOfWeek: new Date(newDate).getDay(),
      periodNumber: newPeriodNumber,
      startTime: originalLesson.startTime,
      endTime: originalLesson.endTime,
      room: originalLesson.room,
      substituteTeacherId,
      reason: 'បង្រៀនសងម៉ោងដែលខកខាន',
      status: 'pending'
    });

    // Create new scheduled lesson on newDate
    const rescheduledLessonId = `SCH-RES-${Date.now()}`;
    const newSession: ScheduledLesson = {
      ...originalLesson,
      scheduledLessonId: rescheduledLessonId,
      date: newDate,
      periodNumber: newPeriodNumber,
      teacherId: substituteTeacherId || originalLesson.teacherId,
      status: 'rescheduled',
      notes: `ម៉ោងបង្រៀនសងពីកាលបរិច្ឆេទ ${originalLesson.date}`
    };

    lessons.push(newSession);
    await storageService.saveScheduledLessons(lessons);
    return newSession;
  }
}

export const schedulerEngine = new SchedulerEngine();
