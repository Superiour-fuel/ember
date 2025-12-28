import { supabase } from '@/integrations/supabase/client';

export interface CaregiverContact {
  id: number;
  name: string;
  phone: string;
  relationship?: string;
  active: boolean;
  addedAt: string;
}

export interface SendInterpretationResult {
  success: boolean;
  sent?: number;
  total?: number;
  reason?: string;
}

// Send interpretation SMS to all active caregivers
export async function sendInterpretationSMS({
  originalMessage,
  interpretation,
  confidence,
}: {
  originalMessage: string;
  interpretation: string;
  confidence: number;
}): Promise<SendInterpretationResult> {
  const contacts = getCaregiverContacts().filter(c => c.active);

  if (contacts.length === 0) {
    console.log('No active caregiver contacts');
    return { success: false, reason: 'no_contacts' };
  }

  // Only send if confidence is reasonable (avoid spam)
  if (confidence < 60) {
    console.log('Confidence too low to send SMS:', confidence);
    return { success: false, reason: 'low_confidence' };
  }

  // Format message
  const messageBody = formatInterpretationMessage({
    originalMessage,
    interpretation,
    confidence,
    timestamp: new Date().toLocaleString(),
  });

  // Send to all active caregivers
  const results = await Promise.allSettled(
    contacts.map((contact) => sendSMS(contact.phone, messageBody))
  );

  const successful = results.filter((r) => r.status === 'fulfilled').length;

  return {
    success: successful > 0,
    sent: successful,
    total: contacts.length,
  };
}

async function sendSMS(toPhone: string, message: string): Promise<{ success: boolean }> {
  try {
    const { data, error } = await supabase.functions.invoke('twilio-sms', {
      body: {
        to: toPhone,
        message,
      },
    });

    if (error) {
      console.error('SMS send error:', error);
      throw error;
    }

    return { success: data?.success || false };
  } catch (err) {
    console.error('Failed to send SMS:', err);
    throw err;
  }
}

function formatInterpretationMessage({
  originalMessage,
  interpretation,
  confidence,
  timestamp,
}: {
  originalMessage: string;
  interpretation: string;
  confidence: number;
  timestamp: string;
}): string {
  return `[Ember Alert]\n
They said: "${originalMessage}"\n
Meant: "${interpretation}"\n
Confidence: ${confidence}%\n
Time: ${timestamp}\n
Reply HELP for assistance, STOP to unsubscribe`;
}

// Get all caregiver contacts from localStorage
export function getCaregiverContacts(): CaregiverContact[] {
  try {
    const contacts = localStorage.getItem('ember_caregiver_contacts');
    return contacts ? JSON.parse(contacts) : [];
  } catch {
    return [];
  }
}

// Save a new caregiver contact
export function saveCaregiverContact(
  name: string,
  phone: string,
  relationship?: string
): CaregiverContact[] {
  const contacts = getCaregiverContacts();

  // Clean phone number - keep only digits and leading +
  const cleanPhone = phone.startsWith('+')
    ? '+' + phone.slice(1).replace(/\D/g, '')
    : phone.replace(/\D/g, '');

  const newContact: CaregiverContact = {
    id: Date.now(),
    name,
    phone: cleanPhone,
    relationship,
    active: true,
    addedAt: new Date().toISOString(),
  };

  contacts.push(newContact);
  localStorage.setItem('ember_caregiver_contacts', JSON.stringify(contacts));
  return contacts;
}

// Remove a caregiver contact by ID
export function removeCaregiverContact(id: number): CaregiverContact[] {
  const contacts = getCaregiverContacts();
  const updated = contacts.filter((c) => c.id !== id);
  localStorage.setItem('ember_caregiver_contacts', JSON.stringify(updated));
  return updated;
}

// Toggle a contact's active status
export function toggleCaregiverActive(id: number): CaregiverContact[] {
  const contacts = getCaregiverContacts();
  const updated = contacts.map((c) =>
    c.id === id ? { ...c, active: !c.active } : c
  );
  localStorage.setItem('ember_caregiver_contacts', JSON.stringify(updated));
  return updated;
}
