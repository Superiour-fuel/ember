// Smart Home Service for Ember
// Handles device control with SmartThings integration

import { supabase } from '@/integrations/supabase/client';

export type SmartHomeAction =
  | 'lights_on' | 'lights_off' | 'lights_bright' | 'lights_dim'
  | 'temp_up' | 'temp_down' | 'temp_set'
  | 'tv_on' | 'tv_off' | 'volume_up' | 'volume_down'
  | 'door_lock' | 'door_unlock'
  | 'curtains_open' | 'curtains_close'
  | 'call_help' | 'call_family';

export interface ActionParams {
  room?: string;
  device?: string;
  deviceId?: string;
  amount?: number;
  urgency?: string;
}

export interface ActionResult {
  success: boolean;
  message: string;
  action?: SmartHomeAction;
}

// Action labels for display
export const ACTION_LABELS: Record<SmartHomeAction, string> = {
  lights_on: "Turn lights on",
  lights_off: "Turn lights off",
  lights_bright: "Increase brightness",
  lights_dim: "Decrease brightness",
  temp_up: "Increase temperature",
  temp_down: "Decrease temperature",
  temp_set: "Set temperature",
  tv_on: "Turn TV on",
  tv_off: "Turn TV off",
  volume_up: "Increase volume",
  volume_down: "Decrease volume",
  door_lock: "Lock the door",
  door_unlock: "Unlock the door",
  curtains_open: "Open curtains",
  curtains_close: "Close curtains",
  call_help: "Call for help",
  call_family: "Call family"
};

// Map actions to SmartThings capabilities and commands
const SMARTTHINGS_COMMANDS: Record<string, { capability: string; command: string; args?: unknown[] }> = {
  lights_on: { capability: 'switch', command: 'on' },
  lights_off: { capability: 'switch', command: 'off' },
  lights_bright: { capability: 'switchLevel', command: 'setLevel', args: [100] },
  lights_dim: { capability: 'switchLevel', command: 'setLevel', args: [30] },
  tv_on: { capability: 'switch', command: 'on' },
  tv_off: { capability: 'switch', command: 'off' },
  door_lock: { capability: 'lock', command: 'lock' },
  door_unlock: { capability: 'lock', command: 'unlock' },
};

function isDemoMode(): boolean {
  return typeof window !== 'undefined' && (
    window.location.search.includes('demo=true')
  );
}

// Simulate actions for demo mode
async function simulateAction(action: SmartHomeAction, params: ActionParams): Promise<void> {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log(`[SIMULATED] ${ACTION_LABELS[action]} in ${params.room || 'current room'}`);
      resolve();
    }, 800);
  });
}

// Call SmartThings API via edge function
async function callSmartThings(action: string, deviceId?: string, capability?: string, command?: string, args?: unknown[]) {
  const { data, error } = await supabase.functions.invoke('smartthings-control', {
    body: { action, deviceId, capability, command, arguments: args }
  });

  if (error) {
    console.error('SmartThings API error:', error);
    throw new Error(error.message || 'SmartThings API error');
  }

  if (!data.success) {
    throw new Error(data.error || 'SmartThings command failed');
  }

  return data.data;
}

// Execute smart home action
export async function executeSmartHomeAction(
  action: SmartHomeAction,
  params: ActionParams = {}
): Promise<ActionResult> {
  console.log('Executing action:', action, params);

  try {
    // DEMO MODE: Just simulate the action
    if (isDemoMode()) {
      await simulateAction(action, params);
      return {
        success: true,
        message: `${ACTION_LABELS[action]}${params.room ? ` in ${params.room}` : ''}`,
        action
      };
    }

    // Check if we have a SmartThings command mapping
    const stCommand = SMARTTHINGS_COMMANDS[action];

    if (stCommand && params.deviceId) {
      // Use SmartThings
      await callSmartThings(
        'control_device',
        params.deviceId,
        stCommand.capability,
        stCommand.command,
        stCommand.args
      );
      return {
        success: true,
        message: `${ACTION_LABELS[action]}${params.room ? ` in ${params.room}` : ''}`,
        action
      };
    }

    // Fallback: simulate if no device configured
    await simulateAction(action, params);
    return {
      success: true,
      message: `${ACTION_LABELS[action]}${params.room ? ` in ${params.room}` : ''} (simulated)`,
      action
    };

  } catch (error) {
    console.error('Smart home action error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      action
    };
  }
}

// Fetch devices from SmartThings
export async function fetchSmartThingsDevices(): Promise<SmartHomeDevice[]> {
  try {
    const devices = await callSmartThings('list_devices');
    return devices.map((d: { id: string; label: string }) => ({
      id: d.id,
      name: d.label
    }));
  } catch (error) {
    console.error('Failed to fetch SmartThings devices:', error);
    return [];
  }
}

// Test a SmartThings device by toggling it quickly
export async function testSmartThingsDevice(deviceId: string): Promise<{ success: boolean; message: string }> {
  try {
    // Quick on/off flash - 500ms is enough to see visual confirmation
    await callSmartThings('control_device', deviceId, 'switch', 'on');
    await new Promise(resolve => setTimeout(resolve, 500));
    await callSmartThings('control_device', deviceId, 'switch', 'off');
    return { success: true, message: 'Device responded successfully' };
  } catch (error) {
    console.error('Device test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Test failed'
    };
  }
}

