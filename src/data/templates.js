
// Use Vite's import.meta.glob to dynamically load all HTML and CSS files
const htmlFiles = import.meta.glob('./**/*.html', { query: '?raw', import: 'default', eager: true });
const cssFiles = import.meta.glob('./**/*.css', { query: '?raw', import: 'default', eager: true });

const templatesMap = {};

// Process HTML files
Object.keys(htmlFiles).forEach((path) => {
  // path example: "./invitation/college/index.html"
  const parts = path.split('/');
  if (parts.length < 4) return;

  const type = parts[1]; // "invitation" or "poster"
  const id = parts[2];   // "college", "talk", etc.
  const key = `${type}-${id}`;

  if (!templatesMap[key]) {
    templatesMap[key] = {
      id: key,
      type: type,
      // Convert "college-event" to "College Event"
      name: id
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' '),
      html: htmlFiles[path],
      css: '',
    };
  } else {
    templatesMap[key].html = htmlFiles[path];
  }
});

// Process CSS files
Object.keys(cssFiles).forEach((path) => {
  // path example: "./invitation/college/styles.css"
  const parts = path.split('/');
  if (parts.length < 4) return;

  const type = parts[1];
  const id = parts[2];
  const key = `${type}-${id}`;

  if (templatesMap[key]) {
    templatesMap[key].css = cssFiles[path];
  }
});

// Export array with combined content for GrapesJS
export const TEMPLATES = Object.values(templatesMap).map(t => ({
  ...t,
  // Combine for GrapesJS editor
  content: `<style>${t.css}</style>${t.html}`,
  // No static thumbnail anymore, Dashboard will render live preview
}));
