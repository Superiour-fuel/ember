import { useState } from "react";
import { AlertTriangle, Phone, PhoneCall, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type UrgencyLevel = 'CRITICAL' | 'URGENT' | 'IMPORTANT';

interface UrgentAlertProps {
  urgencyLevel: UrgencyLevel;
  message: string;
  interpretation?: string;
  emergencyContactPhone?: string | null;
  emergencyContactMethod?: 'whatsapp' | 'sms' | 'call';
  userName?: string;
  onCallHelp: () => void;
  onDismiss: () => void;
}

export function UrgentAlert({
  urgencyLevel,
  message,
  interpretation,
  emergencyContactPhone,
  emergencyContactMethod = 'call',
  userName,
  onCallHelp,
  onDismiss
}: UrgentAlertProps) {
  const [isCallingLoading, setIsCallingLoading] = useState(false);
  const { toast } = useToast();

  const handleCallHelp = async () => {
    console.log('UrgentAlert handleCallHelp called', {
      emergencyContactPhone,
      emergencyContactMethod,
      userName,
    });

    if (!emergencyContactPhone) {
      console.log('No emergency contact phone set');
      onCallHelp();
      return;
    }

    if (emergencyContactMethod === 'call') {
      // Make phone call via Twilio with ElevenLabs voice
      setIsCallingLoading(true);
      try {
        console.log('Invoking twilio-emergency-call edge function...');

        const { data, error } = await supabase.functions.invoke('twilio-emergency-call', {
          body: {
            phoneNumber: emergencyContactPhone,
            message: interpretation || message,
            userName: userName || 'Your contact',
          },
        });

        console.log('twilio-emergency-call response:', { data, error });

        if (error) throw error;

        if (data?.success) {
          toast({
            title: "Emergency call initiated",
            description: `Calling your emergency contact now. Call ID: ${data.callSid?.slice(-8) || 'N/A'}`,
          });
        } else {
          throw new Error(data?.error || 'Failed to make call');
        }
      } catch (error) {
        console.error('Failed to make emergency call:', error);
        toast({
          variant: "destructive",
          title: "Call failed",
          description: error instanceof Error ? error.message : "Could not make emergency call",
        });
      } finally {
        setIsCallingLoading(false);
      }
    } else {
      // Fallback to SMS/WhatsApp
      const cleanPhone = emergencyContactPhone.replace(/[^+\d]/g, '');
      const urgentMessage = encodeURIComponent(
        `🚨 URGENT: ${interpretation || message}\n\nThis is an automated message from Ember. Your contact needs help.`
      );

      if (emergencyContactMethod === 'sms') {
        window.open(`sms:${cleanPhone}?body=${urgentMessage}`, '_blank');
      } else {
        window.open(`https://wa.me/${cleanPhone}?text=${urgentMessage}`, '_blank');
      }
    }
    onCallHelp();
  };
  const config = {
    CRITICAL: {
      headerBg: 'bg-red-500',
      headerText: 'text-white',
      accentColor: 'text-red-600',
      icon: '🚨',
      title: 'Emergency Detected',
      action: 'Call 911 Now',
      description: 'Medical emergency detected. Help is being summoned.',
      canDismiss: false,
    },
    URGENT: {
      headerBg: 'bg-[#facc15]', // Yellow-400 for better visibility/vibes or Orange
      headerText: 'text-black',
      accentColor: 'text-orange-600',
      icon: '⚠️',
      title: 'Urgent Need Detected',
      action: 'Call for Help',
      description: 'Your caregiver will be notified immediately.',
      canDismiss: true,
    },
    IMPORTANT: {
      headerBg: 'bg-blue-400', // Changed to Blue for distinctiveness or keep Yellow
      headerText: 'text-black',
      accentColor: 'text-blue-600',
      icon: '📢',
      title: 'Important Request',
      action: 'Get Assistance',
      description: 'Would you like help with this?',
      canDismiss: true,
    },
  };

  // Specific override for URGENT to match the orange theme but nicer
  if (urgencyLevel === 'URGENT') {
    config.URGENT.headerBg = 'bg-orange-500';
    config.URGENT.headerText = 'text-white';
  }

  const current = config[urgencyLevel];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`
          w-full max-w-lg bg-white 
          rounded-[2rem] border-4 border-black 
          shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]
          overflow-hidden
          animate-in zoom-in-95 duration-300
        `}
      >
        {/* Header */}
        <div className={`relative px-8 py-6 ${current.headerBg} border-b-4 border-black flex items-center gap-5`}>
          {/* Icon Box */}
          <div className="flex-shrink-0 w-16 h-16 bg-white border-4 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
            <span className="text-3xl" role="img" aria-label="Alert">
              {current.icon}
            </span>
          </div>

          <div className="flex-1">
            <h3 className={`font-black text-2xl uppercase tracking-tight leading-none mb-2 ${current.headerText}`}>
              {current.title}
            </h3>
            <p className={`font-bold text-sm ${current.headerText} opacity-90 leading-tight`}>
              {current.description}
            </p>
          </div>

          {current.canDismiss && (
            <button
              onClick={onDismiss}
              className={`
                    absolute top-4 right-4 
                    w-8 h-8 flex items-center justify-center rounded-full 
                    bg-black/10 hover:bg-black/20 border border-black/5
                    transition-colors ${current.headerText}
                  `}
              aria-label="Dismiss alert"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-8">
          {/* Message Box */}
          <div className="bg-slate-50 border-2 border-black rounded-2xl p-6 relative">
            <div className="absolute -top-3 left-6 px-3 py-1 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-md transform -rotate-1">
              What we heard
            </div>
            <p className="text-2xl font-black text-black leading-tight">
              "{message}"
            </p>

            {interpretation && interpretation !== message && (
              <div className="mt-4 pt-4 border-t-2 border-black/10">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Interpretation</p>
                <p className="text-lg font-bold text-gray-800">"{interpretation}"</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={handleCallHelp}
              disabled={isCallingLoading}
              className={`
                    flex-1 h-14 text-lg font-black tracking-wide
                    bg-black text-white hover:bg-gray-900 
                    border-4 border-black rounded-xl
                    shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]
                    hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]
                    active:translate-x-[4px] active:translate-y-[4px] active:shadow-none
                    transition-all
                `}
            >
              {isCallingLoading ? (
                <>
                  <Loader2 className="h-6 w-6 mr-3 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  {urgencyLevel === 'CRITICAL' ? (
                    <PhoneCall className="h-6 w-6 mr-3 animate-pulse" />
                  ) : (
                    <Phone className="h-6 w-6 mr-3" />
                  )}
                  {emergencyContactPhone
                    ? (emergencyContactMethod === 'call' ? 'Call Now' : emergencyContactMethod === 'sms' ? 'Send SMS' : 'WhatsApp')
                    : config[urgencyLevel].action}
                </>
              )}
            </Button>

            {current.canDismiss && (
              <Button
                onClick={onDismiss}
                variant="outline"
                className={`
                    h-14 px-8 text-lg font-bold
                    bg-white text-black hover:bg-gray-100
                    border-4 border-black rounded-xl
                    shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                    hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                    active:translate-x-[4px] active:translate-y-[4px] active:shadow-none
                    transition-all
                  `}
              >
                Dismiss
              </Button>
            )}
          </div>

          {/* Safety Note for Critical */}
          {urgencyLevel === 'CRITICAL' && (
            <div className="flex items-center justify-center gap-2 text-red-600 font-bold bg-red-50 p-2 rounded-lg border border-red-200">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">Cannot dismiss critical alerts</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
