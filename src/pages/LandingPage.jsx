import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Palette, Sparkles, ArrowRight, Heart, Zap, Coffee, Code, Laptop, Download, MoveRight, Wand2, Github } from 'lucide-react';

const LandingPage = () => {
  const [vision, setVision] = useState('');
  const navigate = useNavigate();

  const handleStartGeneration = (e) => {
    e.preventDefault();
    if (!vision.trim()) {
        navigate('/ai-generator');
    } else {
        navigate(`/ai-generator?prompt=${encodeURIComponent(vision)}`);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-light)] text-[var(--color-dark)] font-sans selection:bg-[var(--color-accent)] selection:text-white overflow-x-hidden transition-colors duration-500">
      
      {/* Decorative Organic Shapes (Blobs) */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
         <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-orange-200/40 rounded-full blur-[100px] animate-pulse"></div>
         <div className="absolute top-[40%] left-[-10%] w-[500px] h-[500px] bg-amber-100/50 rounded-full blur-[80px]"></div>
         <div className="absolute bottom-[-10%] right-[20%] w-[400px] h-[400px] bg-rose-100/40 rounded-full blur-[90px]"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-[var(--color-accent)] rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20 transform hover:rotate-12 transition-transform">
                <Palette className="text-white w-5 h-5" />
            </div>
            <span className="text-2xl font-serif font-black tracking-tighter text-[var(--color-dark)]">DesignStudio <span className="text-orange-500">AI</span></span>
        </div>
        
        <div className="hidden md:flex items-center gap-6">
             <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-700 hover:border-slate-400 hover:shadow-md transition-all">
                <Github size={18} />
                <span>Star on GitHub</span>
             </a>
            <Link to="/dashboard" className="px-7 py-3 bg-[var(--color-dark)] text-white rounded-full text-sm font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 hover:shadow-slate-900/20 active:scale-95">
                Get Started
            </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 container mx-auto px-6 pt-20 pb-40 flex flex-col items-center text-center">
        
        <h1 className="text-7xl md:text-9xl font-serif font-black mb-8 leading-[0.95] tracking-tighter text-[var(--color-dark)] max-w-6xl mx-auto">
          Craft Memories <br/> <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent italic">With AI Magic.</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-[var(--color-dark)] opacity-60 mb-14 max-w-2xl mx-auto font-medium leading-relaxed">
          Design invitations that tell your unique story.
        </p>

        {/* Vision Input Integration */}
        <form onSubmit={handleStartGeneration} className="w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl shadow-orange-900/10 border border-orange-100 p-3 flex flex-col md:flex-row gap-3 transition-all focus-within:ring-4 ring-orange-500/10">
            <div className="flex-1 flex items-center px-4">
                <Sparkles size={24} className="text-orange-400 mr-4 hidden md:block" />
                <input 
                    type="text" 
                    placeholder="e.g., A minimalist black tie wedding invitation with gold highlights..." 
                    className="w-full bg-transparent border-none outline-none py-4 text-lg text-slate-700 placeholder:text-slate-300 font-medium"
                    value={vision}
                    onChange={(e) => setVision(e.target.value)}
                />
            </div>
            <button 
                type="submit"
                className="px-10 py-5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-[1.8rem] font-black text-lg transition-all shadow-xl shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-3 group"
            >
                Create with AI <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </button>
        </form>

        {/* Feature Highlights */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl mt-48">
            <div className="flex flex-col items-center text-center p-10 bg-white/40 backdrop-blur-md rounded-[3rem] border border-white shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
                <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center text-orange-600 mb-8 rotate-3">
                    <Wand2 size={40} />
                </div>
                <h3 className="font-serif font-black text-2xl mb-4">Zero-Code Generation</h3>
                <p className="text-slate-500 font-medium leading-relaxed">Simply talk to the AI. No complex tools, no design background needed. Just your vision.</p>
            </div>
            
            <div className="flex flex-col items-center text-center p-10 bg-white/40 backdrop-blur-md rounded-[3rem] border border-white shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
                <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center text-amber-600 mb-8 -rotate-3">
                    <Laptop size={40} />
                </div>
                <h3 className="font-serif font-black text-2xl mb-4">Live Canvas Editor</h3>
                <p className="text-slate-500 font-medium leading-relaxed">A professional-grade visual editor that lets you tweak anything the AI creates instantly.</p>
            </div>

            <div className="flex flex-col items-center text-center p-10 bg-white/40 backdrop-blur-md rounded-[3rem] border border-white shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
                <div className="w-20 h-20 bg-rose-100 rounded-3xl flex items-center justify-center text-rose-600 mb-8 rotate-3">
                    <Download size={40} />
                </div>
                <h3 className="font-serif font-black text-2xl mb-4">Pro Export Options</h3>
                <p className="text-slate-500 font-medium leading-relaxed">High-resolution PDF, JPG, and PNG exports in any aspect ratio you need for print or social.</p>
            </div>
        </div>

        {/* Final CTA */}
        <div className="mt-40 mb-20 bg-[var(--color-dark)] text-white w-full max-w-6xl rounded-[4rem] p-16 md:p-24 flex flex-col md:flex-row items-center justify-between text-left relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] -mr-48 -mt-48 transition-all duration-1000 group-hover:bg-orange-500/20"></div>
            <div className="relative z-10 max-w-xl">
                <h2 className="text-5xl md:text-6xl font-serif font-black mb-6 leading-tight">Ready to start <br/> designing?</h2>
                <p className="text-xl text-slate-400 mb-0 font-medium">Join thousands of creators making beautiful invitations today.</p>
            </div>
            <Link 
                to="/dashboard"
                className="relative z-10 mt-10 md:mt-0 px-12 py-6 bg-white text-[var(--color-dark)] rounded-full font-black text-xl hover:bg-orange-50 transition-all flex items-center gap-4 group/btn shadow-2xl shadow-white/10"
            >
                Start for Free <MoveRight size={24} className="group-hover/btn:translate-x-2 transition-transform" />
            </Link>
        </div>
      </header>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-orange-100/50 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">© 2026 DesignStudio AI. All rights reserved.</div>
        <div className="flex gap-10 text-sm font-black text-slate-600 uppercase tracking-tighter">
            <Link to="/privacy" className="hover:text-orange-500 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-orange-500 transition-colors">Terms</Link>
        </div>
      </footer>
      
    </div>
  );
};

export default LandingPage;
