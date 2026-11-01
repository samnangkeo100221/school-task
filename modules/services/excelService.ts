import * as XLSX from 'xlsx';
import { Student, Teacher, CurriculumItem, TimetableSlot, AttendanceRecord } from '../types';

export class ExcelService {
  /**
   * Export JSON data to Excel file and trigger browser download
   */
  public exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1'): void {
    if (typeof window === 'undefined') return;
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  /**
   * Parse uploaded Excel file into JSON
   */
  public async parseExcelFile<T>(file: File): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json<T>(worksheet);
          resolve(json);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Export students formatted for official Cambodian school reporting
   */
  public exportStudents(students: Student[], className?: string): void {
    const formatted = students.map((s, index) => ({
      'ល.រ': index + 1,
      'អត្តលេខសិស្ស': s.studentCode,
      'គោត្តនាម និងនាម': s.fullName,
      'ភេទ': s.gender === 'M' ? 'ប្រុស' : 'ស្រី',
      'ថ្ងៃខែឆ្នាំកំណើត': s.dateOfBirth,
      'អាណាព្យាបាល': s.guardianName,
      'លេខទូរស័ព្ទអាណាព្យាបាល': s.guardianPhone,
      'អាសយដ្ឋាន': s.address || '',
      'ស្ថានភាព': s.status === 'active' ? 'កំពុងរៀន' : s.status === 'transferred' ? 'ផ្ទេរចេញ' : 'ឈប់រៀន'
    }));
    this.exportToExcel(formatted, `បញ្ជីរាយនាមសិស្ស_${className || 'ទាំងអស់'}_${new Date().toISOString().split('T')[0]}`, 'បញ្ជីសិស្ស');
  }

  /**
   * Export teachers formatted for official roster
   */
  public exportTeachers(teachers: Teacher[]): void {
    const formatted = teachers.map((t, index) => ({
      'ល.រ': index + 1,
      'អត្តលេខគ្រូ': t.teacherCode,
      'គោត្តនាម និងនាម': t.fullName,
      'ភេទ': t.gender === 'M' ? 'ប្រុស' : 'ស្រី',
      'លេខទូរស័ព្ទ': t.phone,
      'អ៊ីមែល': t.email,
      'កម្រិតវប្បធម៌': t.qualification || '',
      'តួនាទី': t.position || '',
      'អាសយដ្ឋាន': t.address,
      'ស្ថានភាពការងារ': t.employmentStatus === 'active' ? 'កំពុងបម្រើការ' : 'ឈប់សម្រាក'
    }));
    this.exportToExcel(formatted, `បញ្ជីរាយនាមគ្រូបង្រៀន_${new Date().toISOString().split('T')[0]}`, 'បញ្ជីគ្រូ');
  }

  /**
   * Export curriculum
   */
  public exportCurriculum(curriculum: CurriculumItem[], subjectName: string): void {
    const formatted = curriculum.map((c, index) => ({
      'ល.រ': index + 1,
      'ជំពូក': c.chapterTitle,
      'ចំណងជើងមេរៀន': c.lessonTitle,
      'ខ្លឹមសារមេរៀន/ប្រធានបទ': c.topicTitle,
      'ចំនួនម៉ោងតម្រូវ': c.requiredPeriods,
      'ចំនួនម៉ោងបានបង្រៀន': c.completedPeriods,
      'វត្ថុបំណងសិក្សា': c.learningObjectives,
      'ស្ថានភាព': c.status === 'completed' ? 'បានបញ្ចប់' : c.status === 'in_progress' ? 'កំពុងបង្រៀន' : 'មិនទាន់បង្រៀន'
    }));
    this.exportToExcel(formatted, `កម្មវិធីសិក្សាលម្អិត_${subjectName}_${new Date().toISOString().split('T')[0]}`, 'កម្មវិធីសិក្សា');
  }

  /**
   * Export attendance
   */
  public exportAttendance(records: AttendanceRecord[], className: string, date: string): void {
    const formatted = records.map((r, index) => ({
      'ល.រ': index + 1,
      'អត្តលេខ': r.studentCode,
      'ឈ្មោះសិស្ស': r.studentName,
      'ភេទ': r.gender === 'M' ? 'ប្រុស' : 'ស្រី',
      'វត្តមាន': r.status === 'PRESENT' ? 'មានវត្តមាន' : r.status === 'ABSENT' ? 'អវត្តមាន' : r.status === 'EXCUSED' ? 'មានច្បាប់' : r.status === 'LATE' ? 'មកយឺត' : 'ចេញមុន',
      'មូលហេតុ': r.reason || '',
      'កាលបរិច្ឆេទ': r.date,
      'ម៉ោងសិក្សា': `ម៉ោងទី ${r.periodNumber}`
    }));
    this.exportToExcel(formatted, `វត្តមានសិស្ស_${className}_${date}`, 'វត្តមាន');
  }
}

export const excelService = new ExcelService();
