import { Link } from "react-router-dom";
import { EmberLogo } from "@/components/EmberLogo";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
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
                <h1 className="text-4xl md:text-6xl font-black mb-12 text-[#4ade80] tracking-tight">Terms of Service</h1>

                <div className="space-y-12 text-gray-300 leading-relaxed text-lg">
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using Ember ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">2. Use License</h2>
                        <p className="mb-4">
                            Permission is granted to temporarily download one copy of the materials (information or software) on Ember's website for personal, non-commercial transitory viewing only.
                        </p>
                        <p>
                            This is the grant of a license, not a transfer of title, and under this license you may not:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 text-gray-400 mt-2">
                            <li>Modify or copy the materials;</li>
                            <li>Use the materials for any commercial purpose, or for any public display;</li>
                            <li>Attempt to decompile or reverse engineer any software contained on Ember's website;</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">3. Disclaimer</h2>
                        <p>
                            The materials on Ember's website are provided "as is". Ember makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties, including without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">4. Limitations</h2>
                        <p>
                            In no event shall Ember or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Ember's Internet site.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">5. Governing Law</h2>
                        <p>
                            Any claim relating to Ember's website shall be governed by the laws of the State of California without regard to its conflict of law provisions.
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
