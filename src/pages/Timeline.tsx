
import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { EmberLogo } from "@/components/EmberLogo";
import { VoiceBankingModal } from "@/components/VoiceBankingModal";
import { VoiceComparisonPlayer } from "@/components/VoiceComparisonPlayer";
import { secureVoiceStorage } from "@/services/voiceEncryptionService";
import {
  ArrowLeft,
  Play,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Check,
  Mic,
  Heart,
  ShieldCheck,
  Trash2,
  FileJson,
  Archive
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { GlowingEffect } from "@/components/ui/glowing-effect";

interface VoiceSample {
  id: string;
  date: string;
  type: 'voice_bank' | 'conversation';
  clarityScore: number;
  duration: number;
  audioBlob?: string;
}

interface VoiceBankData {
  audioBlob: string;
  recordedAt: string;
  clarity_score: number;
  history?: Array<{
    audioBlob: string;
    recordedAt: string;
    clarity_score: number;
    version: number;
  }>;
}

// Generate mock data for the chart
const generateMockData = () => {
  const data = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    // Simulate slight decline over time for demo
    const baseClarity = 90 - (i * 0.3);
    const variance = Math.random() * 10 - 5;
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      fullDate: date.toISOString(),
      clarity: Math.min(95, Math.max(60, Math.floor(baseClarity + variance))),
    });
  }
  return data;
};

const generateMockSamples = (): VoiceSample[] => {
  const samples: VoiceSample[] = [];
  const today = new Date();
  for (let i = 0; i < 10; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(Math.floor(Math.random() * 12) + 8);
    samples.push({
      id: `sample-${i}`,
      date: date.toISOString(),
      type: i === 0 || i === 5 ? 'voice_bank' : 'conversation',
      clarityScore: Math.floor(Math.random() * 25) + 70,
      duration: Math.floor(Math.random() * 120) + 30,
    });
  }
  return samples;
};

