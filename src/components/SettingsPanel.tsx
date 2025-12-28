
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Settings,
  Volume2,
  Accessibility,
  Shield,
  Trash2,
  Download,
  LogOut,
  User,
  Home,
  Phone,
  X,
  ChevronRight,
  Zap,
  Check,
  Loader2
} from "lucide-react";
import { SmartHomeSettings } from "@/components/SmartHomeSettings";
import { CaregiverContacts } from "@/components/CaregiverContacts";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUserData } from "@/hooks/useUserData";
import { secureVoiceStorage } from "@/services/voiceEncryptionService";
import { useAccessibility } from "@/contexts/AccessibilityContext";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const {
    useClonedVoice,
    audioQuality,
    voiceSpeed,
    fontSize,
    highContrast,
    reduceAnimations,
    keyboardShortcuts,
    updateSettings: updateAccessibilitySettings
  } = useAccessibility();

  const [enableDisambiguation, setEnableDisambiguation] = useState(true);
  const [enableCorrections, setEnableCorrections] = useState(true);
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyContactMethod, setEmergencyContactMethod] = useState<'call' | 'whatsapp' | 'sms'>('whatsapp');
  const [isSaving, setIsSaving] = useState(false);

  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const {
    profile,
    settings,
    voiceBank,
    updateSettings,
    deleteVoiceBank,
    isLoading
  } = useUserData();

  // Load functional settings from database
  useEffect(() => {
    if (settings) {
      setEnableDisambiguation(settings.enable_disambiguation ?? true);
      setEnableCorrections(settings.enable_corrections ?? true);
      setEmergencyContactPhone(settings.emergency_contact_phone || "");
      setEmergencyContactMethod((settings.emergency_contact_method as 'call' | 'whatsapp' | 'sms') || 'whatsapp');
    }
  }, [settings]);

  // Save settings
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      if (user) {
        const { error } = await updateSettings({
          speech_speed: voiceSpeed, // syncing context state to DB
          enable_disambiguation: enableDisambiguation,
          enable_corrections: enableCorrections,
          emergency_contact_phone: emergencyContactPhone || null,
          emergency_contact_method: emergencyContactMethod,
        });

        if (error) throw error;
      }

      // Save emergency contact locally as fallback
      if (emergencyContactPhone) {
        localStorage.setItem('ember_emergency_phone', emergencyContactPhone);
      } else {
        localStorage.removeItem('ember_emergency_phone');
      }
      localStorage.setItem('ember_emergency_method', emergencyContactMethod);

      toast({ title: "Settings saved", description: user ? "Synced to your account" : "Saved locally" });
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error saving settings",
        description: "Some settings couldn't be saved.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const exportData = () => {
    const data = {
      profile: profile,
      voiceBank: voiceBank,
      settings: settings,
      localProfile: localStorage.getItem('ember_user_profile'),
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ember-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Data exported", description: "Your data has been downloaded." });
  };

  const handleDeleteVoiceModel = async () => {
    if (confirm("This will delete your voice bank data. Are you sure?")) {
      if (user) {
        await deleteVoiceBank();
      }
      secureVoiceStorage.clearAll();
      toast({ title: "Voice model deleted", description: "Your voice bank has been removed." });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onClose();
    toast({ title: "Signed out", description: "You have been signed out." });
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[#FFFDD0] rounded-[2.5rem] border-2 border-black overflow-hidden animate-in slide-in-from-right duration-500">

      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b-2 border-black bg-white">
        <div>
          <h2 className="text-2xl font-black italic tracking-tighter flex items-center gap-3">
            <Settings className="w-6 h-6 stroke-[3]" />
            SETTINGS
          </h2>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center border-2 border-transparent hover:bg-white hover:text-black hover:border-black transition-all hover:rotate-90 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
        >
          <X className="w-5 h-5 stroke-[3]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">

        {/* Account Profile Card - Compact */}
        {user && (
          <div className="bg-black text-white p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(74,222,128,1)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <User className="w-24 h-24" />
            </div>
            <div className="flex items-center gap-3 relative z-10 mb-3">
              <div className="w-12 h-12 bg-[#4ade80] rounded-lg flex items-center justify-center font-black text-xl text-black border-2 border-white">
                {profile?.display_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <h3 className="text-lg font-bold truncate">{profile?.display_name || "User"}</h3>
                <p className="text-xs font-medium opacity-70 truncate">{user.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 bg-transparent border-2 border-white text-white hover:bg-white hover:text-black font-bold uppercase tracking-wider text-xs relative z-10"
              onClick={handleSignOut}
            >
              <LogOut className="w-3 h-3 mr-2" />
              Sign Out
            </Button>
          </div>
        )}

        {/* Voice Settings */}
        <section className="space-y-3">
          <SectionHeader icon={<Volume2 className="w-4 h-4" />} title="Voice Configuration" />

          {/* Cloned Voice Toggle */}
          <div className="bg-white p-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
            <span className="font-bold text-sm">Use Cloned Voice</span>
            <div className="flex items-center gap-2">
              {!voiceBank && (
                <span className="text-[10px] font-bold text-red-500 bg-red-100 px-1.5 py-0.5 rounded border border-red-500">
                  No Voice Bank
                </span>
              )}
              <BrutalistToggle
                checked={useClonedVoice}
                onChange={() => updateAccessibilitySettings({ useClonedVoice: !useClonedVoice })}
                disabled={!voiceBank}
                size="sm"
              />
            </div>
          </div>

          {/* Speed Slider */}
          <div className="bg-white p-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-sm">Speed</span>
              <span className="text-xs font-black bg-black text-white px-1.5 py-0.5 rounded">{voiceSpeed}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={voiceSpeed}
              onChange={(e) => updateAccessibilitySettings({ voiceSpeed: parseFloat(e.target.value) })}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black border-2 border-black block"
            />
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Audio Quality */}
            <div className="bg-white p-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2">
              <span className="text-[10px] font-black uppercase text-gray-400">Quality</span>
              <div className="flex flex-col gap-1.5">
                <BrutalistOption
                  selected={audioQuality === 'fast'}
                  onClick={() => updateAccessibilitySettings({ audioQuality: 'fast' })}
                  label="⚡ Fast"
                />
                <BrutalistOption
                  selected={audioQuality === 'high'}
                  onClick={() => updateAccessibilitySettings({ audioQuality: 'high' })}
                  label="💎 High"
                />
              </div>
            </div>

            {/* AI Features */}
            <div className="bg-white p-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] space-y-2">
              <span className="text-[10px] font-black uppercase text-gray-400">AI Features</span>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Fix Grammar</span>
                  <BrutalistToggle
                    checked={enableCorrections}
                    onChange={() => setEnableCorrections(!enableCorrections)}
                    size="xs"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Context</span>
                  <BrutalistToggle
                    checked={enableDisambiguation}
                    onChange={() => setEnableDisambiguation(!enableDisambiguation)}
                    size="xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Accessibility */}
        <section className="space-y-3">
          <SectionHeader icon={<Accessibility className="w-4 h-4" />} title="Accessibility" />

          {/* Font Size */}
          <div className="bg-white p-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-[10px] font-black uppercase text-gray-400 block mb-2">Font Size</span>
            <div className="grid grid-cols-4 gap-1.5">
              {(["small", "medium", "large", "xl"] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => updateAccessibilitySettings({ fontSize: size })}
                  className={`
                        h-8 rounded-md font-bold text-xs border-2 transition-all flex items-center justify-center
                        ${fontSize === size
                      ? 'bg-black text-white border-black shadow-[1px_1px_0px_0px_rgba(74,222,128,1)]'
                      : 'bg-white text-black border-gray-200 hover:border-black'
                    }
                      `}
                >
                  {size === 'xl' ? 'XL' : size === 'small' ? 'Sm' : size === 'medium' ? 'Md' : 'Lg'}
                </button>
              ))}
            </div>
          </div>

          {/* High Contrast */}
          <div className="bg-white p-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-400 border-2 border-black rounded-md flex items-center justify-center">
                <Zap className="w-4 h-4 text-black" />
              </div>
              <span className="font-bold text-sm">High Contrast</span>
            </div>
            <BrutalistToggle
              checked={highContrast}
              onChange={() => updateAccessibilitySettings({ highContrast: !highContrast })}
              size="sm"
            />
          </div>
        </section>

        {/* Emergency */}
        <section className="space-y-3">
          <SectionHeader icon={<Phone className="w-4 h-4" />} title="Emergency" />
          <div className="bg-red-50 p-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(239,68,68,1)] space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-red-600">Contact Number</label>
              <Input
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                className="h-9 text-sm border-2 border-black font-mono font-bold bg-white focus:ring-0 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-shadow"
                placeholder="+1 234 567 8900"
              />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {['call', 'whatsapp', 'sms'].map((method) => (
                <button
                  key={method}
                  onClick={() => setEmergencyContactMethod(method as any)}
                  className={`
                          py-1.5 rounded-md text-[10px] font-black uppercase border-2 transition-all
                          ${emergencyContactMethod === method
                      ? 'bg-red-500 text-white border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-white text-red-500 border-red-200 hover:border-red-500'
                    }
                        `}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Smart Home Integration */}
        <section className="space-y-3">
          <SectionHeader icon={<Home className="w-4 h-4" />} title="Smart Home" />
          <div className="bg-white p-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <SmartHomeSettings />
          </div>
        </section>

        {/* Caregiver Contacts Integration */}
        <section className="space-y-3">
          <SectionHeader icon={<User className="w-4 h-4" />} title="Caregivers" />
          <div className="bg-white p-3 rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            <CaregiverContacts />
          </div>
        </section>

        {/* Data Zone */}
        <section className="space-y-3">
          <SectionHeader icon={<Shield className="w-4 h-4" />} title="Data & Privacy" />
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={exportData}
              className="w-full bg-white text-black border-2 border-black font-bold h-10 text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all px-2"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>

            <Button
              onClick={handleDeleteVoiceModel}
              className="w-full bg-[#fee2e2] text-red-600 border-2 border-black font-bold h-10 text-xs shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all px-2"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </section>

      </div>

      {/* Footer */}
      <div className="p-4 border-t-2 border-black bg-white flex flex-col gap-2">
        <Button
          className="w-full bg-[#4ade80] text-black border-2 border-black font-black text-base h-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[0px] active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all rounded-lg"
          onClick={saveSettings}
          disabled={isSaving}
        >
          {isSaving ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
          SAVE CHANGES
        </Button>
        <p className="text-center text-[10px] font-bold text-gray-400">Ember v1.0.0 • Built for Impact</p>
      </div>
    </div>
  );
}

// ----- Styled Components for SettingsPanel -----

function SectionHeader({ icon, title }: { icon: React.ReactNode, title: string }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-black/40 pl-1">
      {icon}
      {title}
    </h3>
  );
}

function BrutalistToggle({ checked, onChange, disabled, size = 'md' }: { checked: boolean, onChange: () => void, disabled?: boolean, size?: 'xs' | 'sm' | 'md' }) {
  const settings = {
    xs: { w: 'w-8', h: 'h-4', ball: 'w-3 h-3', trans: 'translate-x-4' },
    sm: { w: 'w-10', h: 'h-6', ball: 'w-4 h-4', trans: 'translate-x-4' },
    md: { w: 'w-14', h: 'h-8', ball: 'w-6 h-6', trans: 'translate-x-6' }
  };

  const { w, h, ball, trans } = settings[size] || settings.md;

  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`
        ${w} ${h} rounded-full border-2 border-black flex items-center px-0.5 transition-colors relative
        ${checked ? 'bg-black' : 'bg-white'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div
        className={`
          ${ball} bg-white border-2 border-black rounded-full transition-transform
          ${checked ? trans : 'translate-x-0'}
          ${checked ? 'bg-[#4ade80]' : 'bg-gray-200'}
        `}
      />
    </button>
  );
}

function BrutalistOption({ selected, onClick, label }: { selected: boolean, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full py-1.5 px-2 rounded-lg text-[10px] font-bold border-2 transition-all flex items-center justify-between
        ${selected
          ? 'bg-black text-white border-black'
          : 'bg-white text-gray-500 border-black/10 hover:border-black'
        }
      `}
    >
      {label}
      {selected && <Check className="w-3 h-3" />}
    </button>
  );
}
