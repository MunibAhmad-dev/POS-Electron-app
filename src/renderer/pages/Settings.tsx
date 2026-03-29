import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Upload, Store, Phone, MapPin, FileText, Lock, 
  Image as ImageIcon, Database, Download, Trash2, AlertTriangle 
} from 'lucide-react';

interface Settings {
  store_name: string;
  store_phone: string;
  store_address: string;
  store_logo: string;
  receipt_footer: string;
  pos_password: string;
}

const defaultSettings: Settings = {
  store_name: '', store_phone: '', store_address: '',
  store_logo: '', receipt_footer: 'Thank you for visiting!', pos_password: '1234',
};

const fmtPKR = (n: number) => 'PKR ' + Math.round(n).toLocaleString('en-PK');

export default function Settings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [previewLogo, setPreviewLogo] = useState('');
  const [saved, setSaved] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const res = await window.api.getSettings();
      if (res?.success && res.data) {
        setSettings({
          ...(res.data as any),
          pos_password: res.data.pos_password || '1234'
        });
        if (res.data.store_logo) setPreviewLogo(res.data.store_logo);
      }
    } catch {}
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setPreviewLogo(url);
      setSettings({ ...settings, store_logo: url });
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await window.api.updateSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { alert('Failed to save settings.'); }
  };

  const handleDeleteAllData = async () => {
    if (!window.confirm('CRITICAL: This will permanently delete ALL data (products, sales, customers, settings). This action cannot be undone. Are you absolutely sure?')) {
      return;
    }
    
    const secondConfirm = window.confirm('Please confirm ONCE MORE that you want to wipe everything.');
    if (!secondConfirm) return;

    try {
      const res = await window.api.deleteAllData();
      if (res.success) {
        alert('All data has been deleted successfully. The application will now reload.');
        window.location.reload();
      } else {
        alert('Error deleting data: ' + res.error);
      }
    } catch (err) {
      alert('Error deleting data.');
    }
  };

  const handleExportData = async () => {
    try {
      const res = await window.api.exportData();
      if (res.success) {
        const dataStr = JSON.stringify(res.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `pos_backup_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        alert('Data exported successfully!');
      } else {
        alert('Export failed: ' + res.error);
      }
    } catch (err) {
      alert('Error exporting data.');
    }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Importing data will OVERWRITE your current database. Make sure you have a backup. Continue?')) {
      e.target.value = '';
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          const res = await window.api.importData(data);
          if (res.success) {
            alert('Data imported successfully! The application will now reload.');
            window.location.reload();
          } else {
            alert('Import failed: ' + res.error);
          }
        } catch (err) {
          alert('Invalid JSON file format.');
        }
      };
      reader.readAsText(file);
    } catch (err) {
      alert('Error reading file.');
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 text-sm">Configure your restaurant and receipt settings</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Logo */}
        <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-1 flex items-center gap-2 text-base">
            <ImageIcon size={18} className="text-blue-500" /> Restaurant Logo
          </h2>
          <p className="text-xs text-gray-400 mb-4">Appears on printed receipts</p>
          <div className="flex items-center gap-5">
            <div onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-400 transition-colors flex-shrink-0">
              {previewLogo
                ? <img src={previewLogo} alt="Logo" className="w-full h-full object-contain" />
                : <Store size={28} className="text-gray-300" />
              }
            </div>
            <div>
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 border border-gray-200 text-sm text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 font-medium">
                <Upload size={15} /> Upload Image
              </button>
              <p className="text-xs text-gray-400 mt-1.5">PNG, JPG recommended</p>
              {previewLogo && (
                <button type="button" onClick={() => { setPreviewLogo(''); setSettings({ ...settings, store_logo: '' }); }}
                  className="text-xs text-red-500 hover:underline mt-1 block">Remove</button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>
        </section>

        {/* Store Info */}
        <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-base">
            <Store size={18} className="text-blue-500" /> Store Information
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Name *</label>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="text" required value={settings.store_name}
                  onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                  placeholder="The Golden Fork"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input type="tel" value={settings.store_phone}
                  onChange={(e) => setSettings({ ...settings, store_phone: e.target.value })}
                  placeholder="+92 300 1234567"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={16} />
                <textarea value={settings.store_address} rows={2}
                  onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
                  placeholder="123 Main Street, Karachi"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Receipt */}
        <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-base">
            <FileText size={18} className="text-blue-500" /> Receipt Settings
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Footer Message</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 text-gray-400" size={16} />
                <textarea value={settings.receipt_footer} rows={2}
                  onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })}
                  placeholder="Thank you for visiting!"
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="mt-4">
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Preview</p>
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 font-mono text-xs text-gray-700 text-center max-w-xs">
              {previewLogo && <img src={previewLogo} alt="" className="h-10 mx-auto mb-2 object-contain" />}
              <p className="font-bold text-sm">{settings.store_name || 'Restaurant Name'}</p>
              {settings.store_address && <p className="text-gray-400 text-xs leading-tight">{settings.store_address}</p>}
              {settings.store_phone && <p>{settings.store_phone}</p>}
              <div className="border-b border-dashed border-gray-300 my-2" />
              <div className="flex justify-between"><span>Burger x2</span><span>{fmtPKR(1000)}</span></div>
              <div className="flex justify-between"><span>Fries x1</span><span>{fmtPKR(350)}</span></div>
              <div className="border-b border-dashed border-gray-300 my-2" />
              <div className="flex justify-between font-bold"><span>Total</span><span>{fmtPKR(1350)}</span></div>
              <p className="text-gray-400 mt-2">{settings.receipt_footer || 'Thank you for visiting!'}</p>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-base">
            <Lock size={18} className="text-blue-500" /> Security
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Login Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={settings.pos_password}
                onChange={(e) => setSettings({ ...settings, pos_password: e.target.value })}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Enter password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">This is required to log in to the app.</p>
          </div>
        </section>

        {/* Data Management */}
        <section className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 border-l-4 border-l-red-500">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2 text-base">
            <Database size={18} className="text-red-500" /> Data Management
          </h2>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-bold text-gray-700">Backup & Restore</p>
                <p className="text-xs text-gray-500">Export your data to a JSON file or import a previous backup.</p>
              </div>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={handleExportData}
                  className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors"
                >
                  <Download size={14} /> Export
                </button>
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => document.getElementById('import-file')?.click()}
                    className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-100 transition-colors"
                  >
                    <Upload size={14} /> Import
                  </button>
                  <input id="import-file" type="file" accept=".json" onChange={handleImportData} className="hidden" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
              <div>
                <p className="text-sm font-bold text-red-700">Danger Zone</p>
                <p className="text-xs text-red-600/70">Wipe all products, sales, and transaction history.</p>
              </div>
              <button 
                type="button"
                onClick={handleDeleteAllData}
                className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-700 transition-colors shadow-sm"
              >
                <Trash2 size={14} /> Delete All Data
              </button>
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit"
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all shadow-md ${
              saved ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg'}`}>
            <Save size={17} /> {saved ? '✓ Saved!' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
