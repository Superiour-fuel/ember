/**
 * Skeleton Loading Components
 * 
 * Provides visual feedback during loading states.
 * Matches app's bento aesthetic.
 */

import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-xl bg-black/10",
                className
            )}
        />
    );
}

// Message bubble skeleton
export function MessageSkeleton() {
    return (
        <div className="flex flex-col gap-4 p-4">
            {/* User message */}
            <div className="flex justify-end">
                <Skeleton className="h-12 w-48 rounded-2xl" />
            </div>
            {/* Assistant message */}
            <div className="flex justify-start">
                <Skeleton className="h-16 w-64 rounded-2xl" />
            </div>
            {/* User message */}
            <div className="flex justify-end">
                <Skeleton className="h-10 w-32 rounded-2xl" />
            </div>
        </div>
    );
}

// Sidebar card skeleton
export function SidebarCardSkeleton() {
    return (
        <div className="bg-white rounded-[1.5rem] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
            <div className="flex items-center gap-2 mb-4">
                <Skeleton className="w-6 h-6 rounded-full" />
                <Skeleton className="h-5 w-24" />
            </div>
            <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
                <Skeleton className="h-10 w-3/4 rounded-lg" />
            </div>
        </div>
    );
}

// Quick phrases skeleton
export function QuickPhrasesSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Skeleton className="w-5 h-5" />
                <Skeleton className="h-5 w-28" />
            </div>
            <div className="flex flex-wrap gap-2">
                <Skeleton className="h-10 w-24 rounded-xl" />
                <Skeleton className="h-10 w-32 rounded-xl" />
                <Skeleton className="h-10 w-20 rounded-xl" />
                <Skeleton className="h-10 w-28 rounded-xl" />
            </div>
        </div>
    );
}

// Page loading skeleton
export function PageLoadingSkeleton() {
    return (
        <div className="min-h-screen bg-[#FFFDD0] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-full border-4 border-black border-t-transparent animate-spin" />
                <p className="text-lg font-bold text-black/60 animate-pulse">Loading...</p>
            </div>
        </div>
    );
}
