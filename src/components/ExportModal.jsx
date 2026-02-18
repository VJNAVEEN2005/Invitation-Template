import React, { useState, useEffect, useRef } from 'react';
import { X, Download, FileType, Check, LayoutTemplate } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

const PAGE_SIZES = {
  a4: { width: 794, height: 1123, name: 'A4 (210 x 297 mm)', pdfFormat: 'a4' },
  letter: { width: 816, height: 1056, name: 'Letter (8.5 x 11 in)', pdfFormat: 'letter' },
  poster: { width: 1587, height: 2245, name: 'Poster (420 x 594 mm)', pdfFormat: 'a2' },
};

const ASPECT_RATIOS = {
  square: { label: 'Square (1:1)', ratio: 1/1 },
  portrait: { label: 'Portrait (4:5)', ratio: 4/5 },
  story: { label: 'Story (9:16)', ratio: 9/16 },
  landscape: { label: 'Landscape (16:9)', ratio: 16/9 },
};

const ExportModal = ({ isOpen, onClose, editor, templateName, initialFormat = 'pdf' }) => {
  // Detect if this is a certificate (landscape by default)
  const isCertificate = templateName?.toLowerCase().includes('certificate');
  
  const [format, setFormat] = useState(isCertificate ? 'letter' : 'a4');
  const [orientation, setOrientation] = useState(isCertificate ? 'landscape' : 'portrait');
  const [fileType, setFileType] = useState(initialFormat); 
  const [isExporting, setIsExporting] = useState(false);
  const [selectionMode, setSelectionMode] = useState('standard'); // 'standard' | 'ratio'
  const [selectedRatio, setSelectedRatio] = useState('square');
  const [customRatio, setCustomRatio] = useState({ w: 1, h: 1 });
  const [customSize, setCustomSize] = useState({ width: 1000, height: 1000 });

  // Update fileType when modal opens logic
  useEffect(() => {
     if (isOpen) {
         setFileType(initialFormat);
         // Reset to certificate defaults if needed
         if (isCertificate) {
           setFormat('letter');
           setOrientation('landscape');
         }
     }
  }, [isOpen, initialFormat, isCertificate]);

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen || !editor) return null;

  const getDimensions = () => {
      // 1. Standard Page Sizes
      if (selectionMode === 'standard') {
          if (format === 'custom') {
              const w = parseInt(customSize.width) || 800;
              const h = parseInt(customSize.height) || 800;
              return { width: w, height: h };
          }
          const size = PAGE_SIZES[format] || PAGE_SIZES.a4;
          return orientation === 'landscape' 
            ? { width: size.height, height: size.width }
            : { width: size.width, height: size.height };
      }
      
      // 2. Aspect Ratios
      const baseSize = 1080; // Standard for digital exports
      let ratio = 1;
      if (selectedRatio === 'custom') {
          ratio = (parseFloat(customRatio.w) || 1) / (parseFloat(customRatio.h) || 1);
      } else {
          ratio = ASPECT_RATIOS[selectedRatio]?.ratio || 1;
      }
      
      return { width: baseSize, height: Math.round(baseSize / ratio) };
  };

  const currentSize = getDimensions();
  const displayWidth = currentSize.width;
  const displayHeight = currentSize.height;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // 1. Get HTML/CSS from editor
      const rawHtml = editor.getHtml();
      const css = editor.getCss();

      // Pre-process HTML to embed images as Base64 (Fixes CORS & Layout Measurement)
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawHtml, 'text/html');
      const images = doc.querySelectorAll('img');
      
      const imagePromises = Array.from(images).map(async (img) => {
          const src = img.getAttribute('src');
          if (!src || src.startsWith('data:')) return;
          try {
              const response = await fetch(src, { mode: 'cors' });
              const blob = await response.blob();
              return new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                      img.src = reader.result;
                      resolve();
                  };
                  reader.readAsDataURL(blob);
              });
          } catch (e) {
              console.warn('Failed to embed image', src);
          }
      });
      
      await Promise.all(imagePromises);
      const html = doc.body.innerHTML; 
      
      // 2. Create a temporary Iframe for valid rendering (Matches Preview EXACTLY)
      const iframe = document.createElement('iframe');
      Object.assign(iframe.style, {
          position: 'absolute',
          top: '0',
          left: '-9999px', // Off-screen but rendered
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
          border: 'none',
          backgroundColor: 'white'
      });
      
      document.body.appendChild(iframe);

      // 3. Write content to Iframe (Same Logic as Preview)
      const iframeDoc = iframe.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(`
          <!DOCTYPE html>
          <html>
          <head>
              <style>
                  ${css}
                  body {
                      background: white;
                      margin: 0;
                      overflow: hidden; 
                  }
                  #wrapper {
                      width: max-content;
                      height: max-content;
                      transform-origin: 0 0;
                      position: absolute;
                      top: 0;
                      left: 0;
                  }
              </style>
          </head>
          <body>
              <div id="wrapper">
                  ${html}
              </div>
          </body>
          </html>
      `);
      iframeDoc.close();

      // Wait for load
      await new Promise(resolve => iframe.onload = resolve);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Safety buffer

      // 3b. Measure Layout & Scale Content to Fit Target (CSS Scaling)
      const wrapper = iframeDoc.getElementById('wrapper');
      
      // Get natural size of content
      const contentWidth = wrapper.scrollWidth || wrapper.offsetWidth;
      const contentHeight = wrapper.scrollHeight || wrapper.offsetHeight;
      
      // Calculate Scale to fit Target Dimensions (displayWidth/Height)
      const scaleX = displayWidth / contentWidth;
      const scaleY = displayHeight / contentHeight;
      const scale = Math.min(scaleX, scaleY); // Fill area proportionally
      
      // Calculate Centering Offsets
      const fitWidth = contentWidth * scale;
      const fitHeight = contentHeight * scale;
      const offsetX = (displayWidth - fitWidth) / 2;
      const offsetY = (displayHeight - fitHeight) / 2;

      // Apply Transform BEFORE capture
      wrapper.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;

      // 4. Capture the EXACT Iframe Viewport
      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2, // 2x resolution for sharpness
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: displayWidth,
        height: displayHeight,
        x: 0,
        y: 0,
        scrollY: 0,
        scrollX: 0
      });

      // 5. Output Processing
      const safeName = (templateName || 'design').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `${safeName}-${displayWidth}x${displayHeight}`;

      if (fileType === 'pdf') {
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: displayWidth > displayHeight ? 'landscape' : 'portrait',
            unit: 'px',
            format: [displayWidth, displayHeight] 
          });
          // Image is already scaled and centered in the canvas, so we place it at 0,0
          pdf.addImage(imgData, 'PNG', 0, 0, displayWidth, displayHeight);
          pdf.save(`${fileName}.pdf`);
      } else {
          // Image Export
          const mimeType = fileType === 'jpeg' ? 'image/jpeg' : 'image/png';
          const extension = fileType === 'jpeg' ? 'jpg' : 'png';
          const dataUrl = canvas.toDataURL(mimeType, 0.9);
          
          const link = document.createElement('a');
          link.download = `${fileName}.${extension}`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
      }

      document.body.removeChild(iframe);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => !isExporting && onClose()} />
      
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col md:flex-row overflow-hidden animate-fade-in-up">
        
        {/* Left: Controls */}
        <div className="w-full md:w-80 bg-slate-50 border-r border-slate-100 flex flex-col p-6 z-10">
           <div className="flex justify-between items-center mb-6">
               <h2 className="font-serif font-bold text-2xl text-[var(--color-dark)]">
                   Export {fileType === 'pdf' ? 'PDF' : 'Image'}
               </h2>
               <button onClick={onClose} disabled={isExporting} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                   <X size={20} />
               </button>
           </div>
           
           <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
               {/* File Type Selection */}
               <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Export Format</label>
                   <div className="flex bg-slate-100 p-1 rounded-xl">
                       {['pdf', 'png', 'jpeg'].map((type) => (
                           <button
                                key={type}
                                onClick={() => setFileType(type)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center gap-1 ${
                                    fileType === type 
                                    ? 'bg-white shadow-sm text-[var(--color-accent)]' 
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                           >
                               {type.toUpperCase()}
                           </button>
                       ))}
                   </div>
               </div>

               {/* Dimension Mode Toggle */}
               <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dimension Mode</label>
                   <div className="flex bg-slate-100 p-1 rounded-xl">
                       <button
                            onClick={() => setSelectionMode('standard')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                selectionMode === 'standard' 
                                ? 'bg-white shadow-sm text-[var(--color-accent)]' 
                                : 'text-slate-400'
                            }`}
                       >
                           Standard Sizes
                       </button>
                       <button
                            onClick={() => setSelectionMode('ratio')}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                selectionMode === 'ratio' 
                                ? 'bg-white shadow-sm text-[var(--color-accent)]' 
                                : 'text-slate-400'
                            }`}
                       >
                           Digital Ratios
                       </button>
                   </div>
               </div>

               {/* Standard Sizes Selection */}
               {selectionMode === 'standard' && (
                   <div>
                       <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                           {fileType === 'pdf' ? 'Paper Size' : 'Standard Pixels'}
                       </label>
                       <div className="grid gap-2 mb-4">
                           {[...Object.entries(PAGE_SIZES), ['custom', { name: 'Custom Pixels' }]].map(([key, size]) => (
                               <button
                                    key={key}
                                    onClick={() => setFormat(key)}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                                        format === key 
                                        ? 'border-[var(--color-accent)] bg-orange-50 text-[var(--color-dark)] shadow-sm' 
                                        : 'border-white bg-white hover:border-slate-200 text-slate-600'
                                    }`}
                               >
                                   <span>{size.name}</span>
                                   {format === key && <Check size={16} className="text-[var(--color-accent)]" />}
                               </button>
                           ))}
                       </div>
                       
                       {format === 'custom' && (
                           <div className="grid grid-cols-2 gap-3 animate-fade-in">
                               <div>
                                   <label className="text-[10px] font-bold text-slate-400 uppercase">Width (px)</label>
                                   <input 
                                       type="number" 
                                       value={customSize.width}
                                       onChange={(e) => setCustomSize({ ...customSize, width: e.target.value })}
                                       className="w-full mt-1 px-3 py-2 bg-slate-100 border-none rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[var(--color-accent)] outline-none"
                                   />
                               </div>
                               <div>
                                   <label className="text-[10px] font-bold text-slate-400 uppercase">Height (px)</label>
                                   <input 
                                       type="number" 
                                       value={customSize.height}
                                       onChange={(e) => setCustomSize({ ...customSize, height: e.target.value })}
                                       className="w-full mt-1 px-3 py-2 bg-slate-100 border-none rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[var(--color-accent)] outline-none"
                                   />
                               </div>
                           </div>
                       )}

                       {/* Orientation (Only for Standard) */}
                       {format !== 'custom' && (
                           <div className="mt-4">
                               <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Orientation</label>
                               <div className="flex gap-2">
                                   {['portrait', 'landscape'].map(o => (
                                       <button
                                            key={o}
                                            onClick={() => setOrientation(o)}
                                            className={`flex-1 py-3 rounded-xl border text-sm font-bold capitalize transition-all ${
                                                orientation === o 
                                                ? 'bg-orange-50 border-[var(--color-accent)] text-[var(--color-accent)] shadow-sm' 
                                                : 'bg-white border-transparent text-slate-400'
                                            }`}
                                       >
                                           {o}
                                       </button>
                                   ))}
                               </div>
                           </div>
                       )}
                   </div>
               )}

               {/* Ratio Selection */}
               {selectionMode === 'ratio' && (
                   <div>
                       <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-orange-500">Popular Aspect Ratios</label>
                       <div className="grid gap-2 mb-4">
                           {[...Object.entries(ASPECT_RATIOS), ['custom', { label: 'Custom Ratio' }]].map(([key, data]) => (
                               <button
                                    key={key}
                                    onClick={() => setSelectedRatio(key)}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                                        selectedRatio === key 
                                        ? 'border-[var(--color-accent)] bg-orange-50 text-[var(--color-dark)] shadow-sm' 
                                        : 'border-white bg-white hover:border-slate-200 text-slate-600'
                                    }`}
                               >
                                   <span>{data.label}</span>
                                   {selectedRatio === key && <Check size={16} className="text-[var(--color-accent)]" />}
                               </button>
                           ))}
                       </div>

                       {selectedRatio === 'custom' && (
                            <div className="flex items-center gap-3 animate-fade-in p-3 bg-orange-50/50 rounded-xl border border-orange-100">
                                <div className="flex-1">
                                    <label className="text-[9px] font-bold text-orange-400 uppercase">Width</label>
                                    <input 
                                        type="number" 
                                        value={customRatio.w}
                                        onChange={(e) => setCustomRatio({ ...customRatio, w: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-bold text-[var(--color-dark)] focus:ring-2 focus:ring-orange-200"
                                    />
                                </div>
                                <div className="font-bold text-slate-300 pt-5">:</div>
                                <div className="flex-1">
                                    <label className="text-[9px] font-bold text-orange-400 uppercase">Height</label>
                                    <input 
                                        type="number" 
                                        value={customRatio.h}
                                        onChange={(e) => setCustomRatio({ ...customRatio, h: e.target.value })}
                                        className="w-full bg-white border border-slate-200 rounded-lg py-2 px-3 text-sm font-bold text-[var(--color-dark)] focus:ring-2 focus:ring-orange-200"
                                    />
                                </div>
                            </div>
                       )}
                   </div>
               )}


           </div>

           <div className="mt-6 pt-6 border-t border-slate-200">
               <div className="flex justify-between text-sm text-slate-500 mb-4">
                   <span>Output:</span>
                   <span className="font-mono">{displayWidth}x{displayHeight}px • {fileType.toUpperCase()}</span>
               </div>
               <button 
                    onClick={handleExport}
                    disabled={isExporting}
                    className="w-full py-3 bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                   {isExporting ? (
                       <span className="animate-pulse">Rendering...</span>
                   ) : (
                       <>
                        <Download size={20} /> Download {fileType.toUpperCase()}
                       </>
                   )}
               </button>
           </div>
        </div>

        {/* Right: Preview Area */}
        <div className="flex-1 bg-slate-200/50 flex items-center justify-center p-8 overflow-auto relative">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
            
            {/* Live Preview Container using Iframe for isolation */}
            <div 
                className="bg-white shadow-2xl transition-all duration-500 relative group origin-center shrink-0"
                style={{
                    width: `${displayWidth}px`,
                    height: `${displayHeight}px`,
                    transform: `scale(${Math.min(0.6, 600 / Math.max(displayWidth, displayHeight))})`, // Auto-scale to fit view
                }}
            >
                <div className="w-full h-full overflow-hidden relative">
                     <iframe 
                        title="preview"
                        srcDoc={`
                            <!DOCTYPE html>
                            <html>
                            <head>
                                <style>
                                    ${editor.getCss() || ''}
                                    body {
                                        background: white;
                                        margin: 0;
                                        overflow: hidden;
                                        height: 100vh;
                                        width: 100vw;
                                        position: relative;
                                    }
                                    #wrapper {
                                        position: absolute;
                                        left: 0;
                                        top: 0;
                                        width: max-content;
                                        height: max-content;
                                        transform-origin: 0 0;
                                    }
                                </style>
                            </head>
                            <body>
                                <div id="wrapper">
                                    ${editor.getHtml() || ''}
                                </div>
                                <script>
                                    const updateLayout = () => {
                                        const wrapper = document.getElementById('wrapper');
                                        const content = wrapper.firstElementChild || wrapper;
                                        
                                        const targetWidth = window.innerWidth;
                                        const targetHeight = window.innerHeight;
                                        
                                        // Measure content
                                        const contentWidth = wrapper.scrollWidth || wrapper.offsetWidth || 1;
                                        const contentHeight = wrapper.scrollHeight || wrapper.offsetHeight || 1;
                                        
                                        // Calculate scale
                                        const scaleX = targetWidth / contentWidth;
                                        const scaleY = targetHeight / contentHeight;
                                        const scale = Math.min(scaleX, scaleY); // Fill area proportionally

                                        // Calculate offsets
                                        const fitWidth = contentWidth * scale;
                                        const fitHeight = contentHeight * scale;
                                        
                                        const offsetX = (targetWidth - fitWidth) / 2;
                                        const offsetY = (targetHeight - fitHeight) / 2;

                                        wrapper.style.transform = 'translate(' + offsetX + 'px, ' + offsetY + 'px) scale(' + scale + ')';
                                    };

                                    window.onload = updateLayout;
                                    window.onresize = updateLayout;
                                </script>
                            </body>
                            </html>
                        `}
                        className="w-full h-full border-none pointer-events-none select-none"
                     />
                     {/* Overlay to prevent interaction */}
                     <div className="absolute inset-0 bg-transparent"></div>
                </div>
            </div>
            
            <div className="absolute bottom-6 right-6 bg-white/80 backdrop-blur px-4 py-2 rounded-full text-xs font-bold text-slate-500 shadow-sm border border-white">
                Preview Mode
            </div>
        </div>

      </div>
    </div>
  );
};

export default ExportModal;
