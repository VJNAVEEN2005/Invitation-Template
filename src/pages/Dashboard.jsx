import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Image as ImageIcon, Plus, LayoutGrid, Settings, LogOut, ChevronRight, Search, Palette, FileType, Trash2, Edit, Check, X, Sparkles } from 'lucide-react';
import { TEMPLATES } from '../data/templates';
import TemplatePreview from '../components/TemplatePreview';
import TemplateModal from '../components/TemplateModal';
import { getDesignsByType, deleteDesign, createDesignFromTemplate, renameDesign, getAiConfig, saveAiConfig } from '../utils/storage';

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('invitation');
  const [savedDesigns, setSavedDesigns] = useState([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false); // Modal state
  
  // Renaming State
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState('');

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState({ apiKey: '', model: 'gemini-1.5-flash' });


  // Load saved designs on mount and tab change
  useEffect(() => {
    const loadDesigns = () => {
        const designs = getDesignsByType(activeTab);
        setSavedDesigns(designs);
        setAiConfig(getAiConfig());
    };
    
    loadDesigns();

    // Listen for storage changes (in case of multi-tab usage)
    window.addEventListener('storage', loadDesigns);
    return () => window.removeEventListener('storage', loadDesigns);
  }, [activeTab]);

  const handleDelete = (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this design?')) {
        deleteDesign(id);
        // Refresh list
        setSavedDesigns(getDesignsByType(activeTab));
    }
  };

  const startRenaming = (e, design) => {
      e.preventDefault();
      e.stopPropagation();
      setEditingId(design.id);
      setNewName(design.name);
  };

  const cancelRenaming = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setEditingId(null);
      setNewName('');
  };

  const saveRename = (e, id) => {
      e.preventDefault();
      e.stopPropagation();
      if (newName.trim()) {
          renameDesign(id, newName);
          setSavedDesigns(getDesignsByType(activeTab));
      }
      setEditingId(null);
      setNewName('');
  };

  const handleCreateFromTemplate = (templateId) => {
      // 1. Create a new design entry in local storage
      const newDesign = createDesignFromTemplate(templateId);
      // 2. Navigate to editor with the new Design ID
      navigate(`/editor/${newDesign.id}`);
  };

  const handleSaveSettings = (e) => {
      e.preventDefault();
      saveAiConfig(aiConfig);
      setIsSettingsOpen(false);
      alert('Settings saved!');
  };

  return (
    <div className="flex h-screen bg-[var(--color-light)] font-sans overflow-hidden transition-colors duration-500">
      
      {/* Soft & Clean Sidebar */}
      <aside className="w-72 bg-white/80 backdrop-blur-xl border-r border-orange-100 flex flex-col pt-8 pb-6 z-20 shadow-[4px_0_24px_rgba(67,20,7,0.03)]">
        <div className="px-8 mb-10">
             <Link to="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 bg-[var(--color-accent)] rounded-full flex items-center justify-center text-white font-serif font-bold text-xl shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform">
                    <Palette size={16} />
                </div>
                <span className="text-xl font-serif font-bold text-[var(--color-dark)] tracking-tight group-hover:text-[var(--color-accent)] transition-colors">AuraDesign.</span>
             </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
            <div className="px-4 mb-2 text-xs font-bold text-[var(--color-dark)] opacity-40 uppercase tracking-widest">Workspace</div>
            <SidebarItem 
                icon={<Calendar size={18} />} 
                label="Invitations" 
                isActive={activeTab === 'invitation'} 
                onClick={() => setActiveTab('invitation')} 
            />
            <SidebarItem 
                icon={<ImageIcon size={18} />} 
                label="Posters" 
                isActive={activeTab === 'poster'} 
                onClick={() => setActiveTab('poster')} 
            />
            <SidebarItem 
                icon={<FileType size={18} />} 
                label="Certificates" 
                isActive={activeTab === 'certificate'} 
                onClick={() => setActiveTab('certificate')} 
            />
        </nav>

        <div className="px-4 mt-auto">


            <div className="border-t border-orange-100 pt-4 space-y-1">
                <SidebarItem icon={<Settings size={18} />} label="Settings" onClick={() => setIsSettingsOpen(true)} />
                <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[var(--color-dark)] opacity-60 hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all text-sm font-medium group">
                    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span>Log Out</span>
                </button>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-[var(--color-light)]/80 backdrop-blur-md border-b border-orange-100 px-10 py-5 flex justify-between items-center">
             <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-full border border-orange-100 shadow-sm w-96 focus-within:shadow-md focus-within:border-orange-300 transition-all group">
                <Search size={18} className="text-[var(--color-dark)] opacity-40 group-focus-within:text-[var(--color-accent)]" />
                <input type="text" placeholder="Search saved designs..." className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[var(--color-dark)] placeholder:opacity-30 text-[var(--color-dark)]" />
             </div>
             
             <div className="flex items-center gap-3">
                <button 
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full shadow-sm transition-all active:scale-95 font-bold text-sm group"
                >
                    <Plus size={18} className="text-orange-500 group-hover:rotate-90 transition-transform" />
                    <span>Create New</span>
                </button>

                <button 
                    onClick={() => navigate('/ai-generator')}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-full shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all active:scale-95 font-bold text-sm group border border-orange-400/20"
                >
                    <Sparkles size={18} className="animate-pulse" />
                    <span>Make with AI</span>
                </button>
             </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto">
            <div className="flex justify-between items-end mb-10 animate-fade-in-up">
                <div>
                    <h1 className="text-5xl font-serif font-bold text-[var(--color-dark)] mb-3">
                        {activeTab === 'invitation' ? 'Invitations' : activeTab === 'poster' ? 'Posters' : 'Certificates'}
                    </h1>
                    <p className="text-[var(--color-dark)] opacity-60 text-lg">Manage your designs or create a new one.</p>
                </div>
                
                {/* Create New Functionality moved to Header/Action */}
            </div>

            {/* Saved Designs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20 animate-fade-in-up">
                
                {/* 1. Create New Card (Always First) */}
                <button 
                    onClick={() => setIsTemplateModalOpen(true)}
                    className="group bg-gradient-to-br from-[var(--color-accent)] to-orange-600 rounded-2xl p-1 shadow-lg hover:shadow-orange-500/30 hover:-translate-y-2 transition-all duration-300 flex flex-col justify-center items-center text-white aspect-[3/4] relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Plus size={32} />
                    </div>
                    <h3 className="font-serif font-bold text-xl">Create New</h3>
                    <p className="text-xs opacity-80 mt-1">Browse Templates</p>
                </button>

                {/* 2. Saved Designs */}
                {savedDesigns.map((design) => (
                    <div 
                        key={design.id} 
                        onClick={() => { if(editingId !== design.id) navigate(`/editor/${design.id}`) }}
                        className="group bg-white rounded-2xl p-3 shadow-sm hover:shadow-lg transition-all border border-orange-50 hover:border-orange-200 flex flex-col cursor-pointer"
                    >
                        <div className="aspect-[3/4] bg-slate-50 rounded-xl relative overflow-hidden mb-3 isolate">
                                {/* Thumbnail Preview */}
                                <div className="w-full h-full transform transition-transform duration-700 group-hover:scale-105 pointer-events-none opacity-90 group-hover:opacity-100">
                                    <TemplatePreview html={design.html} css={design.css} />
                                </div>
                                
                                {/* Hover Actions */}
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center gap-2">
                                    <button 
                                        onClick={(e) => startRenaming(e, design)}
                                        className="bg-white text-[var(--color-accent)] p-2 rounded-full shadow-lg hover:scale-110 transition-transform"
                                        title="Rename"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button 
                                        onClick={(e) => handleDelete(e, design.id)}
                                        className="bg-white text-red-500 p-2 rounded-full shadow-lg hover:scale-110 transition-transform hover:bg-red-50"
                                        title="Delete"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                        </div>
                        
                        <div className="px-1 h-12 flex flex-col justify-center">
                            {editingId === design.id ? (
                                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <input 
                                        type="text" 
                                        value={newName} 
                                        onChange={(e) => setNewName(e.target.value)}
                                        className="flex-1 text-sm border-b border-orange-300 outline-none bg-transparent font-serif font-bold text-[var(--color-dark)] py-0.5"
                                        autoFocus
                                        onKeyDown={(e) => {
                                            if(e.key === 'Enter') saveRename(e, design.id);
                                            if(e.key === 'Escape') cancelRenaming(e);
                                        }}
                                    />
                                    <button onClick={(e) => saveRename(e, design.id)} className="text-green-600 hover:text-green-700"><Check size={14}/></button>
                                    <button onClick={(e) => cancelRenaming(e)} className="text-red-400 hover:text-red-500"><X size={14}/></button>
                                </div>
                            ) : (
                                <>
                                    <h3 className="font-serif font-bold text-[var(--color-dark)] truncate">{design.name}</h3>
                                    <p className="text-xs text-[var(--color-dark)] opacity-50 mt-0.5">
                                        Last edited {new Date(design.updatedAt).toLocaleDateString()}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Template Modal */}
            <TemplateModal 
                isOpen={isTemplateModalOpen} 
                onClose={() => setIsTemplateModalOpen(false)} 
                activeTab={activeTab}
                onSelect={handleCreateFromTemplate}
            />

            {/* Settings Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSettingsOpen(false)} />
                    <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-4 border-b border-orange-100 flex justify-between items-center bg-orange-50/50">
                            <h3 className="font-serif font-bold text-xl text-[var(--color-dark)]">Settings</h3>
                            <button onClick={() => setIsSettingsOpen(false)} className="p-2 hover:bg-orange-100 rounded-full text-slate-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveSettings} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1">Gemini API Key</label>
                                <input 
                                    type="password" 
                                    value={aiConfig.apiKey}
                                    onChange={(e) => setAiConfig({...aiConfig, apiKey: e.target.value})}
                                    placeholder="Enter your API Key"
                                    className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 outline-none transition-all"
                                />
                                <p className="text-xs text-slate-400 mt-1">
                                    Get key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-orange-500 hover:underline">Google AI Studio</a>
                                </p>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsSettingsOpen(false)}
                                    className="px-4 py-2 rounded-lg text-slate-500 hover:bg-slate-100 font-bold text-sm transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-6 py-2 rounded-lg bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white font-bold text-sm shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                                >
                                    Save Settings
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
      </main>
    </div>
  );
};

const SidebarItem = ({ icon, label, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-medium group relative overflow-hidden ${
            isActive 
            ? 'bg-orange-100 text-[var(--color-accent)] font-bold shadow-sm' 
            : 'text-[var(--color-dark)] opacity-60 hover:opacity-100 hover:bg-orange-50'
        }`}
    >
        <span className={`transition-colors relative z-10 duration-300 ${isActive ? 'text-[var(--color-accent)]' : 'group-hover:text-[var(--color-accent)]'}`}>
            {icon}
        </span>
        <span className="relative z-10">{label}</span>
    </button>
);

export default Dashboard;
