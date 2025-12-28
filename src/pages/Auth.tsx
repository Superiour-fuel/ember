import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmberLogo } from "@/components/EmberLogo";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Mail, Lock, User } from "lucide-react";
import { z } from "zod";


const emailSchema = z.string().email("Please enter a valid email address");
const passwordSchema = z.string().min(6, "Password must be at least 6 characters");

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const { user, isLoading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user && !isLoading) {
      navigate("/app");
    }
  }, [user, isLoading, navigate]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }

    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Login failed",
              description: "Invalid email or password. Please try again.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Login failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You've successfully signed in.",
          });
          navigate("/app");
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast({
              title: "Account exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign up failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Account created!",
            description: "Welcome to Ember. Let's set up your profile.",
          });
          navigate("/setup");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDD0] flex flex-col text-black selection:bg-black selection:text-[#FFFDD0]">
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

      {/* Header */}
      <header className="relative z-10 border-b border-black/10 shrink-0">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/" className="text-black/60 hover:text-black transition-colors flex items-center gap-2 font-bold group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Back</span>
          </Link>
          <div className="ml-auto">
            <EmberLogo size="sm" />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-up">
          <div className="relative rounded-2xl p-8 border-2 border-black bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <div className="relative z-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-black text-white mb-4 shadow-md">
                  {isLogin ? <Lock className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <h1 className="text-3xl font-black mb-2 tracking-tight">
                  {isLogin ? "Welcome Back" : "Create Account"}
                </h1>
                <p className="text-black/60 font-medium">
                  {isLogin
                    ? "Sign in to access your vault."
                    : "Join Ember and start preserving your voice."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="font-bold text-black flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Display Name
                    </Label>
                    <Input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Jane Doe"
                      className="bg-white border-2 border-black text-black placeholder:text-gray-400 focus-visible:ring-0 focus-visible:border-black h-12 rounded-lg"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="font-bold text-black flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors({ ...errors, email: undefined });
                    }}
                    placeholder="you@example.com"
                    className={`bg-white border-2 border-black text-black placeholder:text-gray-400 focus-visible:ring-0 focus-visible:border-black h-12 rounded-lg ${errors.email ? "border-red-500 bg-red-50" : ""}`}
                    required
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 font-bold mt-1">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="font-bold text-black flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    placeholder="••••••••"
                    className={`bg-white border-2 border-black text-black placeholder:text-gray-400 focus-visible:ring-0 focus-visible:border-black h-12 rounded-lg ${errors.password ? "border-red-500 bg-red-50" : ""}`}
                    required
                  />
                  {errors.password && (
                    <p className="text-xs text-red-600 font-bold mt-1">{errors.password}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-black text-white hover:bg-black/90 hover:scale-[1.01] font-bold rounded-lg transition-all shadow-lg mt-6 text-base"
                  disabled={isSubmitting}
                >
                  <span className="flex items-center justify-center">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {isLogin ? "Signing in..." : "Creating account..."}
                      </>
                    ) : (
                      isLogin ? "Sign In" : "Create Account"
                    )}
                  </span>
                </Button>
              </form>

              <div className="mt-8 text-center pt-6 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                  }}
                  className="text-sm font-medium text-black/60 hover:text-black transition-colors"
                >
                  {isLogin ? (
                    <>Don't have an account? <span className="text-black font-black underline decoration-2 underline-offset-2 ml-1">Sign Up</span></>
                  ) : (
                    <>Already have an account? <span className="text-black font-black underline decoration-2 underline-offset-2 ml-1">Sign In</span></>
                  )}
                </button>
              </div>

            </div>
          </div>

          <p className="text-center text-xs font-bold text-black/40 mt-8">
            By continuing, you agree to ember's Terms of Service.
          </p>
        </div>
      </main>
    </div>
  );
}
