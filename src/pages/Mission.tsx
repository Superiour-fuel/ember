import { Link } from "react-router-dom";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Button } from "@/components/ui/button";
import { EmberLogo } from "@/components/EmberLogo";
import {
    Heart,
    Users,
    MessageCircle
} from "lucide-react";

export default function Mission() {
    return (
        <div className="min-h-screen bg-[#f0fdf4] text-black overflow-hidden selection:bg-black selection:text-[#4ade80]">
            {/* Navigation */}
            <header className="relative z-50">
                <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
                    <Link to="/">
                        <div className="text-black">
                            <EmberLogo size="md" />
                        </div>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link to="/mission" className="font-bold text-black border-b-2 border-black">Mission</Link>
                        <Link to="/technology" className="font-bold text-gray-500 hover:text-black transition-colors">Technology</Link>
                        <Link to="/auth">
                            <Button className="bg-black text-white hover:bg-gray-800 font-bold rounded-full relative overflow-hidden">
                                <GlowingEffect spread={20} glow={true} disabled={false} proximity={64} inactiveZone={0.01} />
                                <span className="relative z-10">Join Us</span>
                            </Button>
                        </Link>
                    </div>
                </nav>
            </header>

            <main className="container mx-auto px-6 py-20">
                <div className="max-w-4xl mx-auto text-center mb-32">
                    <h1 className="text-6xl md:text-9xl font-black mb-12 tracking-tighter leading-none">
                        Voice is a<br />
                        <span className="text-[#4ade80] inline-block -rotate-2">Human Right.</span>
                    </h1>
                    <p className="text-2xl md:text-3xl font-medium leading-relaxed max-w-3xl mx-auto">
                        We believe that losing your ability to speak shouldn't mean losing your
                        ability to connect.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-32">
                    <div className="bg-black text-white rounded-[2.5rem] relative group border border-white/10">
                        <GlowingEffect
                            spread={40}
                            glow={true}
                            disabled={false}
                            proximity={64}
                            inactiveZone={0.01}
                            borderWidth={3}
                        />
                        <div className="relative w-full h-full overflow-hidden rounded-[inherit] p-12 min-h-[500px] flex flex-col justify-end">
                            <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-green-500 via-transparent to-transparent"></div>
                            <Users className="w-16 h-16 mb-6 text-[#4ade80] relative z-10" />
                            <h3 className="text-4xl font-bold mb-6 relative z-10">The 50 Million</h3>
                            <p className="text-xl text-gray-300 leading-relaxed relative z-10">
                                Over 50 million people globally suffer from speech impairments due to ALS, Stroke,
                                Parkinson's, and other conditions. Current tools treat them like patients.
                                We treat them like people.
                            </p>
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div className="bg-white p-10 rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                            <GlowingEffect
                                spread={40}
                                glow={true}
                                disabled={false}
                                proximity={64}
                                inactiveZone={0.01}
                                borderWidth={3}
                            />
                            <div className="relative z-10">
                                <Heart className="w-10 h-10 text-red-500 mb-4 fill-current" />
                                <h4 className="text-2xl font-bold mb-2">Empathy First</h4>
                                <p className="font-medium text-gray-600">We design alongside the community, not just for them.</p>
                            </div>
                        </div>
                        <div className="bg-[#4ade80] p-10 rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
                            <GlowingEffect
                                spread={40}
                                glow={true}
                                disabled={false}
                                proximity={64}
                                inactiveZone={0.01}
                                borderWidth={3}
                            />
                            <div className="relative z-10">
                                <MessageCircle className="w-10 h-10 text-black mb-4" />
                                <h4 className="text-2xl font-bold mb-2">Expression, Not Just Speech</h4>
                                <p className="font-medium text-black">It's not enough to be understood. You deserve to be heard with emotion/nuance.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Our Principles */}
                <div className="mb-32">
                    <h2 className="text-4xl md:text-5xl font-black text-center mb-12 tracking-tight">Our Principles</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-4 text-[#4ade80]">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Privacy First</h3>
                            <p className="text-gray-600">Your voice stays yours. AES-256 encryption, local processing, zero server storage of biometrics.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-4 text-[#4ade80]">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 6v6l4 2" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Speed Matters</h3>
                            <p className="text-gray-600">Sub-200ms latency. Because when you need to say "help," every millisecond counts.</p>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-4 text-[#4ade80]">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-2">Dignity Always</h3>
                            <p className="text-gray-600">No robotic voices. Your cloned voice preserves your identity, emotion, and humanity.</p>
                        </div>
                    </div>
                </div>

                {/* Comparison Table */}
                <div className="mb-32">
                    <h2 className="text-4xl md:text-5xl font-black text-center mb-4 tracking-tight">Why ember?</h2>
                    <p className="text-center text-gray-600 mb-12 text-lg">Traditional AAC devices were designed in another era. We built for today.</p>
                    <div className="bg-white rounded-3xl border-2 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-black">
                                    <th className="text-left p-6 font-bold text-lg">Feature</th>
                                    <th className="text-center p-6 font-bold text-lg bg-gray-100">Traditional AAC</th>
                                    <th className="text-center p-6 font-bold text-lg bg-[#4ade80]">ember</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-gray-200">
                                    <td className="p-6 font-medium">Voice Quality</td>
                                    <td className="p-6 text-center text-gray-500">Robotic, generic</td>
                                    <td className="p-6 text-center font-bold bg-[#4ade80]/10">Your cloned voice</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="p-6 font-medium">Response Time</td>
                                    <td className="p-6 text-center text-gray-500">2-5 seconds</td>
                                    <td className="p-6 text-center font-bold bg-[#4ade80]/10">Sub-second</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="p-6 font-medium">Aphasia Support</td>
                                    <td className="p-6 text-center text-gray-500">None</td>
                                    <td className="p-6 text-center font-bold bg-[#4ade80]/10">Fragment reconstruction</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="p-6 font-medium">Cost</td>
                                    <td className="p-6 text-center text-gray-500">$5,000 - $15,000</td>
                                    <td className="p-6 text-center font-bold bg-[#4ade80]/10">Free (beta)</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="p-6 font-medium">Context Awareness</td>
                                    <td className="p-6 text-center text-gray-500">None</td>
                                    <td className="p-6 text-center font-bold bg-[#4ade80]/10">Vision + Speech (multimodal)</td>
                                </tr>
                                <tr className="border-b border-gray-200">
                                    <td className="p-6 font-medium">Smart Home</td>
                                    <td className="p-6 text-center text-gray-500">Not supported</td>
                                    <td className="p-6 text-center font-bold bg-[#4ade80]/10">SmartThings integrated</td>
                                </tr>
                                <tr>
                                    <td className="p-6 font-medium">Emergency Alerts</td>
                                    <td className="p-6 text-center text-gray-500">Manual only</td>
                                    <td className="p-6 text-center font-bold bg-[#4ade80]/10">AI-triggered calls</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="text-center max-w-2xl mx-auto py-20">
                    <h2 className="text-4xl font-bold mb-8">Ready to find your voice?</h2>
                    <Link to="/app">
                        <Button className="h-20 px-12 text-2xl rounded-full bg-black text-white hover:scale-105 transition-transform relative overflow-hidden">
                            <GlowingEffect spread={20} glow={true} disabled={false} proximity={64} inactiveZone={0.01} />
                            <span className="relative z-10">Start Using ember</span>
                        </Button>
                    </Link>
                </div>
            </main>
        </div>
    );
}
