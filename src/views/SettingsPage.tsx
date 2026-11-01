import { APP_VERSION, APP_BUILD_DATE, APP_RELEASE_NAME } from '../version';
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { useApp } from '../contexts/AppContext';
import { initFirebase } from '../services/firebase';
import { SchoolSettings, TeachingPeriodConfig, AuditLog } from '../types';
import { 
  Settings, Building2, Clock, Database, ShieldCheck, 
  RotateCcw, Save, CheckCircle, Info, Tag, GitBranch
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { addToast } = useApp();
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [firebaseConfigStr, setFirebaseConfigStr] = useState<string>('');
  const [isSavedAlert, setIsSavedAlert] = useState<boolean>(false);
  const [firebaseStatus, setFirebaseStatus] = useState<string>('LOCAL_STORAGE');

  const loadData = async () => {
    const [s, logs] = await Promise.all([
      storageService.getSettings(),
      storageService.getAuditLogs()
    ]);
    setSettings(s);
    setAuditLogs(logs);

    const savedFb = localStorage.getItem('my_school_firebase_config');
    if (savedFb) {
      setFirebaseConfigStr(savedFb);
      setFirebaseStatus('CONFIGURED');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSchoolInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    await storageService.updateSettings(settings);
    addToast('success', 'បានរក្សាទុកព័ត៌មានសាលារៀន');
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 3000);
  };

  const handleSaveFirebaseConfig = () => {
    try {
      if (!firebaseConfigStr.trim()) {
        localStorage.removeItem('my_school_firebase_config');
        setFirebaseStatus('LOCAL_STORAGE');
        alert('បានលុបការកំណត់ Firebase! ប្រព័ន្ធដំណើរការជាមួយ Offline Reactive Storage។');
        return;
      }

      const parsed = JSON.parse(firebaseConfigStr);
      localStorage.setItem('my_school_firebase_config', JSON.stringify(parsed));
      initFirebase(parsed);
      setFirebaseStatus('CONFIGURED');
      alert('បានតភ្ជាប់ និងរក្សាទុក Firebase Configuration ជោគជ័យ!');
    } catch (err: any) {
      alert('កំហុស JSON Format! សូមពិនិត្យមើលទម្រង់ JSON របស់ Firebase Config: ' + err.message);
    }
  };

  const handleResetToDemo = () => {
    if (confirm('ការកំណត់ឡើងវិញនឹងស្តារទិន្នន័យគំរូដើមទាំងអស់ (វិទ្យាល័យហ៊ុនសែន បាត់ដឹង, លោកគ្រូ កែវ សំណាង, កម្មវិធីសិក្សា ៣៨ សប្តាហ៍)! តើអ្នកចង់បន្តទេ?')) {
      storageService.resetToInitialData();
      alert('ទិន្នន័យត្រូវបានកំណត់ឡើងវិញជោគជ័យ!');
      window.location.reload();
    }
  };

  if (!settings) {
    return <div className="p-8 text-center text-gray-500">កំពុងផ្ទុកការកំណត់...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            ការកំណត់ប្រព័ន្ធ (System Settings)
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            គ្រប់គ្រងព័ត៌មានសាលារៀន ម៉ោងសិក្សា ការតភ្ជាប់ Firebase និងកំណត់ត្រាប្រតិបត្តិការ
          </p>
        </div>
        <button
          onClick={handleResetToDemo}
          className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
        >
          <RotateCcw className="w-4 h-4 text-rose-600" />
          កំណត់ទិន្នន័យគំរូឡើងវិញ (Reset to Demo)
        </button>
      </div>

      {isSavedAlert && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">ការកំណត់ត្រូវបានរក្សាទុកដោយជោគជ័យ!</span>
        </div>
      )}

      {/* School Information Form */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2 bg-indigo-50/40 dark:bg-indigo-950/30">
          <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-bold text-gray-900 dark:text-white text-base">ព័ត៌មានទូទៅរបស់សាលារៀន (School Information)</h2>
        </div>

        <form onSubmit={handleSaveSchoolInfo} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">ឈ្មោះសាលារៀន (ភាសាខ្មែរ)</label>
              <input
                type="text"
                value={settings.schoolNameKm}
                onChange={(e) => setSettings({ ...settings, schoolNameKm: e.target.value })}
                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">ឈ្មោះសាលារៀន (English)</label>
              <input
                type="text"
                value={settings.schoolNameEn || ''}
                onChange={(e) => setSettings({ ...settings, schoolNameEn: e.target.value })}
                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">បាវចនាសាលា (Slogan)</label>
              <input
                type="text"
                value={settings.sloganKm || ''}
                onChange={(e) => setSettings({ ...settings, sloganKm: e.target.value })}
                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">ឈ្មោះលោកនាយកសាលា</label>
              <input
                type="text"
                value={settings.directorNameKm || ''}
                onChange={(e) => setSettings({ ...settings, directorNameKm: e.target.value })}
                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">ខេត្ត / រាជធានី</label>
              <input
                type="text"
                value={settings.provinceKm || ''}
                onChange={(e) => setSettings({ ...settings, provinceKm: e.target.value })}
                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">ស្រុក / ខណ្ឌ</label>
              <input
                type="text"
                value={settings.districtKm || ''}
                onChange={(e) => setSettings({ ...settings, districtKm: e.target.value })}
                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">លេខទូរស័ព្ទទំនាក់ទំនង</label>
              <input
                type="text"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">សារអេឡិចត្រូនិច (Email)</label>
              <input
                type="email"
                value={settings.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              រក្សាទុកព័ត៌មានសាលា
            </button>
          </div>
        </form>
      </div>

      {/* Period Timings Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2 bg-indigo-50/40 dark:bg-indigo-950/30">
          <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-bold text-gray-900 dark:text-white text-base">កាលវិភាគម៉ោងសិក្សា (Period Definitions)</h2>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/60 text-gray-700 dark:text-slate-300 text-xs font-semibold border-b border-gray-200 dark:border-slate-700">
                  <th className="py-2.5 px-4 text-center">ម៉ោងទី</th>
                  <th className="py-2.5 px-4">វេនសិក្សា</th>
                  <th className="py-2.5 px-4">ម៉ោងចាប់ផ្តើម</th>
                  <th className="py-2.5 px-4">ម៉ោងបញ្ចប់</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {settings.periods.map((p, idx) => (
                  <tr key={p.periodNumber} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50">
                    <td className="py-2.5 px-4 text-center font-bold text-indigo-600 dark:text-indigo-400">
                      {p.periodNameKm || `ម៉ោងទី ${p.periodNumber}`}
                    </td>
                    <td className="py-2.5 px-4 text-xs font-medium text-gray-700 dark:text-slate-300">
                      <span className={`px-2 py-0.5 rounded ${
                        p.session === 'MORNING' ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300'
                      }`}>
                        {p.session === 'MORNING' ? 'ព្រឹក' : 'រសៀល'}
                      </span>
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="time"
                        value={p.startTime}
                        onChange={(e) => {
                          const updated = [...settings.periods];
                          updated[idx].startTime = e.target.value;
                          setSettings({ ...settings, periods: updated });
                        }}
                        className="border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded px-2 py-1 text-xs"
                      />
                    </td>
                    <td className="py-2.5 px-4">
                      <input
                        type="time"
                        value={p.endTime}
                        onChange={(e) => {
                          const updated = [...settings.periods];
                          updated[idx].endTime = e.target.value;
                          setSettings({ ...settings, periods: updated });
                        }}
                        className="border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded px-2 py-1 text-xs"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveSchoolInfo}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2"
            >
              <Save className="w-3.5 h-3.5" />
              រក្សាទុកម៉ោងសិក្សា
            </button>
          </div>
        </div>
      </div>

      {/* Firebase Cloud Connection Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-indigo-50/40 dark:bg-indigo-950/30">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-bold text-gray-900 dark:text-white text-base">ការកំណត់ Firebase Cloud (Dual-Storage Mode)</h2>
          </div>
          <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
            firebaseStatus === 'CONFIGURED' ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300' : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300'
          }`}>
            {firebaseStatus === 'CONFIGURED' ? 'Firebase Cloud Connected' : 'Offline Reactive Storage Active'}
          </span>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed">
            ប្រព័ន្ធនេះដំណើរការដោយស្វ័យប្រវត្តិតាមរយៈ Reactive Local Storage ដោយមិនបាច់កំណត់ Firebase ក៏បាន។
            ប្រសិនបើអ្នកចង់ធ្វើសមកាលកម្មទិន្នន័យឡើង Firebase Firestore សូមបិទភ្ជាប់ JSON Configuration ដែលទទួលបានពី Firebase Console ខាងក្រោម៖
          </p>

          <textarea
            rows={5}
            value={firebaseConfigStr}
            onChange={(e) => setFirebaseConfigStr(e.target.value)}
            placeholder={`{\n  "apiKey": "AIzaSy...",\n  "authDomain": "my-school.firebaseapp.com",\n  "projectId": "my-school-task",\n  "storageBucket": "...",\n  "messagingSenderId": "...",\n  "appId": "..."\n}`}
            className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-lg p-3 font-mono text-xs focus:ring-2 focus:ring-indigo-500"
          />

          <div className="flex justify-end gap-3">
            <button
              onClick={handleSaveFirebaseConfig}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              រក្សាទុក និងតភ្ជាប់ Firebase
            </button>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-2 bg-indigo-50/40 dark:bg-indigo-950/30">
          <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="font-bold text-gray-900 dark:text-white text-base">កំណត់ត្រាប្រតិបត្តិការប្រព័ន្ធ (System Audit Logs)</h2>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-900/60 text-gray-700 dark:text-slate-300 font-semibold border-b border-gray-200 dark:border-slate-700">
                  <th className="py-2.5 px-3">ពេលវេលា</th>
                  <th className="py-2.5 px-3">សកម្មភាព</th>
                  <th className="py-2.5 px-3">ផ្នែក</th>
                  <th className="py-2.5 px-3">ព័ត៌មានលម្អិត</th>
                  <th className="py-2.5 px-3">អ្នកប្រើប្រាស់</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-400">
                      មិនទាន់មានកំណត់ត្រាប្រតិបត្តិការ
                    </td>
                  </tr>
                ) : (
                  auditLogs.slice(0, 50).map(log => (
                    <tr key={log.logId} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/50">
                      <td className="py-2 px-3 text-gray-500 dark:text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleString('km-KH')}
                      </td>
                      <td className="py-2 px-3 font-semibold text-indigo-600 dark:text-indigo-400">
                        {log.action}
                      </td>
                      <td className="py-2 px-3 text-gray-700 dark:text-slate-300">
                        {log.collection}
                      </td>
                      <td className="py-2 px-3 text-gray-600 dark:text-slate-400">
                        {log.details}
                      </td>
                      <td className="py-2 px-3 text-gray-500 dark:text-slate-400 font-mono">
                        {log.userEmail || log.userId}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
