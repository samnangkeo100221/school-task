import React, { useEffect, useState } from 'react';
import {
  School,
  Plus,
  Edit2,
  Users,
  GraduationCap,
  DoorOpen,
  Calendar
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { ClassRoom, Teacher, Student } from '../types';
import { Modal } from '../components/common/Modal';

export const ClassesPage: React.FC = () => {
  const { activeAcademicYear, addToast } = useApp();
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null);
  const [formData, setFormData] = useState<Partial<ClassRoom>>({
    grade: 8,
    className: '',
    homeroomTeacherId: 'T-001',
    capacity: 45,
    roomNumber: 'បន្ទប់ ១២',
    status: 'active'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [allCls, allTchs, allStudents] = await Promise.all([
        storageService.getClasses(),
        storageService.getTeachers(),
        storageService.getStudents()
      ]);
      setClasses(allCls);
      setTeachers(allTchs);
      setStudents(allStudents);
    } catch (err) {
      console.error('Failed to load classes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeAcademicYear]);

  const handleOpenAdd = () => {
    setEditingClass(null);
    setFormData({
      classId: `CLS-8${String.fromCharCode(65 + classes.length)}`,
      grade: 8,
      className: `៨${classes.length === 0 ? 'ក' : classes.length === 1 ? 'ខ' : classes.length === 2 ? 'គ' : 'ឃ'}`,
      homeroomTeacherId: 'T-001',
      capacity: 45,
      roomNumber: `បន្ទប់ ${12 + classes.length}`,
      status: 'active',
      academicYearId: activeAcademicYear?.academicYearId || 'AY-2025-2026'
    });
    setShowModal(true);
  };

  const handleOpenEdit = (cls: ClassRoom) => {
    setEditingClass(cls);
    setFormData(cls);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.className) {
      addToast('error', 'សូមបញ្ចូលឈ្មោះថ្នាក់');
      return;
    }

    try {
      const classToSave: ClassRoom = {
        classId: editingClass?.classId || `CLS-${Date.now()}`,
        grade: Number(formData.grade) || 8,
        className: formData.className || '',
        academicYearId: activeAcademicYear?.academicYearId || 'AY-2025-2026',
        homeroomTeacherId: formData.homeroomTeacherId,
        capacity: Number(formData.capacity) || 45,
        roomNumber: formData.roomNumber,
        status: (formData.status as any) || 'active'
      };

      await storageService.saveClass(classToSave);
      await loadData();
      setShowModal(false);
      addToast('success', editingClass ? 'បានកែប្រែថ្នាក់រៀន' : 'បានបន្ថែមថ្នាក់រៀនថ្មី', classToSave.className);
    } catch (err: any) {
      addToast('error', 'បរាជ័យក្នុងការរក្សាទុក', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <School className="w-5 h-5 text-blue-600" />
            <span>គ្រប់គ្រងថ្នាក់រៀន (Classes Management)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ថ្នាក់រៀនកម្រិតទី ៨ វិទ្យាល័យ ហ៊ុន សែន បាត់ដឹង (៨ក, ៨ខ, ៨គ, ៨ឃ)
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>បន្ថែមថ្នាក់រៀន</span>
        </button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {classes.map((cls) => {
          const classStudentsCount = students.filter(s => s.classId === cls.classId && s.status === 'active').length;
          const homeroomTeacher = teachers.find(t => t.teacherId === cls.homeroomTeacherId);

          return (
            <div
              key={cls.classId}
              className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-black flex items-center justify-center text-lg shadow-xs">
                    {cls.grade}
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    សកម្ម
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    ថ្នាក់ {cls.className}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <DoorOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>{cls.roomNumber || 'បន្ទប់ទូទៅ'}</span>
                  </p>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">គ្រូបន្ទុកថ្នាក់៖</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {homeroomTeacher?.fullName || 'មិនទាន់ចាត់តាំង'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">ចំនួនសិស្ស៖</span>
                    <span className="font-bold text-blue-600">
                      {classStudentsCount} / {cls.capacity} នាក់
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-end">
                <button
                  onClick={() => handleOpenEdit(cls)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>កែប្រែ</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingClass ? 'កែប្រែថ្នាក់រៀន' : 'បន្ថែមថ្នាក់រៀនថ្មី'}
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                កម្រិតថ្នាក់ (Grade) *
              </label>
              <input
                type="number"
                min="7"
                max="12"
                value={formData.grade || 8}
                onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                ឈ្មោះថ្នាក់ *
              </label>
              <input
                type="text"
                placeholder="ឧ. ៨ក (8A)"
                value={formData.className || ''}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                បន្ទប់រៀន
              </label>
              <input
                type="text"
                placeholder="ឧ. បន្ទប់ ១២"
                value={formData.roomNumber || ''}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                ចំណុះអតិបរមា
              </label>
              <input
                type="number"
                value={formData.capacity || 45}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              គ្រូទទួលបន្ទុកថ្នាក់ (Homeroom Teacher)
            </label>
            <select
              value={formData.homeroomTeacherId}
              onChange={(e) => setFormData({ ...formData, homeroomTeacherId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
            >
              <option value="">-- មិនទាន់ចាត់តាំង --</option>
              {teachers.map(t => (
                <option key={t.teacherId} value={t.teacherId}>
                  {t.fullName} ({t.teacherCode})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl"
            >
              បោះបង់
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold"
            >
              រក្សាទុក
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
