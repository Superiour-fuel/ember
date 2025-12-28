/**
 * SmartThings Control Edge Function
 * 
 * Purpose: Controls smart home devices via Samsung SmartThings API
 * 
 * Actions supported:
 * - list_devices: Get all connected devices
 * - get_device_status: Check device state
 * - control_device: Send commands (on/off, setLevel, lock/unlock)
 * 
 * Used by: smartHomeService.ts for voice-activated device control
 * 
 * Required secrets:
 * - SMARTTHINGS_PAT: SmartThings Personal Access Token
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SMARTTHINGS_API = 'https://api.smartthings.com/v1';

interface SmartThingsRequest {
  action: 'list_devices' | 'control_device' | 'get_device_status';
  deviceId?: string;
  capability?: string;
  command?: string;
  arguments?: unknown[];
}

async function makeSmartThingsRequest(endpoint: string, method = 'GET', body?: unknown) {
  const pat = Deno.env.get('SMARTTHINGS_PAT');
  if (!pat) {
    throw new Error('SmartThings PAT not configured');
  }

  const options: RequestInit = {
    method,
    headers: {
      'Authorization': `Bearer ${pat}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  console.log(`SmartThings API: ${method} ${endpoint}`);
  const response = await fetch(`${SMARTTHINGS_API}${endpoint}`, options);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`SmartThings API error: ${response.status} - ${errorText}`);
    throw new Error(`SmartThings API error: ${response.status}`);
  }

  return response.json();
}

async function listDevices() {
  const data = await makeSmartThingsRequest('/devices');
  // Filter to just return essential info
  return data.items?.map((device: { deviceId: string; label: string; name: string; components: unknown[] }) => ({
    id: device.deviceId,
    label: device.label || device.name,
    name: device.name,
    components: device.components,
  })) || [];
}

async function getDeviceStatus(deviceId: string) {
  return await makeSmartThingsRequest(`/devices/${deviceId}/status`);
}

async function controlDevice(deviceId: string, capability: string, command: string, args: unknown[] = []) {
  const body = {
    commands: [{
      component: 'main',
      capability,
      command,
      arguments: args,
    }],
  };

  console.log(`Sending command to device ${deviceId}:`, JSON.stringify(body));
  return await makeSmartThingsRequest(`/devices/${deviceId}/commands`, 'POST', body);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, deviceId, capability, command, arguments: args }: SmartThingsRequest = await req.json();
    console.log(`SmartThings action: ${action}`, { deviceId, capability, command });

    let result;

    switch (action) {
      case 'list_devices':
        result = await listDevices();
        break;

      case 'get_device_status':
        if (!deviceId) throw new Error('deviceId required');
        result = await getDeviceStatus(deviceId);
        break;

      case 'control_device':
        if (!deviceId || !capability || !command) {
          throw new Error('deviceId, capability, and command are required');
        }
        result = await controlDevice(deviceId, capability, command, args || []);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('SmartThings control error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
