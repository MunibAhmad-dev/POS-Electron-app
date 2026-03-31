import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, Upload, Store, Phone, MapPin, FileText, Lock, 
  Image as ImageIcon, Database, Download, Trash2, ShieldCheck, Eye, EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useNotifications } from '../components/NotificationProvider';
import { cn } from '../lib/utils';

interface SettingsData {
  store_name: string;
  store_phone: string;
  store_address: string;
  store_logo: string;
  receipt_footer: string;
  pos_password: string;
}

const defaultSettings: SettingsData = {
  store_name: '', store_phone: '', store_address: '',
  store_logo: '', receipt_footer: 'Thank you for visiting!', pos_password: '1234',
};

const fmtPKR = (n: number) => 'PKR ' + Math.round(n).toLocaleString('en-PK');

export default function Settings() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [previewLogo, setPreviewLogo] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { addNotification } = useNotifications();

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
    } catch {
       addNotification("Error", "Could not load settings payload from database.", "error");
    }
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
    setIsSaving(true);
    try {
      const res = await window.api.updateSettings(settings);
      if(res.success){
         addNotification("Settings Saved", "Your operational preferences have been updated.", "success");
      } else {
         addNotification("Save Failed", res.error || "A database error occurred.", "error");
      }
    } catch { 
       addNotification("Error", "Critical fault saving settings.", "error"); 
    } finally {
       setIsSaving(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!window.confirm('CRITICAL WARNING:\n\nThis will permanently delete ALL data (products, sales, customers, analytics) and reset settings to default.\n\nThis action CANNOT be undone. Are you absolutely sure?')) {
      return;
    }
    
    if (!window.confirm('FINAL CONFIRMATION:\n\nType OK to confirm the complete wipe.')) return;

    try {
      addNotification("Wiping Data", "Clearing all records...", "warning");
      const res = await window.api.deleteAllData();
      if (res.success) {
        window.location.reload();
      } else {
        addNotification("Wipe Failed", "Error deleting data: " + res.error, "error");
      }
    } catch (err) {
      addNotification("Error", "Critical execution error deleting data.", "error");
    }
  };

  const handleExportData = async () => {
    try {
      addNotification("Exporting Data", "Compiling system records...", "info");
      const res = await window.api.exportData();
      if (res.success) {
        const dataStr = JSON.stringify(res.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = `pos_backup_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        addNotification("Export Complete", "Data backup downloaded successfully.", "success");
      } else {
        addNotification("Export Failed", res.error || "System constraints blocked export.", "error");
      }
    } catch (err) {
       addNotification("Error", "Failed exporting JSON blob.", "error");
    }
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Warning: Importing data will OVERWRITE your current database. Make sure you have a backup. Continue?')) {
      e.target.value = '';
      return;
    }

    try {
      addNotification("Importing Data", "Restoring system records...", "info");
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          const res = await window.api.importData(data);
          if (res.success) {
            window.location.reload();
          } else {
             addNotification("Import Failed", res.error || "JSON constraints validation failed.", "error");
          }
        } catch (err) {
           addNotification("Import Error", "Invalid JSON file structure.", "error");
        }
      };
      reader.readAsText(file);
    } catch (err) {
       addNotification("Error", "Failed to read file buffer.", "error");
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in max-w-4xl pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure your restaurant defaults and operational parameters</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        <Card className="shadow-sm">
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
                <ImageIcon size={18} className="text-primary" /> Company Branding
             </CardTitle>
             <CardDescription>Logo used on UI and printed receipts</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="flex items-start sm:items-center gap-6">
               <div 
                 onClick={() => fileInputRef.current?.click()}
                 className={cn(
                   "w-24 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-colors bg-muted/20 shrink-0 group relative",
                   previewLogo ? "border-transparent" : "border-border hover:border-primary hover:bg-muted/50"
                 )}
               >
                 {previewLogo ? (
                   <>
                     <img src={previewLogo} alt="Logo" className="w-full h-full object-contain p-2 group-hover:opacity-30 transition-opacity" />
                     <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Upload size={20} className="text-foreground" />
                     </div>
                   </>
                 ) : (
                   <Store size={32} className="text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:text-primary transition-all" />
                 )}
               </div>
               <div className="flex flex-col space-y-2">
                 <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="w-fit">
                   <Upload size={14} className="mr-2" /> Upload Image
                 </Button>
                 <p className="text-xs text-muted-foreground">Recommended format: Square PNG or JPG, max 1MB.</p>
                 {previewLogo && (
                   <Button type="button" variant="link" size="sm" onClick={() => { setPreviewLogo(''); setSettings({ ...settings, store_logo: '' }); }} className="h-auto p-0 text-destructive justify-start w-fit">
                     Remove current logo
                   </Button>
                 )}
               </div>
               <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
             </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
                <Store size={18} className="text-primary" /> Store Information
             </CardTitle>
             <CardDescription>Details printed externally</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
               <label className="text-sm font-semibold">Restaurant Name <span className="text-destructive">*</span></label>
               <div className="relative">
                 <Store className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" size={16} />
                 <Input required value={settings.store_name} onChange={(e) => setSettings({ ...settings, store_name: e.target.value })} placeholder="e.g. The Golden Fork" className="pl-9" />
               </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold">Contact Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" size={16} />
                    <Input type="tel" value={settings.store_phone} onChange={(e) => setSettings({ ...settings, store_phone: e.target.value })} placeholder="+92 300 1234567" className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2 border border-dashed rounded-lg p-3 bg-muted/10 relative overflow-hidden group">
                   {/* Mini Invoice Preview within form */}
                   <p className="text-[10px] font-semibold text-muted-foreground uppercase absolute top-2 left-3">Receipt Preview Header</p>
                   <div className="mt-4 text-center">
                     <p className="font-bold text-sm text-foreground">{settings.store_name || 'Restaurant Name'}</p>
                     <p className="text-[10px] text-muted-foreground mt-0.5">{settings.store_phone || 'Phone Number'}</p>
                   </div>
                </div>
             </div>

             <div className="space-y-2">
               <label className="text-sm font-semibold">Street Address</label>
               <div className="relative">
                 <MapPin className="absolute left-3 top-3 text-muted-foreground opacity-50" size={16} />
                 <textarea 
                    value={settings.store_address} rows={2}
                    onChange={(e) => setSettings({ ...settings, store_address: e.target.value })}
                    placeholder="123 Main Street, Karachi"
                    className="w-full flex rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-9 resize-none" 
                  />
               </div>
             </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
                <FileText size={18} className="text-primary" /> Receipt Footer
             </CardTitle>
             <CardDescription>Custom message shown at the end of each print</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
               <div className="relative">
                 <FileText className="absolute left-3 top-3 text-muted-foreground opacity-50" size={16} />
                 <textarea 
                    value={settings.receipt_footer} rows={2}
                    onChange={(e) => setSettings({ ...settings, receipt_footer: e.target.value })}
                    placeholder="Thank you for visiting!"
                    className="w-full flex rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-9 resize-none" 
                  />
               </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
             <CardTitle className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" /> Security & Access
             </CardTitle>
             <CardDescription>Protect application launch with a secure PIN</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-2 max-w-sm">
               <label className="text-sm font-semibold">Terminal Login Password</label>
               <div className="relative group">
                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50" size={16} />
                 <Input 
                   type={showPassword ? 'text' : 'password'}
                   value={settings.pos_password}
                   onChange={(e) => setSettings({ ...settings, pos_password: e.target.value })}
                   placeholder="Enter numeric PIN"
                   className="pl-9 pr-10 font-mono"
                 />
                 <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                 </button>
               </div>
             </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t flex items-center justify-between p-4">
             <div />
             <Button type="submit" disabled={isSaving} className="shadow-md transition-all gap-2">
                <Save size={16} /> {isSaving ? 'Saving...' : 'Save Settings'}
             </Button>
          </CardFooter>
        </Card>

        {/* Danger Zone */}
        <Card className="shadow-sm border-destructive/30 overflow-hidden">
          <div className="h-1 w-full bg-destructive" />
          <CardHeader>
             <CardTitle className="flex items-center gap-2 text-destructive">
                <Database size={18} /> Data Management
             </CardTitle>
             <CardDescription>Backup your database or permanently erase limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-muted/30 border rounded-xl gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm flex items-center gap-2"><Download size={16} className="text-primary"/> Export Data</h4>
                  <p className="text-xs text-muted-foreground mt-1">Export your complete database to a standardized JSON schema for backups or migrations.</p>
                </div>
                <Button type="button" variant="outline" onClick={handleExportData} className="w-full sm:w-auto shrink-0 shadow-sm gap-2">
                   <Download size={14} /> Download Backup
                </Button>
             </div>

             <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-muted/30 border rounded-xl gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm flex items-center gap-2"><Upload size={16} className="text-blue-500"/> Restore Backup</h4>
                  <p className="text-xs text-muted-foreground mt-1">Import a JSON payload to completely restore the database. This replaces current data.</p>
                </div>
                <div className="w-full sm:w-auto shrink-0">
                  <Button type="button" variant="outline" onClick={() => document.getElementById('import-file')?.click()} className="w-full shadow-sm gap-2">
                     <Upload size={14} /> Import File
                  </Button>
                  <input id="import-file" type="file" accept=".json" onChange={handleImportData} className="hidden" />
                </div>
             </div>

             <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-destructive/5 border border-destructive/20 rounded-xl gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-destructive flex items-center gap-2"><Trash2 size={16}/> Wipe System</h4>
                  <p className="text-xs text-destructive/80 mt-1">Permanently delete all sales, products, and customers. Factory resets the system.</p>
                </div>
                <Button type="button" variant="destructive" onClick={handleDeleteAllData} className="w-full sm:w-auto shrink-0 shadow-md gap-2 font-bold">
                   <Trash2 size={15} /> Terminate Data
                </Button>
             </div>
          </CardContent>
        </Card>

      </form>
    </div>
  );
}
