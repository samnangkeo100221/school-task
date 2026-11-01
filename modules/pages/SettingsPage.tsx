import React, { useEffect, useState } from 'react';
import {
  Settings,
  School,
  Clock,
  Database,
  History,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ShieldAlert
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/storageService';
import { initFirebase } from '../services/firebase';
import { SchoolSettings, AuditLog } from '../types';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const SettingsPage: React.FC = () => {
  const { schoolSettings, refreshData, addToast } = useApp();
  const [activeTab, setActiveTab] = useState<'school' | 'periods' | 'firebase' | 'audit'>('school');
  const [formData, setFormData] = useState<Partial<SchoolSettings>>({});
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [saving, setSaving] = useState(false);

  // Firebase Config State
  const [firebaseConfig, setFirebaseConfig] = useState({
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  });

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    if (schoolSettings) {
      setFormData(schoolSettings);
    }
    const loadLogs = async () => {
      const logs = await storageService.getAuditLogs();
      setAuditLogs(logs);
    };
    loadLogs();

    if (typeof window !== 'undefined') {
      try {
        const savedFb = JSON.parse(localStorage.getItem('my_school_firebase_config') || '{}');
        if (savedFb.apiKey) setFirebaseConfig(savedFb);
      } catch {
        // ignore
      }
    }
  }, [schoolSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.schoolNameKm) return;

    setSaving(true);
    try {
      await storageService.updateSettings(formData as SchoolSettings);
      await refreshData();
      addToast('success', 'បានរក្សាទុកការកំណត់សាលារៀន');
    } catch (err: any) {
      addToast('error', 'បរាជ័យក្នុងការរក្សាទុក', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFirebaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('my_school_firebase_config', JSON.stringify(firebaseConfig));
      initFirebase(firebaseConfig);
      addToast('success', 'បានរក្សាទុកការកំណត់ Firebase', 'ប្រព័ន្ធបានភ្ជាប់ទៅកាន់ Firestore Database');
    }
  };

  const handleResetData = () => {
    storageService.resetToInitialData();
    refreshData();
    addToast('info', 'បានកំណត់ទិន្នន័យឡើងវិញ', 'ទិន្នន័យគំរូត្រូវបានបញ្ចូលឡើងវិញ');
  };

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            <span>ការកំណត់ប្រព័ន្ធ និងសុវត្ថិភាព (System Settings & Audit)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            ព័ត៌មានទូទៅរបស់សាលា ការកំណត់ម៉ោងបង្រៀន Firebase Database និងប្រវត្តិកំណត់ត្រា (Audit Logs)
          </p>
        </div>

        <button
          onClick={() => setShowResetConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300 rounded-xl text-xs font-bold transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>កំណត់ទិន្នន័យឡើងវិញ (Reset)</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('school')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
            activeTab === 'school'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <School className="w-4 h-4" />
          <span>ព័ត៌មានសាលារៀន</span>
        </button>
        <button
          onClick={() => setActiveTab('periods')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
            activeTab === 'periods'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>ម៉ោងសិក្សា & សម្រាក</span>
        </button>
        <button
          onClick={() => setActiveTab('firebase')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
            activeTab === 'firebase'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Flame className="w-4 h-4 text-amber-400" />
          <span>Firebase Database</span>
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all ${
            activeTab === 'audit'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>ប្រវត្តិកំណត់ត្រា (Audit Logs)</span>
        </button>
      </div>

      {/* TAB 1: SCHOOL INFO */}
      {activeTab === 'school' && (
        <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                ឈ្មោះសាលារៀន (ភាសាខ្មែរ) *
              </label>
              <input
                type="text"
                value={formData.schoolNameKm || ''}
                onChange={(e) => setFormData({ ...formData, schoolNameKm: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                ឈ្មោះសាលារៀន (អង់គ្លេស)
              </label>
              <input
                type="text"
                value={formData.schoolNameEn || ''}
                onChange={(e) => setFormData({ ...formData, schoolNameEn: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                ឈ្មោះនាយកសាលា
              </label>
              <input
                type="text"
                value={formData.principalName || ''}
                onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-medium"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                កូដសាលា
              </label>
              <input
                type="text"
                value={formData.schoolCode || ''}
                onChange={(e) => setFormData({ ...formData, schoolCode: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                លេខទូរស័ព្ទទាក់ទង
              </label>
              <input
                type="text"
                value={formData.contactPhone || ''}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                អ៊ីមែលសាលា
              </label>
              <input
                type="email"
                value={formData.contactEmail || ''}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              ទីតាំងសាលារៀន
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
            >
              {saving ? 'កំពុងរក្សាទុក...' : 'រក្សាទុកព័ត៌មានសាលា'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: PERIOD SETTINGS */}
      {activeTab === 'periods' && (
        <form onSubmit={handleSaveSettings} className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                រយៈពេល ១ ម៉ោងសិក្សា (នាទី)
              </label>
              <input
                type="number"
                min="30"
                max="90"
                value={formData.periodDurationMinutes || 50}
                onChange={(e) => setFormData({ ...formData, periodDurationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                ចំនួនម៉ោងបង្រៀនសរុបក្នុង ១ ថ្ងៃ
              </label>
              <input
                type="number"
                min="4"
                max="10"
                value={formData.periodsPerDay || 8}
                onChange={(e) => setFormData({ ...formData, periodsPerDay: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                ចំនួនម៉ោងពេលព្រឹក
              </label>
              <input
                type="number"
                value={formData.morningPeriods || 4}
                onChange={(e) => setFormData({ ...formData, morningPeriods: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                ចំនួនម៉ោងពេលរសៀល
              </label>
              <input
                type="number"
                value={formData.afternoonPeriods || 4}
                onChange={(e) => setFormData({ ...formData, afternoonPeriods: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-bold"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
            >
              រក្សាទុកការកំណត់ម៉ោង
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: FIREBASE */}
      {activeTab === 'firebase' && (
        <form onSubmit={handleSaveFirebaseConfig} className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4 text-xs">
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-start gap-3">
            <Flame className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-900 dark:text-amber-200">
                ការកំណត់ Firebase Cloud Firestore
              </p>
              <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                បញ្ចូល Firebase Web Config របស់អ្នកដើម្បីធ្វើសមកាលកម្មទិន្នន័យ (Cloud Firestore & Firebase Auth) ដោយផ្ទាល់។ ប្រព័ន្ធដំណើរការដោយរលូនជាមួយនឹងកន្លែងផ្ទុកទិន្នន័យអចិន្ត្រៃយ៍មូលដ្ឋានដោយស្វ័យប្រវត្តិ។
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">API Key</label>
              <input
                type="text"
                placeholder="AIzaSy..."
                value={firebaseConfig.apiKey}
                onChange={(e) => setFirebaseConfig({ ...firebaseConfig, apiKey: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Project ID</label>
              <input
                type="text"
                placeholder="my-school-task-system"
                value={firebaseConfig.projectId}
                onChange={(e) => setFirebaseConfig({ ...firebaseConfig, projectId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Auth Domain</label>
              <input
                type="text"
                placeholder="my-school.firebaseapp.com"
                value={firebaseConfig.authDomain}
                onChange={(e) => setFirebaseConfig({ ...firebaseConfig, authDomain: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">App ID</label>
              <input
                type="text"
                placeholder="1:123456789:web:abcdef"
                value={firebaseConfig.appId}
                onChange={(e) => setFirebaseConfig({ ...firebaseConfig, appId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
            >
              រក្សាទុក Firebase Config
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              ប្រវត្តិកំណត់ត្រាសកម្មភាពសំខាន់ៗ (Audit Logs)
            </h2>
            <span className="text-xs text-slate-400">
              សរុប {auditLogs.length} កំណត់ត្រា
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-100 dark:border-slate-700 rounded-2xl">
            <table className="w-full text-left divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50 dark:bg-slate-900 font-bold text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="px-3 py-2.5">កាលបរិច្ឆេទ & ម៉ោង</th>
                  <th className="px-3 py-2.5">អ្នកធ្វើសកម្មភាព</th>
                  <th className="px-3 py-2.5">សកម្មភាព (Action)</th>
                  <th className="px-3 py-2.5">ទិន្នន័យ (Collection)</th>
                  <th className="px-3 py-2.5">ព័ត៌មានលម្អិត</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.slice(0, 30).map((log) => (
                  <tr key={log.logId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('km-KH')}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-blue-600">{log.userEmail}</td>
                    <td className="px-3 py-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">{log.action}</td>
                    <td className="px-3 py-2.5 font-mono text-slate-500">{log.collection}</td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{log.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reset Confirmation */}
      <ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={handleResetData}
        title="បញ្ជាក់ការកំណត់ប្រព័ន្ធឡើងវិញ"
        message="តើលោកគ្រូពិតជាចង់កំណត់ប្រព័ន្ធឡើងវិញមែនទេ? ទិន្នន័យគំរូផ្លូវការទាំងអស់នៃវិទ្យាល័យ ហ៊ុន សែន បាត់ដឹង និងកម្មវិធីសិក្សាគណិតវិទ្យាថ្នាក់ទី ៨ នឹងត្រូវបានបញ្ចូលឡើងវិញ។"
        confirmLabel="យល់ព្រមកំណត់ឡើងវិញ"
        cancelLabel="បោះបង់"
        isDestructive
      />
    </div>
  );
};
