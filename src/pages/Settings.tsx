import { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Monitor,
  Camera,
  Bell,
  User,
  Database,
  Wrench,
  Save,
  RotateCcw,
  Download,
  Upload,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { PageTemplate } from '../layout';
import { Card, Button } from '../components';
import { useAuth } from '../state';

// Preferences types
interface UserPreferences {
  // Display
  theme: 'dark' | 'light' | 'auto';
  density: 'compact' | 'comfortable' | 'spacious';
  defaultPage: string;
  itemsPerPage: number;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  // Scanning
  scanMode: 'add' | 'remove' | 'pull' | 'return';
  autoGenerateBarcodes: boolean;
  barcodeFormat: 'sku' | 'qr';
  requireReason: boolean;
  beepOnScan: boolean;
  camera: 'front' | 'back';
  // Notifications (placeholders)
  lowStockAlerts: boolean;
  jobReminders: boolean;
  pullListNotifications: boolean;
  clockInReminders: boolean;
  // Advanced
  experimentalFeatures: boolean;
  debugMode: boolean;
  apiEndpoint: string;
}

const defaultPreferences: UserPreferences = {
  theme: 'dark',
  density: 'comfortable',
  defaultPage: '/',
  itemsPerPage: 25,
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  scanMode: 'add',
  autoGenerateBarcodes: true,
  barcodeFormat: 'sku',
  requireReason: false,
  beepOnScan: true,
  camera: 'back',
  lowStockAlerts: true,
  jobReminders: true,
  pullListNotifications: true,
  clockInReminders: true,
  experimentalFeatures: false,
  debugMode: false,
  apiEndpoint: '',
};

const STORAGE_KEY = 'neonos-preferences';

function loadPreferences(): UserPreferences {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...defaultPreferences, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Failed to load preferences:', e);
  }
  return defaultPreferences;
}

function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save preferences:', e);
  }
}

type TabId = 'display' | 'scanning' | 'notifications' | 'account' | 'data' | 'advanced';

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'display', label: 'Display', icon: Monitor },
  { id: 'scanning', label: 'Scanning', icon: Camera },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'account', label: 'Account', icon: User },
  { id: 'data', label: 'Data', icon: Database },
  { id: 'advanced', label: 'Advanced', icon: Wrench },
];

