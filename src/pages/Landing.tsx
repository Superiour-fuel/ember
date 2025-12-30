import { useEffect } from "react";
import { Link } from "react-router-dom";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Button } from "@/components/ui/button";
import { EmberLogo } from "@/components/EmberLogo";
import { FeatureCard } from "@/components/FeatureCard";
import { StatCard } from "@/components/StatCard";
import { VoiceVisualization } from "@/components/VoiceVisualization";
import {
  AudioWaveform,
  BrainCircuit,
  Volume2,
  Mic,
  Brain,
  Camera,
  Users,
  Play,
  Linkedin,
  ArrowRight,
  Zap,
  Shield,
  Heart,
  Quote
} from "lucide-react";



export default function Landing() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@elevenlabs/convai-widget-embed@beta";
    script.async = true;
    script.type = "text/javascript";
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#4ade80] text-black overflow-hidden selection:bg-black selection:text-[#4ade80]">
      {/* Decorative noise/texture overlay (optional premium feel) */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
      </div>

      {/* Radial Gradient for Depth (Spotlight Effect) */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_10%,_rgba(0,0,0,0.15)_100%)]"></div>

      {/* Navigation */}
      <header className="relative z-50">
        <nav className="container mx-auto px-6 py-6 flex items-center justify-between" role="navigation" aria-label="Main navigation">
          {/* Logo - Force Black Text for contrast */}
          <div className="flex-1 flex justify-start text-black">
            <EmberLogo size="md" />
          </div>

          <div className="flex items-center justify-center gap-8 hidden md:flex">
            <Link to="/mission" className="font-bold text-black/70 hover:text-black transition-colors text-lg">Mission</Link>
            <Link to="/technology" className="font-bold text-black/70 hover:text-black transition-colors text-lg">Technology</Link>
          </div>

          <div className="flex-1 flex justify-end items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost" className="text-black hover:bg-black/10 hover:text-black font-semibold relative overflow-hidden">
                <GlowingEffect spread={20} glow={true} disabled={false} proximity={64} inactiveZone={0.01} />
                <span className="relative z-10">Sign In</span>
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-black text-white hover:bg-black/80 hover:scale-105 transition-all rounded-full px-6 font-bold shadow-lg shadow-black/20 relative overflow-hidden">
                <GlowingEffect spread={20} glow={true} disabled={false} proximity={64} inactiveZone={0.01} />
                <span className="relative z-10">Get Started</span>
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-6 pt-12 pb-16 md:pt-24 md:pb-32 text-center">
          <div className="max-w-5xl mx-auto">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-black/5 border border-black/10 backdrop-blur-sm mb-6 animate-fade-up">
              <span className="text-sm font-bold tracking-wide uppercase">New Era of Voice Accessibility</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[0.9] mb-6 animate-fade-up delay-100">
              Keep the ember alive.
            </h1>

            <p className="text-xl md:text-3xl font-medium text-black/80 max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-up delay-200">
              Instant voice personalization for speech disabilities.
              <br className="hidden md:block" />
              No training. No latency. <span className="bg-[#FFFDD0] text-black px-4 py-1 rounded-full shadow-sm">Just your voice.</span>
            </p>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-fade-up delay-300">
              <Link to="/app">
                <Button className="h-16 px-10 text-xl bg-black text-white rounded-full hover:bg-gray-900 transition-all hover:scale-105 hover:shadow-2xl hover:shadow-black/20 flex items-center gap-2 group relative overflow-hidden">
                  <GlowingEffect spread={20} glow={true} disabled={false} proximity={64} inactiveZone={0.01} />
                  <span className="relative z-10 flex items-center gap-2">
                    <Mic className="w-6 h-6" />
                    Start Speaking
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1 ml-2" />
                  </span>
                </Button>
              </Link>
              <Button variant="outline" className="h-16 px-10 text-xl border-4 border-black text-black bg-transparent rounded-full hover:bg-black hover:text-white transition-all font-bold relative overflow-hidden">
                <GlowingEffect spread={20} glow={true} disabled={false} proximity={64} inactiveZone={0.01} />
                <span className="relative z-10 flex items-center gap-2">
                  <Play className="w-5 h-5 mr-2 fill-current" />
                  Watch Demo
                </span>
              </Button>
            </div>
          </div>



        </section>

        {/* Stats Section - Full Width & Moved Down */}
        <div className="w-full border-t-4 border-black bg-white mt-24">
          <section className="container mx-auto px-6 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div>
                <div className="text-7xl font-black mb-2 text-black">2M+</div>
                <div className="text-xl font-bold text-gray-500 uppercase tracking-widest">People with ALS</div>
              </div>
              <div>
                <div className="text-7xl font-black mb-2 text-black">+7.5M</div>
                <div className="text-xl font-bold text-gray-500 uppercase tracking-widest">with voice disabilities</div>
              </div>
              <div>
                <div className="text-7xl font-black mb-2 text-black">50M+</div>
                <div className="text-xl font-bold text-gray-500 uppercase tracking-widest">globally affected</div>
              </div>
            </div>
          </section>
        </div>

        {/* Feature Bento Grid */}
        <section className="container mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-6 md:grid-rows-2 gap-6 max-w-7xl mx-auto">
            {/* Large Card 1 - Instant Personalization */}
            <div className="md:col-span-3 md:row-span-2 bg-white rounded-[2rem] border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all relative group">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
              />
              <div className="relative w-full h-full overflow-hidden rounded-[inherit] p-10">
                <div className="absolute top-0 right-0 p-10 opacity-20 group-hover:opacity-40 transition-opacity">
                  <Zap className="w-40 h-40" />
                </div>
                <div className="bg-green-100 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border border-black relative z-10">
                  <Zap className="w-8 h-8 text-black" />
                </div>
                <h3 className="text-4xl font-bold mb-4">Instant<br />Analysis.</h3>
                <p className="text-xl font-medium text-black/70 leading-relaxed mb-8">
                  Record just 5 phrases. Our engine maps your phonemes instantly. No 3-hour training sessions required.
                </p>
                <VoiceVisualization isActive={true} className="opacity-80 mix-blend-multiply" />
              </div>
            </div>

            {/* Wide Card 2 - Aphasia */}
            <div className="md:col-span-3 bg-black text-white rounded-[2rem] p-10 border-2 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)] flex flex-col justify-center hover:scale-[1.02] transition-transform relative">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
                variant="default" // or white, relying on default which has colors
              />
              <div className="flex items-start justify-between mb-4 relative z-10">
                <h3 className="text-3xl font-bold">Aphasia Repair</h3>
                <Brain className="w-10 h-10 text-[#4ade80]" />
              </div>
              <p className="text-lg text-gray-300">
                We reconstruct fragmented speech into complete, fluent sentences using context-aware AI.
              </p>
            </div>

            {/* Square Card 3 - Privacy */}
            <div className="md:col-span-1.5 md:col-span-2 bg-[#f0fdf4] rounded-[2rem] p-8 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:rotate-1 transition-transform relative">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
              />
              <div className="relative z-10">
                <Shield className="w-10 h-10 mb-4 text-black" />
                <h3 className="text-xl font-bold mb-2">100% Private</h3>
                <p className="text-sm font-semibold text-black/60">Local-first processing.</p>
              </div>
            </div>

            {/* Square Card 4 - Context */}
            <div className="md:col-span-1.5 md:col-span-1 bg-orange-100 rounded-[2rem] p-8 border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-rotate-1 transition-transform relative">
              <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
                borderWidth={3}
              />
              <div className="relative z-10">
                <Camera className="w-10 h-10 mb-4 text-black" />
                <h3 className="text-xl font-bold mb-2">Vision</h3>
                <p className="text-sm font-semibold text-black/60">Sees what you see.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Marquee Section */}
        <section className="py-20 overflow-hidden bg-black text-[#4ade80] rotate-1 scale-105 border-y-8 border-white">
          <div className="flex whitespace-nowrap animate-marquee">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex items-center gap-12 mx-12">
                <span className="text-6xl font-black uppercase tracking-tighter">Voice Banking</span>
                <span className="text-6xl font-black uppercase tracking-tighter text-white">★</span>
                <span className="text-6xl font-black uppercase tracking-tighter">Dysarthria Support</span>
                <span className="text-6xl font-black uppercase tracking-tighter text-white">★</span>
                <span className="text-6xl font-black uppercase tracking-tighter">Real-time</span>
                <span className="text-6xl font-black uppercase tracking-tighter text-white">★</span>
              </div>
            ))}
          </div>
        </section>

        {/* Use Cases Section - "Who is Ember For?" */}
        <section className="container mx-auto px-6 py-32 bg-white text-black border-y-4 border-black">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl md:text-7xl font-black mb-20 text-center tracking-tighter">
              Who is <span className="bg-black text-white px-4 py-1 rounded-full inline-block transform -rotate-2">ember</span> for?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Use Case 1 */}
              <div className="p-8 bg-[#f0fdf4] border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:scale-[1.02] transition-transform relative">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mb-6 relative z-10">
                  <Zap className="w-6 h-6 text-[#4ade80]" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-3">ALS / MND</h3>
                  <p className="font-medium text-gray-600 leading-relaxed">
                    Preserve your voice before it's gone. Use our "Voice Banking" module to create a permanent digital twin.
                  </p>
                </div>
              </div>

              {/* Use Case 2 */}
              <div className="p-8 bg-orange-50 border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:scale-[1.02] transition-transform relative">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mb-6 relative z-10">
                  <Brain className="w-6 h-6 text-orange-400" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-3">Stroke / Aphasia</h3>
                  <p className="font-medium text-gray-600 leading-relaxed">
                    Struggling to find words? Ember anticipates your intent and helps you build fluent sentences instantly.
                  </p>
                </div>
              </div>

              {/* Use Case 3 */}
              <div className="p-8 bg-blue-50 border-2 border-black rounded-[2rem] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:scale-[1.02] transition-transform relative">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center mb-6 relative z-10">
                  <Heart className="w-6 h-6 text-blue-400 fill-current" />
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-3">Laryngectomy</h3>
                  <p className="font-medium text-gray-600 leading-relaxed">
                    Communicate expressively after surgery. Type or select icons, and speak with your unique, personal tone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section - "The Magic" */}
        <section className="container mx-auto px-6 py-32 bg-[#4ade80] text-black">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-5xl md:text-8xl font-black mb-6 text-center tracking-tighter">
              The <span className="underline decoration-8 decoration-black underline-offset-8">Magic</span>.
            </h2>
            <p className="text-center text-black/60 font-bold text-xl mb-20 max-w-2xl mx-auto">Three simple steps. No complex setup. Just your voice.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="bg-black text-white p-10 rounded-[2rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] hover:translate-y-[-4px] transition-transform relative overflow-hidden group">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-[#4ade80] rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                    <AudioWaveform className="w-10 h-10 text-black" />
                  </div>
                  <div className="text-[#4ade80] font-black text-6xl mb-4 opacity-20 absolute top-6 right-6">01</div>
                  <h3 className="text-3xl font-black mb-4">Record 5 Phrases</h3>
                  <p className="text-gray-400 font-medium text-lg leading-relaxed">
                    Just 5 examples. No training sessions. 30 seconds total.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white text-black p-10 rounded-[2rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] transition-transform relative overflow-hidden group">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-black rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                    <BrainCircuit className="w-10 h-10 text-[#4ade80]" />
                  </div>
                  <div className="text-black font-black text-6xl mb-4 opacity-10 absolute top-6 right-6">02</div>
                  <h3 className="text-3xl font-black mb-4">AI Learns</h3>
                  <p className="text-gray-600 font-medium text-lg leading-relaxed">
                    Ember analyzes your speech patterns in real-time. Instant adaptation.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-black text-white p-10 rounded-[2rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(255,255,255,0.3)] hover:translate-y-[-4px] transition-transform relative overflow-hidden group">
                <GlowingEffect
                  spread={40}
                  glow={true}
                  disabled={false}
                  proximity={64}
                  inactiveZone={0.01}
                  borderWidth={3}
                />
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-[#4ade80] rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                    <Volume2 className="w-10 h-10 text-black" />
                  </div>
                  <div className="text-[#4ade80] font-black text-6xl mb-4 opacity-20 absolute top-6 right-6">03</div>
                  <h3 className="text-3xl font-black mb-4">Speak Naturally</h3>
                  <p className="text-gray-400 font-medium text-lg leading-relaxed">
                    Your voice, understood clearly—even when slurred.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Vault Teaser */}
        <section className="bg-black text-white py-32 border-y-8 border-white overflow-hidden relative">
          <div className="container mx-auto px-6 relative z-10">
            <div className="flex flex-col md:flex-row items-center gap-16">
              <div className="md:w-1/2">
                <div className="inline-block bg-[#4ade80] text-black font-bold px-4 py-1 rounded-full mb-6">Local-First Architecture</div>
                <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter">Your Voice.<br />Your Vault.</h2>
                <p className="text-xl text-gray-400 font-medium leading-relaxed mb-10">
                  Unlike other assistants, Ember processes audio directly on your device.
                  Your unique voice fingerprint is encrypted and never shared with the cloud without your explicit key.
                </p>
                <Link to="/technology">
                  <Button className="h-14 px-8 bg-white text-black hover:bg-[#4ade80] hover:text-black font-bold rounded-full text-lg transition-colors relative overflow-hidden">
                    <GlowingEffect spread={20} glow={true} disabled={false} proximity={64} inactiveZone={0.01} />
                    <span className="relative z-10">See How It Works</span>
                  </Button>
                </Link>
              </div>
              <div className="md:w-1/2 flex justify-center">
                {/* Abstract Geometric Bird/Vault Drawing */}
                <svg viewBox="0 0 400 350" fill="none" stroke="white" strokeWidth="2" className="w-full max-w-md h-auto">
                  {/* Main origami bird/envelope shape */}
                  <path d="M200 20 L350 150 L280 150 L350 280 L200 200 L50 280 L120 150 L50 150 Z" />
                  {/* Inner fold lines */}
                  <path d="M200 20 L200 200" />
                  <path d="M200 200 L280 150" />
                  <path d="M200 200 L120 150" />
                  {/* Additional geometric accents */}
                  <path d="M120 150 L200 100 L280 150" />
                  <path d="M50 280 L200 320 L350 280" strokeWidth="1.5" />
                  {/* Small decorative triangle */}
                  <path d="M200 100 L230 130 L170 130 Z" strokeWidth="1" />
                </svg>
              </div>
            </div>
          </div>
          {/* Background Grid Pattern */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        </section>

        {/* Why ember? Comparison */}
        <section className="container mx-auto px-6 py-32 bg-[#4ade80] text-black">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black mb-4 text-center tracking-tighter">Why ember?</h2>
            <p className="text-center text-black/70 mb-12 text-lg font-medium">Traditional AAC devices were designed in another era. We built for today.</p>
            <div className="bg-white rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-black">
                    <th className="text-left p-5 font-bold text-base">Feature</th>
                    <th className="text-center p-5 font-bold text-base bg-gray-100">Traditional AAC</th>
                    <th className="text-center p-8 font-black text-2xl bg-black text-[#4ade80]">ember</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="p-5 font-medium">Voice Quality</td>
                    <td className="p-5 text-center text-gray-500">Robotic, generic</td>
                    <td className="p-5 text-center font-bold bg-[#4ade80]/10">Your cloned voice</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-5 font-medium">Response Time</td>
                    <td className="p-5 text-center text-gray-500">2-5 seconds</td>
                    <td className="p-5 text-center font-bold bg-[#4ade80]/10">Sub-second</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-5 font-medium">Aphasia Support</td>
                    <td className="p-5 text-center text-gray-500">None</td>
                    <td className="p-5 text-center font-bold bg-[#4ade80]/10">Fragment reconstruction</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-5 font-medium">Cost</td>
                    <td className="p-5 text-center text-gray-500">$5,000 - $15,000</td>
                    <td className="p-5 text-center font-bold bg-[#4ade80]/10">Free (beta)</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-5 font-medium">Context Awareness</td>
                    <td className="p-5 text-center text-gray-500">None</td>
                    <td className="p-5 text-center font-bold bg-[#4ade80]/10">Vision + Speech</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="p-5 font-medium">Smart Home</td>
                    <td className="p-5 text-center text-gray-500">Not supported</td>
                    <td className="p-5 text-center font-bold bg-[#4ade80]/10">SmartThings</td>
                  </tr>
                  <tr>
                    <td className="p-5 font-medium">Emergency Alerts</td>
                    <td className="p-5 text-center text-gray-500">Manual only</td>
                    <td className="p-5 text-center font-bold bg-[#4ade80]/10">AI-triggered</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Testimonial Section */}
        <section className="bg-white text-black py-32 border-t-8 border-black">
          <div className="container mx-auto px-6 text-center">
            <div className="max-w-5xl mx-auto relative">
              <Quote className="w-24 h-24 text-[#4ade80] absolute -top-12 -left-4 md:-left-12 opacity-50 transform -rotate-12" />
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight mb-12 relative z-10">
                "After my stroke, I couldn't speak clearly to my grandchildren. With ember, I can finally tell them 'I love you' again. This was typed using the app."
              </h2>
              <div className="inline-flex items-center gap-3 bg-black text-white px-6 py-3 rounded-full border-2 border-transparent shadow-[4px_4px_0px_0px_rgba(74,222,128,1)] hover:scale-105 transition-transform">
                <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
                <p className="font-bold text-sm md:text-base tracking-wide uppercase">
                  Based on feedback from nursing home residents
                </p>
              </div>
            </div>
          </div>
        </section>




      </main>

      {/* Footer - Minimal & Bold */}
      <footer className="bg-black text-[#4ade80] py-20 px-6 border-t border-[#4ade80]/20">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-center md:text-left">
            <h2 className="text-4xl font-black tracking-tight text-white mb-2">ember.</h2>
            <p className="text-gray-400 font-medium">Restoring the human connection.</p>
          </div>
          <div className="flex items-center gap-8 text-lg font-bold">
            <Link to="/privacy" className="hover:text-white hover:underline decoration-2 underline-offset-4">Privacy</Link>
            <Link to="/terms" className="hover:text-white hover:underline decoration-2 underline-offset-4">Terms</Link>
            <a href="https://www.linkedin.com/in/manoj07ar/" target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline decoration-2 underline-offset-4">Contact</a>
            <a href="https://www.linkedin.com/in/manoj07ar/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <Linkedin className="w-6 h-6" />
            </a>
          </div>
        </div>
      </footer>

      {/* custom marquee animation style injection */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>

      {/* ElevenLabs Conversational AI Widget */}
      <div className="fixed bottom-4 right-4 z-50">
        {/* @ts-ignore */}
        <elevenlabs-convai agent-id="agent_1501kdrjksqdftrv1em1pmhx7akk"></elevenlabs-convai>
      </div>
    </div>
  );
}