// Convenience helpers
export async function turnLightsOn(room = 'living room', deviceId?: string): Promise<ActionResult> {
  return executeSmartHomeAction('lights_on', { room, deviceId });
}

export async function turnLightsOff(room = 'living room', deviceId?: string): Promise<ActionResult> {
  return executeSmartHomeAction('lights_off', { room, deviceId });
}

export async function adjustTemperature(direction: 'up' | 'down', amount = 2): Promise<ActionResult> {
  const action = direction === 'up' ? 'temp_up' : 'temp_down';
  return executeSmartHomeAction(action, { amount });
}

export async function controlTV(command: 'on' | 'off', deviceId?: string): Promise<ActionResult> {
  return executeSmartHomeAction(`tv_${command}` as SmartHomeAction, { deviceId });
}

export async function callForHelp(urgency = 'normal'): Promise<ActionResult> {
  return executeSmartHomeAction('call_help', { urgency });
}

// Device management for settings
export interface SmartHomeDevice {
  id: string;
  name: string;
}

export interface SmartHomeDevices {
  lights: SmartHomeDevice[];
  thermostats: SmartHomeDevice[];
  entertainment: SmartHomeDevice[];
  locks: SmartHomeDevice[];
}

export function getStoredDevices(): SmartHomeDevices {
  const saved = localStorage.getItem('ember_smart_home_devices');
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    lights: [],
    thermostats: [],
    entertainment: [],
    locks: []
  };
}

export function saveDevices(devices: SmartHomeDevices): void {
  localStorage.setItem('ember_smart_home_devices', JSON.stringify(devices));
}

// Map visual pointing targets (from Gemini Vision) to device categories
export type DeviceCategory = 'lights' | 'entertainment' | 'thermostat' | 'locks' | null;

export function getDeviceTypeFromTarget(target: string | null | undefined): DeviceCategory {
  if (!target) return null;

  const targetLower = target.toLowerCase();

  // Lights - ceiling, lamps, light fixtures, switches
  const lightKeywords = ['ceiling', 'light', 'lamp', 'bulb', 'chandelier', 'fixture', 'switch', 'fan'];
  if (lightKeywords.some(kw => targetLower.includes(kw))) {
    return 'lights';
  }

  // Entertainment - TV, speakers, screen
  const entertainmentKeywords = ['tv', 'television', 'screen', 'monitor', 'speaker', 'soundbar', 'remote'];
  if (entertainmentKeywords.some(kw => targetLower.includes(kw))) {
    return 'entertainment';
  }

  // Thermostat
  const thermostatKeywords = ['thermostat', 'ac', 'air condition', 'heater', 'heating', 'cooling'];
  if (thermostatKeywords.some(kw => targetLower.includes(kw))) {
    return 'thermostat';
  }

  // Locks
  const lockKeywords = ['door', 'lock', 'entrance', 'gate'];
  if (lockKeywords.some(kw => targetLower.includes(kw))) {
    return 'locks';
  }

  return null;
}

// Get action from simple commands combined with visual target
export function getActionFromVisualCommand(
  command: string,
  pointingTarget: string | null | undefined,
  pointingDirection: string | null | undefined
): { action: SmartHomeAction; deviceCategory: DeviceCategory } | null {
  const commandLower = command.toLowerCase().trim();

  // Determine device from pointing target or direction
  let deviceCategory = getDeviceTypeFromTarget(pointingTarget);

  // If pointing up (at ceiling), assume lights
  if (!deviceCategory && pointingDirection?.toLowerCase() === 'up') {
    deviceCategory = 'lights';
  }

  if (!deviceCategory) return null;

  // Simple command parsing
  const isOn = /^(on|turn\s*on|switch\s*on|open)$/i.test(commandLower) || commandLower.includes('turn on');
  const isOff = /^(off|turn\s*off|switch\s*off|close|stop)$/i.test(commandLower) || commandLower.includes('turn off');
  const isBrighter = /^(bright|brighter|up|more|louder)$/i.test(commandLower);
  const isDimmer = /^(dim|dimmer|down|less|quieter|lower)$/i.test(commandLower);

  // Map to actions
  if (deviceCategory === 'lights') {
    if (isOn) return { action: 'lights_on', deviceCategory };
    if (isOff) return { action: 'lights_off', deviceCategory };
    if (isBrighter) return { action: 'lights_bright', deviceCategory };
    if (isDimmer) return { action: 'lights_dim', deviceCategory };
  }

  if (deviceCategory === 'entertainment') {
    if (isOn) return { action: 'tv_on', deviceCategory };
    if (isOff) return { action: 'tv_off', deviceCategory };
    if (isBrighter) return { action: 'volume_up', deviceCategory };
    if (isDimmer) return { action: 'volume_down', deviceCategory };
  }

  if (deviceCategory === 'thermostat') {
    if (isBrighter || isOn) return { action: 'temp_up', deviceCategory };
    if (isDimmer || isOff) return { action: 'temp_down', deviceCategory };
  }

  if (deviceCategory === 'locks') {
    if (isOn || commandLower.includes('lock')) return { action: 'door_lock', deviceCategory };
    if (isOff || commandLower.includes('unlock')) return { action: 'door_unlock', deviceCategory };
  }

  return null;
}
