
import { useState, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { VoiceBankingModal } from "./VoiceBankingModal";
import { useUserData } from "@/hooks/useUserData";
import { useAuth } from "@/hooks/useAuth";
import {
  Shield,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Mic,
  LogIn,
  Heart
} from "lucide-react";
import { Link } from "react-router-dom";

interface VoiceBankingCardProps {
  className?: string;
}

export const VoiceBankingCard = forwardRef<HTMLDivElement, VoiceBankingCardProps>(
  function VoiceBankingCard({ className }, ref) {
    const [modalOpen, setModalOpen] = useState(false);
    const { user } = useAuth();
    const { voiceBank, refetch } = useUserData();

    const getClarityColor = (score: number) => {
      if (score >= 85) return "text-green-600";
      if (score >= 70) return "text-yellow-600";
      return "text-red-600";
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    };

    // If not logged in, show login prompt
    if (!user) {
      return (
        <div className={`relative bg-[#fdf2f8] rounded-[1.5rem] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 overflow-hidden transition-transform hover:-translate-y-1 duration-200 ${className}`}>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-pink-600" />
            <h3 className="font-bold text-lg text-black">Voice Banking</h3>
          </div>

          <p className="text-sm font-medium text-gray-700 mb-4">
            Sign in to preserve your voice identity.
          </p>

          <Link to="/auth">
            <Button className="w-full bg-black text-white rounded-xl border-2 border-transparent hover:bg-black/80 hover:scale-[1.02] transition-all font-bold text-xs h-9 shadow-sm">
              <LogIn className="w-3 h-3 mr-1" />
              Sign In
              <ChevronRight className="w-3 h-3 ml-auto" />
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <>
        <div
          ref={ref}
          className={`relative bg-[#FFFDD0] rounded-[1.5rem] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] duration-200 ${className}`}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]">
              {voiceBank ? (
                <ShieldCheck className="w-4 h-4 text-[#4ade80]" />
              ) : (
                <Heart className="w-4 h-4 text-white fill-current" />
              )}
            </div>
            <h3 className="font-black text-lg text-black uppercase tracking-tight leading-none">
              {voiceBank ? "Voice Active" : "Voice Banking"}
            </h3>
          </div>

          {voiceBank ? (
            <>
              <div className="bg-white/50 rounded-xl p-3 border-2 border-black/5 mb-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Recorded</p>
                <p className="text-sm font-black text-black mb-2">
                  {formatDate(voiceBank.recorded_at)}
                </p>
                <div className="flex items-center gap-2 bg-black/5 rounded-lg px-2 py-1 w-fit">
                  <span className={`text-xs font-black ${getClarityColor(voiceBank.clarity_score)}`}>
                    {voiceBank.clarity_score}% Clarity
                  </span>
                </div>
              </div>

              <Button
                className="w-full bg-black text-white rounded-xl border-2 border-transparent hover:bg-gray-900 transition-all font-bold text-xs h-10 shadow-sm"
                onClick={() => setModalOpen(true)}
              >
                <Mic className="w-3 h-3 mr-2" />
                Update Voice
              </Button>
            </>
          ) : (
            <>
              <div className="bg-yellow-50 rounded-xl p-3 border-2 border-yellow-200 mb-4">
                <p className="text-xs font-bold text-yellow-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Not Preserved
                </p>
                <p className="text-sm font-bold text-black/80 leading-snug">
                  Create a digital copy of your voice before it changes.
                </p>
              </div>

              <Button
                className="w-full bg-black text-white rounded-xl border-2 border-black hover:bg-gray-900 hover:scale-[1.02] transition-all font-bold text-xs h-10 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.2)]"
                onClick={() => setModalOpen(true)}
              >
                Start Voice Banking
                <ChevronRight className="w-3 h-3 ml-auto" />
              </Button>
            </>
          )}
        </div>

        <VoiceBankingModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          onVoiceBankSaved={refetch}
        />
      </>
    );
  }
);
