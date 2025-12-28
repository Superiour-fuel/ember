import { useRef } from "react";
import { Link } from "react-router-dom";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Button } from "@/components/ui/button";
import { EmberLogo } from "@/components/EmberLogo";
import {
    Cpu,
    Globe,
    Wifi,
    CheckCircle2
} from "lucide-react";

export default function Technology() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#4ade80] selection:text-black font-sans scroll-smooth">
            {/* Decorative noise/texture overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.05] mix-blend-overlay z-50"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>

            {/* Navigation */}
            <header className="relative z-40 border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0">
                <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="hover:opacity-80 transition-opacity">
                        <div className="text-white">
                            <EmberLogo size="md" />
                        </div>
                    </Link>
                    <div className="flex items-center gap-6 hidden md:flex">
                        <Link to="/mission" className="font-bold text-sm text-gray-400 hover:text-[#4ade80] transition-colors uppercase tracking-widest">Mission</Link>
                        <Link to="/technology" className="font-bold text-sm text-[#4ade80] transition-colors uppercase tracking-widest">Technology</Link>
                    </div>
                    <div>
                        <Link to="/auth">
                            <Button className="bg-[#4ade80] text-black hover:bg-[#4ade80]/90 font-bold rounded-full px-6 relative overflow-hidden">
                                <GlowingEffect spread={20} glow={true} disabled={false} proximity={64} inactiveZone={0.01} />
                                <span className="relative z-10">Try ember</span>
                            </Button>
                        </Link>
                    </div>
                </nav>
            </header>

            <main className="relative z-10">
                {/* Hero Section */}
                <section className="container mx-auto px-6 py-24 md:py-32 text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8 animate-fade-up">
                        <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></div>
                        <span className="text-xs font-bold tracking-widest uppercase text-gray-300">Engineering & Performance</span>
                    </div>

                    <h1 className="text-5xl md:text-8xl font-black mb-10 tracking-tighter animate-fade-up delay-100 leading-tight">
                        Local First.<br />
                        <span className="text-[#4ade80]">Cloud Intelligent.</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-400 font-medium leading-relaxed max-w-3xl mx-auto mb-12 animate-fade-up delay-200">
                        We re-engineered the voice stack to run entirely in your browser.
                        <br className="hidden md:block" />
                        Zero latency loops with optional cloud intelligence for complex reasoning.
                    </p>
                </section>

                {/* Architecture Bento Grid */}
                <section className="container mx-auto px-6 pb-32">
                    <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 max-w-7xl mx-auto">

                        {/* Card 1: Edge Compute (Large) */}
                        <div className="md:col-span-2 md:row-span-2 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-[2rem] relative group hover:border-[#4ade80]/50 transition-all duration-500">
                            <GlowingEffect
                                spread={40}
                                glow={true}
                                disabled={false}
                                proximity={64}
                                inactiveZone={0.01}
                                borderWidth={3}
                            />
                            <div className="relative w-full h-full overflow-hidden rounded-[inherit] p-10">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Cpu className="w-64 h-64" />
                                </div>
                                <div className="w-16 h-16 bg-[#4ade80] rounded-2xl flex items-center justify-center mb-8 text-black shadow-[0_0_30px_rgba(74,222,128,0.3)]">
                                    {/* Custom Lightning Bolt */}
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" />
                                    </svg>
                                </div>
                                <h3 className="text-4xl font-bold mb-6">WASM Edge Engine</h3>
                                <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-lg">
                                    By compiling our core signal processing models to WebAssembly, we achieve near-native performance directly in the browser.
                                    Audio is processed frame-by-frame creates a specialized localized feedback loop that feels instantaneous.
                                </p>
                                <div className="flex gap-4">
                                    <div className="px-4 py-2 bg-black/30 rounded-lg border border-white/10 text-sm font-mono text-[#4ade80]">
                                        ONNX Runtime
                                    </div>
                                    <div className="px-4 py-2 bg-black/30 rounded-lg border border-white/10 text-sm font-mono text-[#4ade80]">
                                        WebGL Acceleration
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Privacy */}
                        <div className="bg-[#4ade80] text-black rounded-[2rem] relative group hover:scale-[1.02] transition-transform duration-300">
                            <GlowingEffect
                                spread={40}
                                glow={true}
                                disabled={false}
                                proximity={64}
                                inactiveZone={0.01}
                                borderWidth={3}
                            />
                            <div className="relative w-full h-full overflow-hidden rounded-[inherit] p-8">
                                <div className="absolute top-4 right-4 opacity-20">
                                    {/* Custom Lock BG */}
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-24 h-24" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 2C9.243 2 7 4.243 7 7V10H6C4.897 10 4 10.897 4 12V20C4 21.103 4.897 22 6 22H18C19.103 22 20 21.103 20 20V12C20 10.897 19.103 10 18 10H17V7C17 4.243 14.757 2 12 2ZM12 4C13.654 4 15 5.346 15 7V10H9V7C9 5.346 10.346 4 12 4ZM6 12H18V20H6V12Z" />
                                    </svg>
                                </div>
                                {/* Custom Shield Icon */}
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 mb-6">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    <path d="m9 12 2 2 4-4" />
                                </svg>
                                <h3 className="text-2xl font-bold mb-2">Privacy Vault</h3>
                                <p className="font-medium text-black/80 leading-snug mb-4">
                                    Voice samples encrypted with AES-256 before localStorage. Device fingerprinting for key derivation.
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    <span className="px-2 py-1 bg-black/10 rounded text-xs font-bold">crypto-js</span>
                                    <span className="px-2 py-1 bg-black/10 rounded text-xs font-bold">SHA-256</span>
                                </div>
                            </div>
                        </div>

                        {/* Card 3: Hybrid Cloud */}
                        <div className="bg-black border border-white/10 rounded-[2rem] relative group hover:border-white/30 transition-all">
                            <GlowingEffect
                                spread={40}
                                glow={true}
                                disabled={false}
                                proximity={64}
                                inactiveZone={0.01}
                                borderWidth={3}
                            />
                            <div className="relative w-full h-full overflow-hidden rounded-[inherit] p-8">
                                <div className="absolute top-4 right-4 opacity-10">
                                    <Globe className="w-24 h-24 text-blue-500" />
                                </div>
                                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mb-6 text-white">
                                    {/* Custom Server Icon */}
                                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V6H20V18ZM6 10H8V14H6V10ZM10 10H18V12H10V10ZM10 14H18V16H10V14Z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Cloud Relay</h3>
                                <p className="text-gray-400 text-sm leading-snug">
                                    Heavy lifting for semantic understanding is offloaded to Gemini 2.0 Flash via edge functions only when needed.
                                </p>
                            </div>
                        </div>

                    </div>
                </section>

                {/* Technical Specifications */}
                <section className="container mx-auto px-6 py-20 border-t border-white/10">
                    <div className="max-w-5xl mx-auto">
                        <h2 className="text-3xl font-black mb-12 text-center uppercase tracking-widest text-gray-500">System Specifications</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border border-white/10 rounded-2xl overflow-hidden">
                            {/* Spec Item */}
                            <div className="bg-black p-8 flex flex-col gap-2 hover:bg-white/5 transition-colors">
                                <span className="text-gray-500 font-mono text-sm uppercase">Audio Latency</span>
                                <span className="text-3xl font-bold text-white">&lt; 200ms</span>
                                <p className="text-xs text-gray-600">Glass-to-glass average on Chrome/Edge</p>
                            </div>

                            {/* Spec Item */}
                            <div className="bg-black p-8 flex flex-col gap-2 hover:bg-white/5 transition-colors">
                                <span className="text-gray-500 font-mono text-sm uppercase">Sample Rate</span>
                                <span className="text-3xl font-bold text-white">48 kHz</span>
                                <p className="text-xs text-gray-600">High-fidelity voice synthesis</p>
                            </div>

                            {/* Spec Item */}
                            <div className="bg-black p-8 flex flex-col gap-2 hover:bg-white/5 transition-colors">
                                <span className="text-gray-500 font-mono text-sm uppercase">Encryption</span>
                                <span className="text-3xl font-bold text-white">AES-256</span>
                                <p className="text-xs text-gray-600">Client-side wrapping key architecture</p>
                            </div>

                            {/* Spec Item */}
                            <div className="bg-black p-8 flex flex-col gap-2 hover:bg-white/5 transition-colors">
                                <span className="text-gray-500 font-mono text-sm uppercase">Model Size</span>
                                <span className="text-3xl font-bold text-white">~35 MB</span>
                                <p className="text-xs text-gray-600">Quantized WASM binary size</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Security Architecture */}
                <section className="container mx-auto px-6 py-24 border-t border-white/10">
                    <div className="max-w-6xl mx-auto">
                        {/* Section Header */}
                        <div className="text-center mb-16">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#4ade80]/10 border border-[#4ade80]/30 mb-6">
                                <div className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse"></div>
                                <span className="text-xs font-bold tracking-widest uppercase text-[#4ade80]">Military-Grade Security</span>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tight">
                                Your Voice. <span className="text-[#4ade80]">Your Control.</span>
                            </h2>
                            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                                We built ember with a privacy-first architecture. Your biometric data never leaves your device unprotected.
                            </p>
                        </div>

                        {/* Bento Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* AES-256 Card - Primary */}
                            <div className="md:col-span-2 bg-[#4ade80] text-black rounded-[2rem] relative group hover:scale-[1.01] transition-transform duration-300 overflow-hidden">
                                <GlowingEffect
                                    spread={40}
                                    glow={true}
                                    disabled={false}
                                    proximity={64}
                                    inactiveZone={0.01}
                                    borderWidth={3}
                                />
                                <div className="relative w-full h-full p-8 md:p-10">
                                    {/* Background Icon */}
                                    <div className="absolute top-4 right-4 opacity-10">
                                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-32 h-32">
                                            <path d="M12 2C9.243 2 7 4.243 7 7V10H6C4.897 10 4 10.897 4 12V20C4 21.103 4.897 22 6 22H18C19.103 22 20 21.103 20 20V12C20 10.897 19.103 10 18 10H17V7C17 4.243 14.757 2 12 2ZM12 4C13.654 4 15 5.346 15 7V10H9V7C9 5.346 10.346 4 12 4ZM6 12H18V20H6V12Z" />
                                        </svg>
                                    </div>

                                    <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mb-6 text-[#4ade80] shadow-xl">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-7 h-7">
                                            <rect x="3" y="11" width="18" height="11" rx="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-3xl font-black mb-3">AES-256 Encryption</h3>
                                    <p className="font-medium text-black/70 leading-relaxed mb-6 max-w-md">
                                        Every voice sample is encrypted using AES-256-CBC before touching localStorage. The same encryption trusted by banks, governments, and defense contractors.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1.5 bg-black/10 rounded-full text-xs font-bold">crypto-js</span>
                                        <span className="px-3 py-1.5 bg-black/10 rounded-full text-xs font-bold">CBC Mode</span>
                                        <span className="px-3 py-1.5 bg-black/10 rounded-full text-xs font-bold">256-bit Key</span>
                                    </div>
                                </div>
                            </div>

                            {/* Device Fingerprinting Card */}
                            <div className="bg-black border-2 border-white/10 rounded-[2rem] relative group hover:border-white/30 transition-all overflow-hidden">
                                <GlowingEffect
                                    spread={40}
                                    glow={true}
                                    disabled={false}
                                    proximity={64}
                                    inactiveZone={0.01}
                                    borderWidth={3}
                                />
                                <div className="relative w-full h-full p-8">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 text-black">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
                                            <circle cx="12" cy="12" r="3" />
                                            <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                                            <path d="M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
                                        </svg>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3">Device Binding</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Encryption keys are derived from your unique device fingerprint using SHA-256. Your voice data is cryptographically bound to your device alone.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Second Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Zero Server Storage */}
                            <div className="bg-black border-2 border-white/10 rounded-[2rem] relative group hover:border-white/30 transition-all overflow-hidden">
                                <GlowingEffect
                                    spread={40}
                                    glow={true}
                                    disabled={false}
                                    proximity={64}
                                    inactiveZone={0.01}
                                    borderWidth={3}
                                />
                                <div className="relative w-full h-full p-8">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 text-black">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                            <path d="m9 12 2 2 4-4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3">Zero Upload</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Voice biometrics never leave your browser. AI processing happens on-device or via secure edge functions — raw audio stays local.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </main>

            <footer className="py-12 border-t border-white/10 bg-black">
                <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-gray-600 text-sm">Ember Engineering Team &copy; 2025</p>
                    <div className="flex gap-6 text-sm font-bold text-gray-500">
                        <Link to="/privacy" className="hover:text-[#4ade80] transition-colors">Privacy</Link>
                        <Link to="/terms" className="hover:text-[#4ade80] transition-colors">Terms</Link>
                        <a href="mailto:contact@ember-voice.com" className="hover:text-[#4ade80] transition-colors">Contact</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
