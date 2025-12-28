import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      <div className="text-center relative z-10 p-8 rounded-3xl border-2 border-black bg-black/50 shadow-[0_0_50px_-12px_rgba(74,222,128,0.2)]">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        <div className="relative z-10">
          <h1 className="mb-4 text-8xl font-black text-[#4ade80]">404</h1>
          <p className="mb-8 text-2xl text-gray-400 font-medium">Page not found</p>
          <Link to="/">
            <Button className="h-14 px-8 bg-white text-black hover:bg-[#4ade80] hover:text-black font-bold rounded-full text-lg transition-colors relative overflow-hidden">
              <GlowingEffect spread={20} glow={true} disabled={false} proximity={64} inactiveZone={0.01} />
              <span className="relative z-10">Return Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
