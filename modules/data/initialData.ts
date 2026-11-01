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
  LessonPlan,
  TeachingPeriod
} from '../types';

export const initialSchoolSettings: SchoolSettings = {
  schoolId: 'SCH-HSBD-01',
  schoolNameKm: 'វិទ្យាល័យ ហ៊ុន សែន បាត់ដឹង',
  schoolNameEn: 'Hun Sen Batdoeng High School',
  schoolCode: 'HSBD-2026',
  academicYearActiveId: 'AY-2025-2026',
  currentSemester: 1,
  principalName: 'លោកនាយក ឈុន គឹមសាន',
  location: 'ឃុំបាត់ដឹង ស្រុកឧដុង្គ ខេត្តកំពង់ស្ពឺ',
  contactPhone: '012 998 877',
  contactEmail: 'contact@batdoenghs.moeys.gov.kh',
  periodDurationMinutes: 50,
  periodsPerDay: 8,
  morningPeriods: 4,
  afternoonPeriods: 4,
  breakBetweenPeriodsMinutes: 10,
  longBreakMinutes: 20
};

export const standardTeachingPeriods: TeachingPeriod[] = [
  { periodNumber: 1, periodNameKm: 'ម៉ោងទី ១ (ព្រឹក)', startTime: '07:00', endTime: '07:50', session: 'morning' },
  { periodNumber: 2, periodNameKm: 'ម៉ោងទី ២ (ព្រឹក)', startTime: '08:00', endTime: '08:50', session: 'morning' },
  { periodNumber: 3, periodNameKm: 'ម៉ោងទី ៣ (ព្រឹក)', startTime: '09:10', endTime: '10:00', session: 'morning' },
  { periodNumber: 4, periodNameKm: 'ម៉ោងទី ៤ (ព្រឹក)', startTime: '10:10', endTime: '11:00', session: 'morning' },
  { periodNumber: 5, periodNameKm: 'ម៉ោងទី ៥ (រសៀល)', startTime: '13:00', endTime: '13:50', session: 'afternoon' },
  { periodNumber: 6, periodNameKm: 'ម៉ោងទី ៦ (រសៀល)', startTime: '14:00', endTime: '14:50', session: 'afternoon' },
  { periodNumber: 7, periodNameKm: 'ម៉ោងទី ៧ (រសៀល)', startTime: '15:10', endTime: '16:00', session: 'afternoon' },
  { periodNumber: 8, periodNameKm: 'ម៉ោងទី ៨ (រសៀល)', startTime: '16:10', endTime: '17:00', session: 'afternoon' }
];

export const initialAcademicYears: AcademicYear[] = [
  {
    academicYearId: 'AY-2025-2026',
    yearName: 'ឆ្នាំសិក្សា ២០២៥-២០២៦',
    startDate: '2025-11-01',
    endDate: '2026-08-31',
    status: 'active',
    description: 'ឆ្នាំសិក្សាផ្លូវការតាមសេចក្តីណែនាំក្រសួងអប់រំ យុវជន និងកីឡា (៣៨ សប្តាហ៍បង្រៀន)',
    totalWeeks: 38,
    semester1StartDate: '2025-11-01',
    semester1EndDate: '2026-03-31',
    semester2StartDate: '2026-04-01',
    semester2EndDate: '2026-08-31'
  },
  {
    academicYearId: 'AY-2024-2025',
    yearName: 'ឆ្នាំសិក្សា ២០២៤-២០២៥',
    startDate: '2024-11-01',
    endDate: '2025-08-31',
    status: 'archived',
    description: 'ឆ្នាំសិក្សាកន្លងផុត (ប្រវត្តិទិន្នន័យ)',
    totalWeeks: 38,
    semester1StartDate: '2024-11-01',
    semester1EndDate: '2025-03-31',
    semester2StartDate: '2025-04-01',
    semester2EndDate: '2025-08-31'
  }
];

export const initialTeachers: Teacher[] = [
  {
    teacherId: 'T-001',
    teacherCode: 'KS-100221',
    fullName: 'កែវ សំណាង',
    gender: 'M',
    phone: '012 889 456',
    email: 'samnang.keo@school.edu.kh',
    address: 'ភូមិបាត់ដឹង ឃុំបាត់ដឹង ស្រុកឧដុង្គ ខេត្តកំពង់ស្ពឺ',
    subjects: ['SUB-MATH-8'],
    assignedClasses: ['CLS-8A', 'CLS-8B', 'CLS-8C', 'CLS-8D'],
    employmentStatus: 'active',
    userId: 'USR-KS-01',
    qualification: 'បរិញ្ញាបត្រគរុកោសល្យ (គណិតវិទ្យា)',
    position: 'គ្រូបង្រៀនកម្រិតមូលដ្ឋាន',
    hireDate: '2018-10-01'
  },
  {
    teacherId: 'T-002',
    teacherCode: 'SS-100222',
    fullName: 'ស៊ុន សុភា',
    gender: 'F',
    phone: '098 765 432',
    email: 'sophea.sun@school.edu.kh',
    address: 'ស្រុកឧដុង្គ ខេត្តកំពង់ស្ពឺ',
    subjects: ['SUB-KHM-8'],
    assignedClasses: ['CLS-8A', 'CLS-8B'],
    employmentStatus: 'active',
    qualification: 'បរិញ្ញាបត្រអក្សរសាស្ត្រខ្មែរ',
    position: 'គ្រូបង្រៀន',
    hireDate: '2019-10-01'
  },
  {
    teacherId: 'T-003',
    teacherCode: 'MS-100223',
    fullName: 'ម៉ែន សុខា',
    gender: 'M',
    phone: '011 234 567',
    email: 'sokha.men@school.edu.kh',
    address: 'ស្រុកឧដុង្គ ខេត្តកំពង់ស្ពឺ',
    subjects: ['SUB-PHY-8'],
    assignedClasses: ['CLS-8C', 'CLS-8D'],
    employmentStatus: 'active',
    qualification: 'បរិញ្ញាបត្ររូបវិទ្យា',
    position: 'គ្រូបង្រៀន',
    hireDate: '2020-10-01'
  },
  {
    teacherId: 'T-004',
    teacherCode: 'CT-100224',
    fullName: 'ចាន់ ធារី',
    gender: 'F',
    phone: '077 345 678',
    email: 'theary.chan@school.edu.kh',
    address: 'ស្រុកឧដុង្គ ខេត្តកំពង់ស្ពឺ',
    subjects: ['SUB-BIO-8', 'SUB-CHM-8'],
    assignedClasses: ['CLS-8A', 'CLS-8B', 'CLS-8C', 'CLS-8D'],
    employmentStatus: 'active',
    qualification: 'បរិញ្ញាបត្រវិទ្យាសាស្ត្រ',
    position: 'គ្រូបង្រៀន',
    hireDate: '2021-10-01'
  }
];

