import { useState, useEffect, useRef } from 'react';
import { Lightbulb, LightbulbOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { executeSmartHomeAction, getStoredDevices } from '@/services/smartHomeService';

interface VoiceControlledLightsProps {
  onAction?: (action: 'on' | 'off') => void;
}

export function VoiceControlledLights({ onAction }: VoiceControlledLightsProps) {
  const [lightsOn, setLightsOn] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const onButtonRef = useRef<HTMLButtonElement>(null);
  const offButtonRef = useRef<HTMLButtonElement>(null);

  // Listen for voice commands
  useEffect(() => {
    const handleVoiceCommand = (event: CustomEvent<{ action: string }>) => {
      const { action } = event.detail;
      console.log('VoiceControlledLights received command:', action);

      if (action === 'lights_on') {
        // Simulate button click with visual feedback
        setIsAnimating(true);
        setTimeout(() => {
          onButtonRef.current?.click();
          setIsAnimating(false);
        }, 100);
      } else if (action === 'lights_off') {
        setIsAnimating(true);
        setTimeout(() => {
          offButtonRef.current?.click();
          setIsAnimating(false);
        }, 100);
      }
    };

    window.addEventListener('ember-voice-command', handleVoiceCommand as EventListener);
    return () => {
      window.removeEventListener('ember-voice-command', handleVoiceCommand as EventListener);
    };
  }, []);

  const handleLightsOn = async () => {
    console.log('Lights ON button clicked');
    setLightsOn(true);
    onAction?.('on');

    const devices = getStoredDevices();
    const deviceId = devices.lights.length > 0 ? devices.lights[0].id : undefined;

    const result = await executeSmartHomeAction('lights_on', { deviceId });
    if (result.success) {
      toast.success('Lights turned on');
    } else {
      toast.error(result.message);
    }
  };

  const handleLightsOff = async () => {
    console.log('Lights OFF button clicked');
    setLightsOn(false);
    onAction?.('off');

    const devices = getStoredDevices();
    const deviceId = devices.lights.length > 0 ? devices.lights[0].id : undefined;

    const result = await executeSmartHomeAction('lights_off', { deviceId });
    if (result.success) {
      toast.success('Lights turned off');
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="bg-secondary/50 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-4">
        {lightsOn ? (
          <Lightbulb className="w-6 h-6 text-yellow-400" />
        ) : (
          <LightbulbOff className="w-6 h-6 text-muted-foreground" />
        )}
        <h4 className="font-semibold text-foreground">Quick Light Control</h4>
        {isAnimating && (
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full animate-pulse">
            Voice command...
          </span>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          ref={onButtonRef}
          variant={lightsOn ? "default" : "outline"}
          className={`flex-1 transition-all duration-300 ${isAnimating ? 'scale-95 ring-2 ring-primary' : ''}`}
          onClick={handleLightsOn}
        >
          <Lightbulb className="w-4 h-4 mr-2" />
          Lights On
        </Button>
        <Button
          ref={offButtonRef}
          variant={!lightsOn ? "default" : "outline"}
          className={`flex-1 transition-all duration-300 ${isAnimating ? 'scale-95 ring-2 ring-primary' : ''}`}
          onClick={handleLightsOff}
        >
          <LightbulbOff className="w-4 h-4 mr-2" />
          Lights Off
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        💡 Say "lights on" or "lights off" - works with stuttering too!
      </p>
    </div>
  );
}
