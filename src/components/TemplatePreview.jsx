import React, { useRef, useEffect, useState } from 'react';

const TemplatePreview = ({ html, css }) => {
  const containerRef = useRef(null);
  const shadowRootRef = useRef(null);
  const [wrapperSize, setWrapperSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (containerRef.current && !shadowRootRef.current) {
      try {
        shadowRootRef.current = containerRef.current.attachShadow({ mode: 'open' });
      } catch (e) {
        console.error("Failed to attach shadow root", e);
      }
    }
  }, []);

  useEffect(() => {
    if (shadowRootRef.current) {
      shadowRootRef.current.innerHTML = '';
      
      const style = document.createElement('style');
      style.textContent = `
        :host {
          display: block;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: white;
        }
        .preview-wrapper {
          width: 100%; 
          height: 100%;
          /* Force container to act as a responsive viewport */
          display: flex;
          align-items: center;
          justify-content: center;
          /* Scale down content to fit */
          transform-origin: top left;
        }
        .content-container {
             width: 100%;
             height: 100%;
             /* Reset content styles */
             ${css}
        }
      `;
      shadowRootRef.current.appendChild(style);

      const wrapper = document.createElement('div');
      wrapper.className = 'preview-wrapper';
      
      const content = document.createElement('div');
      content.className = 'content-container';
      content.innerHTML = html;
      
      wrapper.appendChild(content);
      shadowRootRef.current.appendChild(wrapper);
    }
  }, [html, css]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
};

export default TemplatePreview;