export function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('display');
  const [prefs, setPrefs] = useState<UserPreferences>(loadPreferences);
  const [hasChanges, setHasChanges] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Track changes
  useEffect(() => {
    const saved = loadPreferences();
    setHasChanges(JSON.stringify(prefs) !== JSON.stringify(saved));
  }, [prefs]);

  const updatePref = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    savePreferences(prefs);
    setHasChanges(false);
  };

  const handleReset = () => {
    setPrefs(defaultPreferences);
  };

  const handleExport = () => {
    const data = {
      preferences: prefs,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neonos-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (data.preferences) {
              setPrefs({ ...defaultPreferences, ...data.preferences });
            }
          } catch (err) {
            alert('Invalid settings file');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleClearData = () => {
    localStorage.clear();
    setPrefs(defaultPreferences);
    setShowClearConfirm(false);
    window.location.reload();
  };

  // Toggle component
  const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-slate-300 font-mono text-sm">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`
          relative w-11 h-6 rounded-sm transition-colors
          ${checked ? 'bg-blue-600' : 'bg-slate-700'}
        `}
      >
        <span
          className={`
            absolute top-1 w-4 h-4 bg-white rounded-sm transition-transform
            ${checked ? 'left-6' : 'left-1'}
          `}
        />
      </button>
    </label>
  );

  // Select component
  const SelectField = ({
    label,
    value,
    onChange,
    options
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <div className="flex items-center justify-between">
      <span className="text-slate-300 font-mono text-sm">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-950 border-2 border-slate-700 rounded-sm px-3 py-1.5 font-mono text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );

  return (
    <PageTemplate
      title="Settings"
      actions={
        hasChanges ? (
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setPrefs(loadPreferences())}>
              Cancel
            </Button>
            <Button variant="primary" icon={Save} onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        ) : null
      }
    >
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tabs - horizontal on mobile, vertical on desktop */}
        <div className="lg:w-48 flex-shrink-0">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-sm font-mono text-sm whitespace-nowrap
                    transition-all
                    ${isActive
                      ? 'bg-blue-500/10 text-blue-400 border-l-2 lg:border-l-2 border-blue-500'
                      : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800 border-l-2 lg:border-l-2 border-transparent'
                    }
                  `}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <Card title={tabs.find(t => t.id === activeTab)?.label} icon={SettingsIcon}>
            <div className="space-y-6">
              {/* Display Tab */}
              {activeTab === 'display' && (
                <>
                  <SelectField
                    label="Theme"
                    value={prefs.theme}
                    onChange={(v) => updatePref('theme', v as UserPreferences['theme'])}
                    options={[
                      { value: 'dark', label: 'Dark' },
                      { value: 'light', label: 'Light (Coming Soon)' },
                      { value: 'auto', label: 'Auto' },
                    ]}
                  />
                  <SelectField
                    label="Density"
                    value={prefs.density}
                    onChange={(v) => updatePref('density', v as UserPreferences['density'])}
                    options={[
                      { value: 'compact', label: 'Compact' },
                      { value: 'comfortable', label: 'Comfortable' },
                      { value: 'spacious', label: 'Spacious' },
                    ]}
                  />
                  <SelectField
                    label="Default Page"
                    value={prefs.defaultPage}
                    onChange={(v) => updatePref('defaultPage', v)}
                    options={[
                      { value: '/', label: 'Dashboard' },
                      { value: '/inventory', label: 'Inventory' },
                      { value: '/jobs', label: 'Jobs' },
                      { value: '/scan', label: 'Scanner' },
                    ]}
                  />
                  <SelectField
                    label="Items Per Page"
                    value={String(prefs.itemsPerPage)}
                    onChange={(v) => updatePref('itemsPerPage', Number(v))}
                    options={[
                      { value: '10', label: '10' },
                      { value: '25', label: '25' },
                      { value: '50', label: '50' },
                      { value: '100', label: '100' },
                    ]}
                  />
                  <SelectField
                    label="Date Format"
                    value={prefs.dateFormat}
                    onChange={(v) => updatePref('dateFormat', v)}
                    options={[
                      { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                      { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                      { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
                    ]}
                  />
                  <SelectField
                    label="Time Format"
                    value={prefs.timeFormat}
                    onChange={(v) => updatePref('timeFormat', v as UserPreferences['timeFormat'])}
                    options={[
                      { value: '12h', label: '12 hour (3:00 PM)' },
                      { value: '24h', label: '24 hour (15:00)' },
                    ]}
                  />
                </>
              )}

              {/* Scanning Tab */}
              {activeTab === 'scanning' && (
                <>
                  <SelectField
                    label="Default Scan Mode"
                    value={prefs.scanMode}
                    onChange={(v) => updatePref('scanMode', v as UserPreferences['scanMode'])}
                    options={[
                      { value: 'add', label: 'Add to Inventory' },
                      { value: 'remove', label: 'Remove from Inventory' },
                      { value: 'pull', label: 'Pull for Job' },
                      { value: 'return', label: 'Return Items' },
                    ]}
                  />
                  <Toggle
                    label="Auto-generate Internal Barcodes"
                    checked={prefs.autoGenerateBarcodes}
                    onChange={(v) => updatePref('autoGenerateBarcodes', v)}
                  />
                  <SelectField
                    label="Barcode Format"
                    value={prefs.barcodeFormat}
                    onChange={(v) => updatePref('barcodeFormat', v as UserPreferences['barcodeFormat'])}
                    options={[
                      { value: 'sku', label: 'NEO-{SKU}' },
                      { value: 'qr', label: 'QR Code' },
                    ]}
                  />
                  <Toggle
                    label="Require Reason for Changes"
                    checked={prefs.requireReason}
                    onChange={(v) => updatePref('requireReason', v)}
                  />
                  <Toggle
                    label="Beep on Scan"
                    checked={prefs.beepOnScan}
                    onChange={(v) => updatePref('beepOnScan', v)}
                  />
                  <SelectField
                    label="Default Camera"
                    value={prefs.camera}
                    onChange={(v) => updatePref('camera', v as UserPreferences['camera'])}
                    options={[
                      { value: 'back', label: 'Back Camera' },
                      { value: 'front', label: 'Front Camera' },
                    ]}
                  />
                </>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <>
                  <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 rounded-sm mb-4">
                    <p className="text-amber-400 font-mono text-sm">
                      Notification settings will be available when backend is connected.
                    </p>
                  </div>
                  <Toggle
                    label="Low Stock Alerts"
                    checked={prefs.lowStockAlerts}
                    onChange={(v) => updatePref('lowStockAlerts', v)}
                  />
                  <Toggle
                    label="Job Reminders"
                    checked={prefs.jobReminders}
                    onChange={(v) => updatePref('jobReminders', v)}
                  />
                  <Toggle
                    label="Pull List Notifications"
                    checked={prefs.pullListNotifications}
                    onChange={(v) => updatePref('pullListNotifications', v)}
                  />
                  <Toggle
                    label="Clock-in Reminders"
                    checked={prefs.clockInReminders}
                    onChange={(v) => updatePref('clockInReminders', v)}
                  />
                </>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={user?.avatar}
                        alt={user?.name}
                        className="w-16 h-16 rounded-sm border-2 border-slate-700"
                      />
                      <div>
                        <div className="text-slate-200 font-mono font-bold text-lg">
                          {user?.name}
                        </div>
                        <div className="text-slate-500 font-mono text-sm">
                          {user?.email}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-700 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-mono text-sm">Role</span>
                        <span className="text-blue-400 font-mono text-sm font-bold uppercase">
                          {user?.role}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-mono text-sm">Status</span>
                        <span className="text-emerald-400 font-mono text-sm font-bold uppercase">
                          {user?.status}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-700">
                      <p className="text-slate-500 font-mono text-xs">
                        Password and 2FA settings will be available with Google OAuth integration.
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Data Tab */}
              {activeTab === 'data' && (
                <>
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button variant="secondary" icon={Download} onClick={handleExport} className="flex-1">
                        Export Settings
                      </Button>
                      <Button variant="secondary" icon={Upload} onClick={handleImport} className="flex-1">
                        Import Settings
                      </Button>
                    </div>

                    <div className="pt-4 border-t border-slate-700">
                      <Button variant="ghost" icon={RotateCcw} onClick={handleReset}>
                        Reset to Defaults
                      </Button>
                    </div>

                    <div className="pt-4 border-t border-slate-700">
                      {showClearConfirm ? (
                        <div className="p-4 bg-red-500/10 border-2 border-red-500/30 rounded-sm space-y-3">
                          <div className="flex items-center gap-2 text-red-400">
                            <AlertTriangle size={20} />
                            <span className="font-mono font-bold">Clear All Data?</span>
                          </div>
                          <p className="text-slate-400 font-mono text-sm">
                            This will delete all local data including inventory, jobs, and settings.
                            This cannot be undone.
                          </p>
                          <div className="flex gap-2">
                            <Button variant="danger" onClick={handleClearData}>
                              Yes, Clear Everything
                            </Button>
                            <Button variant="ghost" onClick={() => setShowClearConfirm(false)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button variant="danger" icon={Trash2} onClick={() => setShowClearConfirm(true)}>
                          Clear All Local Data
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Advanced Tab */}
              {activeTab === 'advanced' && (
                <>
                  <Toggle
                    label="Enable Experimental Features"
                    checked={prefs.experimentalFeatures}
                    onChange={(v) => updatePref('experimentalFeatures', v)}
                  />
                  <Toggle
                    label="Debug Mode"
                    checked={prefs.debugMode}
                    onChange={(v) => updatePref('debugMode', v)}
                  />
                  <div className="space-y-2">
                    <label className="text-slate-300 font-mono text-sm">API Endpoint</label>
                    <input
                      type="text"
                      value={prefs.apiEndpoint}
                      onChange={(e) => updatePref('apiEndpoint', e.target.value)}
                      placeholder="https://api.neonos.kg3.io"
                      className="w-full bg-slate-950 border-2 border-slate-700 rounded-sm px-3 py-2 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                    <p className="text-slate-500 font-mono text-xs">
                      Leave empty to use local storage only
                    </p>
                  </div>

                  <div className="pt-4 border-t border-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-mono text-sm">Version</span>
                      <span className="text-slate-500 font-mono text-sm">1.0.0-beta</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageTemplate>
  );
}
