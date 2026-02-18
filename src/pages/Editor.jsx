import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import { ChevronLeft, Save, Download, FileText, ArrowLeft, LayoutTemplate, ChevronDown, FileType, Code, Layers, Sparkles, X, Wand2, Zap, Loader2, Undo2, Redo2 } from 'lucide-react';
import MonacoEditor from '@monaco-editor/react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as prettier from 'prettier/standalone';
import parserHtml from 'prettier/plugins/html';
import parserPostCss from 'prettier/plugins/postcss';
import { TEMPLATES } from '../data/templates';
import { exportToWord, exportToImage } from '../utils/exportUtils';
import ExportModal from '../components/ExportModal';
import AiChat from '../components/AiChat';


import { getDesignById, saveDesign, getAiConfig, saveAiConfig } from '../utils/storage';

const DEFAULT_MODELS = [
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' }
];

const Editor = () => {
    const { templateId } = useParams();
    const [editor, setEditor] = useState(null);
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [exportMode, setExportMode] = useState('pdf'); // 'pdf', 'png', 'jpeg'
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const editorRef = useRef(null);
    
    // 1. Try to find in storage first (it's a Design ID)
    // 2. If not found, check if it's a raw Template ID (fallback for old links)
    const [design, setDesign] = useState(null);
    const [activeView, setActiveView] = useState('design'); // 'design' | 'code' | 'split'
    const [codeHtml, setCodeHtml] = useState('');
    const [codeCss, setCodeCss] = useState('');


    // AI State
    // const [isAiModalOpen, setIsAiModalOpen] = useState(false); // Deprecated
    // const [aiPrompt, setAiPrompt] = useState(''); // Deprecated
    const [chatMessages, setChatMessages] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedModel, setSelectedModel] = useState('gemini-2.0-flash');
    const [availableModels, setAvailableModels] = useState(DEFAULT_MODELS);

    useEffect(() => {
        const config = getAiConfig();
        if (config.model) {
            setSelectedModel(config.model);
        }
        fetchModels(config.apiKey);
    }, []);

    const fetchModels = async (apiKey) => {
        if (!apiKey) return;
        try {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
            const data = await res.json();
            if (data.models) {
                // Filter for chat-compatible / production models if needed, or just map them
                const models = data.models
                    .filter(m => m.supportedGenerationMethods.includes('generateContent'))
                    .map(m => ({
                        id: m.name.replace('models/', ''),
                        name: m.displayName || m.name.split('/').pop()
                    }))
                    .sort((a,b) => b.id.localeCompare(a.id)); // Newest firstish
                
                if (models.length > 0) {
                    setAvailableModels(models);
                }
                console.log("models : ",data)
            }
        } catch (error) {
            console.error('Failed to fetch Gemini models:', error);
        }
    };

    const handleModelChange = (modelId) => {
        setSelectedModel(modelId);
        const config = getAiConfig();
        saveAiConfig({ ...config, model: modelId });
    };

    // Format Code Function
    const formatCode = async (html, css) => {
        try {
            const formattedHtml = await prettier.format(html, {
                parser: 'html',
                plugins: [parserHtml],
                htmlWhitespaceSensitivity: 'ignore'
            });
            const formattedCss = await prettier.format(css, {
                parser: 'css',
                plugins: [parserPostCss]
            });
            return { html: formattedHtml, css: formattedCss };
        } catch (e) {
            console.error('Formatting error:', e);
            return { html, css };
        }
    };

    // AI Generation Handler
    const handleAiGeneration = async (userPrompt) => {
        if (!userPrompt.trim() || !editor) return;

        const config = getAiConfig();
        if (!config.apiKey) {
            setChatMessages(prev => [...prev, { role: 'user', text: userPrompt }, { role: 'model', text: "Please configure your Gemini API Key in the Dashboard Settings first." }]);
            return;
        }

        // Add user message
        setChatMessages(prev => [...prev, { role: 'user', text: userPrompt }]);
        setIsGenerating(true);

        try {

            const genAI = new GoogleGenerativeAI(config.apiKey);
            const model = genAI.getGenerativeModel({ model: selectedModel });

            let currentHtml = editor.getHtml();
            let currentCss = editor.getCss();

            // --- OPTIMIZATION START: Strip Base64 Images ---
            const imageMap = new Map();
            let imageCounter = 0;

            const processString = (str) => {
                return str.replace(/data:image\/[^;]+;base64,[^\s"'\)]+/g, (match) => {
                    const placeholder = `__BASE64_IMAGE_${imageCounter++}__`;
                    imageMap.set(placeholder, match);
                    return placeholder;
                });
            };

            const cleanHtml = processString(currentHtml);
            const cleanCss = processString(currentCss);
            // --- OPTIMIZATION END ---

            const prompt = `
                You are an expert web designer. 
                Task: Modify the following HTML and CSS based on this request: "${userPrompt}".
                
                Current HTML:
                ${cleanHtml}

                Current CSS:
                ${cleanCss}

                Requirements:
                1. Return ONLY a valid JSON object. 
                2. The JSON must have exactly three keys: "html", "css", and "message".
                3. The "html" value should be the full modified HTML string.
                4. The "css" value should be the full modified CSS string.
                5. The "message" value should be a brief, friendly, and helpful description of the changes you made, explaining why it looks better now.
                6. Do NOT use Markdown formatting (no \`\`\`json blocks).
                7. Ensure the code is valid and responsive.
                8. IMPORTANT: Preserved encoded image placeholders (like __BASE64_IMAGE_0__) EXACTLY as they appear. Do not change or remove them unless specifically asked to replace images.
                
                Design Constraints for Export Compatibility:
                - Use a clear container (usually .invitation-container) with a solid background color or a stable background image.
                - For shadows, use simple "box-shadow" values (e.g., box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1)). Avoid multi-layered complex shadows that may look different in PDF.
                - Ensure and maintain a standard aspect ratio within the design container.
                - Avoid using "position: absolute" for critical text elements unless they are parented by a "position: relative" container that maintains its size.
                - Ensure all text remains within the bounds of the background to avoid clipping during PDF/Image export.
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // Clean up if markdown is potentially returned
            const cleanerText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const generated = JSON.parse(cleanerText);

            if (generated.html && generated.css) {
                // --- RESTORE IMAGES START ---
                let finalHtml = generated.html;
                let finalCss = generated.css;

                // Restore base64 strings from the map
                imageMap.forEach((base64, placeholder) => {
                    finalHtml = finalHtml.split(placeholder).join(base64);
                    finalCss = finalCss.split(placeholder).join(base64);
                });
                // --- RESTORE IMAGES END ---

                // Apply changes
                editor.setComponents(finalHtml);
                const cssRules = editor.Parser.parseCss(finalCss);
                editor.setStyle(cssRules);
                // Format before setting local state for code view
                const formatted = await formatCode(finalHtml, finalCss);
                setCodeHtml(formatted.html);
                setCodeCss(formatted.css);
                
                const modelResponseText = generated.message || "I've updated the design for you! Let me know if you'd like any other changes.";
                setChatMessages(prev => [...prev, { role: 'model', text: modelResponseText }]);
            } else {
                throw new Error("Invalid response format from AI");
            }

        } catch (error) {
            console.error("AI Generation Error:", error);
            setChatMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error while processing your request. Please try again." }]);
        } finally {
            setIsGenerating(false);
        }
    };

    // Toggle Handler
    const handleViewSwitch = async (view) => {
        if (view === activeView) return;
        
        if (view === 'code' || view === 'split' || view === 'ai') {
            // Switch to Code/Split: Pull from GrapesJS
            if (editor) {
                const html = editor.getHtml();
                const css = editor.getCss();
                
                // Format before setting state
                const formatted = await formatCode(html, css);
                
                setCodeHtml(formatted.html);
                setCodeCss(formatted.css);
            }
        } 
        
        if (view === 'design' && activeView !== 'design') {
             // Switching back to full design: Push changes
             if (editor) {
                editor.setComponents(codeHtml);
                const cssRules = editor.Parser.parseCss(codeCss);
                editor.setStyle(cssRules);
            }
        }

        setActiveView(view);
    };

    // Sync from Code to Design (Debounced) for Split View
    useEffect(() => {
        if ((activeView === 'split' || activeView === 'ai') && editor) {
            const timer = setTimeout(() => {
                editor.setComponents(codeHtml);
                const cssRules = editor.Parser.parseCss(codeCss);
                editor.setStyle(cssRules);
            }, 1000); // 1s debounce
            return () => clearTimeout(timer);
        }
    }, [codeHtml, codeCss, activeView, editor]);

    useEffect(() => {
        const loadDesign = () => {
             try {
                 // Check if it's a saved design
                 let loadedDesign = getDesignById(templateId);
                 
                 if (!loadedDesign) {
                     const template = TEMPLATES.find(t => t.id === templateId);
                     if (template) {
                         loadedDesign = {
                             id: 'temp', // Non-saving
                             name: template.name,
                             type: template.type,
                             content: template.content,
                             html: template.html,
                             css: template.css
                         };
                     }
                 }
                 setDesign(loadedDesign);
             } catch (err) {
                 console.error('Error loading design:', err);
             }
        };
        loadDesign();
    }, [templateId]);

    // Autosave Logic
    useEffect(() => {
        if (!editor || !design || design.id === 'temp') return;

        const handleSave = () => {
            setSaving(true);
            const html = editor.getHtml();
            const css = editor.getCss();
            const projectData = editor.getProjectData(); // Complete GrapesJS JSON
            
            saveDesign({
                ...design,
                content: projectData, // Save full state
                html,
                css,
                updatedAt: new Date().toISOString()
            });
            
            setSaving(false);
            setLastSaved(new Date());
        };

        // Listen to changes
        editor.on('storage:store', handleSave);
        // Also simpler update events
        editor.on('component:update', handleSave);
        editor.on('style:update', handleSave);
        // Debounce would be good here in real app, but for now direct save is okay or GrapesJS storage manager handles it?
        // Actually, GrapesJS has a Storage Manager. We can perform a manual save or hook into it.
        // Let's use a simple debounce for now to avoid spamming.
        
        let timeout;
        const triggerSave = () => {
            setSaving(true);
            clearTimeout(timeout);
            timeout = setTimeout(handleSave, 1000);
        };

        editor.on('change:changesCount', triggerSave);
        
        return () => {
            editor.off('change:changesCount', triggerSave);
        };
    }, [editor, design]);

    useEffect(() => {
        if (!editorRef.current || !design) return;

        try {
            // Initialize GrapesJS
            const gjsEditor = grapesjs.init({
                container: editorRef.current,
                fromElement: false,
                height: '100%',
                width: 'auto',
                storageManager: false, // We handle it manually
                deviceManager: {
                    devices: [
                        { name: 'Desktop', width: '' },
                        { name: 'Mobile', width: '320px', widthMedia: '480px' },
                    ]
                },
                plugins: [], 
                canvas: {
                    styles: [],
                    scripts: [] 
                }
            });

            // HACK: Inject cursor styles directly into the Canvas frame
            gjsEditor.on('load', () => {
                try {
                     const frameHead = gjsEditor.Canvas.getDocument().head;
                     const style = document.createElement('style');
                      style.innerHTML = `
                          /* Force cursor inheritance inside the iframe */
                          * {
                              cursor: inherit;
                          }
                          body { 
                              cursor: url('/cursor.svg') 5 0, auto !important;
                          }
                          a, button, [role="button"], .cursor-pointer, [onclick], label, select {
                              cursor: url('/pointer.svg') 10 2, pointer !important;
                          }
                          /* Ensure text cursor still works for inputs */
                          input[type="text"], textarea, [contenteditable="true"] {
                              cursor: text !important;
                          }
                      `;
                     frameHead.appendChild(style);
                } catch(e) { console.error('Error injecting cursor styles', e); }
            });


        // Load content
        if (design.content && typeof design.content === 'object') {
            // It's a saved GrapesJS JSON object
            gjsEditor.loadProjectData(design.content);
        } else if (design.content) {
             // It's an HTML string (from template)
             gjsEditor.setComponents(design.content);
        } else if (design.html) {
            // It's an AI-generated design with raw HTML/CSS only
            gjsEditor.setComponents(design.html);
            if (design.css) {
                const cssRules = gjsEditor.Parser.parseCss(design.css);
                gjsEditor.setStyle(cssRules);
            }
        }

        // Add some basic blocks for functionality if defaults aren't enough
        const blockManager = gjsEditor.BlockManager;
        // We check if blocks exist before adding to avoid duplicates if re-mounting
        if(blockManager.getAll().length === 0) {
            blockManager.add('text', {
                label: 'Text',
                content: '<div style="padding: 10px;">Insert your text here</div>',
                category: 'Basic',
                attributes: { class: 'fa fa-text-height' }
            });
            blockManager.add('image', {
                label: 'Image',
                content: { type: 'image' },
                category: 'Basic',
                attributes: { class: 'fa fa-image' }
            });
            blockManager.add('columns', {
                label: '2 Columns',
                content: '<div style="display: flex;"><div style="flex:1; padding: 10px;">Col 1</div><div style="flex:1; padding: 10px;">Col 2</div></div>',
                category: 'Layout',
            });
        }
        
        // Force "A4" like view and Fit to Screen
        gjsEditor.on('load', () => {
             const body = gjsEditor.Canvas.getBody();
             if(body) {
                 body.style.margin = '0 auto';
                 body.style.backgroundColor = 'white';
                 body.style.height = '1123px'; // A4 height
                 body.style.width = '794px';  // A4 width
                 body.style.transformOrigin = 'top center';
                 body.style.boxShadow = '0 10px 40px rgba(67, 20, 7, 0.1)'; // Warmer shadow
                 
                 // Auto-zoom to fit
                 const canvasView = gjsEditor.Canvas.getElement();
                 // We use the wrapper or frame element to calculate available space
                 const frameEl = gjsEditor.Canvas.getFrameEl();
                 
                 if (frameEl) {
                     // Canvas element in GrapesJS is usually the iframe. 
                     // The parent of the iframe is the window/view we view.
                     // But let's use the editor container size.
                     const container = editorRef.current;
                     const containerHeight = container.offsetHeight - 40; 
                     const containerWidth = container.offsetWidth - 40;
                     
                     const scaleH = containerHeight / 1123;
                     const scaleW = containerWidth / 794;
                     
                     // "Make it big": Prioritize Width over Height.
                     // On landscape screens, scaleH is usually the limiting factor for "Fit Page".
                     // switching to scaleW makes it fill the width, which is much bigger/readable.
                     // We cap it at 1.0 (100%) so it doesn't get pixelated on huge screens,
                     // but we allow it to be larger than scaleH (requires scrolling).
                     let scale = Math.min(scaleW, 1.0);
                     
                     // Additional check: If fitting width makes it GIGANTIC (e.g. vertical monitor), 
                     // maybe stick to something reasonable.
                     // But for standard use, scaleW * 0.9 (for margin) is good.
                     scale = scale * 0.9; // 5% margin
                     
                     gjsEditor.Canvas.setZoom(scale * 100);
                     
                     // Center horizontally if width is much smaller (GrapesJS aligns left by default often)
                     // Margin 0 auto on body handles the inner alignment.
                 }
             }
        });

        setEditor(gjsEditor);

        return () => {
            gjsEditor.destroy();
        };
        } catch (error) {
            console.error('GrapesJS Init Error:', error);
        }
    }, [templateId, design]); // Re-run if ID changes

    const handleQuickExport = async (format) => {
        if (!editor) return;
        setShowExportMenu(false);
        document.body.style.cursor = 'wait';
        try {
            await exportToImage(editor, format, design?.name || 'design');
        } catch (e) {
            console.error(e);
        } finally {
            document.body.style.cursor = 'auto'; 
        }
    };

    const handleExportWord = () => {
        if (!editor) return;
        const html = editor.getHtml();
        const css = editor.getCss();
        const fullContent = `<style>${css}</style>${html}`;
        exportToWord(fullContent, `${design?.name || 'design'}.doc`); // Use design name
    };

    if (!design) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    return (
        <div className="h-screen flex flex-col bg-[var(--color-surface)] overflow-hidden font-sans">
             {/* Custom Toolbar */}
            <header className="bg-white/90 backdrop-blur-sm border-b border-orange-100 px-6 py-4 flex justify-between items-center z-[100] shrink-0 h-20 shadow-[0_4px_20px_rgba(67,20,7,0.02)] relative">
                <div className="flex items-center gap-6">
                    <Link to="/dashboard" className="w-10 h-10 flex items-center justify-center bg-orange-50 hover:bg-orange-100 rounded-full text-[var(--color-dark)] transition-all shadow-sm group">
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <input 
                            type="text" 
                            value={design?.name || ''} 
                            onChange={(e) => {
                                const newName = e.target.value;
                                setDesign(prev => ({...prev, name: newName}));
                                // Debounced save could go here, or just save on blur
                            }}
                            onBlur={() => {
                                if (design?.id !== 'temp') {
                                    saveDesign({
                                        ...design,
                                        updatedAt: new Date().toISOString()
                                    });
                                }
                            }}
                            className="font-serif font-bold text-[var(--color-dark)] text-xl leading-none bg-transparent border-b border-transparent hover:border-orange-200 focus:border-orange-500 outline-none transition-colors w-64 md:w-96 truncate"
                            placeholder="Untitled Design"
                        />
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded-md bg-orange-100 text-[var(--color-accent)] text-[10px] font-bold uppercase tracking-wider">
                                {design?.type || 'Draft'}
                            </span>
                            <span className="text-xs text-[var(--color-dark)] opacity-40 flex items-center gap-1">
                                {saving ? 'Saving...' : lastSaved ? 'Saved' : 'Autosaved'}
                            </span>
                        </div>
                    </div>
                    </div>

                {/* AI Button - REMOVED (Moved to Toggle) */}

                <div className="flex gap-3">
                <div className="flex gap-3 relative items-center">
                     {/* Undo/Redo Buttons */}
                     <div className="flex bg-orange-50/50 p-1 rounded-xl border border-orange-100 mr-2">
                        <button 
                            onClick={() => editor?.UndoManager.undo()}
                            className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-[var(--color-accent)] transition-all active:scale-90"
                            title="Undo"
                        >
                            <Undo2 size={18} />
                        </button>
                        <button 
                            onClick={() => editor?.UndoManager.redo()}
                            className="p-2 hover:bg-white rounded-lg text-slate-400 hover:text-[var(--color-accent)] transition-all active:scale-90"
                            title="Redo"
                        >
                            <Redo2 size={18} />
                        </button>
                     </div>

                     {/* View Toggle */}
                     <div className="bg-orange-50/50 p-1 rounded-xl flex items-center gap-1 border border-orange-100">
                        <button
                            onClick={() => handleViewSwitch('design')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeView === 'design' 
                                ? 'bg-white text-[var(--color-accent)] shadow-sm' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <Layers size={16} />
                            Design
                        </button>
                        <button
                            onClick={() => handleViewSwitch('split')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeView === 'split' 
                                ? 'bg-white text-[var(--color-accent)] shadow-sm' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <LayoutTemplate size={16} />
                            Split
                        </button>
                        <button
                            onClick={() => handleViewSwitch('code')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeView === 'code' 
                                ? 'bg-white text-[var(--color-accent)] shadow-sm' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <Code size={16} />
                            Code
                        </button>
                        <button
                            onClick={() => handleViewSwitch('ai')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                activeView === 'ai' 
                                ? 'bg-white text-[var(--color-accent)] shadow-sm' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            <Sparkles size={16} />
                            Gemini
                        </button>
                     </div>

                     <div className="h-8 w-px bg-orange-100 mx-2"></div>

                     {/* Consolidated Export Dropdown */}
                     <button 
                         onClick={() => setShowExportMenu(!showExportMenu)}
                         onBlur={() => setTimeout(() => setShowExportMenu(false), 200)}
                         className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 group"
                     >
                         <Download size={18} />
                         <span>Export</span>
                         <ChevronDown size={16} className={`transition-transform duration-300 ${showExportMenu ? 'rotate-180' : ''}`} />
                     </button>

                     {/* Dropdown Menu */}
                     <div className={`absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-orange-100 overflow-hidden transition-all duration-200 origin-top-right z-[110] ${showExportMenu ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}`}>
                         <div className="p-1">
                             <button onClick={() => { setIsExportModalOpen(true); setExportMode('pdf'); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 rounded-lg transition-colors group text-left">
                                 <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform">
                                     <FileType size={16} />
                                 </div>
                                 <div>
                                     <div className="text-sm font-bold text-slate-700">PDF Document</div>
                                     <div className="text-[10px] text-slate-400">High quality print</div>
                                 </div>
                             </button>
                             
                             <button onClick={() => { setIsExportModalOpen(true); setExportMode('png'); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 rounded-lg transition-colors group text-left">
                                 <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                                     <LayoutTemplate size={16} /> 
                                 </div>
                                 <div>
                                     <div className="text-sm font-bold text-slate-700">Image (PNG)</div>
                                     <div className="text-[10px] text-slate-400">Custom Size available</div>
                                 </div>
                             </button>

                             <button onClick={() => { setIsExportModalOpen(true); setExportMode('jpeg'); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 rounded-lg transition-colors group text-left">
                                 <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                     <LayoutTemplate size={16} />
                                 </div>
                                 <div>
                                     <div className="text-sm font-bold text-slate-700">Image (JPG)</div>
                                     <div className="text-[10px] text-slate-400">Custom Size available</div>
                                 </div>
                             </button>

                             <div className="h-px bg-slate-100 my-1"></div>

                             <button onClick={handleExportWord} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 rounded-lg transition-colors group text-left">
                                 <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                     <FileText size={16} />
                                 </div>
                                 <div>
                                     <div className="text-sm font-bold text-slate-700">Microsoft Word</div>
                                     <div className="text-[10px] text-slate-400">Editable document</div>
                                 </div>
                             </button>
                         </div>
                     </div>
                </div>
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden bg-[var(--color-surface)] relative perspective-1000">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
                
                {/* Design View (GrapesJS) */}
                <div 
                    className={`absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] transform origin-left ${
                        activeView === 'design' 
                        ? 'opacity-100 scale-100 translate-x-0 z-10 w-full' 
                        : (activeView === 'split' || activeView === 'ai')
                        ? 'opacity-100 scale-100 translate-x-0 z-10 w-1/2 border-r-4 border-orange-100'
                        : 'opacity-0 scale-95 -translate-x-10 pointer-events-none z-0'
                                        } ${isGenerating ? 'scale-[0.99] transition-all duration-1000' : ''}`}
                >
                    <div id="gjs" ref={editorRef} style={{height: '100%', overflow: 'hidden'}}>
                        {/* GrapesJS generates its own UI here */}
                    </div>
                    
                    {/* Glowing Orange Border Overlay for Design View */}
                    {isGenerating && (
                        <div className="absolute inset-0 z-20 pointer-events-none rounded-lg transition-all duration-500">
                            {/* Inner Glow Border */}
                            <div className="absolute inset-0 border-[3px] border-orange-500 shadow-[inset_0_0_30px_rgba(249,115,22,0.6)] rounded-lg animate-glow-pulse"></div>
                            
                            {/* Subtle dark tint to help center badge pop, but NO BLUR */}
                            <div className="absolute inset-0 bg-black/5 rounded-lg"></div>

                            {/* Status Badge */}
                            <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-xl px-4 py-2 rounded-full shadow-lg border border-orange-200 flex items-center gap-2 animate-fade-in-up">
                                <Sparkles size={16} className="text-orange-500 animate-spin-slow" />
                                <span className="text-xs font-bold text-slate-600 tracking-wide">Gemini is working...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Code View (Monaco) */}
                <div 
                    className={`absolute inset-y-0 right-0 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] transform origin-right flex flex-col bg-white/50 backdrop-blur-xl ${
                        activeView === 'code' 
                        ? 'opacity-100 scale-100 translate-x-0 z-10 w-full' 
                        : (activeView === 'split' || activeView === 'ai')
                        ? 'opacity-100 scale-100 translate-x-0 z-10 w-1/2'
                        : 'opacity-0 scale-95 translate-x-10 pointer-events-none z-0'
                    }`}
                >
                    {activeView === 'ai' ? (
                        <AiChat 
                            messages={chatMessages}
                            onSendMessage={handleAiGeneration}
                            isGenerating={isGenerating}
                            onClose={() => handleViewSwitch('design')}
                            selectedModel={selectedModel}
                            onModelChange={setSelectedModel}
                            availableModels={availableModels}
                        />
                    ) : (
                        /* Split Pane for Code/Split View (Vertical Stack for better Split view usage) */
                        <div className="flex-1 flex flex-col h-full">
                    {/* HTML Editor */}
                    <div className="flex-1 border-b border-orange-100 flex flex-col h-1/2">
                        <div className="px-4 py-3 bg-orange-50/50 border-b border-orange-100 font-bold text-slate-500 text-xs uppercase tracking-wider flex justify-between items-center shrink-0">
                            <span>HTML Structure</span>
                            <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                        </div>
                        <div className="flex-1">
                            <MonacoEditor
                                height="100%"
                                defaultLanguage="html"
                                value={codeHtml}
                                onChange={(value) => setCodeHtml(value)}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    wordWrap: 'on',
                                    scrollBeyondLastLine: false,
                                    smoothScrolling: true,
                                    padding: { top: 16 }
                                }}
                            />
                        </div>
                    </div>

                    {/* CSS Editor */}
                    <div className="flex-1 flex flex-col h-1/2">
                        <div className="px-4 py-3 bg-blue-50/50 border-b border-blue-100 font-bold text-slate-500 text-xs uppercase tracking-wider flex justify-between items-center shrink-0">
                            <span>CSS Styles</span>
                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                        </div>
                        <div className="flex-1">
                             <MonacoEditor
                                height="100%"
                                defaultLanguage="css"
                                value={codeCss}
                                onChange={(value) => setCodeCss(value)}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    wordWrap: 'on',
                                    scrollBeyondLastLine: false,
                                    smoothScrolling: true,
                                    padding: { top: 16 }
                                }}
                            />
                        </div>
                    </div>
                    </div>
                    )}
                </div>


            </div>

            {/* AI Prompt Modal - REMOVED */}

            {/* Export Modal */}
            <ExportModal 
                isOpen={isExportModalOpen} 
                onClose={() => setIsExportModalOpen(false)} 
                editor={editor}
                templateName={design?.name}
                initialFormat={exportMode}
            />
        </div>
    );
};

export default Editor;