export const initialClasses: ClassRoom[] = [
  {
    classId: 'CLS-8A',
    grade: 8,
    className: '៨ក (8A)',
    academicYearId: 'AY-2025-2026',
    homeroomTeacherId: 'T-001',
    capacity: 45,
    status: 'active',
    roomNumber: 'បន្ទប់ ១២',
    totalStudents: 42
  },
  {
    classId: 'CLS-8B',
    grade: 8,
    className: '៨ខ (8B)',
    academicYearId: 'AY-2025-2026',
    homeroomTeacherId: 'T-002',
    capacity: 45,
    status: 'active',
    roomNumber: 'បន្ទប់ ១៣',
    totalStudents: 40
  },
  {
    classId: 'CLS-8C',
    grade: 8,
    className: '៨គ (8C)',
    academicYearId: 'AY-2025-2026',
    homeroomTeacherId: 'T-003',
    capacity: 45,
    status: 'active',
    roomNumber: 'បន្ទប់ ១៤',
    totalStudents: 41
  },
  {
    classId: 'CLS-8D',
    grade: 8,
    className: '៨ឃ (8D)',
    academicYearId: 'AY-2025-2026',
    homeroomTeacherId: 'T-004',
    capacity: 45,
    status: 'active',
    roomNumber: 'បន្ទប់ ១៥',
    totalStudents: 39
  }
];

export const initialSubjects: Subject[] = [
  {
    subjectId: 'SUB-MATH-8',
    subjectCode: 'MTH-8',
    subjectName: 'គណិតវិទ្យា (Mathematics)',
    description: 'កម្មវិធីគណិតវិទ្យាថ្នាក់ទី ៨ តាមស្តង់ដារក្រសួងអប់រំ យុវជន និងកីឡា',
    color: '#2563eb', // blue
    status: 'active',
    weeklyPeriods: 4,
    gradeLevels: [8]
  },
  {
    subjectId: 'SUB-KHM-8',
    subjectCode: 'KHM-8',
    subjectName: 'ភាសាខ្មែរ (Khmer Literature)',
    description: 'ភាសាខ្មែរ វេយ្យាករណ៍ និងអត្ថបទអាន ថ្នាក់ទី ៨',
    color: '#dc2626', // red
    status: 'active',
    weeklyPeriods: 5,
    gradeLevels: [8]
  },
  {
    subjectId: 'SUB-PHY-8',
    subjectCode: 'PHY-8',
    subjectName: 'រូបវិទ្យា (Physics)',
    description: 'វិទ្យាសាស្ត្ររូបវិទ្យា ថ្នាក់ទី ៨',
    color: '#059669', // green
    status: 'active',
    weeklyPeriods: 2,
    gradeLevels: [8]
  },
  {
    subjectId: 'SUB-CHM-8',
    subjectCode: 'CHM-8',
    subjectName: 'គីមីវិទ្យា (Chemistry)',
    description: 'វិទ្យាសាស្ត្រគីមីវិទ្យា ថ្នាក់ទី ៨',
    color: '#7c3aed', // purple
    status: 'active',
    weeklyPeriods: 2,
    gradeLevels: [8]
  },
  {
    subjectId: 'SUB-BIO-8',
    subjectCode: 'BIO-8',
    subjectName: 'ជីវវិទ្យា (Biology)',
    description: 'ជីវវិទ្យានិងផែនដីវិទ្យា ថ្នាក់ទី ៨',
    color: '#0891b2', // cyan
    status: 'active',
    weeklyPeriods: 2,
    gradeLevels: [8]
  },
  {
    subjectId: 'SUB-ENG-8',
    subjectCode: 'ENG-8',
    subjectName: 'ភាសាអង់គ្លេស (English)',
    description: 'English for Grade 8',
    color: '#d97706', // amber
    status: 'active',
    weeklyPeriods: 3,
    gradeLevels: [8]
  }
];

