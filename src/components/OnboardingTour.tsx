import { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS, TooltipRenderProps } from 'react-joyride';
import { Button } from '@/components/ui/button';
import { Mic, Sparkles, TestTube, AlertTriangle, Settings, HelpCircle, ArrowRight, ArrowLeft, X, CheckCircle } from 'lucide-react';

const TOUR_STEPS: Step[] = [
    {
        target: '.voice-button',
        content: '',
        disableBeacon: true,
        placement: 'top',
        data: {
            icon: Mic,
            title: 'START SPEAKING',
            description: 'Tap this button or press SPACE to begin. Ember will listen and understand what you mean, even if words come out differently.',
            tip: 'Pro tip: Hold for continuous listening!'
        }
    },
    {
        target: '.interpretation-display',
        content: '',
        placement: 'bottom',
        data: {
            icon: Sparkles,
            title: 'SEE THE MAGIC',
            description: 'Watch as Ember interprets your speech in real-time. You\'ll see confidence levels and can confirm or try again.',
            tip: 'Press ENTER to confirm, ESC to retry'
        }
    },
    {
        target: '.demo-mode-toggle',
        content: '',
        placement: 'left',
        data: {
            icon: TestTube,
            title: 'TRY DEMO MODE',
            description: 'Not ready to speak yet? No problem! Demo mode lets you see exactly how Ember works with pre-set examples.',
            tip: 'Press Ctrl+D to toggle demo mode'
        }
    },
    {
        target: '.emergency-button',
        content: '',
        placement: 'top',
        data: {
            icon: AlertTriangle,
            title: 'EMERGENCY HELP',
            description: 'Say "help", "pain", or other urgent words and Ember automatically alerts your caregiver. You\'re never alone.',
            tip: 'Works even with unclear speech'
        }
    },
    {
        target: '.settings-panel',
        content: '',
        placement: 'left',
        data: {
            icon: Settings,
            title: 'MAKE IT YOURS',
            description: 'Customize voice feedback, connect smart home devices, and adjust settings to match your needs.',
            tip: 'Your preferences are saved automatically'
        }
    }
];

// Custom Tooltip Component matching app's neo-brutalist design
function CustomTooltip({
    continuous,
    index,
    step,
    backProps,
    closeProps,
    primaryProps,
    skipProps,
    tooltipProps,
    isLastStep,
    size
}: TooltipRenderProps) {
    const stepData = step.data as {
        icon: React.ComponentType<{ className?: string }>;
        title: string;
        description: string;
        tip: string;
    };

    const Icon = stepData?.icon || Sparkles;

    return (
        <div
            {...tooltipProps}
            className="bg-white rounded-2xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-sm overflow-hidden"
        >
            {/* Header with icon */}
            <div className="bg-[#4ade80] px-5 py-4 border-b-2 border-black">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(255,255,255,0.3)]">
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-black/60 uppercase tracking-wider">
                            Step {index + 1} of {size}
                        </p>
                        <h3 className="text-lg font-black text-black uppercase tracking-tight">
                            {stepData?.title || 'Welcome'}
                        </h3>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-5 py-4">
                <p className="text-black/80 font-medium leading-relaxed">
                    {stepData?.description || step.content}
                </p>

                {stepData?.tip && (
                    <div className="mt-3 px-3 py-2 bg-black/5 rounded-lg border border-black/10">
                        <p className="text-xs font-bold text-black/60 flex items-center gap-2">
                            <span className="w-4 h-4 bg-[#4ade80] rounded-full flex items-center justify-center">
                                <CheckCircle className="w-3 h-3 text-black" />
                            </span>
                            {stepData.tip}
                        </p>
                    </div>
                )}
            </div>

            {/* Progress bar */}
            <div className="px-5 pb-2">
                <div className="flex gap-1">
                    {Array.from({ length: size }).map((_, i) => (
                        <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                                i <= index ? 'bg-black' : 'bg-black/20'
                            }`}
                        />
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="px-5 py-4 border-t-2 border-black/10 flex items-center justify-between gap-3">
                <button
                    {...skipProps}
                    className="text-sm font-bold text-black/50 hover:text-black/70 transition-colors uppercase tracking-wide"
                >
                    Skip tour
                </button>

                <div className="flex items-center gap-2">
                    {index > 0 && (
                        <button
                            {...backProps}
                            className="px-4 py-2 text-sm font-bold text-black border-2 border-black rounded-lg hover:bg-black/5 transition-all flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                    )}

                    {continuous && (
                        <button
                            {...primaryProps}
                            className="px-4 py-2 text-sm font-bold text-white bg-black rounded-lg hover:bg-black/90 transition-all flex items-center gap-1 shadow-[3px_3px_0px_0px_rgba(74,222,128,1)] hover:shadow-[1px_1px_0px_0px_rgba(74,222,128,1)] hover:translate-x-[1px] hover:translate-y-[1px]"
                        >
                            {isLastStep ? (
                                <>
                                    Let's Go!
                                    <CheckCircle className="w-4 h-4" />
                                </>
                            ) : (
                                <>
                                    Next
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export function OnboardingTour() {
    const [run, setRun] = useState(false);

    useEffect(() => {
        // Check if user has completed tour
        const hasCompletedTour = localStorage.getItem('ember-tour-completed');
        if (!hasCompletedTour) {
            // Wait 1.5 seconds before starting tour
            const timer = setTimeout(() => setRun(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleJoyrideCallback = (data: CallBackProps) => {
        const { status } = data;

        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as string)) {
            setRun(false);
            localStorage.setItem('ember-tour-completed', 'true');
        }
    };

    return (
        <>
            <Joyride
                steps={TOUR_STEPS}
                run={run}
                continuous
                showProgress
                showSkipButton
                disableOverlayClose
                spotlightClicks
                callback={handleJoyrideCallback}
                tooltipComponent={CustomTooltip}
                floaterProps={{
                    disableAnimation: false,
                }}
                styles={{
                    options: {
                        zIndex: 10000,
                        arrowColor: '#ffffff',
                    },
                    overlay: {
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    },
                    spotlight: {
                        borderRadius: 16,
                        boxShadow: '0 0 0 4px #4ade80, 0 0 0 8px rgba(74, 222, 128, 0.3)',
                    },
                    beacon: {
                        inner: '#4ade80',
                        outer: '#4ade80',
                    },
                    beaconInner: {
                        backgroundColor: '#4ade80',
                    },
                    beaconOuter: {
                        backgroundColor: 'rgba(74, 222, 128, 0.3)',
                        border: '2px solid #4ade80',
                    },
                }}
                locale={{
                    back: 'Back',
                    close: 'Close',
                    last: "Let's Go!",
                    next: 'Next',
                    skip: 'Skip tour',
                }}
            />

            {/* Manual tour trigger - redesigned */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => {
                    localStorage.removeItem('ember-tour-completed');
                    setRun(true);
                }}
                className="fixed bottom-4 left-4 z-50 bg-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px] transition-all font-bold text-black"
            >
                <HelpCircle className="w-4 h-4 mr-2" />
                Show Tour
            </Button>
        </>
    );
}
