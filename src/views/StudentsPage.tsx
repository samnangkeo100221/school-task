import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Trash2,
  Phone,
  UserCheck,
  ArrowRightLeft,
  Calendar,
  History
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { Student, ClassRoom, AttendanceRecord } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { ExcelImportModal } from '../components/common/ExcelImportModal';
import { excelService } from '../services/excelService';

export const StudentsPage: React.FC = () => {
  const { addToast } = useApp();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [targetClassId, setTargetClassId] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    studentId: '',
    studentCode: '',
    fullName: '',
    gender: 'M' as 'M' | 'F',
    dateOfBirth: '2011-01-01',
    classId: '',
    guardianName: '',
    guardianPhone: '',
    address: '',
    status: 'ACTIVE' as 'ACTIVE' | 'TRANSFERRED' | 'DROPPED'
  });

  const loadData = async () => {
    const [s, c, a] = await Promise.all([
      storageService.getStudents(),
      storageService.getClasses(),
      storageService.getAttendance()
    ]);
    setStudents(s);
    setClasses(c);
    setAttendance(a);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setSelectedStudent(null);
    setFormData({
      studentId: 'STU-' + Date.now().toString().slice(-4),
      studentCode: 'BD-' + Math.floor(800 + Math.random() * 199),
      fullName: '',
      gender: 'M',
      dateOfBirth: '2011-05-15',
      classId: classes[0]?.classId || 'CLS-8A',
      guardianName: '',
      guardianPhone: '',
      address: '',
      status: 'ACTIVE'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (s: Student) => {
    setSelectedStudent(s);
    setFormData({
      studentId: s.studentId,
      studentCode: s.studentCode,
      fullName: s.fullName,
      gender: s.gender,
      dateOfBirth: s.dateOfBirth,
      classId: s.classId,
      guardianName: s.guardianName,
      guardianPhone: s.guardianPhone,
      address: s.address || '',
      status: s.status
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.studentCode || !formData.classId) {
      addToast('error', 'សូមបំពេញព័ត៌មានចាំបាច់ឱ្យបានគ្រប់គ្រាន់!');
      return;
    }

    const payload: Student = {
      studentId: formData.studentId,
      studentCode: formData.studentCode,
      fullName: formData.fullName,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth,
      classId: formData.classId,
      guardianName: formData.guardianName,
      guardianPhone: formData.guardianPhone,
      address: formData.address,
      status: formData.status
    };

    await storageService.saveStudent(payload);
    await loadData();
    setModalOpen(false);
    addToast('success', selectedStudent ? 'បានកែប្រែព័ត៌មានសិស្សជោគជ័យ' : 'បានបន្ថែមសិស្សថ្មីជោគជ័យ', payload.fullName);
  };

  const handleOpenTransfer = (s: Student) => {
    setSelectedStudent(s);
    setTargetClassId('');
    setTransferModalOpen(true);
  };

  const handleTransferStudent = async () => {
    if (!selectedStudent || !targetClassId) {
      addToast('error', 'សូមជ្រើសរើសថ្នាក់ដែលត្រូវផ្ទេរទៅ!');
      return;
    }

    const oldClassName = classes.find(c => c.classId === selectedStudent.classId)?.className;
    const newClassName = classes.find(c => c.classId === targetClassId)?.className;

    const updated: Student = {
      ...selectedStudent,
      classId: targetClassId
    };

    await storageService.saveStudent(updated);
    await storageService.logAction(
      'TRANSFER_STUDENT',
      'students',
      selectedStudent.studentId,
      `ផ្ទេរសិស្ស ${selectedStudent.fullName} ពីថ្នាក់ ${oldClassName} ទៅថ្នាក់ ${newClassName} (រក្សាទុកប្រវត្តិវត្តមាន)`
    );

    await loadData();
    setTransferModalOpen(false);
    addToast('success', 'បានផ្ទេរសិស្សជោគជ័យ', `${selectedStudent.fullName} ទៅកាន់ថ្នាក់ ${newClassName}`);
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    await storageService.deleteStudent(confirmDeleteId);
    setConfirmDeleteId(null);
    await loadData();
    addToast('success', 'បានលុបទិន្នន័យសិស្សជោគជ័យ');
  };

  const handleExportExcel = () => {
    const exportData = students.map((s, idx) => ({
      'ល.រ': idx + 1,
      'អត្តលេខសិស្ស (Code)': s.studentCode,
      'គោត្តនាម-នាម (Name)': s.fullName,
      'ភេទ (Gender)': s.gender === 'M' ? 'ប្រុស' : 'ស្រី',
      'ថ្ងៃខែឆ្នាំកំណើត (DOB)': s.dateOfBirth,
      'ថ្នាក់រៀន (Class)': classes.find(c => c.classId === s.classId)?.className || s.classId,
      'អាណាព្យាបាល (Guardian)': s.guardianName,
      'លេខទូរស័ព្ទអាណាព្យាបាល (Phone)': s.guardianPhone,
      'អាសយដ្ឋាន (Address)': s.address || '',
      'ស្ថានភាព (Status)': s.status
    }));
    excelService.exportToExcel(exportData, 'បញ្ជីរាយនាមសិស្ស_វិទ្យាល័យហ៊ុនសែនបាត់ដឹង', 'Students');
    addToast('success', 'បានទាញយកទិន្នន័យ Excel ជោគជ័យ');
  };

  const handleImportExcel = async (parsedRows: any[]) => {
    let count = 0;
    for (const row of parsedRows) {
      const name = row['គោត្តនាម-នាម (Name)'] || row['fullName'] || row['Name'];
      if (!name) continue;

      const code = row['អត្តលេខសិស្ស (Code)'] || row['studentCode'] || 'BD-' + Math.floor(800 + Math.random() * 199);
      const gender = (row['ភេទ (Gender)'] === 'ស្រី' || row['gender'] === 'F') ? 'F' : 'M';
      const dob = row['ថ្ងៃខែឆ្នាំកំណើត (DOB)'] || '2011-01-01';
      const classNameRaw = row['ថ្នាក់រៀន (Class)'] || '';
      const matchedClass = classes.find(c => c.className.includes(classNameRaw)) || classes[0];

      const newStudent: Student = {
        studentId: 'STU-' + Date.now().toString().slice(-4) + Math.random().toString(36).substring(2, 5),
        studentCode: code,
        fullName: name,
        gender,
        dateOfBirth: dob,
        classId: matchedClass?.classId || 'CLS-8A',
        guardianName: row['អាណាព្យាបាល (Guardian)'] || '',
        guardianPhone: String(row['លេខទូរស័ព្ទអាណាព្យាបាល (Phone)'] || ''),
        status: 'ACTIVE'
      };
      await storageService.saveStudent(newStudent);
      count++;
    }
    await loadData();
    addToast('success', `បានបញ្ចូលសិស្សចំនួន ${count} នាក់ដោយជោគជ័យ`);
  };

  const filtered = students.filter(s => {
    const matchSearch = s.fullName.toLowerCase().includes(search.toLowerCase()) ||
                        s.studentCode.toLowerCase().includes(search.toLowerCase()) ||
                        s.guardianPhone.includes(search);
    const matchClass = filterClass ? s.classId === filterClass : true;
    return matchSearch && matchClass;
  });

  // Student Attendance History
  const studentAttHistory = selectedStudent
    ? attendance.filter(a => a.studentId === selectedStudent.studentId)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary-600" />
            គ្រប់គ្រងសិស្ស (Students Management)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            បញ្ជីរាយនាមសិស្ស ផ្ទេរថ្នាក់ រក្សាប្រវត្តិវត្តមាន និងនាំចេញ/នាំចូល Excel
          </p>
        </div>

        <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
          <button
            onClick={() => setImportModalOpen(true)}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center"
          >
            <Upload className="w-4 h-4 mr-1.5" />
            នាំចូល Excel
          </button>
          <button
            onClick={handleExportExcel}
            className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-1.5" />
            ទាញយក Excel
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20 transition-all flex items-center"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            បន្ថែមសិស្សថ្មី
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ស្វែងរកតាមឈ្មោះសិស្ស, អត្តលេខ, ទូរស័ព្ទ..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="">-- គ្រប់ថ្នាក់រៀន --</option>
            {classes.map(c => (
              <option key={c.classId} value={c.classId}>{c.className}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3.5 font-bold">ល.រ</th>
                <th className="p-3.5 font-bold">អត្តលេខ</th>
                <th className="p-3.5 font-bold">គោត្តនាម-នាមសិស្ស</th>
                <th className="p-3.5 font-bold">ភេទ</th>
                <th className="p-3.5 font-bold">ថ្ងៃខែឆ្នាំកំណើត</th>
                <th className="p-3.5 font-bold">ថ្នាក់</th>
                <th className="p-3.5 font-bold">អាណាព្យាបាល</th>
                <th className="p-3.5 font-bold">ទូរស័ព្ទ</th>
                <th className="p-3.5 font-bold text-center">ស្ថានភាព</th>
                <th className="p-3.5 font-bold text-center">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((s, idx) => {
                const cls = classes.find(c => c.classId === s.classId);
                return (
                  <tr key={s.studentId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="p-3.5 font-mono font-bold text-primary-600">{s.studentCode}</td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-white">
                      {s.fullName}
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300">
                      {s.gender === 'M' ? 'ប្រុស' : 'ស្រី'}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">{s.dateOfBirth}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                        {cls?.className || s.classId}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-700 dark:text-slate-300">{s.guardianName || '-'}</td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-400 font-mono">{s.guardianPhone || '-'}</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        កំពុងរៀន
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center space-x-1 rtl:space-x-reverse">
                        <button
                          onClick={() => {
                            setSelectedStudent(s);
                            setHistoryModalOpen(true);
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="មើលប្រវត្តិវត្តមាន"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenTransfer(s)}
                          className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="ផ្ទេរថ្នាក់"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="កែសម្រួល"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(s.studentId)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="លុប"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 text-xs">
                    រកមិនឃើញទិន្នន័យសិស្សដែលស្វែងរកទេ!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add / Edit Student */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedStudent ? 'កែសម្រួលព័ត៌មានសិស្ស' : 'បន្ថែមសិស្សថ្មី'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                អត្តលេខសិស្ស (Code) *
              </label>
              <input
                type="text"
                required
                value={formData.studentCode}
                onChange={(e) => setFormData({ ...formData, studentCode: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                placeholder="BD-801"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ភេទ *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                <option value="M">ប្រុស (Male)</option>
                <option value="F">ស្រី (Female)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              គោត្តនាម និងនាមសិស្ស *
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              placeholder="សុខ មករា"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ថ្ងៃខែឆ្នាំកំណើត
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ថ្នាក់រៀន *
              </label>
              <select
                value={formData.classId}
                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                {classes.map(c => (
                  <option key={c.classId} value={c.classId}>{c.className}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ឈ្មោះអាណាព្យាបាល
              </label>
              <input
                type="text"
                value={formData.guardianName}
                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                placeholder="ឈ្មោះឪពុក ឬម្តាយ"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                លេខទូរស័ព្ទអាណាព្យាបាល
              </label>
              <input
                type="text"
                value={formData.guardianPhone}
                onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                placeholder="012 334 455"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20"
            >
              រក្សាទុក
            </button>
          </div>
        </form>
      </Modal>

      {/* Transfer Student Modal */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="ផ្ទេរសិស្សទៅថ្នាក់ថ្មី (Class Transfer)"
        subtitle="រក្សាទុកប្រវត្តិវត្តមាន និងលទ្ធផលសិក្សាកន្លងមកដោយសុវត្ថិភាព"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-1">
            <p className="font-bold text-slate-800 dark:text-white">សិស្ស៖ {selectedStudent?.fullName}</p>
            <p className="text-slate-500">អត្តលេខ៖ {selectedStudent?.studentCode}</p>
            <p className="text-slate-500">ថ្នាក់បច្ចុប្បន្ន៖ {classes.find(c => c.classId === selectedStudent?.classId)?.className}</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ជ្រើសរើសថ្នាក់ដែលត្រូវផ្ទេរទៅ *
            </label>
            <select
              value={targetClassId}
              onChange={(e) => setTargetClassId(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            >
              <option value="">-- ជ្រើសរើសថ្នាក់ថ្មី --</option>
              {classes.filter(c => c.classId !== selectedStudent?.classId).map(c => (
                <option key={c.classId} value={c.classId}>{c.className}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setTransferModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
            >
              បោះបង់
            </button>
            <button
              type="button"
              onClick={handleTransferStudent}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20"
            >
              បញ្ជាក់ការផ្ទេរថ្នាក់
            </button>
          </div>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`ប្រវត្តិវត្តមានរបស់សិស្ស៖ ${selectedStudent?.fullName || ''}`}
        maxWidth="lg"
      >
        <div className="space-y-3">
          {studentAttHistory.length > 0 ? (
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5">កាលបរិច្ឆេទ</th>
                    <th className="p-2.5">ម៉ោងទី</th>
                    <th className="p-2.5">ស្ថានភាព</th>
                    <th className="p-2.5">មូលហេតុ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studentAttHistory.map((att) => (
                    <tr key={att.attendanceId}>
                      <td className="p-2.5 font-mono">{att.date}</td>
                      <td className="p-2.5 font-mono">ម៉ោង {att.periodNumber}</td>
                      <td className="p-2.5 font-bold">
                        {att.status === 'PRESENT' && <span className="text-emerald-600">វត្តមាន</span>}
                        {att.status === 'EXCUSED' && <span className="text-blue-600">មានច្បាប់</span>}
                        {att.status === 'ABSENT' && <span className="text-rose-600">អវត្តមាន</span>}
                        {att.status === 'LATE' && <span className="text-amber-600">មកយឺត</span>}
                      </td>
                      <td className="p-2.5 text-slate-500">{att.reason || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs">
              មិនទាន់មានកំណត់ត្រាអវត្តមានសម្រាប់សិស្សនេះទេ (សិស្សមានវត្តមានទៀងទាត់)!
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="លុបសិស្ស"
        message="តើអ្នកប្រាកដជាចង់លុបសិស្សនេះចេញពីប្រព័ន្ធមែនទេ?"
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="នាំចូលបញ្ជីសិស្សពី Excel"
        expectedFields={['អត្តលេខសិស្ស (Code)', 'គោត្តនាម-នាម (Name)', 'ភេទ (Gender)', 'ថ្នាក់រៀន (Class)']}
        onImportConfirmed={handleImportExcel}
      />
    </div>
  );
};

