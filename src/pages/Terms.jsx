import React from 'react';
import { Link } from 'react-router-dom';
import { Palette, ArrowLeft } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-[var(--color-light)] text-[var(--color-dark)] font-sans">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-6 flex justify-between items-center border-b border-orange-100/50">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[var(--color-accent)] rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Palette className="text-white w-5 h-5" />
          </div>
          <span className="text-2xl font-serif font-black tracking-tighter text-[var(--color-dark)]">DesignStudio <span className="text-orange-500">AI</span></span>
        </Link>
        <Link to="/" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-orange-500 transition-colors">
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </nav>

      {/* Content */}
      <main className="container mx-auto px-6 py-16 max-w-3xl">
        <h1 className="text-5xl font-serif font-black mb-4 text-[var(--color-dark)]">Terms of Service</h1>
        <p className="text-slate-400 font-medium mb-12">Last updated: February 18, 2026</p>

        <div className="space-y-10 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-2xl font-serif font-black text-[var(--color-dark)] mb-4">1. Acceptance of Terms</h2>
            <p>By accessing and using DesignStudio AI, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use the application.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-black text-[var(--color-dark)] mb-4">2. Description of Service</h2>
            <p>DesignStudio AI is an open-source, browser-based invitation and poster design tool that leverages artificial intelligence to help users create designs. The service includes:</p>
            <ul className="list-disc list-inside mt-4 space-y-2 pl-4">
              <li>AI-powered design generation using Google's Gemini API</li>
              <li>A visual drag-and-drop canvas editor</li>
              <li>Pre-built invitation templates</li>
              <li>Export capabilities in PDF, PNG, and JPEG formats</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-black text-[var(--color-dark)] mb-4">3. User Responsibilities</h2>
            <p>When using DesignStudio AI, you agree to:</p>
            <ul className="list-disc list-inside mt-4 space-y-2 pl-4">
              <li>Provide your own valid Gemini API key for AI features</li>
              <li>Use the service only for lawful purposes</li>
              <li>Not generate content that is harmful, offensive, or infringes on others' rights</li>
              <li>Take responsibility for backing up your designs, as data is stored locally</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-black text-[var(--color-dark)] mb-4">4. Intellectual Property</h2>
            <p>Designs you create using DesignStudio AI belong to you. However:</p>
            <ul className="list-disc list-inside mt-4 space-y-2 pl-4">
              <li>The DesignStudio AI application code is open-source and subject to its license</li>
              <li>Pre-built templates are provided for personal and commercial use</li>
              <li>AI-generated content may be subject to Google's usage policies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-black text-[var(--color-dark)] mb-4">5. API Usage & Costs</h2>
            <p>The AI generation features require a Google Gemini API key. You are solely responsible for any costs associated with your API usage. DesignStudio AI does not charge for the use of the application itself.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-black text-[var(--color-dark)] mb-4">6. Disclaimer of Warranties</h2>
            <p>DesignStudio AI is provided "as is" without any warranties, express or implied. We do not guarantee that the service will be uninterrupted, error-free, or that designs will meet your specific requirements.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-black text-[var(--color-dark)] mb-4">7. Limitation of Liability</h2>
            <p>In no event shall DesignStudio AI or its contributors be liable for any indirect, incidental, special, or consequential damages arising from your use of the service, including but not limited to loss of data or designs.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-black text-[var(--color-dark)] mb-4">8. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-black text-[var(--color-dark)] mb-4">9. Contact</h2>
            <p>For questions about these Terms of Service, please visit our <a href="https://github.com/VJNAVEEN2005/Invitation-Template" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline font-bold">GitHub repository</a>.</p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-orange-100/50 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">© 2026 DesignStudio AI. All rights reserved.</div>
        <div className="flex gap-10 text-sm font-black text-slate-600 uppercase tracking-tighter">
          <Link to="/privacy" className="hover:text-orange-500 transition-colors">Privacy</Link>
          <Link to="/terms" className="text-orange-500">Terms</Link>
        </div>
      </footer>
    </div>
  );
};

export default Terms;