export const initialCurriculum: CurriculumItem[] = [
  // ជំពូកទី ១: ចំនួនគត់រ៉ឺឡាទីវ (Integers)
  {
    curriculumId: 'CUR-01',
    academicYearId: 'AY-2025-2026',
    grade: 8,
    subjectId: 'SUB-MATH-8',
    chapterNumber: 1,
    chapterTitle: 'ជំពូកទី ១៖ ចំនួនគត់រ៉ឺឡាទីវ',
    lessonTitle: 'មេរៀនទី ១៖ និយមន័យ និងការប្រៀបធៀបចំនួនគត់រ៉ឺឡាទីវ',
    topicTitle: 'ចំនួនវិជ្ជមាន អវិជ្ជមាន និងការតាងលើបន្ទាត់ចំនួន',
    lessonOrder: 1,
    requiredPeriods: 2,
    learningObjectives: 'សិស្សកំណត់បានចំនួនវិជ្ជមាន អវិជ្ជមាន និងប្រៀបធៀបចំនួនគត់រ៉ឺឡាទីវបានត្រឹមត្រូវ។',
    status: 'completed',
    completedPeriods: 2,
    weekNumber: 1
  },
  {
    curriculumId: 'CUR-02',
    academicYearId: 'AY-2025-2026',
    grade: 8,
    subjectId: 'SUB-MATH-8',
    chapterNumber: 1,
    chapterTitle: 'ជំពូកទី ១៖ ចំនួនគត់រ៉ឺឡាទីវ',
    lessonTitle: 'មេរៀនទី ២៖ ប្រមាណវិធីបូក និងដកចំនួនគត់រ៉ឺឡាទីវ',
    topicTitle: 'ការបូកចំនួនមានសញ្ញាដូចគ្នា និងសញ្ញាខុសគ្នា',
    lessonOrder: 2,
    requiredPeriods: 3,
    learningObjectives: 'សិស្សគណនាផលបូក និងផលដកនៃចំនួនគត់រ៉ឺឡាទីវដោយប្រើវិធានបានយ៉ាងច្បាស់លាស់។',
    status: 'completed',
    completedPeriods: 3,
    weekNumber: 2
  },
  {
    curriculumId: 'CUR-03',
    academicYearId: 'AY-2025-2026',
    grade: 8,
    subjectId: 'SUB-MATH-8',
    chapterNumber: 1,
    chapterTitle: 'ជំពូកទី ១៖ ចំនួនគត់រ៉ឺឡាទីវ',
    lessonTitle: 'មេរៀនទី ៣៖ ប្រមាណវិធីគុណ និងចែកចំនួនគត់រ៉ឺឡាទីវ',
    topicTitle: 'វិធានសញ្ញាក្នុងការគុណ និងការចែក',
    lessonOrder: 3,
    requiredPeriods: 3,
    learningObjectives: 'សិស្សអនុវត្តវិធានសញ្ញាក្នុងការគុណ និងចែកចំនួនគត់រ៉ឺឡាទីវបានត្រឹមត្រូវ។',
    status: 'completed',
    completedPeriods: 3,
    weekNumber: 3
  },
  // ជំពូកទី ២: ចំនួនសនិទាន (Rational Numbers)
  {
    curriculumId: 'CUR-04',
    academicYearId: 'AY-2025-2026',
    grade: 8,
    subjectId: 'SUB-MATH-8',
    chapterNumber: 2,
    chapterTitle: 'ជំពូកទី ២៖ ចំនួនសនិទាន',
    lessonTitle: 'មេរៀនទី ១៖ និយមន័យ និងទម្រង់ចំនួនសនិទាន',
    topicTitle: 'ប្រភាគ និងចំនួនទសភាគសនិទាន',
    lessonOrder: 4,
    requiredPeriods: 2,
    learningObjectives: 'សិស្សស្គាល់ទម្រង់ a/b (b != 0) និងបំប្លែងទសភាគខួបទៅជាប្រភាគ។',
    status: 'in_progress',
    completedPeriods: 1,
    weekNumber: 4
  },
  {
    curriculumId: 'CUR-05',
    academicYearId: 'AY-2025-2026',
    grade: 8,
    subjectId: 'SUB-MATH-8',
    chapterNumber: 2,
    chapterTitle: 'ជំពូកទី ២៖ ចំនួនសនិទាន',
    lessonTitle: 'មេរៀនទី ២៖ ប្រមាណវិធីលើចំនួនសនិទាន',
    topicTitle: 'ការបូក ដក គុណ ចែក ប្រភាគសនិទាន',
    lessonOrder: 5,
    requiredPeriods: 4,
    learningObjectives: 'សិស្សអាចគណនាកន្សោមលេខដែលមានប្រមាណវិធីចម្រុះលើចំនួនសនិទាន។',
    status: 'planned',
    completedPeriods: 0,
    weekNumber: 5
  },
  // ជំពូកទី ៣: ស្វ័យគុណ (Powers & Exponents)
  {
    curriculumId: 'CUR-06',
    academicYearId: 'AY-2025-2026',
    grade: 8,
    subjectId: 'SUB-MATH-8',
    chapterNumber: 3,
    chapterTitle: 'ជំពូកទី ៣៖ ស្វ័យគុណ',
    lessonTitle: 'មេរៀនទី ១៖ ស្វ័យគុណនៃចំនួនសនិទាន',
    topicTitle: 'ស្វ័យគុណដែលមាននិទស្សន្តជាចំនួនគត់វិជ្ជមាន និងអវិជ្ជមាន',
    lessonOrder: 6,
    requiredPeriods: 3,
    learningObjectives: 'សិស្សយល់ពីលក្ខណៈស្វ័យគុណ a^m * a^n, (a^m)^n, (ab)^n និងអនុវត្តបាន។',
    status: 'planned',
    completedPeriods: 0,
    weekNumber: 6
  },
  // ជំពូកទី ៤: កន្សោមពីជគណិត (Algebraic Expressions)
  {
    curriculumId: 'CUR-07',
    academicYearId: 'AY-2025-2026',
    grade: 8,
    subjectId: 'SUB-MATH-8',
    chapterNumber: 4,
    chapterTitle: 'ជំពូកទី ៤៖ កន្សោមពីជគណិត',
    lessonTitle: 'មេរៀនទី ១៖ ឯកធា និងពហុធា',
    topicTitle: 'ដឺក្រេនៃឯកធា និងពហុធា ការបូកដកពហុធា',
    lessonOrder: 7,
    requiredPeriods: 4,
    learningObjectives: 'សិស្សចេះកំណត់ដឺក្រេ និងគណនាផលបូក ផលដកពហុធាដោយបង្រួមតួដូចគ្នា។',
    status: 'planned',
    completedPeriods: 0,
    weekNumber: 7
  },
  {
    curriculumId: 'CUR-08',
    academicYearId: 'AY-2025-2026',
    grade: 8,
    subjectId: 'SUB-MATH-8',
    chapterNumber: 4,
    chapterTitle: 'ជំពូកទី ៤៖ កន្សោមពីជគណិត',
    lessonTitle: 'មេរៀនទី ២៖ ការគុណ និងចែកពហុធា',
    topicTitle: 'ការគុណឯកធានឹងពហុធា និងការគុណពហុធានឹងពហុធា',
    lessonOrder: 8,
    requiredPeriods: 4,
    learningObjectives: 'សិស្សពង្រាយកន្សោមពីជគណិត និងចេះប្រើរូបមន្តស្វ័យគុណទ្វេធា (a+b)^2, (a-b)^2, a^2-b^2។',
    status: 'planned',
    completedPeriods: 0,
    weekNumber: 8
  },
  // ជំពូកទី ៥: សមីការដឺក្រេទី១ មានមួយអថេរ (Linear Equations)
  {
    curriculumId: 'CUR-09',
    academicYearId: 'AY-2025-2026',
    grade: 8,
    subjectId: 'SUB-MATH-8',
    chapterNumber: 5,
    chapterTitle: 'ជំពូកទី ៥៖ សមីការដឺក្រេទី១ មានមួយអថេរ',
    lessonTitle: 'មេរៀនទី ១៖ ការដោះស្រាយសមីការ ax + b = 0',
    topicTitle: 'វិធានផ្ទេរតួ និងការដកស្រង់ឫសសមីការ',
    lessonOrder: 9,
    requiredPeriods: 4,
    learningObjectives: 'សិស្សដោះស្រាយសមីការដឺក្រេទី១ មានមួយអថេរបានយ៉ាងស្ទាត់ជំនាញ។',
    status: 'planned',
    completedPeriods: 0,
    weekNumber: 9
  },
  {
    curriculumId: 'CUR-10',
    academicYearId: 'AY-2025-2026',
    grade: 8,
    subjectId: 'SUB-MATH-8',
    chapterNumber: 5,
    chapterTitle: 'ជំពូកទី ៥៖ សមីការដឺក្រេទី១ មានមួយអថេរ',
    lessonTitle: 'មេរៀនទី ២៖ ចំណោទសមីការ',
    topicTitle: 'ការបំប្លែងលំហាត់ជាក់ស្តែងមកជាសមីការពីជគណិត',
    lessonOrder: 10,
    requiredPeriods: 3,
    learningObjectives: 'សិស្សដោះស្រាយចំណោទគណិតវិទ្យាជីវភាពរស់នៅតាមរយៈសមីការបានត្រឹមត្រូវ។',
    status: 'planned',
    completedPeriods: 0,
    weekNumber: 10
  },
  // ជំពូកទី ៦: វិសមីការដឺក្រេទី១ មានមួយអថេរ (Inequalities)
  {
    curriculumId: 'CUR-11',
    academicYearId: 'AY-2025-2026',
    grade: 8,
    subjectId: 'SUB-MATH-8',
    chapterNumber: 6,
    chapterTitle: 'ជំពូកទី ៦៖ វិសមីការដឺក្រេទី១ មានមួយអថេរ',
    lessonTitle: 'មេរៀនទី ១៖ វិធានដោះស្រាយវិសមីការ',
    topicTitle: 'លក្ខណៈវិសមភាព និងការតាងចម្លើយលើបន្ទាត់ចំនួន',
    lessonOrder: 11,
    requiredPeriods: 3,
    learningObjectives: 'សិស្សដោះស្រាយវិសមីការ និងគូសក្រាហ្វិចម្លើយលើបន្ទាត់ចំនួន។',
    status: 'planned',
    completedPeriods: 0,
    weekNumber: 11
  },
  // ជំពូកទី ៧: ធរណីមាត្រ មុំ និងបន្ទាត់ស្រប (Geometry: Angles & Parallel Lines)
  {
    curriculumId: 'CUR-12',
    academicYearId: 'AY-2025-2026',
    grade: 8,
    subjectId: 'SUB-MATH-8',
    chapterNumber: 7,
    chapterTitle: 'ជំពូកទី ៧៖ មុំ និងបន្ទាត់ស្រប',
    lessonTitle: 'មេរៀនទី ១៖ មុំកើតពីបន្ទាត់ពីរស្របគ្នាកាត់ដោយខាត់កាត់មួយ',
    topicTitle: 'មុំឆ្លាស់ក្នុង មុំឆ្លាស់ក្រៅ និងមុំត្រូវគ្នា',
    lessonOrder: 12,
    requiredPeriods: 4,
    learningObjectives: 'សិស្សកំណត់លក្ខណៈនៃមុំ និងបញ្ជាក់បន្ទាត់ពីរស្របគ្នាដោយប្រើលក្ខណៈមុំ។',
    status: 'planned',
    completedPeriods: 0,
    weekNumber: 12
  },
  // ជំពូកទី ៨: ត្រីកោណ និងទ្រឹស្តីបទពីតាករ (Triangles & Pythagorean Theorem)
  {
    curriculumId: 'CUR-13',
    academicYearId: 'AY-2025-2026',
    grade: 8,
    subjectId: 'SUB-MATH-8',
    chapterNumber: 8,
    chapterTitle: 'ជំពូកទី ៨៖ ត្រីកោណ និងទ្រឹស្តីបទពីតាករ',
    lessonTitle: 'មេរៀនទី ១៖ ទ្រឹស្តីបទពីតាករក្នុងត្រីកោណកែង',
    topicTitle: 'រូបមន្ត a^2 + b^2 = c^2 និងទ្រឹស្តីបទច្រាស',
    lessonOrder: 13,
    requiredPeriods: 4,
    learningObjectives: 'សិស្សគណនាប្រវែងជ្រុងត្រីកោណកែង និងបញ្ជាក់ត្រីកោណកែងដោយប្រើពីតាករ។',
    status: 'planned',
    completedPeriods: 0,
    weekNumber: 13
  },
  // ជំពូកទី ៩: ស្ថិតិវិទ្យា (Statistics)
  {
    curriculumId: 'CUR-14',
    academicYearId: 'AY-2025-2026',
    grade: 8,
    subjectId: 'SUB-MATH-8',
    chapterNumber: 9,
    chapterTitle: 'ជំពូកទី ៩៖ ស្ថិតិវិទ្យា',
    lessonTitle: 'មេរៀនទី ១៖ ការប្រមូលទិន្នន័យ តារាងប្រេកង់ និងមធ្យមភាគ',
    topicTitle: 'ការគណនាមធ្យមភាគ ម៉ូត និងមេដ្យាន',
    lessonOrder: 14,
    requiredPeriods: 4,
    learningObjectives: 'សិស្សចេះរៀបចំតារាងស្ថិតិ និងគណនាតម្លៃកណ្តាលនៃទិន្នន័យ។',
    status: 'planned',
    completedPeriods: 0,
    weekNumber: 14
  }
];

