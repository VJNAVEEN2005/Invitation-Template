/**
 * Export a given HTML element as a PDF via Browser Print
 * ensuring text remains selectable and vectors are preserved.
 * @param {string} html - The HTML string to export
 * @param {string} css - The CSS string to export
 * @param {string} fileName - The desired filename (used as document title)
 */
export const exportToPDF = (html, css, fileName = 'design') => {
  const iframe = document.createElement('iframe');
  // Hide iframe but keep it part of the DOM
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${fileName}</title>
          <style>
            /* Reset for print */
            @page { 
                size: auto; 
                margin: 0mm; 
            }
            body { 
                margin: 0; 
                padding: 0; 
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
                background-color: white;
            }
            /* Inject template CSS */
            ${css}
            /* Additional print overrides if needed */
            @media print {
                body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `);
  doc.close();

  // Allow resources to load/render
  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();

    // Clean up after print dialog closes (approximate)
    // We can't know for sure when it closes, so we leave it 
    // or remove it after a long delay. 
    // Removing it too early breaks the print preview on some browsers.
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000); // 2 seconds delay
  }, 500);
};

/**
 * Export a given HTML content as a Word Document (.doc)
 * @param {string} htmlContent - The HTML string to export
 * @param {string} fileName - The desired filename
 */
export const exportToWord = (htmlContent, fileName = 'design.doc') => {
  const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title></head><body>";
  const footer = "</body></html>";
  const sourceHTML = header + htmlContent + footer;

  const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
  const fileDownload = document.createElement("a");
  document.body.appendChild(fileDownload);
  fileDownload.href = source;
  fileDownload.download = fileName;
  fileDownload.click();
  document.body.removeChild(fileDownload);
};

// Helper to embed images for html2canvas
const embedImages = async (root) => {
  const images = root.querySelectorAll('img');
  const promises = Array.from(images).map(async (img) => {
    const src = img.getAttribute('src');
    if (!src || src.startsWith('data:')) return;
    try {
      const response = await fetch(src, { mode: 'cors' });
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          img.src = reader.result;
          resolve();
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Failed to embed image:', src, error);
    }
  });
  await Promise.all(promises);
};

/**
 * Export HTML content as an Image (PNG/JPEG)
 * Uses html2canvas-pro to render the content off-screen.
 * @param {object} editor - GrapesJS editor instance
 * @param {string} format - 'png' or 'jpeg'
 * @param {string} fileName - Base filename
 */
import html2canvas from 'html2canvas-pro';

export const exportToImage = async (editor, format = 'png', fileName = 'design') => {
  // 1. Get Content
  const html = editor.getHtml();
  const css = editor.getCss();

  // 2. Prepare Container (A4 Default for Quick Export)
  // We assume A4 Portrait (794x1123) as default base size if just clicking export
  const width = 794;
  const height = 1123;

  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '-9999px';
  container.style.left = '0';
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.backgroundColor = 'white';

  // Inject and Scale
  container.innerHTML = `<style>${css} body { margin: 0; padding: 0; background: white; }</style>${html}`;
  document.body.appendChild(container);

  try {
    // Embed Images
    await embedImages(container);

    // Auto-Fit Logic (Mini version of Modal's logic)
    // We only scale down if it overflows A4 height
    const wrapper = container.querySelector('.invitation-container') || container.firstElementChild;
    if (wrapper) {
      // Wait a tick for layout
      await new Promise(r => setTimeout(r, 100));
      if (wrapper.scrollHeight > height) {
        const scale = (height / wrapper.scrollHeight) * 0.96;
        wrapper.style.transformOrigin = 'top center';
        wrapper.style.transform = `scale(${scale})`;
        wrapper.style.width = '100%';
      }
    }

    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 300));

    // 3. Capture
    const canvas = await html2canvas(container, {
      scale: 2, // High res
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      allowTaint: true,
    });

    // 4. Download
    const mimeType = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const extension = format === 'jpeg' ? 'jpg' : 'png';
    const dataUrl = canvas.toDataURL(mimeType, 0.9);

    const link = document.createElement('a');
    link.download = `${fileName}.${extension}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error('Image export failed:', error);
    alert('Failed to export image. Please try again.');
  } finally {
    document.body.removeChild(container);
  }
};
