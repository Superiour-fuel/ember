import { useState, useEffect } from 'react';
import { Lightbulb, Thermometer, Tv, Lock, Plus, Trash2, RefreshCw, Wifi, Zap, Loader2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  SmartHomeDevices,
  SmartHomeDevice,
  getStoredDevices,
  saveDevices,
  fetchSmartThingsDevices,
  testSmartThingsDevice
} from '@/services/smartHomeService';
import { VoiceControlledLights } from './VoiceControlledLights';

interface DeviceSectionProps {
  icon: React.ElementType;
  title: string;
  devices: SmartHomeDevice[];
  onAdd: (name: string, id?: string) => void;
  onRemove: (id: string) => void;
  onTest: (device: SmartHomeDevice) => Promise<void>;
  testingDeviceId: string | null;
  smartThingsDevices?: SmartHomeDevice[];
}

function DeviceSection({ icon: Icon, title, devices, onAdd, onRemove, onTest, testingDeviceId, smartThingsDevices = [] }: DeviceSectionProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [showSmartThings, setShowSmartThings] = useState(false);

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd(newName.trim());
      setNewName('');
      setShowAdd(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
    else if (e.key === 'Escape') {
      setShowAdd(false);
      setNewName('');
    }
  };

  const availableSTDevices = smartThingsDevices.filter(
    std => !devices.some(d => d.id === std.id)
  );

  return (
    <div className="border-2 border-black rounded-xl p-3 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-black text-white p-1 rounded">
            <Icon className="w-3 h-3" />
          </div>
          <h4 className="font-black text-xs uppercase tracking-wider">{title}</h4>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="w-6 h-6 border-2 border-black rounded flex items-center justify-center hover:bg-black hover:text-white transition-colors"
        >
          {showAdd ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        </button>
      </div>

      {/* Device list */}
      <div className="space-y-2">
        {devices.length === 0 && !showAdd ? (
          <p className="text-[10px] font-bold text-gray-400 italic text-center py-2">No devices configured</p>
        ) : (
          devices.map(device => {
            const isSmartThings = device.id.length > 10;
            const isTesting = testingDeviceId === device.id;

            return (
              <div key={device.id} className="flex items-center justify-between p-2 border-2 border-black/10 rounded-lg bg-gray-50 group hover:border-black transition-colors">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-xs font-bold truncate">{device.name}</span>
                  {isSmartThings && (
                    <span className="text-[8px] font-black bg-blue-100 text-blue-600 px-1 py-0.5 rounded border border-blue-200 uppercase tracking-wide">ST</span>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isSmartThings && (
                    <button
                      onClick={() => onTest(device)}
                      disabled={isTesting}
                      className="w-6 h-6 flex items-center justify-center rounded border border-black hover:bg-yellow-300 transition-colors"
                      title="Test device"
                    >
                      {isTesting ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Zap className="w-3 h-3" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => onRemove(device.id)}
                    className="w-6 h-6 flex items-center justify-center rounded border border-black hover:bg-red-500 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Interface */}
      {showAdd && (
        <div className="mt-3 pt-3 border-t-2 border-black animate-in slide-in-from-top-2">
          {!showSmartThings ? (
            <div className="space-y-2">
              <Input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Device Name..."
                className="h-8 text-xs border-2 border-black font-bold focus:ring-0 focus:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAdd} className="h-7 text-xs bg-black hover:bg-gray-800 flex-1">Add</Button>
                {availableSTDevices.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSmartThings(true)}
                    className="h-7 text-xs border-2 border-black flex-1"
                  >
                    <Wifi className="w-3 h-3 mr-1" />
                    SmartThings
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold">Select Device:</span>
                <button onClick={() => setShowSmartThings(false)} className="text-[10px] underline">Manual</button>
              </div>
              <div className="max-h-32 overflow-y-auto space-y-1 border-2 border-black rounded p-1 bg-gray-50">
                {availableSTDevices.map(device => (
                  <button
                    key={device.id}
                    className="w-full text-left p-1.5 text-xs font-bold rounded hover:bg-black hover:text-white transition-colors truncate"
                    onClick={() => {
                      onAdd(device.name, device.id);
                      setShowSmartThings(false);
                      setShowAdd(false);
                    }}
                  >
                    {device.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SmartHomeSettings() {
  const [devices, setDevices] = useState<SmartHomeDevices>(getStoredDevices);
  const [smartThingsDevices, setSmartThingsDevices] = useState<SmartHomeDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [testingDeviceId, setTestingDeviceId] = useState<string | null>(null);

  useEffect(() => {
    setDevices(getStoredDevices());
  }, []);

  const handleTestDevice = async (device: SmartHomeDevice) => {
    setTestingDeviceId(device.id);
    try {
      const result = await testSmartThingsDevice(device.id);
      if (result.success) toast.success(`${device.name}: ${result.message}`);
      else toast.error(`${device.name}: ${result.message}`);
    } catch {
      toast.error(`Failed to test ${device.name}`);
    } finally {
      setTestingDeviceId(null);
    }
  };

  const loadSmartThingsDevices = async () => {
    setLoading(true);
    try {
      const fetchedDevices = await fetchSmartThingsDevices();
      setSmartThingsDevices(fetchedDevices);
      if (fetchedDevices.length > 0) toast.success(`Found ${fetchedDevices.length} devices`);
      else toast.info('No devices found');
    } catch {
      toast.error('Failed to connect to SmartThings');
    } finally {
      setLoading(false);
    }
  };

  const updateDevices = (updated: SmartHomeDevices) => {
    setDevices(updated);
    saveDevices(updated);
  };

  const addDevice = (type: keyof SmartHomeDevices, name: string, id?: string) => {
    const updated = {
      ...devices,
      [type]: [...devices[type], { name, id: id || Date.now().toString() }]
    };
    updateDevices(updated);
  };

  const removeDevice = (type: keyof SmartHomeDevices, id: string) => {
    const updated = {
      ...devices,
      [type]: devices[type].filter(d => d.id !== id)
    };
    updateDevices(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black uppercase">Devices</h3>
          <p className="text-[10px] text-gray-500 font-bold leading-tight">Control via voice commands</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadSmartThingsDevices}
          disabled={loading}
          className="h-7 text-[10px] border-2 border-black font-bold hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
        >
          <RefreshCw className={`w-3 h-3 mr-1 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Syncing...' : 'Sync Hub'}
        </Button>
      </div>

      <VoiceControlledLights />

      <div className="grid grid-cols-1 gap-3">
        <DeviceSection
          icon={Lightbulb}
          title="Lights"
          devices={devices.lights}
          onAdd={(name, id) => addDevice('lights', name, id)}
          onRemove={(id) => removeDevice('lights', id)}
          onTest={handleTestDevice}
          testingDeviceId={testingDeviceId}
          smartThingsDevices={smartThingsDevices}
        />

        <DeviceSection
          icon={Thermometer}
          title="Climate"
          devices={devices.thermostats}
          onAdd={(name, id) => addDevice('thermostats', name, id)}
          onRemove={(id) => removeDevice('thermostats', id)}
          onTest={handleTestDevice}
          testingDeviceId={testingDeviceId}
          smartThingsDevices={smartThingsDevices}
        />

        {/* Group less common ones */}
        <div className="grid grid-cols-2 gap-3">
          <DeviceSection
            icon={Tv}
            title="Media"
            devices={devices.entertainment}
            onAdd={(name, id) => addDevice('entertainment', name, id)}
            onRemove={(id) => removeDevice('entertainment', id)}
            onTest={handleTestDevice}
            testingDeviceId={testingDeviceId}
            smartThingsDevices={smartThingsDevices}
          />

          <DeviceSection
            icon={Lock}
            title="Security"
            devices={devices.locks}
            onAdd={(name, id) => addDevice('locks', name, id)}
            onRemove={(id) => removeDevice('locks', id)}
            onTest={handleTestDevice}
            testingDeviceId={testingDeviceId}
            smartThingsDevices={smartThingsDevices}
          />
        </div>
      </div>

      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-2 text-[10px] font-bold text-blue-800 flex items-center gap-2">
        <span className="bg-white border border-blue-200 rounded-full w-4 h-4 flex items-center justify-center shrink-0">?</span>
        <span>Connect SmartThings at <a href="https://my.smartthings.com" target="_blank" className="underline decoration-2">my.smartthings.com</a></span>
      </div>
    </div>
  );
}