// Timetable for Teacher Keo Samnang (16 periods/week: 4 classes x 4 periods/week)
export const initialTimetable: TimetableSlot[] = [
  // ថ្ងៃចន្ទ (Monday = 1)
  {
    timetableId: 'TT-01',
    academicYearId: 'AY-2025-2026',
    teacherId: 'T-001',
    classId: 'CLS-8A',
    subjectId: 'SUB-MATH-8',
    dayOfWeek: 1,
    periodNumber: 1,
    startTime: '07:00',
    endTime: '07:50',
    room: 'បន្ទប់ ១២',
    effectiveStartDate: '2025-11-01',
    effectiveEndDate: '2026-08-31',
    status: 'active'
  },
  {
    timetableId: 'TT-02',
    academicYearId: 'AY-2025-2026',
    teacherId: 'T-001',
    classId: 'CLS-8B',
    subjectId: 'SUB-MATH-8',
    dayOfWeek: 1,
    periodNumber: 2,
    startTime: '08:00',
    endTime: '08:50',
    room: 'បន្ទប់ ១៣',
    effectiveStartDate: '2025-11-01',
    effectiveEndDate: '2026-08-31',
    status: 'active'
  },
  {
    timetableId: 'TT-03',
    academicYearId: 'AY-2025-2026',
    teacherId: 'T-001',
    classId: 'CLS-8C',
    subjectId: 'SUB-MATH-8',
    dayOfWeek: 1,
    periodNumber: 3,
    startTime: '09:10',
    endTime: '10:00',
    room: 'បន្ទប់ ១៤',
    effectiveStartDate: '2025-11-01',
    effectiveEndDate: '2026-08-31',
    status: 'active'
  },

  // ថ្ងៃអង្គារ (Tuesday = 2)
  {
    timetableId: 'TT-04',
    academicYearId: 'AY-2025-2026',
    teacherId: 'T-001',
    classId: 'CLS-8D',
    subjectId: 'SUB-MATH-8',
    dayOfWeek: 2,
    periodNumber: 1,
    startTime: '07:00',
    endTime: '07:50',
    room: 'បន្ទប់ ១៥',
    effectiveStartDate: '2025-11-01',
    effectiveEndDate: '2026-08-31',
    status: 'active'
  },
  {
    timetableId: 'TT-05',
    academicYearId: 'AY-2025-2026',
    teacherId: 'T-001',
    classId: 'CLS-8A',
    subjectId: 'SUB-MATH-8',
    dayOfWeek: 2,
    periodNumber: 2,
    startTime: '08:00',
    endTime: '08:50',
    room: 'បន្ទប់ ១២',
    effectiveStartDate: '2025-11-01',
    effectiveEndDate: '2026-08-31',
    status: 'active'
  },
  {
    timetableId: 'TT-06',
    academicYearId: 'AY-2025-2026',
    teacherId: 'T-001',
    classId: 'CLS-8B',
    subjectId: 'SUB-MATH-8',
    dayOfWeek: 2,
    periodNumber: 4,
    startTime: '10:10',
    endTime: '11:00',
    room: 'បន្ទប់ ១៣',
    effectiveStartDate: '2025-11-01',
    effectiveEndDate: '2026-08-31',
    status: 'active'
  },

  // ថ្ងៃពុធ (Wednesday = 3)
  {
    timetableId: 'TT-07',
    academicYearId: 'AY-2025-2026',
    teacherId: 'T-001',
    classId: 'CLS-8C',
    subjectId: 'SUB-MATH-8',
    dayOfWeek: 3,
    periodNumber: 1,
    startTime: '07:00',
    endTime: '07:50',
    room: 'បន្ទប់ ១៤',
    effectiveStartDate: '2025-11-01',
    effectiveEndDate: '2026-08-31',
    status: 'active'
  },
  {
    timetableId: 'TT-08',
    academicYearId: 'AY-2025-2026',
    teacherId: 'T-001',
    classId: 'CLS-8D',
    subjectId: 'SUB-MATH-8',
    dayOfWeek: 3,
    periodNumber: 2,
    startTime: '08:00',
    endTime: '08:50',
    room: 'បន្ទប់ ១៥',
    effectiveStartDate: '2025-11-01',
    effectiveEndDate: '2026-08-31',
    status: 'active'
  },
  {
    timetableId: 'TT-09',
    academicYearId: 'AY-2025-2026',
    teacherId: 'T-001',
    classId: 'CLS-8A',
    subjectId: 'SUB-MATH-8',
    dayOfWeek: 3,
    periodNumber: 3,
    startTime: '09:10',
    endTime: '10:00',
    room: 'បន្ទប់ ១២',
    effectiveStartDate: '2025-11-01',
    effectiveEndDate: '2026-08-31',
    status: 'active'
  },

  // ថ្ងៃព្រហស្បតិ៍ (Thursday = 4)
  {
    timetableId: 'TT-10',
    academicYearId: 'AY-2025-2026',
    teacherId: 'T-001',
    classId: 'CLS-8B',
    subjectId: 'SUB-MATH-8',
    dayOfWeek: 4,
    periodNumber: 1,
    startTime: '07:00',
    endTime: '07:50',
    room: 'បន្ទប់ ១៣',
    effectiveStartDate: '2025-11-01',
    effectiveEndDate: '2026-08-31',
    status: 'active'
  },
  {
    timetableId: 'TT-11',
    academicYearId: 'AY-2025-2026',
    teacherId: 'T-001',
    classId: 'CLS-8C',
    subjectId: 'SUB-MATH-8',
    dayOfWeek: 4,
    periodNumber: 2,
    startTime: '08:00',
    endTime: '08:50',
    room: 'បន្ទប់ ១៤',
    effectiveStartDate: '2025-11-01',
    effectiveEndDate: '2026-08-31',
    status: 'active'
  },
  {
    timetableId: 'TT-12',
    academicYearId: 'AY-2025-2026',
    teacherId: 'T-001',
    classId: 'CLS-8D',
    subjectId: 'SUB-MATH-8',
    dayOfWeek: 4,
    periodNumber: 4,
    startTime: '10:10',
    endTime: '11:00',
    room: 'បន្ទប់ ១៥',
    effectiveStartDate: '2025-11-01',
    effectiveEndDate: '2026-08-31',
    status: 'active'
  },

  // ថ្ងៃសុក្រ (Friday = 5)
  {
    timetableId: 'TT-13',
    academicYearId: 'AY-2025-2026',
    teacherId: 'T-001',
    classId: 'CLS-8A',
    subjectId: 'SUB-MATH-8',
    dayOfWeek: 5,
    periodNumber: 1,
    startTime: '07:00',
    endTime: '07:50',
    room: 'បន្ទប់ ១២',
    effectiveStartDate: '2025-11-01',
    effectiveEndDate: '2026-08-31',
    status: 'active'
  },
  {
    timetableId: 'TT-14',
    academicYearId: 'AY-2025-2026',
    teacherId: 'T-001',
    classId: 'CLS-8B',
    subjectId: 'SUB-MATH-8',
    dayOfWeek: 5,
    periodNumber: 2,
    startTime: '08:00',
    endTime: '08:50',
    room: 'បន្ទប់ ១៣',
    effectiveStartDate: '2025-11-01',
    effectiveEndDate: '2026-08-31',
    status: 'active'
  },

  // ថ្ងៃសៅរ៍ (Saturday = 6)
  {
    timetableId: 'TT-15',
    academicYearId: 'AY-2025-2026',
    teacherId: 'T-001',
    classId: 'CLS-8C',
    subjectId: 'SUB-MATH-8',
    dayOfWeek: 6,
    periodNumber: 1,
    startTime: '07:00',
    endTime: '07:50',
    room: 'បន្ទប់ ១៤',
    effectiveStartDate: '2025-11-01',
    effectiveEndDate: '2026-08-31',
    status: 'active'
  },
  {
    timetableId: 'TT-16',
    academicYearId: 'AY-2025-2026',
    teacherId: 'T-001',
    classId: 'CLS-8D',
    subjectId: 'SUB-MATH-8',
    dayOfWeek: 6,
    periodNumber: 2,
    startTime: '08:00',
    endTime: '08:50',
    room: 'បន្ទប់ ១៥',
    effectiveStartDate: '2025-11-01',
    effectiveEndDate: '2026-08-31',
    status: 'active'
  }
];

