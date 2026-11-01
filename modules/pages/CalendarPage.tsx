import React, { useEffect, useState } from 'react';
import {
  CalendarCheck,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  Edit2,
  Trash2,
  Flag,
  Sparkles,
  Award
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { SchoolCalendarEvent } from '../types';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const CalendarPage: React.FC = () => {
  const { activeAcademicYear, addToast } = useApp();
  const [events, setEvents] = useState<SchoolCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [filterType, setFilterType] = useState<string>('all');

  // Modal
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolCalendarEvent | null>(null);
  const [eventFormData, setEventFormData] = useState<Partial<SchoolCalendarEvent>>({
    eventTitle: '',
    eventType: 'national_holiday',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    isFullDay: true,
    isTeachingDay: false,
    description: ''
  });

  // Delete Confirm
  const [eventToDelete, setEventToDelete] = useState<SchoolCalendarEvent | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await storageService.getCalendarEvents(activeAcademicYear?.academicYearId);
      setEvents(data.sort((a, b) => a.startDate.localeCompare(b.startDate)));
    } catch (err) {
      console.error('Failed to load calendar events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [activeAcademicYear]);

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setEventFormData({
      eventId: `EV-${Date.now()}`,
      academicYearId: activeAcademicYear?.academicYearId || 'AY-2025-2026',
      eventTitle: '',
      eventType: 'national_holiday',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      isFullDay: true,
      isTeachingDay: false,
      description: ''
    });
    setShowEventModal(true);
  };

  const handleOpenEdit = (ev: SchoolCalendarEvent) => {
    setEditingEvent(ev);
    setEventFormData(ev);
    setShowEventModal(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventFormData.eventTitle || !eventFormData.startDate) {
      addToast('error', 'សូមបំពេញព័ត៌មានចាំបាច់');
      return;
    }

    try {
      const evToSave: SchoolCalendarEvent = {
        eventId: editingEvent?.eventId || `EV-${Date.now()}`,
        academicYearId: activeAcademicYear?.academicYearId || 'AY-2025-2026',
        eventTitle: eventFormData.eventTitle || '',
        eventType: (eventFormData.eventType as any) || 'national_holiday',
        startDate: eventFormData.startDate || '',
        endDate: eventFormData.endDate || eventFormData.startDate || '',
        isFullDay: eventFormData.isFullDay !== false,
        isTeachingDay: eventFormData.isTeachingDay === true,
        description: eventFormData.description || ''
      };

      await storageService.saveCalendarEvent(evToSave);
      await loadEvents();
      setShowEventModal(false);
      addToast('success', editingEvent ? 'បានកែប្រែព្រឹត្តិការណ៍' : 'បានបន្ថែមព្រឹត្តិការណ៍ថ្មី', evToSave.eventTitle);
    } catch (err: any) {
      addToast('error', 'បរាជ័យក្នុងការរក្សាទុក', err.message);
    }
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      await storageService.deleteCalendarEvent(eventToDelete.eventId);
      await loadEvents();
      addToast('success', 'បានលុបព្រឹត្តិការណ៍', eventToDelete.eventTitle);
    } catch (err: any) {
      addToast('error', 'បរាជ័យក្នុងការលុប', err.message);
    }
  };

  const filteredEvents = events.filter(e => {
    if (filterType !== 'all' && e.eventType !== filterType) return false;
    return true;
  });

  const getEventTypeBadge = (type: SchoolCalendarEvent['eventType']) => {
    switch (type) {
      case 'national_holiday':
        return { label: 'បុណ្យជាតិ', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' };
      case 'traditional_festival':
        return { label: 'ពិធីបុណ្យប្រពៃណី', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' };
      case 'examination':
        return { label: 'ការប្រឡង', color: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' };
      case 'academic_opening':
      case 'academic_closing':
        return { label: 'បវេសនកាល', color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' };
      default:
        return { label: 'កម្មវិធីសាលា', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-blue-600" />
            <span>ប្រតិទិនសាលា និងបុណ្យជាតិកម្ពុជា (School Calendar & Holidays)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            កំណត់ថ្ងៃឈប់សម្រាកផ្លូវការ បុណ្យជាតិ ប្រពៃណី និងសប្តាហ៍ប្រឡង ដើម្បីគណនាកាលវិភាគបង្រៀន
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>បន្ថែមបុណ្យ/ព្រឹត្តិការណ៍</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'all', label: 'ទាំងអស់' },
          { id: 'national_holiday', label: 'បុណ្យជាតិ' },
          { id: 'traditional_festival', label: 'ពិធីបុណ្យប្រពៃណី' },
          { id: 'examination', label: 'ការប្រឡង' },
          { id: 'academic_opening', label: 'បវេសនកាល' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
              filterType === tab.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEvents.map((ev) => {
          const badge = getEventTypeBadge(ev.eventType);
          return (
            <div
              key={ev.eventId}
              className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${badge.color}`}>
                    {badge.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {ev.isTeachingDay ? '○ មានការបង្រៀន' : '✓ ឈប់សម្រាក'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {ev.eventTitle}
                </h3>

                <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>
                    {ev.startDate === ev.endDate ? ev.startDate : `${ev.startDate} ដល់ ${ev.endDate}`}
                  </span>
                </div>

                {ev.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {ev.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 font-mono">
                  {ev.isFullDay ? 'ពេញមួយថ្ងៃ' : 'កន្លះថ្ងៃ'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(ev)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-blue-600"
                    title="កែសម្រួល"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setEventToDelete(ev);
                      setShowDeleteConfirm(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600"
                    title="លុប"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        title={editingEvent ? 'កែប្រែព្រឹត្តិការណ៍/បុណ្យជាតិ' : 'បន្ថែមព្រឹត្តិការណ៍ថ្មី'}
        maxWidth="xl"
      >
        <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              ឈ្មោះព្រឹត្តិការណ៍ / បុណ្យជាតិ *
            </label>
            <input
              type="text"
              placeholder="ឧ. ទិវាបុណ្យឯករាជ្យជាតិ (៩ វិច្ឆិកា)"
              value={eventFormData.eventTitle || ''}
              onChange={(e) => setEventFormData({ ...eventFormData, eventTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                ប្រភេទព្រឹត្តិការណ៍
              </label>
              <select
                value={eventFormData.eventType}
                onChange={(e) => setEventFormData({ ...eventFormData, eventType: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
              >
                <option value="national_holiday">បុណ្យជាតិ (National Holiday)</option>
                <option value="traditional_festival">ពិធីបុណ្យប្រពៃណី (Traditional)</option>
                <option value="examination">ការប្រឡង (Examination)</option>
                <option value="school_holiday">ឈប់សម្រាកសាលា (School Holiday)</option>
                <option value="academic_opening">បើកបវេសនកាល</option>
                <option value="academic_closing">បិទបញ្ចប់ឆ្នាំសិក្សា</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                ថ្ងៃបង្រៀន?
              </label>
              <select
                value={eventFormData.isTeachingDay ? 'yes' : 'no'}
                onChange={(e) => setEventFormData({ ...eventFormData, isTeachingDay: e.target.value === 'yes' })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
              >
                <option value="no">ឈប់សម្រាក (មិនមានបង្រៀន)</option>
                <option value="yes">មានការបង្រៀនធម្មតា</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                កាលបរិច្ឆេទចាប់ផ្តើម *
              </label>
              <input
                type="date"
                value={eventFormData.startDate}
                onChange={(e) => setEventFormData({ ...eventFormData, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
                required
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
                កាលបរិច្ឆេទបញ្ចប់ *
              </label>
              <input
                type="date"
                value={eventFormData.endDate}
                onChange={(e) => setEventFormData({ ...eventFormData, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-600 dark:text-slate-300 font-semibold mb-1">
              ការពិពណ៌នាបន្ថែម
            </label>
            <textarea
              rows={2}
              value={eventFormData.description || ''}
              onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setShowEventModal(false)}
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

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteEvent}
        title="បញ្ជាក់ការលុបព្រឹត្តិការណ៍"
        message={`តើលោកគ្រូពិតជាចង់លុបព្រឹត្តិការណ៍ "${eventToDelete?.eventTitle}" នេះមែនទេ?`}
        confirmLabel="យល់ព្រមលុប"
        cancelLabel="បោះបង់"
        isDestructive
      />
    </div>
  );
};
