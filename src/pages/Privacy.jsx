import React from 'react';
import { Link } from 'react-router-dom';
import { Palette, ArrowLeft } from 'lucide-react';

const Privacy = () => {
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
        <h1 className="text-5xl font-serif font-black mb-4 text-[var(--color-dark)]">Privacy Policy</h1>
        <p className="text-slate-400 font-medium mb-12">Last updated: February 18, 2026</p>

        <div className="space-y-10 text-slate-600 leading-relaxed">
          <section>
            <h2 className="text-2xl font-serif font-black text-[var(--color-dark)] mb-4">1. We Do Not Collect Any Data</h2>
            <p>DesignStudio AI is a fully client-side application. <strong>We do not collect, store, or transmit any of your personal data.</strong> There are no servers, no databases, and no analytics. Everything you do in this app stays entirely on your device.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-black text-[var(--color-dark)] mb-4">2. Local Storage Only</h2>
            <p>All your designs, settings, and API keys are saved in your browser's local storage. This means:</p>
            <ul className="list-disc list-inside mt-4 space-y-2 pl-4">
              <li>Your data never leaves your device</li>
              <li>We have no access to your designs or configurations</li>
              <li>Clearing your browser data will permanently remove your saved work</li>
              <li>We recommend exporting important designs regularly as a backup</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-black text-[var(--color-dark)] mb-4">3. Third-Party AI Services</h2>
            <p>When you use the AI generation feature, your design prompts are sent directly from your browser to Google's Gemini API using <strong>your own API key</strong>. This communication happens between your browser and Google — we are not involved in any way. Please review <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline font-bold">Google's Privacy Policy</a> for how they handle data sent to their API.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-black text-[var(--color-dark)] mb-4">4. Your Complete Control</h2>
            <p>Since everything is stored locally, you have full and exclusive control over your data at all times. You can delete it by clearing your browser's local storage or using the delete functions within the app. No account creation or personal information is ever required.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-black text-[var(--color-dark)] mb-4">5. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. Any changes will be reflected on this page with an updated revision date.</p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-black text-[var(--color-dark)] mb-4">6. Contact</h2>
            <p>If you have any questions about this Privacy Policy, please reach out via our <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-orange-500 hover:underline font-bold">GitHub repository</a>.</p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-orange-100/50 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">© 2026 DesignStudio AI. All rights reserved.</div>
        <div className="flex gap-10 text-sm font-black text-slate-600 uppercase tracking-tighter">
          <Link to="/privacy" className="text-orange-500">Privacy</Link>
          <Link to="/terms" className="hover:text-orange-500 transition-colors">Terms</Link>
        </div>
      </footer>
    </div>
  );
};

export default Privacy;