export const initialCalendarEvents: SchoolCalendarEvent[] = [
  {
    eventId: 'EV-01',
    academicYearId: 'AY-2025-2026',
    eventTitle: 'បើកបវេសនកាលឆ្នាំសិក្សា ២០២៥-២០២៦',
    eventType: 'academic_opening',
    startDate: '2025-11-01',
    endDate: '2025-11-01',
    isFullDay: true,
    isTeachingDay: false,
    description: 'ពិធីបើកបវេសនកាលផ្លូវការទូទាំងប្រទេស'
  },
  {
    eventId: 'EV-02',
    academicYearId: 'AY-2025-2026',
    eventTitle: 'ទិវាបុណ្យឯករាជ្យជាតិ (៩ វិច្ឆិកា)',
    eventType: 'national_holiday',
    startDate: '2025-11-09',
    endDate: '2025-11-09',
    isFullDay: true,
    isTeachingDay: false,
    description: 'ខួបអនុស្សាវរីយ៍ទិវាបុណ្យឯករាជ្យជាតិលើកទី ៧២'
  },
  {
    eventId: 'EV-03',
    academicYearId: 'AY-2025-2026',
    eventTitle: 'ព្រះរាជពិធីបុណ្យអុំទូក បណ្តែតប្រទីប និងសំពះព្រះខែ អកអំបុក',
    eventType: 'traditional_festival',
    startDate: '2025-11-26',
    endDate: '2025-11-28',
    isFullDay: true,
    isTeachingDay: false,
    description: 'ឈប់សម្រាកពិធីបុណ្យអុំទូកប្រពៃណីជាតិ ៣ ថ្ងៃ'
  },
  {
    eventId: 'EV-04',
    academicYearId: 'AY-2025-2026',
    eventTitle: 'ទិវាទិវាជ័យជម្នះលើរបបប្រល័យពូជសាសន៍ (៧ មករា)',
    eventType: 'national_holiday',
    startDate: '2026-01-07',
    endDate: '2026-01-07',
    isFullDay: true,
    isTeachingDay: false,
    description: 'ទិវាជ័យជម្នះ ៧ មករា'
  },
  {
    eventId: 'EV-05',
    academicYearId: 'AY-2025-2026',
    eventTitle: 'ទិវានារីអន្តរជាតិ ៨ មីនា',
    eventType: 'national_holiday',
    startDate: '2026-03-08',
    endDate: '2026-03-08',
    isFullDay: true,
    isTeachingDay: false,
    description: 'ទិវាសិទ្ធិនារីអន្តរជាតិ'
  },
  {
    eventId: 'EV-06',
    academicYearId: 'AY-2025-2026',
    eventTitle: 'ការប្រឡងឆមាសទី ១ ( Semester 1 Exams )',
    eventType: 'examination',
    startDate: '2026-03-24',
    endDate: '2026-03-28',
    isFullDay: true,
    isTeachingDay: false,
    description: 'សប្តាហ៍ប្រឡងវាស់ស្ទង់សមត្ថភាពឆមាសទី ១'
  },
  {
    eventId: 'EV-07',
    academicYearId: 'AY-2025-2026',
    eventTitle: 'ពិធីបុណ្យចូលឆ្នាំថ្មីប្រពៃណីជាតិខ្មែរ',
    eventType: 'traditional_festival',
    startDate: '2026-04-13',
    endDate: '2026-04-16',
    isFullDay: true,
    isTeachingDay: false,
    description: 'ឈប់សម្រាកចូលឆ្នាំប្រពៃណីជាតិ ៤ ថ្ងៃ'
  },
  {
    eventId: 'EV-08',
    academicYearId: 'AY-2025-2026',
    eventTitle: 'ទិវាពលកម្មអន្តរជាតិ (១ ឧសភា)',
    eventType: 'national_holiday',
    startDate: '2026-05-01',
    endDate: '2026-05-01',
    isFullDay: true,
    isTeachingDay: false,
    description: 'ទិវាពលកម្មអន្តរជាតិ'
  },
  {
    eventId: 'EV-09',
    academicYearId: 'AY-2025-2026',
    eventTitle: 'ព្រះរាជពិធីច្រត់ព្រះនង្គ័ល',
    eventType: 'traditional_festival',
    startDate: '2026-05-20',
    endDate: '2026-05-20',
    isFullDay: true,
    isTeachingDay: false,
    description: 'ព្រះរាជពិធីច្រត់ព្រះនង្គ័លប្រពៃណីជាតិ'
  },
  {
    eventId: 'EV-10',
    academicYearId: 'AY-2025-2026',
    eventTitle: 'ការប្រឡងឆមាសទី ២ និងបិទបញ្ចប់ឆ្នាំសិក្សា',
    eventType: 'examination',
    startDate: '2026-08-15',
    endDate: '2026-08-20',
    isFullDay: true,
    isTeachingDay: false,
    description: 'ការប្រឡងបញ្ចប់ឆ្នាំសិក្សា ២០២៥-២០២៦'
  }
];

