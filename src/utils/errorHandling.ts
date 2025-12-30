import { toast } from 'sonner';

export class GracefulError extends Error {
    constructor(
        message: string,
        public userMessage: string,
        public recoveryAction?: () => void
    ) {
        super(message);
        this.name = 'GracefulError';
    }
}

export function handleInterpretationError(error: unknown, fallback?: () => void) {
    console.error('Interpretation error:', error);

    let userMessage = "I couldn't quite catch that. Could you try again?";
    let action = fallback;

    if (error instanceof GracefulError) {
        userMessage = error.userMessage;
        action = error.recoveryAction || fallback;
    } else if (error instanceof Error) {
        if (error.message.includes('network')) {
            userMessage = "Connection issue. Please check your internet and try again.";
        } else if (error.message.includes('timeout')) {
            userMessage = "That's taking too long. Let's try a shorter phrase.";
        } else if (error.message.includes('rate limit')) {
            userMessage = "Too many requests. Please wait a moment.";
        }
    }

    toast.error(userMessage, {
        action: action ? {
            label: 'Try Again',
            onClick: action
        } : undefined
    });
}

export async function withGracefulFallback<T>(
    promise: Promise<T>,
    fallback: T,
    errorMessage?: string
): Promise<T> {
    try {
        return await promise;
    } catch (error) {
        console.error('Operation failed, using fallback:', error);
        if (errorMessage) {
            toast.error(errorMessage);
        }
        return fallback;
    }
}
