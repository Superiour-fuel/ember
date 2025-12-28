import { Link } from "react-router-dom";
import { EmberLogo } from "@/components/EmberLogo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#4ade80] selection:text-black font-sans">
            {/* Header */}
            <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
                <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="hover:opacity-80 transition-opacity">
                        <div className="text-white">
                            <EmberLogo size="md" />
                        </div>
                    </Link>
                    <Link to="/">
                        <Button variant="ghost" className="text-gray-400 hover:text-white">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                </nav>
            </header>

            <main className="container mx-auto px-6 py-20 max-w-4xl">
                <h1 className="text-4xl md:text-6xl font-black mb-12 text-[#4ade80] tracking-tight">Privacy Policy</h1>

                <div className="space-y-12 text-gray-300 leading-relaxed text-lg">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                        <p>
                            At Ember, we prioritize your privacy above all else. Our architecture is designed to be "Local-First," meaning your voice data is processed primarily on your device. We believe your voice is your identity, and it belongs solely to you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Data Collection & Usage</h2>
                        <p className="mb-4">
                            We collect minimal data necessary to provide our services:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-400">
                            <li><strong>Voice Data:</strong> Audio samples used for calibration are processed locally. If you opt-in to cloud features, data is encrypted before transmission.</li>
                            <li><strong>Usage Metrics:</strong> Anonymous performance data to improve model latency and accuracy.</li>
                            <li><strong>Account Info:</strong> Basic profile information for account management.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. Local-First Processing</h2>
                        <p>
                            Ember's core text-to-speech and speech-to-text engines run via WebAssembly on your browser. This means your raw audio does not leave your device for standard interactions, ensuring zero-latency privacy.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Third-Party Services</h2>
                        <p>
                            We partner with trusted providers like ElevenLabs for high-fidelity synthesis and Google Gemini for advanced semantic analysis. Data shared with these partners is ephemeral and strictly for processing your immediate requests.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at privacy@ember-voice.com.
                        </p>
                    </section>
                </div>
            </main>

            <footer className="py-12 text-center text-gray-600 text-sm border-t border-white/10 bg-black mt-20">
                <p>Ember Engineering Team &copy; {new Date().getFullYear()}</p>
            </footer>
        </div>
    );
}