export const initialStudents: Student[] = [
  // Class 8A (៨ក)
  { studentId: 'ST-8A-01', studentCode: '8A-01', fullName: 'ចាន់ សុវណ្ណារ៉ា', gender: 'M', dateOfBirth: '2012-03-15', classId: 'CLS-8A', guardianName: 'ចាន់ សុខ', guardianPhone: '012 334 455', status: 'active', address: 'ភូមិបាត់ដឹង' },
  { studentId: 'ST-8A-02', studentCode: '8A-02', fullName: 'គឹម ស្រីនិច', gender: 'F', dateOfBirth: '2012-05-20', classId: 'CLS-8A', guardianName: 'គឹម សារឿន', guardianPhone: '097 556 677', status: 'active', address: 'ភូមិបាត់ដឹង' },
  { studentId: 'ST-8A-03', studentCode: '8A-03', fullName: 'ហេង ពិសាល', gender: 'M', dateOfBirth: '2012-01-10', classId: 'CLS-8A', guardianName: 'ហេង វិសាល', guardianPhone: '088 112 233', status: 'active', address: 'ភូមិត្រពាំង' },
  { studentId: 'ST-8A-04', studentCode: '8A-04', fullName: 'សុខ ម៉ាលី', gender: 'F', dateOfBirth: '2012-07-12', classId: 'CLS-8A', guardianName: 'សុខ សារ៉ាត', guardianPhone: '010 445 566', status: 'active', address: 'ភូមិព្រៃព្នៅ' },
  { studentId: 'ST-8A-05', studentCode: '8A-05', fullName: 'ឡុង វិបុល', gender: 'M', dateOfBirth: '2012-09-05', classId: 'CLS-8A', guardianName: 'ឡុង សុភាព', guardianPhone: '092 667 788', status: 'active', address: 'ភូមិបាត់ដឹង' },
  { studentId: 'ST-8A-06', studentCode: '8A-06', fullName: 'សេង ស្រីលក្ខណ៍', gender: 'F', dateOfBirth: '2012-04-18', classId: 'CLS-8A', guardianName: 'សេង ចាន់ថា', guardianPhone: '078 889 900', status: 'active', address: 'ភូមិព្រៃព្នៅ' },
  { studentId: 'ST-8A-07', studentCode: '8A-07', fullName: 'ទិត្យ វីរៈ', gender: 'M', dateOfBirth: '2012-11-22', classId: 'CLS-8A', guardianName: 'ទិត្យ គង់', guardianPhone: '017 332 211', status: 'active', address: 'ភូមិបាត់ដឹង' },
  { studentId: 'ST-8A-08', studentCode: '8A-08', fullName: 'មាស សុធារី', gender: 'F', dateOfBirth: '2012-08-30', classId: 'CLS-8A', guardianName: 'មាស សុខុន', guardianPhone: '096 778 899', status: 'active', address: 'ភូមិត្រពាំង' },

  // Class 8B (៨ខ)
  { studentId: 'ST-8B-01', studentCode: '8B-01', fullName: 'អ៊ុក រតនា', gender: 'M', dateOfBirth: '2012-02-14', classId: 'CLS-8B', guardianName: 'អ៊ុក សារ៉េត', guardianPhone: '012 554 433', status: 'active', address: 'ភូមិបាត់ដឹង' },
  { studentId: 'ST-8B-02', studentCode: '8B-02', fullName: 'ប៉ែន សុជាតា', gender: 'F', dateOfBirth: '2012-06-25', classId: 'CLS-8B', guardianName: 'ប៉ែន ណារិន', guardianPhone: '089 998 877', status: 'active', address: 'ភូមិត្រពាំង' },
  { studentId: 'ST-8B-03', studentCode: '8B-03', fullName: 'ជ័យ សុវណ្ណ', gender: 'M', dateOfBirth: '2012-10-09', classId: 'CLS-8B', guardianName: 'ជ័យ សម្បត្តិ', guardianPhone: '070 332 114', status: 'active', address: 'ភូមិព្រៃព្នៅ' },
  { studentId: 'ST-8B-04', studentCode: '8B-04', fullName: 'នួន ស្រីពៅ', gender: 'F', dateOfBirth: '2012-03-03', classId: 'CLS-8B', guardianName: 'នួន វណ្ណឌី', guardianPhone: '015 667 890', status: 'active', address: 'ភូមិបាត់ដឹង' },

  // Class 8C (៨គ)
  { studentId: 'ST-8C-01', studentCode: '8C-01', fullName: 'រស់ ពិសិដ្ឋ', gender: 'M', dateOfBirth: '2012-04-14', classId: 'CLS-8C', guardianName: 'រស់ សារ៉ន', guardianPhone: '011 445 566', status: 'active', address: 'ភូមិបាត់ដឹង' },
  { studentId: 'ST-8C-02', studentCode: '8C-02', fullName: 'ស៊ឹម រចនា', gender: 'F', dateOfBirth: '2012-08-19', classId: 'CLS-8C', guardianName: 'ស៊ឹម សំបូរ', guardianPhone: '097 223 344', status: 'active', address: 'ភូមិត្រពាំង' },
  { studentId: 'ST-8C-03', studentCode: '8C-03', fullName: 'ពេជ្រ សុភ័ក្ត្រ', gender: 'M', dateOfBirth: '2012-12-01', classId: 'CLS-8C', guardianName: 'ពេជ្រ សុផាន', guardianPhone: '085 889 900', status: 'active', address: 'ភូមិព្រៃព្នៅ' },

  // Class 8D (៨ឃ)
  { studentId: 'ST-8D-01', studentCode: '8D-01', fullName: 'ខៀវ វិទូ', gender: 'M', dateOfBirth: '2012-05-11', classId: 'CLS-8D', guardianName: 'ខៀវ កុសល', guardianPhone: '016 778 899', status: 'active', address: 'ភូមិបាត់ដឹង' },
  { studentId: 'ST-8D-02', studentCode: '8D-02', fullName: 'លីណា សុគន្ធា', gender: 'F', dateOfBirth: '2012-07-28', classId: 'CLS-8D', guardianName: 'លីណា សារឿន', guardianPhone: '093 112 233', status: 'active', address: 'ភូមិត្រពាំង' },
  { studentId: 'ST-8D-03', studentCode: '8D-03', fullName: 'ម៉ៅ វឌ្ឍនៈ', gender: 'M', dateOfBirth: '2012-09-17', classId: 'CLS-8D', guardianName: 'ម៉ៅ ចាន់ឌី', guardianPhone: '012 776 655', status: 'active', address: 'ភូមិព្រៃព្នៅ' }
];

