import React, { useState, useEffect } from 'react';
import {
  School,
  Plus,
  Edit2,
  Trash2,
  Users,
  GraduationCap,
  DoorOpen,
  Search
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { ClassRoom, Teacher, Student } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const ClassesPage: React.FC = () => {
  const { activeAcademicYear, addToast } = useApp();
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState<number | ''>('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    classId: '',
    grade: 8,
    className: '',
    academicYearId: '',
    homeroomTeacherId: '',
    roomNumber: '',
    capacity: 45,
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE'
  });

  const loadData = async () => {
    const [c, t, s] = await Promise.all([
      storageService.getClasses(),
      storageService.getTeachers(),
      storageService.getStudents()
    ]);
    setClasses(c);
    setTeachers(t);
    setStudents(s);
  };

  useEffect(() => {
    loadData();
  }, [activeAcademicYear]);

  const handleOpenAdd = () => {
    setEditingClass(null);
    setFormData({
      classId: 'CLS-' + Date.now().toString().slice(-4),
      grade: 8,
      className: '៨ង (8E)',
      academicYearId: activeAcademicYear?.academicYearId || 'AY-2025-2026',
      homeroomTeacherId: teachers[0]?.teacherId || '',
      roomNumber: 'B1-05',
      capacity: 45,
      status: 'ACTIVE'
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (c: ClassRoom) => {
    setEditingClass(c);
    setFormData({
      classId: c.classId,
      grade: c.grade,
      className: c.className,
      academicYearId: c.academicYearId,
      homeroomTeacherId: c.homeroomTeacherId,
      roomNumber: c.roomNumber || '',
      capacity: c.capacity,
      status: c.status
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.className || !formData.grade) {
      addToast('error', 'សូមបំពេញឈ្មោះថ្នាក់ និងកម្រិតថ្នាក់!');
      return;
    }

    const payload: ClassRoom = {
      classId: formData.classId,
      grade: Number(formData.grade),
      className: formData.className,
      academicYearId: formData.academicYearId || activeAcademicYear?.academicYearId || 'AY-2025-2026',
      homeroomTeacherId: formData.homeroomTeacherId,
      roomNumber: formData.roomNumber,
      capacity: Number(formData.capacity) || 45,
      status: formData.status
    };

    await storageService.saveClass(payload);
    await loadData();
    setModalOpen(false);
    addToast('success', editingClass ? 'បានកែប្រែព័ត៌មានថ្នាក់ជោគជ័យ' : 'បានបង្កើតថ្នាក់រៀនថ្មីជោគជ័យ', payload.className);
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    let list = await storageService.getClasses();
    list = list.filter(c => c.classId !== confirmDeleteId);
    localStorage.setItem('msts_classes', JSON.stringify(list));
    setConfirmDeleteId(null);
    await loadData();
    addToast('success', 'បានលុបថ្នាក់រៀនជោគជ័យ');
  };

  const filtered = classes.filter(c => {
    const matchSearch = c.className.toLowerCase().includes(search.toLowerCase()) ||
                        (c.roomNumber && c.roomNumber.toLowerCase().includes(search.toLowerCase()));
    const matchGrade = filterGrade !== '' ? c.grade === Number(filterGrade) : true;
    return matchSearch && matchGrade;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <School className="w-5 h-5 mr-2 text-primary-600" />
            គ្រប់គ្រងថ្នាក់រៀន (Classes Management)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            បញ្ជីថ្នាក់រៀន គ្រូទទួលបន្ទុកថ្នាក់ បន្ទប់រៀន និងចំណុះសិស្ស
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20 transition-all flex items-center self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          បង្កើតថ្នាក់ថ្មី
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ស្វែងរកតាមឈ្មោះថ្នាក់ ឬបន្ទប់..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value ? Number(e.target.value) : '')}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="">-- គ្រប់កម្រិតថ្នាក់ --</option>
            <option value="7">ថ្នាក់ទី ៧</option>
            <option value="8">ថ្នាក់ទី ៨</option>
            <option value="9">ថ្នាក់ទី ៩</option>
            <option value="10">ថ្នាក់ទី ១០</option>
            <option value="11">ថ្នាក់ទី ១១</option>
            <option value="12">ថ្នាក់ទី ១២</option>
          </select>
        </div>
      </div>

      {/* Classes Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {filtered.map((c) => {
          const homeroomTeacher = teachers.find(t => t.teacherId === c.homeroomTeacherId);
          const studentCount = students.filter(s => s.classId === c.classId).length;

          return (
            <div
              key={c.classId}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-primary-500/50 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-primary-50 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                      កម្រិតទី {c.grade}
                    </span>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-2">
                      {c.className}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-1 rtl:space-x-reverse">
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="កែសម្រួល"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(c.classId)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="លុប"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="my-4 space-y-2 text-xs">
                  <div className="flex items-center text-slate-600 dark:text-slate-300">
                    <GraduationCap className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                    <span className="truncate">គ្រូប្រចាំថ្នាក់៖ <strong className="text-slate-800 dark:text-white">{homeroomTeacher?.fullName || 'មិនទាន់ចាត់តាំង'}</strong></span>
                  </div>

                  <div className="flex items-center text-slate-600 dark:text-slate-300">
                    <DoorOpen className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                    <span>បន្ទប់រៀន៖ <strong className="text-slate-800 dark:text-white">{c.roomNumber || 'មិនទាន់កំណត់'}</strong></span>
                  </div>

                  <div className="flex items-center text-slate-600 dark:text-slate-300">
                    <Users className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                    <span>ចំនួនសិស្ស៖ <strong className="text-primary-600 font-bold">{studentCount}</strong> / {c.capacity} នាក់</span>
                  </div>
                </div>
              </div>

              {/* Progress bar of capacity */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>ចំណុះផ្ទុក</span>
                  <span>{Math.round((studentCount / c.capacity) * 100)}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 rounded-full"
                    style={{ width: `${Math.min(100, Math.round((studentCount / c.capacity) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Class */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingClass ? 'កែសម្រួលថ្នាក់រៀន' : 'បង្កើតថ្នាក់រៀនថ្មី'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                កម្រិតថ្នាក់ (Grade) *
              </label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                {[7, 8, 9, 10, 11, 12].map(g => (
                  <option key={g} value={g}>ថ្នាក់ទី {g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ឈ្មោះថ្នាក់ (Class Name) *
              </label>
              <input
                type="text"
                required
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                placeholder="៨ក (8A)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                បន្ទប់រៀន (Room No.)
              </label>
              <input
                type="text"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                placeholder="B1-01"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ចំណុះផ្ទុកសិស្សអតិបរមា
              </label>
              <input
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) || 45 })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              គ្រូទទួលបន្ទុកថ្នាក់ (Homeroom Teacher)
            </label>
            <select
              value={formData.homeroomTeacherId}
              onChange={(e) => setFormData({ ...formData, homeroomTeacherId: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            >
              <option value="">-- ជ្រើសរើសគ្រូប្រចាំថ្នាក់ --</option>
              {teachers.map(t => (
                <option key={t.teacherId} value={t.teacherId}>{t.fullName} ({t.teacherCode})</option>
              ))}
            </select>
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="លុបថ្នាក់រៀន"
        message="តើអ្នកប្រាកដជាចង់លុបថ្នាក់រៀននេះចេញពីប្រព័ន្ធមែនទេ?"
      />
    </div>
  );
};

