import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import {
  MessageSquare,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
  Globe,
  Mail,
  Lock,
  User,
  Phone
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { register } from "../api/auth";

const InputField = ({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  isPassword = false
}: any) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="space-y-1.5 relative group">
      <label
        htmlFor={id}
        className={`text-sm font-medium transition-colors duration-200 ${isFocused ? "text-blue-400" : "text-slate-300"
          }`}
      >
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-400 transition-colors">
          {Icon && <Icon size={18} />}
        </div>
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 font-medium text-slate-100 placeholder:text-slate-500"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

const FeatureItem = ({ icon: Icon, title, desc }: any) => (
  <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-all duration-300">
    <div className="p-2.5 bg-blue-500/20 rounded-lg text-blue-300">
      <Icon size={24} />
    </div>
    <div>
      <h3 className="text-white font-semibold text-base">{title}</h3>
      <p className="text-blue-100/60 text-sm leading-relaxed">{desc}</p>
    </div>
  </div>
);

type LoginStep = "login" | "signup";

export default function LoginPage() {
  const { login: authLogin, user, isLoading: authLoading } = useAuth();
  const [step, setStep] = useState<LoginStep>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();

  const [isAnimating, setIsAnimating] = useState(false);

  // Removed useEffect for redirection to avoid race conditions

  const switchStep = (newStep: LoginStep) => {
    setIsAnimating(true);
    setErrors({});
    setTimeout(() => {
      setStep(newStep);
      setIsAnimating(false);
    }, 300);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);
    console.log("Attempting login with:", { email });
    try {
      const loggedInUser = await authLogin(email, password);
      if (loggedInUser.role === 'admin') {
        setLocation("/admin");
      } else {
        setLocation("/");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.detail || "Invalid credentials. Please try again.";
      setErrors({ api: typeof errorMessage === 'string' ? errorMessage : JSON.stringify(errorMessage) });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);
    console.log("Attempting signup with:", { email, username, phoneNumber });
    try {
      await register({ email, username, password, phone_number: phoneNumber });
      const loggedInUser = await authLogin(email, password);
      if (loggedInUser.role === 'admin') {
        setLocation("/admin");
      } else {
        setLocation("/");
      }
    } catch (error: any) {
      console.error("Signup error:", error);
      let errorMessage = "Registration failed. Please try again.";

      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          // Pydantic validation error format
          errorMessage = detail.map((err: any) => `${err.loc?.join(' > ') || 'Field'}: ${err.msg}`).join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      }

      setErrors({ api: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen w-full flex justify-center bg-slate-950 font-sans overflow-hidden relative">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] rounded-full bg-blue-600/20 blur-[120px] animate-pulse-slow"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse-slow delay-1000"></div>
        <div className="absolute top-[40%] left-[40%] w-[40%] h-[40%] rounded-full bg-cyan-500/10 blur-[100px] animate-pulse-slow delay-2000"></div>
      </div>
      <div className="flex w-full h-full max-w-7xl z-10 relative">
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 xl:p-16">
          <div className="relative">
            <div className="flex items-center gap-3 mb-10">
              <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg shadow-blue-500/20 border border-blue-400/20">
                <MessageSquare className="text-white w-6 h-6" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight drop-shadow-sm">Echo</span>
            </div>
            <div className="space-y-6 max-w-lg">
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight drop-shadow-lg">
                Connect effortlessly. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                  Communicate freely.
                </span>
              </h1>
              <p className="text-lg text-blue-100/70 leading-relaxed">
                Experience the next generation of messaging. Clean, fast, and utility-focused design for seamless conversations.
              </p>
            </div>
          </div>
          <div className="space-y-4 max-w-md mt-8">
            <FeatureItem icon={Zap} title="Real-time Sync" desc="Instant message delivery with state-of-the-art WebSocket technology." />
            <FeatureItem icon={ShieldCheck} title="Secure & Private" desc="Your conversations are yours. Enhanced privacy defaults." />
          </div>
          <div className="mt-auto pt-8">
            <div className="flex items-center gap-4 text-sm text-blue-200/40">
              <span>© 2024 Echo Inc.</span>
              <span className="w-1 h-1 rounded-full bg-blue-200/30"></span>
              <a href="#" className="hover:text-blue-200 transition-colors">Privacy</a>
              <span className="w-1 h-1 rounded-full bg-blue-200/30"></span>
              <a href="#" className="hover:text-blue-200 transition-colors">Terms</a>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex flex-col items-center mb-8 text-center space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-600 rounded-lg shadow-md">
                  <MessageSquare className="text-white w-5 h-5" />
                </div>
                <span className="text-xl font-bold text-white">Echo</span>
              </div>
              <h1 className="text-3xl font-bold text-white leading-tight">
                Connect <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">freely.</span>
              </h1>
            </div>
            <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/20 p-6 sm:p-8 border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-white">
                  {step === "login" ? "Welcome Back" : "Create Account"}
                </h2>
                <p className="text-slate-400 mt-2 text-sm">
                  {step === "login"
                    ? "Enter your credentials to access your workspace."
                    : "Join Echo and start connecting today."}
                </p>
              </div>
              {errors.api && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                  <div className="w-1 h-4 bg-red-500 rounded-full"></div>
                  {errors.api}
                </div>
              )}
              <div className={`transition-all duration-300 ease-in-out ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
                {step === "login" ? (
                  <form onSubmit={handleLoginSubmit} className="space-y-5">
                    <InputField id="email" label="Email or Username" placeholder="admin@example.com" icon={Mail} value={email} onChange={(e: any) => setEmail(e.target.value)} />
                    <div className="space-y-1">
                      <InputField id="password" label="Password" type="password" placeholder="password" icon={Lock} isPassword value={password} onChange={(e: any) => setPassword(e.target.value)} />
                      <div className="flex justify-end">
                        <button type="button" className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
                          Forgot Password?
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed group mt-2 border border-blue-500/50">
                      {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <>Sign In <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSignupSubmit} className="space-y-5">
                    <InputField id="signup-email" label="Email Address" type="email" placeholder="name@example.com" icon={Mail} value={email} onChange={(e: any) => setEmail(e.target.value)} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InputField id="username" label="Username" placeholder="name" icon={User} value={username} onChange={(e: any) => setUsername(e.target.value)} />
                      <InputField id="phone" label="Phone" type="tel" placeholder="+1 234..." icon={Phone} value={phoneNumber} onChange={(e: any) => setPhoneNumber(e.target.value)} />
                    </div>
                    <InputField id="signup-password" label="Password" type="password" placeholder="Create a strong password" icon={Lock} isPassword value={password} onChange={(e: any) => setPassword(e.target.value)} />
                    <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-slate-100 hover:bg-white text-slate-900 rounded-xl font-semibold shadow-lg shadow-white/5 flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed group mt-4">
                      {isLoading ? <Loader2 className="animate-spin w-5 h-5 text-slate-900" /> : <>Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                    </button>
                  </form>
                )}
              </div>
              <div className="mt-8 pt-6 border-t border-slate-700/50">
                <div className="text-center text-sm text-slate-400">
                  {step === "login" ? (<>Don't have an account?{" "}<button onClick={() => switchStep("signup")} className="font-semibold text-blue-400 hover:text-blue-300 transition-colors focus:outline-none focus:underline">Sign up for free</button></>) : (<>Already have an account?{" "}<button onClick={() => switchStep("login")} className="font-semibold text-blue-400 hover:text-blue-300 transition-colors focus:outline-none focus:underline">Log in here</button></>)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes pulse-slow { 0%, 100% { transform: scale(1); opacity: 0.2; } 50% { transform: scale(1.1); opacity: 0.3; } }
        .animate-pulse-slow { animation: pulse-slow 8s infinite ease-in-out; }
      `}</style>
    </div>
  );
}