export const sampleLessonPlanGrade8Math: LessonPlan = {
  lessonPlanId: 'LP-SAMPLE-01',
  scheduledLessonId: 'SCH-01',
  academicYearId: 'AY-2025-2026',
  teacherId: 'T-001',
  classId: 'CLS-8A',
  subjectId: 'SUB-MATH-8',
  date: '2025-11-03',
  topic: 'ជំពូកទី ១៖ ចំនួនគត់រ៉ឺឡាទីវ - មេរៀនទី ១៖ និយមន័យ និងការប្រៀបធៀបចំនួនគត់រ៉ឺឡាទីវ',
  objectives: {
    knowledge: 'សិស្សកំណត់បាននូវនិយមន័យនៃចំនួនគត់រ៉ឺឡាទីវ វិជ្ជមាន និងអវិជ្ជមាន បានត្រឹមត្រូវតាមរយៈការសង្កេតបន្ទាត់ចំនួន។',
    skills: 'សិស្សចេះគូសបន្ទាត់ចំនួន តាងចំនួន និងប្រៀបធៀបចំនួនគត់រ៉ឺឡាទីវពីរ ឬច្រើនបានយ៉ាងច្បាស់លាស់។',
    attitude: 'សិស្សមានស្មារតីយកចិត្តទុកដាក់ សហការជាក្រុម និងមានទំនុកចិត្តក្នុងការដោះស្រាយលំហាត់គណិតវិទ្យា។'
  },
  teachingMaterials: 'សៀវភៅពុម្ពគណិតវិទ្យាថ្នាក់ទី ៨ (ក្រសួងអប់រំ), បន្ទាត់វែង, ហ្វឺត, ក្រដាសរូបភាពបន្ទាត់ចំនួន, កាតសំណួរ។',
  teachingMethods: 'វិធីសាស្ត្របង្រៀនតាមបែបសកម្ម (Active Learning), ពិភាក្សាជាដៃគូ (Think-Pair-Share), ការបង្ហាញគំរូ។',
  steps: {
    step1Introduction: {
      teacherActivity: 'ពិនិត្យអនាម័យ វត្តមាន និងរៀបចំរបៀបរៀបរយក្នុងថ្នាក់។ បង្ហាញសីតុណ្ហភាពអវិជ្ជមានដើម្បីទាញចំណាប់អារម្មណ៍។',
      studentActivity: 'ប្រធានថ្នាក់រាយការណ៍វត្តមាន។ សិស្សចូលរួមឆ្លើយសំណួរអំពីសីតុណ្ហភាពក្រោមសូន្យ។',
      timeMinutes: 5
    },
    step2Review: {
      teacherActivity: 'រំលឹកមេរៀនចាស់៖ ឱ្យសិស្សឡើងសរសេរចំនួនគត់ធម្មជាតិ និងប្រភាគសាមញ្ញលើក្តារខៀន។',
      studentActivity: 'សិស្សស្ម័គ្រចិត្ត ២ នាក់ឡើងសរសេរ និងពន្យល់។ សិស្សឯទៀតផ្ទៀងផ្ទាត់។',
      timeMinutes: 5
    },
    step3NewLesson: {
      teacherActivity: 'ពន្យល់និយមន័យចំនួនគត់រ៉ឺឡាទីវ Z = {...-3, -2, -1, 0, +1, +2, +3...}។ គូសបន្ទាត់ចំនួន និងបង្ហាញទិសដៅវិជ្ជមាន (ស្តាំ) និងអវិជ្ជមាន (ឆ្វេង)។ ដាក់លំហាត់គំរូប្រៀបធៀប៖ -5 និង +2, -3 និង -7។',
      studentActivity: 'សិស្សស្តាប់ការបកស្រាយ កត់ត្រានិយមន័យចូលសៀវភៅ។ សិស្សអនុវត្តគូសបន្ទាត់ចំនួនក្នុងសៀវភៅកិច្ចការ។',
      timeMinutes: 25
    },
    step4Strengthening: {
      teacherActivity: 'ចែកសិស្សជាក្រុមតូចៗ (៤ នាក់) ឱ្យធ្វើលំហាត់ប្រតិបត្តិទំព័រទី ៨។ ដើរសម្របសម្រួល និងជួយសិស្សដែលជួបការលំបាក។',
      studentActivity: 'សិស្សពិភាក្សាក្នុងក្រុម ដោះស្រាយលំហាត់ និងបញ្ជូនតំណាងក្រុមឡើងបង្ហាញចម្លើយ។',
      timeMinutes: 10
    },
    step5AssessmentHomework: {
      teacherActivity: 'វាយតម្លៃសមត្ថភាពសិស្សតាមរយៈសំណួរខ្លីៗ ២ សំណួរ។ ដាក់កិច្ចការផ្ទះលំហាត់ ១, ២, ៣ ទំព័រទី ៩។ ណែនាំឱ្យអានមេរៀនបន្ទាប់។',
      studentActivity: 'សិស្សឆ្លើយសំណួរវាយតម្លៃ និងកត់ត្រាកិច្ចការផ្ទះ។',
      timeMinutes: 5
    }
  },
  assessment: 'តាមរយៈការសង្កេតសកម្មភាពចូលរួមក្នុងការពិភាក្សាជាក្រុម និងការឆ្លើយសំណួរផ្ទាល់មាត់បានត្រឹមត្រូវយ៉ាងតិច ៨០% នៃសិស្សក្នុងថ្នាក់។',
  homework: 'លំហាត់ទី ១, ២ និង ៣ ទំព័រទី ៩ នៃសៀវភៅពុម្ពគណិតវិទ្យាថ្នាក់ទី ៨។',
  notes: 'សិស្សយល់ច្បាស់អំពីចំនួនអវិជ្ជមានលើបន្ទាត់ចំនួន។ ម៉ោងបន្ទាប់បន្តប្រមាណវិធីបូក។',
  status: 'taught',
  updatedAt: '2025-11-03T11:00:00Z'
};