export default function Timeline() {
  const [filter, setFilter] = useState<"week" | "month" | "all">("month");
  const [voiceBankModalOpen, setVoiceBankModalOpen] = useState(false);
  const [voiceBank, setVoiceBank] = useState<VoiceBankData | null>(null);

  const chartData = useMemo(() => generateMockData(), []);
  const samples = useMemo(() => generateMockSamples(), []);
  const { toast } = useToast();

  const loadVoiceBank = () => {
    // Load and decrypt voice bank from secure storage
    const data = secureVoiceStorage.getVoiceBank();
    if (data) {
      setVoiceBank(data);
    }
  };

  useEffect(() => {
    loadVoiceBank();
  }, []);

  // Calculate trend
  const trend = useMemo(() => {
    if (chartData.length < 7) return "stable";
    const recent = chartData.slice(-7).reduce((sum, d) => sum + d.clarity, 0) / 7;
    const older = chartData.slice(-14, -7).reduce((sum, d) => sum + d.clarity, 0) / 7;
    const diff = recent - older;
    if (diff > 3) return "improving";
    if (diff < -3) return "declining";
    return "stable";
  }, [chartData]);

  const avgClarity = useMemo(() => {
    return Math.round(chartData.reduce((sum, d) => sum + d.clarity, 0) / chartData.length);
  }, [chartData]);

  const filteredData = useMemo(() => {
    if (filter === "week") return chartData.slice(-7);
    if (filter === "month") return chartData;
    return chartData;
  }, [chartData, filter]);

  const getTrendIcon = () => {
    switch (trend) {
      case "improving": return <TrendingUp className="w-5 h-5 text-green-600" />;
      case "declining": return <TrendingDown className="w-5 h-5 text-red-600" />;
      default: return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getClarityColor = (score: number) => {
    if (score >= 85) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getClarityBadge = (score: number) => {
    if (score >= 85) return "🟢";
    if (score >= 70) return "🟡";
    return "🔴";
  };

  const handleExportData = () => {
    const exportData = {
      voiceBank,
      timeline: samples,
      chartData,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ember-voice-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Data exported", description: "Your voice data has been downloaded." });
  };

  const handleDeleteVoiceBank = () => {
    secureVoiceStorage.clearAll();
    setVoiceBank(null);
    toast({ title: "Voice bank deleted", description: "Your preserved voice has been removed.", variant: "destructive" });
  };

  // Get original and current samples for comparison
  const originalSample = voiceBank?.history?.[voiceBank.history.length - 1] ||
    (voiceBank ? { audioBlob: voiceBank.audioBlob, recordedAt: voiceBank.recordedAt, clarity_score: voiceBank.clarity_score } : null);
  const currentSample = voiceBank ? { audioBlob: voiceBank.audioBlob, recordedAt: voiceBank.recordedAt, clarity_score: voiceBank.clarity_score } : null;

  return (
    <div className="min-h-screen bg-[#4ade80] text-black pb-12">
      {/* Background Noise Texture */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay z-0"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      {/* Header */}
      <header className="relative z-10 pt-6 px-6 mb-8">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/app" className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-black text-white hover:bg-black/80 transition-transform hover:scale-105 shadow-lg">
              <ArrowLeft className="w-5 h-5" />
              <span className="sr-only">Back to app</span>
            </Link>
            <div className="text-black">
              <EmberLogo size="sm" />
            </div>
          </div>

          <Button variant="outline" className="bg-white border-2 border-black text-black font-bold hover:bg-gray-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl" onClick={handleExportData}>
            <Download className="w-4 h-4 mr-2" />
            Export Data
          </Button>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-6">
        {/* Page header */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">Your Voice Journey.</h1>
          <p className="text-xl font-medium opacity-80">Track how your voice clarity evolves over time.</p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {/* Average Clarity */}
          <div className="relative bg-white rounded-[2rem] p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden hover:-translate-y-1 transition-transform">
            <div className="relative z-10">
              <p className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Average Clarity</p>
              <p className={`text-4xl font-black ${getClarityColor(avgClarity)}`}>{avgClarity}%</p>
            </div>
          </div>

          {/* Trend */}
          <div className="relative bg-white rounded-[2rem] p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden hover:-translate-y-1 transition-transform">
            <div className="relative z-10">
              <p className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Trend (7 days)</p>
              <div className="flex items-center gap-2">
                {getTrendIcon()}
                <p className="text-xl font-bold capitalize text-black">{trend}</p>
              </div>
            </div>
          </div>

          {/* Samples Recorded */}
          <div className="relative bg-white rounded-[2rem] p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden hover:-translate-y-1 transition-transform">
            <div className="relative z-10">
              <p className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wide">Samples Recorded</p>
              <p className="text-4xl font-black text-black">{samples.length}</p>
            </div>
          </div>

          {/* Voice Bank Status */}
          <div className={`relative rounded-[2rem] p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden hover:-translate-y-1 transition-transform ${voiceBank ? "bg-[#dcfce7]" : "bg-[#fef9c3]"}`}>
            <div className="relative z-10">
              <p className="text-sm font-bold text-black/60 mb-2 uppercase tracking-wide">Voice Bank</p>
              <div className="flex items-center gap-2">
                {voiceBank ? (
                  <>
                    <ShieldCheck className="w-6 h-6 text-green-700" />
                    <p className="text-xl font-black text-green-700">Preserved</p>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-6 h-6 text-yellow-700" />
                    <p className="text-xl font-black text-yellow-700">Not Saved</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Insights Card */}
        <div className="mb-8">
          {trend === "declining" ? (
            <div className="relative rounded-[2rem] p-6 border-2 border-black bg-[#fee2e2] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-red-100 rounded-xl border-2 border-red-200">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-black text-red-700 mb-2">Voice Clarity Declining</h3>
                  <p className="font-medium text-red-900/70 mb-4 max-w-2xl">
                    Your voice has changed over the past week. Consider updating your voice model to preserve your current voice and maintain accuracy.
                  </p>
                  <div className="flex items-center gap-4">
                    <Button className="bg-red-600 text-white border-2 border-transparent hover:bg-red-700 font-bold rounded-xl" onClick={() => setVoiceBankModalOpen(true)}>
                      <Mic className="w-4 h-4 mr-2" />
                      Update Voice Model Now
                    </Button>
                    <div className="flex items-center gap-2 text-xs font-bold text-red-400">
                      <Calendar className="w-4 h-4" />
                      <span>Last update: {voiceBank ? new Date(voiceBank.recordedAt).toLocaleDateString() : 'Never'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : trend === "improving" ? (
            <div className="relative rounded-[2rem] p-6 border-2 border-black bg-[#dcfce7] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-xl border-2 border-green-200">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-green-800 mb-2">Voice Improving</h3>
                  <p className="font-medium text-green-900/70 max-w-2xl">
                    Great news! Your voice clarity has improved over the past week. Keep using ember regularly to track your progress.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative rounded-[2rem] p-6 border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-transform">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-xl border-2 border-gray-200">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-black mb-2">Voice Stable</h3>
                  <p className="font-medium text-gray-600">
                    Your voice clarity is consistent. Last voice banking: {voiceBank ? new Date(voiceBank.recordedAt).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Chart */}
            <div className="relative bg-white rounded-[2.5rem] p-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-black">Clarity Score</h2>
                <div className="flex gap-2 bg-gray-100 p-1.5 rounded-xl border border-black/5">
                  {(["week", "month", "all"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${filter === f
                        ? "bg-black text-white shadow-md"
                        : "text-gray-500 hover:text-black hover:bg-gray-200"
                        }`}
                    >
                      {f === "week" ? "Week" : f === "month" ? "Month" : "All"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredData}>
                    <defs>
                      <linearGradient id="clarityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#9ca3af"
                      tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      domain={[50, 100]}
                      stroke="#9ca3af"
                      tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '2px solid #000',
                        borderRadius: '12px',
                        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                        padding: '12px'
                      }}
                      itemStyle={{ color: '#000', fontWeight: 'bold' }}
                      labelStyle={{ color: '#6b7280', marginBottom: '4px', fontSize: '12px' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="clarity"
                      stroke="#000"
                      strokeWidth={3}
                      fill="url(#clarityGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Voice Samples */}
            <div className="relative bg-white rounded-[2.5rem] p-8 border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-black">History</h2>
                <Button variant="ghost" size="sm" className="text-gray-500 hover:text-black hover:bg-gray-100 rounded-xl">
                  <Calendar className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>

              <div className="space-y-4">
                {samples.map((sample, index) => (
                  <div
                    key={sample.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all hover:scale-[1.01] ${sample.type === 'voice_bank'
                      ? "bg-[#f0fdf4] border-[#4ade80]"
                      : "bg-white border-transparent hover:border-black/5 hover:shadow-sm hover:bg-gray-50"
                      }`}
                  >
                    <button className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center hover:bg-[#4ade80] hover:text-black transition-colors shadow-md">
                      <Play className="w-5 h-5 ml-0.5" />
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-base font-bold text-black">
                          {new Date(sample.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <span className="text-sm text-gray-400 font-medium">
                          {new Date(sample.date).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit'
                          })}
                        </span>
                        {sample.type === 'voice_bank' && (
                          <span className="px-2 py-0.5 rounded-full bg-black text-white text-[10px] font-bold flex items-center gap-1">
                            <Heart className="w-3 h-3" />
                            Voice Bank
                          </span>
                        )}
                        {index === 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#4ade80] text-black text-[10px] font-bold border border-black">
                            Latest
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                        Duration: {formatDuration(sample.duration)}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className={`text-2xl font-black ${getClarityColor(sample.clarityScore)}`}>
                        {sample.clarityScore}%
                      </div>
                      <div className="text-xs">{getClarityBadge(sample.clarityScore)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Voice Comparison - Needs to be checked if component supports styling or needs wrapping */}
            {voiceBank && voiceBank.history && voiceBank.history.length > 0 && originalSample && currentSample && (
              <div className="rounded-[2rem] border-2 border-black overflow-hidden shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                <VoiceComparisonPlayer
                  originalSample={originalSample}
                  currentSample={currentSample}
                  onUpdate={() => setVoiceBankModalOpen(true)}
                />
              </div>
            )}

            {/* Actions */}
            <div className="relative bg-[#FFFDD0] rounded-[2rem] p-6 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="font-black text-xl mb-6 text-black">Actions</h3>
              <div className="space-y-3">
                <Button
                  className="w-full justify-start bg-black text-white hover:bg-black/80 font-bold h-12 rounded-xl text-base shadow-sm"
                  onClick={() => setVoiceBankModalOpen(true)}
                >
                  <Mic className="w-5 h-5 mr-3" />
                  Record New Sample
                </Button>

                <Button variant="outline" className="w-full justify-start bg-white border-2 border-black text-black font-bold h-12 rounded-xl hover:bg-gray-50" onClick={handleExportData}>
                  <FileJson className="w-5 h-5 mr-3" />
                  Export Voice Data
                </Button>

                <Button variant="outline" className="w-full justify-start bg-white border-2 border-black text-black font-bold h-12 rounded-xl hover:bg-gray-50">
                  <Archive className="w-5 h-5 mr-3" />
                  Download All
                </Button>

                {voiceBank && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700 font-bold h-12 rounded-xl">
                        <Trash2 className="w-5 h-5 mr-3" />
                        Delete Voice Bank
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white border-2 border-black rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-black text-2xl">Delete Voice Bank?</AlertDialogTitle>
                        <AlertDialogDescription className="font-medium text-gray-600">
                          This will permanently delete your preserved voice. This action cannot be undone.
                          You can always record a new voice sample later.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl font-bold border-2 border-black text-black">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteVoiceBank} className="rounded-xl font-bold bg-red-600 hover:bg-red-700 text-white border-2 border-red-800">
                          Delete Voice Bank
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>

            {/* Privacy Notice */}
            <div className="text-center p-4 rounded-2xl bg-black/5 border-2 border-transparent">
              <p className="text-xs font-bold text-gray-500">
                🔒 Your voice data is stored locally on your device and is never shared without your explicit consent.
              </p>
            </div>
          </div>
        </div>
      </main>

      <VoiceBankingModal
        open={voiceBankModalOpen}
        onOpenChange={setVoiceBankModalOpen}
        onVoiceBankSaved={loadVoiceBank}
      />
    </div >
  );
}