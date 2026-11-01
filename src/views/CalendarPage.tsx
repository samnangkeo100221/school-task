import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Plus,
  Calendar,
  Clock,
  AlertTriangle,
  Edit2,
  Trash2,
  Search,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { SchoolCalendarEvent, CalendarEventType } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const CalendarPage: React.FC = () => {
  const { activeAcademicYear, addToast } = useApp();
  const [events, setEvents] = useState<SchoolCalendarEvent[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolCalendarEvent | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    eventId: '',
    academicYearId: '',
    eventTitle: '',
    eventType: 'NATIONAL_HOLIDAY' as CalendarEventType,
    startDate: '',
    endDate: '',
    isFullDay: true,
    isTeachingDay: false,
    blockedSession: 'ALL' as 'ALL' | 'MORNING' | 'AFTERNOON',
    description: ''
  });

  const loadData = async () => {
    const list = await storageService.getCalendarEvents(activeAcademicYear?.academicYearId);
    setEvents(list.sort((a, b) => a.startDate.localeCompare(b.startDate)));
  };

  useEffect(() => {
    loadData();
  }, [activeAcademicYear]);

  const eventTypeLabels: Record<CalendarEventType, { label: string; color: string }> = {
    ACADEMIC_OPENING: { label: 'បើកបវេសនកាល', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' },
    ACADEMIC_CLOSING: { label: 'បិទបញ្ចប់ឆ្នាំសិក្សា', color: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200' },
    NATIONAL_HOLIDAY: { label: 'បុណ្យជាតិផ្លូវការ', color: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' },
    TRADITIONAL_FESTIVAL: { label: 'បុណ្យប្រពៃណីជាតិ', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
    SCHOOL_HOLIDAY: { label: 'ឈប់សម្រាកសាលា', color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' },
    EXAMINATION: { label: 'ការប្រឡងឆមាស', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
    TEACHER_MEETING: { label: 'ប្រជុំគ្រូបង្រៀន', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
    SPECIAL_EVENT: { label: 'កម្មវិធីពិសេស', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300' },
    EMERGENCY_CLOSURE: { label: 'បិទបន្ទាន់', color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' },
    HALF_DAY_CLOSURE: { label: 'បិទកន្លះថ្ងៃ', color: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300' },
  };

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setFormData({
      eventId: 'EV-' + Date.now().toString().slice(-4),
      academicYearId: activeAcademicYear?.academicYearId || 'AY-2025-2026',
      eventTitle: '',
      eventType: 'NATIONAL_HOLIDAY',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      isFullDay: true,
      isTeachingDay: false,
      blockedSession: 'ALL',
      description: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (ev: SchoolCalendarEvent) => {
    setEditingEvent(ev);
    setFormData({
      eventId: ev.eventId,
      academicYearId: ev.academicYearId,
      eventTitle: ev.eventTitle,
      eventType: ev.eventType,
      startDate: ev.startDate,
      endDate: ev.endDate,
      isFullDay: ev.isFullDay,
      isTeachingDay: ev.isTeachingDay,
      blockedSession: ev.blockedSession || 'ALL',
      description: ev.description || ''
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventTitle || !formData.startDate) {
      addToast('error', 'សូមបំពេញចំណងជើងព្រឹត្តិការណ៍ និងកាលបរិច្ឆេទ!');
      return;
    }

    const payload: SchoolCalendarEvent = {
      eventId: formData.eventId,
      academicYearId: formData.academicYearId || activeAcademicYear?.academicYearId || 'AY-2025-2026',
      eventTitle: formData.eventTitle,
      eventType: formData.eventType,
      startDate: formData.startDate,
      endDate: formData.endDate || formData.startDate,
      isFullDay: formData.isFullDay,
      isTeachingDay: formData.isTeachingDay,
      blockedSession: formData.blockedSession,
      description: formData.description
    };

    await storageService.saveCalendarEvent(payload);
    await loadData();
    setModalOpen(false);
    addToast('success', editingEvent ? 'បានកែប្រែព្រឹត្តិការណ៍ជោគជ័យ' : 'បានបន្ថែមព្រឹត្តិការណ៍ប្រតិទិនជោគជ័យ', payload.eventTitle);
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    await storageService.deleteCalendarEvent(confirmDeleteId);
    setConfirmDeleteId(null);
    await loadData();
    addToast('success', 'បានលុបព្រឹត្តិការណ៍ចេញពីប្រតិទិន');
  };

  const filtered = events.filter(e => {
    const matchSearch = e.eventTitle.toLowerCase().includes(search.toLowerCase()) ||
                        (e.description && e.description.toLowerCase().includes(search.toLowerCase()));
    const matchType = filterType ? e.eventType === filterType : true;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center">
            <CalendarCheck className="w-5 h-5 mr-2 text-primary-600" />
            ប្រតិទិនសាលា និងថ្ងៃឈប់សម្រាក (School Calendar & Holidays)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            ថ្ងៃឈប់សម្រាកបុណ្យជាតិ បុណ្យប្រពៃណី ការប្រឡងឆមាស និងការកំណត់ថ្ងៃបង្រៀន
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2 text-xs font-semibold rounded-xl bg-primary-600 hover:bg-primary-700 text-white shadow-md shadow-primary-500/20 transition-all flex items-center self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          បន្ថែមព្រឹត្តិការណ៍ថ្មី
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
            placeholder="ស្វែងរកតាមឈ្មោះបុណ្យ ឬព្រឹត្តិការណ៍..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="">-- គ្រប់ប្រភេទព្រឹត្តិការណ៍ --</option>
            {Object.entries(eventTypeLabels).map(([key, item]) => (
              <option key={key} value={key}>{item.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar Event Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((ev) => {
          const typeBadge = eventTypeLabels[ev.eventType] || { label: ev.eventType, color: 'bg-slate-100 text-slate-700' };

          return (
            <div
              key={ev.eventId}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${typeBadge.color}`}>
                    {typeBadge.label}
                  </span>

                  <div className="flex items-center space-x-1 rtl:space-x-reverse">
                    <button
                      onClick={() => handleOpenEdit(ev)}
                      className="p-1 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(ev.eventId)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-800 dark:text-white mt-2 leading-snug">
                  {ev.eventTitle}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {ev.description || 'ព្រឹត្តិការណ៍ផ្លូវការក្នុងប្រតិទិនសិក្សា'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                  <span className="text-slate-400 flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1" /> កាលបរិច្ឆេទ៖
                  </span>
                  <span className="font-mono font-semibold">
                    {ev.startDate === ev.endDate ? ev.startDate : `${ev.startDate} ដល់ ${ev.endDate}`}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">ថ្ងៃបង្រៀន (Teaching Day)៖</span>
                  <span className={`font-bold text-[11px] ${ev.isTeachingDay ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {ev.isTeachingDay ? 'បង្រៀនធម្មតា' : 'ឈប់សម្រាក (គ្មានបង្រៀន)'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add / Edit Event */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEvent ? 'កែសម្រួលព្រឹត្តិការណ៍' : 'បន្ថែមព្រឹត្តិការណ៍ថ្មី'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ចំណងជើងព្រឹត្តិការណ៍ (Event Title) *
            </label>
            <input
              type="text"
              required
              value={formData.eventTitle}
              onChange={(e) => setFormData({ ...formData, eventTitle: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              placeholder="បុណ្យចូលឆ្នាំខ្មែរ"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ប្រភេទព្រឹត្តិការណ៍ *
            </label>
            <select
              value={formData.eventType}
              onChange={(e) => setFormData({ ...formData, eventType: e.target.value as any })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            >
              {Object.entries(eventTypeLabels).map(([key, item]) => (
                <option key={key} value={key}>{item.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ចាប់ផ្តើមពីថ្ងៃ *
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                រហូតដល់ថ្ងៃ
              </label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
            <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isTeachingDay}
                onChange={(e) => setFormData({ ...formData, isTeachingDay: e.target.checked })}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              <span>ជាថ្ងៃបង្រៀនធម្មតា</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFullDay}
                onChange={(e) => setFormData({ ...formData, isFullDay: e.target.checked })}
                className="rounded text-primary-600 focus:ring-primary-500"
              />
              <span>ឈប់ពេញមួយថ្ងៃ</span>
            </label>
          </div>

          {!formData.isFullDay && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                បិទសម្រាកពេលណា
              </label>
              <select
                value={formData.blockedSession}
                onChange={(e) => setFormData({ ...formData, blockedSession: e.target.value as any })}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              >
                <option value="MORNING">ពេលព្រឹក (Morning)</option>
                <option value="AFTERNOON">ពេលរសៀល (Afternoon)</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              ពិពណ៌នាបន្ថែម
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
              placeholder="ព័ត៌មានលម្អិត..."
            />
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
        title="លុបព្រឹត្តិការណ៍ប្រតិទិន"
        message="តើអ្នកប្រាកដជាចង់លុបព្រឹត្តិការណ៍នេះចេញពីប្រតិទិនសាលាមែនទេ?"
      />
    </div>
  );
};

