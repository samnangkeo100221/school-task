import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Download,
  Upload,
  Edit2,
  Trash2,
  Eye,
  School,
  Phone,
  ArrowRightLeft,
  Calendar
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { excelService } from '../services/excelService';
import { Student, ClassRoom, AttendanceRecord } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExcelImportModal } from '../components/common/ExcelImportModal';

export const StudentsPage: React.FC = () => {
  const { activeAcademicYear, addToast } = useApp();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<Partial<Student>>({
    studentCode: '',
    fullName: '',
    gender: 'M',
    dateOfBirth: '2012-01-01',
    classId: 'CLS-8A',
    guardianName: '',
    guardianPhone: '',
    address: 'ភូមិបាត់ដឹង',
    status: 'active'
  });

  // Transfer Modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [studentToTransfer, setStudentToTransfer] = useState<Student | null>(null);
  const [targetClassId, setTargetClassId] = useState<string>('');

  // History / View Modal
  const [selectedStudentForHistory, setSelectedStudentForHistory] = useState<Student | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Delete Confirm
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Excel Import
  const [showImportModal, setShowImportModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allStudents, allCls, att] = await Promise.all([
        storageService.getStudents(),
        storageService.getClasses(),
        storageService.getAttendance(activeAcademicYear?.academicYearId)
      ]);
      setStudents(allStudents);
      setClasses(allCls);
      setAttendance(att);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeAcademicYear]);

  const filteredStudents = students.filter(s => {
    if (selectedClassId !== 'all' && s.classId !== selectedClassId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.studentCode.toLowerCase().includes(q) ||
        (s.guardianName && s.guardianName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    setEditingStudent(null);
    const codeNum = students.length + 1;
    setFormData({
      studentId: `ST-${Date.now()}`,
      studentCode: `8A-${codeNum.toString().padStart(2, '0')}`,
      fullName: '',
      gender: 'M',
      dateOfBirth: '2012-01-01',
      classId: selectedClassId !== 'all' ? selectedClassId : 'CLS-8A',
      guardianName: '',
      guardianPhone: '',
      address: 'ភូមិបាត់ដឹង',
      status: 'active'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData(student);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.studentCode) {
      addToast('error', 'សូមបំពេញព័ត៌មានចាំបាច់');
      return;
    }

    try {
      const studentToSave: Student = {
        studentId: editingStudent?.studentId || `ST-${Date.now()}`,
        studentCode: formData.studentCode || '',
        fullName: formData.fullName || '',
        gender: (formData.gender as any) || 'M',
        dateOfBirth: formData.dateOfBirth || '2012-01-01',
        classId: formData.classId || 'CLS-8A',
        guardianName: formData.guardianName || '',
        guardianPhone: formData.guardianPhone || '',
        address: formData.address || '',
        status: (formData.status as any) || 'active'
      };

      await storageService.saveStudent(studentToSave);
      await loadData();
      setShowModal(false);
      addToast('success', editingStudent ? 'បានកែប្រែព័ត៌មានសិស្ស' : 'បានបន្ថែមសិស្សថ្មី', studentToSave.fullName);
    } catch (err: any) {
      addToast('error', 'បរាជ័យក្នុងការរក្សាទុក', err.message);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentToTransfer || !targetClassId || targetClassId === studentToTransfer.classId) return;

    try {
      const fromClass = classes.find(c => c.classId === studentToTransfer.classId)?.className;
      const toClass = classes.find(c => c.classId === targetClassId)?.className;

      const updated = {
        ...studentToTransfer,
        classId: targetClassId
      };
      await storageService.saveStudent(updated);
      await storageService.logAction(
        'TRANSFER_STUDENT',
        'students',
        studentToTransfer.studentId,
        `Transferred student ${studentToTransfer.fullName} from ${fromClass} to ${toClass}. Attendance history preserved.`
      );
      await loadData();
      setShowTransferModal(false);
      addToast('success', 'បានផ្ទេរសិស្សដោយជោគជ័យ', `ផ្ទេរពី ${fromClass} ទៅកាន់ ${toClass} (ប្រវត្តិវត្តមានត្រូវបានរក្សាទុក)`);
    } catch (err: any) {
      addToast('error', 'បរាជ័យក្នុងការផ្ទេរសិស្ស', err.message);
    }
  };

  const handleDelete = async () => {
    if (!studentToDelete) return;
    try {
      await storageService.deleteStudent(studentToDelete.studentId);
      await loadData();
      addToast('success', 'បានកែប្រែស្ថានភាពសិស្សទៅជាឈប់រៀន', studentToDelete.fullName);
    } catch (err: any) {
      addToast('error', 'បរាជ័យក្នុងការលុប', err.message);
    }
  };

  const handleImportExcel = async (parsedData: any[]) => {
    const imported: Student[] = parsedData.map((row, i) => ({
      studentId: `ST-IMP-${Date.now()}-${i}`,
      studentCode: String(row['អត្តលេខសិស្ស'] || row['studentCode'] || `8A-${i + 1}`),
      fullName: String(row['គោត្តនាម និងនាម'] || row['fullName'] || 'សិស្សថ្មី'),
      gender: (row['ភេទ'] === 'ស្រី' || row['gender'] === 'F') ? 'F' : 'M',
      dateOfBirth: String(row['ថ្ងៃខែឆ្នាំកំណើត'] || row['dateOfBirth'] || '2012-01-01'),
      classId: selectedClassId !== 'all' ? selectedClassId : 'CLS-8A',
      guardianName: String(row['អាណាព្យាបាល'] || row['guardianName'] || ''),
      guardianPhone: String(row['លេខទូរស័ព្ទអាណាព្យាបាល'] || row['guardianPhone'] || ''),
      address: String(row['អាសយដ្ឋាន'] || row['address'] || 'ភូមិបាត់ដឹង'),
      status: 'active'
    }));

    await storageService.saveStudentsBatch(imported);
    await loadData();
    addToast('success', 'បានបញ្ចូលសិស្សពី Excel', `បញ្ចូលបាន ${imported.length} នាក់`);
  };

  // Student Attendance History records
  const studentAttendanceHistory = selectedStudentForHistory
    ? attendance.filter(a => a.studentId === selectedStudentForHistory.studentId)
    : [];

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>គ្រប់គ្រងសិស្ស (Students Management)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            បញ្ជីរាយនាមសិស្សតាមថ្នាក់ ប្រវត្តិសិក្សា ការផ្ទេរថ្នាក់ និងប្រវត្តិវត្តមាន
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              const currentClass = classes.find(c => c.classId === selectedClassId)?.className;
              excelService.exportStudents(filteredStudents, currentClass);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>ទាញយក Excel</span>
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>បញ្ចូល Excel</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>បន្ថែមសិស្សថ្មី</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="ស្វែងរកតាមឈ្មោះ អត្តលេខ ឬអាណាព្យាបាល..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200"
            />
          </div>

          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-bold"
          >
            <option value="all">គ្រប់ថ្នាក់រៀន</option>
            {classes.map(c => (
              <option key={c.classId} value={c.classId}>{c.className}</option>
            ))}
          </select>
        </div>

        <span className="text-xs text-slate-500">
          សិស្សសរុប៖ {filteredStudents.length} នាក់
        </span>
      </div>

      {/* Students Table */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-x-auto text-xs">
        <table className="w-full text-left divide-y divide-slate-100 dark:divide-slate-800">
          <thead className="bg-slate-50 dark:bg-slate-900 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            <tr>
              <th className="px-3 py-3 text-center w-12">ល.រ</th>
              <th className="px-3 py-3">អត្តលេខ</th>
              <th className="px-3 py-3">ឈ្មោះសិស្ស</th>
              <th className="px-3 py-3 text-center">ភេទ</th>
              <th className="px-3 py-3">ថ្ងៃខែឆ្នាំកំណើត</th>
              <th className="px-3 py-3">ថ្នាក់</th>
              <th className="px-3 py-3">អាណាព្យាបាល & ទូរស័ព្ទ</th>
              <th className="px-3 py-3 text-center">ស្ថានភាព</th>
              <th className="px-3 py-3 text-right">សកម្មភាព</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredStudents.map((st, i) => {
              const cls = classes.find(c => c.classId === st.classId);
              return (
                <tr key={st.studentId} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                  <td className="px-3 py-3 text-center font-bold text-slate-400">{i + 1}</td>
                  <td className="px-3 py-3 font-mono font-bold text-blue-600">{st.studentCode}</td>
                  <td className="px-3 py-3 font-bold text-slate-900 dark:text-white">{st.fullName}</td>
                  <td className="px-3 py-3 text-center font-semibold">
                    {st.gender === 'M' ? 'ប្រុស' : 'ស្រី'}
                  </td>
                  <td className="px-3 py-3 text-slate-600 dark:text-slate-300">{st.dateOfBirth}</td>
                  <td className="px-3 py-3 font-bold text-slate-800 dark:text-slate-200">
                    {cls?.className || st.classId}
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{st.guardianName || '—'}</p>
                    <p className="text-[11px] text-slate-400">{st.guardianPhone}</p>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      st.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {st.status === 'active' ? 'កំពុងរៀន' : 'ឈប់រៀន'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setSelectedStudentForHistory(st);
                          setShowHistoryModal(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600"
                        title="ប្រវត្តិវត្តមាន"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setStudentToTransfer(st);
                          setTargetClassId(st.classId);
                          setShowTransferModal(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-indigo-600"
                        title="ផ្ទេរថ្នាក់"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(st)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600"
                        title="កែសម្រួល"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setStudentToDelete(st);
                          setShowDeleteConfirm(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600"
                        title="លុប"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingStudent ? 'កែប្រែព័ត៌មានសិស្ស' : 'បន្ថែមសិស្សថ្មី'}
        maxWidth="xl"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                អត្តលេខសិស្ស *
              </label>
              <input
                type="text"
                value={formData.studentCode}
                onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                គោត្តនាម និងនាម *
              </label>
              <input
                type="text"
                placeholder="ឧ. ចាន់ សុវណ្ណារ៉ា"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-semibold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                ភេទ
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              >
                <option value="M">ប្រុស</option>
                <option value="F">ស្រី</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                ថ្ងៃខែឆ្នាំកំណើត
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                ថ្នាក់រៀន
              </label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold"
              >
                {classes.map(c => <option key={c.classId} value={c.classId}>{c.className}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                ឈ្មោះអាណាព្យាបាល
              </label>
              <input
                type="text"
                placeholder="ឈ្មោះឪពុក ឬម្តាយ"
                value={formData.guardianName || ''}
                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                លេខទូរស័ព្ទអាណាព្យាបាល
              </label>
              <input
                type="text"
                placeholder="012 xxx xxx"
                value={formData.guardianPhone || ''}
                onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              អាសយដ្ឋាន
            </label>
            <input
              type="text"
              placeholder="ភូមិ ឃុំ ស្រុក ខេត្ត"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-medium"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
            >
              រក្សាទុក
            </button>
          </div>
        </form>
      </Modal>

      {/* Transfer Class Modal */}
      {studentToTransfer && (
        <Modal
          isOpen={showTransferModal}
          onClose={() => setShowTransferModal(false)}
          title={`ផ្ទេរថ្នាក់សិស្ស៖ ${studentToTransfer.fullName}`}
          maxWidth="md"
        >
          <form onSubmit={handleTransfer} className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-300">
              ការផ្ទេរសិស្សរវាងថ្នាក់រៀននឹងមិនធ្វើឱ្យបាត់បង់ប្រវត្តិវត្តមានកន្លងមករបស់សិស្សឡើយ (Preserve historical attendance records)។
            </p>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                ថ្នាក់រៀនបច្ចុប្បន្ន
              </label>
              <input
                type="text"
                disabled
                value={classes.find(c => c.classId === studentToTransfer.classId)?.className}
                className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                ផ្ទេរទៅកាន់ថ្នាក់ថ្មី *
              </label>
              <select
                value={targetClassId}
                onChange={(e) => setTargetClassId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold text-blue-600"
                required
              >
                {classes.filter(c => c.classId !== studentToTransfer.classId).map(c => (
                  <option key={c.classId} value={c.classId}>{c.className}</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl"
              >
                បោះបង់
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold"
              >
                យល់ព្រមផ្ទេរ
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* History Modal */}
      {selectedStudentForHistory && (
        <Modal
          isOpen={showHistoryModal}
          onClose={() => setShowHistoryModal(false)}
          title={`ប្រវត្តិវត្តមានសិស្ស៖ ${selectedStudentForHistory.fullName} (${selectedStudentForHistory.studentCode})`}
          maxWidth="2xl"
        >
          <div className="space-y-3 text-xs">
            {studentAttendanceHistory.length === 0 ? (
              <p className="text-center py-8 text-slate-400">
                មិនទាន់មានប្រវត្តិអវត្តមានកត់ត្រាសម្រាប់សិស្សនេះនៅឡើយទេ។
              </p>
            ) : (
              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-left divide-y divide-slate-100">
                  <thead className="bg-slate-50 font-bold text-slate-600">
                    <tr>
                      <th className="p-2">កាលបរិច្ឆេទ</th>
                      <th className="p-2">ម៉ោងទី</th>
                      <th className="p-2">ស្ថានភាព</th>
                      <th className="p-2">មូលហេតុ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {studentAttendanceHistory.map((rec) => (
                      <tr key={rec.attendanceId}>
                        <td className="p-2 font-mono">{rec.date}</td>
                        <td className="p-2">ម៉ោងទី {rec.periodNumber}</td>
                        <td className="p-2 font-bold">{rec.status}</td>
                        <td className="p-2 text-slate-500">{rec.reason || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="បញ្ជាក់ការកែប្រែស្ថានភាពសិស្ស"
        message={`តើលោកគ្រូពិតជាចង់កំណត់សិស្ស "${studentToDelete?.fullName}" ទៅជាឈប់រៀនមែនទេ?`}
        confirmLabel="យល់ព្រម"
        cancelLabel="បោះបង់"
        isDestructive
      />

      {/* Excel Import */}
      <ExcelImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="បញ្ចូលបញ្ជីសិស្សពី Excel"
        onImport={handleImportExcel}
        expectedColumnsDescription="អត្តលេខសិស្ស, គោត្តនាម និងនាម, ភេទ, ថ្ងៃខែឆ្នាំកំណើត, អាណាព្យាបាល, លេខទូរស័ព្ទអាណាព្យាបាល"
      />
    </div>
  );
};
