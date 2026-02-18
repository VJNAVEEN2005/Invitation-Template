import React, { useState, useEffect } from 'react';
import { X, Search, ChevronRight, Plus, Palette } from 'lucide-react';
import { TEMPLATES } from '../data/templates';
import TemplatePreview from './TemplatePreview';

const TemplateModal = ({ isOpen, onClose, activeTab, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(activeTab);

  // Sync internal category state with prop if it changes when opening
  useEffect(() => {
    if (isOpen) {
        setSelectedCategory(activeTab);
        setSearchTerm('');
    }
  }, [isOpen, activeTab]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const filteredTemplates = TEMPLATES.filter(t => 
    t.type === selectedCategory && 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-500" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-[#faf9f6] w-full max-w-6xl h-[85vh] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col transform transition-all duration-500 scale-100 animate-fade-in-up border border-white/20">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-orange-100/50 bg-white/80 backdrop-blur-xl shrink-0 flex justify-between items-center z-10 sticky top-0">
            <div>
                <h2 className="font-serif font-bold text-3xl text-[var(--color-dark)] mb-1">
                    Choose a Template
                </h2>
                <p className="text-[var(--color-dark)] opacity-50 text-sm">
                    Start with a professionally designed layout.
                </p>
            </div>
            
            <button 
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
            >
                <X size={20} />
            </button>
        </div>

        {/* Filters & Search */}
        <div className="px-8 py-4 bg-white/50 backdrop-blur-sm flex flex-col md:flex-row gap-4 justify-between items-center shrink-0">
            {/* Category Tabs */}
            <div className="flex bg-slate-100/50 p-1 rounded-xl">
                 {['invitation', 'poster', 'certificate'].map(cat => (
                     <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${
                            selectedCategory === cat 
                            ? 'bg-white shadow-sm text-[var(--color-accent)]' 
                            : 'text-slate-400 hover:text-slate-600'
                        }`}
                     >
                         {cat}s
                     </button>
                 ))}
            </div>

            {/* Search */}
            <div className="relative group w-full md:w-72">
                 <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[var(--color-accent)] transition-colors" />
                 <input 
                    type="text" 
                    placeholder={`Search ${selectedCategory}s...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white pl-10 pr-4 py-2.5 rounded-xl border border-transparent focus:border-orange-200 focus:ring-4 focus:ring-orange-100 outline-none text-sm font-medium transition-all shadow-sm"
                 />
            </div>
        </div>

        {/* Grid Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 relative">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] pointer-events-none"></div>
             
             {filteredTemplates.length > 0 ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                     {filteredTemplates.map((template, index) => (
                         <div 
                             key={template.id} 
                             onClick={() => onSelect(template.id)}
                             className="group bg-white rounded-[1.5rem] p-3 shadow-sm hover:shadow-[0_20px_40px_rgba(249,115,22,0.15)] hover:-translate-y-2 transition-all duration-500 border border-transparent hover:border-orange-100 cursor-pointer flex flex-col relative overflow-hidden"
                             style={{ animationDelay: `${index * 50}ms` }}
                         >
                             {/* Preview Container */}
                             <div className="aspect-[3/4] bg-slate-100 rounded-xl relative overflow-hidden mb-4 isolate">
                                 {/* Live Preview */}
                                 <div className="w-full h-full transform transition-transform duration-700 ease-out group-hover:scale-105 opacity-90 group-hover:opacity-100 pointer-events-none origin-top">
                                     <TemplatePreview html={template.html} css={template.css} />
                                 </div>
                                 
                                 {/* Hover Action */}
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 z-20 flex items-end justify-center p-4">
                                     <span className="bg-white/90 backdrop-blur text-[var(--color-dark)] px-4 py-2 rounded-full font-bold text-xs shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform flex items-center gap-2">
                                         <Plus size={14} /> Create Design
                                     </span>
                                 </div>
                             </div>

                             <div className="px-2 pb-1">
                                 <div className="flex justify-between items-start">
                                     <div>
                                         <h3 className="font-serif font-bold text-lg text-[var(--color-dark)] group-hover:text-[var(--color-accent)] transition-colors line-clamp-1">{template.name}</h3>
                                         <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-1">{template.type}</p>
                                     </div>
                                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-[var(--color-accent)] group-hover:text-white transition-colors">
                                         <ChevronRight size={16} />
                                      </div>
                                 </div>
                             </div>
                         </div>
                     ))}
                 </div>
             ) : (
                 <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                     <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
                         <Search size={32} />
                     </div>
                     <h3 className="font-serif font-bold text-xl text-[var(--color-dark)]">No templates found</h3>
                     <p className="text-sm">Try adjusting your search terms.</p>
                 </div>
             )}
        </div>
        
      </div>
    </div>
  );
};

export default TemplateModal;
