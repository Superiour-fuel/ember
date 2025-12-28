import { useState, useEffect, useCallback } from 'react';
import { Lightbulb, Thermometer, Tv, DoorOpen, Sun, Phone, Check, X, Volume2, LucideIcon } from 'lucide-react';
import { SmartHomeAction, ACTION_LABELS, ActionParams } from '@/services/smartHomeService';
import { Button } from '@/components/ui/button';

const ACTION_ICONS: Partial<Record<SmartHomeAction, LucideIcon>> = {
  lights_on: Lightbulb,
  lights_off: Lightbulb,
  lights_bright: Lightbulb,
  lights_dim: Lightbulb,
  temp_up: Thermometer,
  temp_down: Thermometer,
  temp_set: Thermometer,
  tv_on: Tv,
  tv_off: Tv,
  volume_up: Volume2,
  volume_down: Volume2,
  door_lock: DoorOpen,
  door_unlock: DoorOpen,
  curtains_open: Sun,
  curtains_close: Sun,
  call_help: Phone,
  call_family: Phone
};

interface ActionConfirmationProps {
  action: SmartHomeAction;
  actionParams: ActionParams;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  brand?: 'smartthings' | 'default';
}

export function ActionConfirmation({
  action,
  actionParams,
  message,
  onConfirm,
  onCancel,
  brand = 'default'
}: ActionConfirmationProps) {
  const [countdown, setCountdown] = useState(5);
  const Icon = ACTION_ICONS[action] || Lightbulb;
  const label = ACTION_LABELS[action] || action;

  // Auto-confirm for urgent actions
  const isUrgent = ['call_help', 'call_family'].includes(action);

  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);

  useEffect(() => {
    if (isUrgent) {
      const timer = setTimeout(() => handleConfirm(), 2000);
      return () => clearTimeout(timer);
    } else {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        handleConfirm();
      }
    }
  }, [countdown, isUrgent, handleConfirm]);

  // SmartThings Logo Component
  const SmartThingsLogo = () => (
    <svg viewBox="0 0 512 512" className="w-16 h-16 fill-[#15BAFF]" fillRule="evenodd">
      <path d="M198.6 150.8c-14.7 0-26.7 11.9-26.7 26.7 0 14.7 11.9 26.7 26.7 26.7 14.7 0 26.7-11.9 26.7-26.7 0-14.8-12-26.7-26.7-26.7zm114.8 0c-14.7 0-26.7 11.9-26.7 26.7 0 14.7 11.9 26.7 26.7 26.7 14.7 0 26.7-11.9 26.7-26.7 0-14.8-12-26.7-26.7-26.7zM256 225.5c-14.7 0-26.7 11.9-26.7 26.7 0 14.7 11.9 26.7 26.7 26.7 14.7 0 26.7-11.9 26.7-26.7 0-14.7-12-26.7-26.7-26.7zm-115.3 0c-14.7 0-26.7 11.9-26.7 26.7 0 14.7 11.9 26.7 26.7 26.7 14.7 0 26.7-11.9 26.7-26.7 0-14.7-11.9-26.7-26.7-26.7zm229.6 0c-14.7 0-26.7 11.9-26.7 26.7 0 14.7 11.9 26.7 26.7 26.7 14.7 0 26.7-11.9 26.7-26.7 0-14.7-11.9-26.7-26.7-26.7zM256 300.2c-14.7 0-26.7 11.9-26.7 26.7 0 14.7 11.9 26.7 26.7 26.7 14.7 0 26.7-11.9 26.7-26.7 0-14.7-12-26.7-26.7-26.7z" />
      <path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm0 464.3c-115 0-208.3-93.3-208.3-208.3S141 47.7 256 47.7 464.3 141 464.3 256 371 464.3 256 464.3z" fillOpacity="0.1" />
    </svg>
  );

  return (
    <div className="fixed inset-0 bg-background/90 flex items-center justify-center z-50 p-4">
      <div className={`rounded-2xl p-8 max-w-lg w-full border-2 ${isUrgent
          ? 'bg-destructive/10 border-destructive'
          : brand === 'smartthings'
            ? 'bg-white border-[#15BAFF]/30'
            : 'bg-card border-primary/30'
        }`}>
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className={`p-6 rounded-full ${isUrgent
              ? 'bg-destructive/20'
              : brand === 'smartthings'
                ? 'bg-[#15BAFF]/10'
                : 'bg-primary/20'
            }`}>
            {brand === 'smartthings' ? (
              <div className="relative">
                <SmartThingsLogo />
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm">
                  <Icon className="w-6 h-6 text-[#15BAFF]" />
                </div>
              </div>
            ) : (
              <Icon className={`w-16 h-16 ${isUrgent ? 'text-destructive' : 'text-primary'
                }`} />
            )}
          </div>
        </div>

        {/* Message */}
        <div className="text-center mb-6">
          {brand === 'smartthings' && (
            <p className="text-[#15BAFF] font-bold tracking-wide uppercase text-xs mb-3">SmartThings Connected</p>
          )}
          <p className="text-sm text-muted-foreground mb-2">You said:</p>
          <p className="text-xl text-foreground mb-4">"{message}"</p>

          <h2 className={`text-2xl font-bold mb-2 ${brand === 'smartthings' ? 'text-[#15BAFF]' : 'text-foreground'
            }`}>
            {isUrgent ? '🚨 Urgent Action' : 'Confirm Action'}
          </h2>
          <p className="text-lg text-muted-foreground">
            {label}
            {actionParams.room && ` in ${actionParams.room}`}
          </p>
        </div>

        {/* Buttons */}
        {!isUrgent && (
          <>
            <div className="flex gap-4 mb-4">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={onCancel}
              >
                <X className="w-5 h-5 mr-2" />
                No, Cancel
              </Button>

              <Button
                variant={brand === 'smartthings' ? 'default' : 'ember'}
                size="lg"
                className={`flex-1 ${brand === 'smartthings' ? 'bg-[#15BAFF] hover:bg-[#15BAFF]/90 text-white' : ''}`}
                onClick={handleConfirm}
              >
                <Check className="w-5 h-5 mr-2" />
                Yes, Do It
              </Button>
            </div>

            {/* Countdown */}
            <p className="text-center text-sm text-muted-foreground">
              Auto-confirming in <span className={`font-bold ${brand === 'smartthings' ? 'text-[#15BAFF]' : 'text-primary'}`}>{countdown}</span> seconds
            </p>
          </>
        )}

        {isUrgent && (
          <div className="text-center">
            <p className="text-destructive font-semibold">
              Calling for help in 2 seconds...
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
