import { v4 as uuidv4 } from 'uuid';
import { TEMPLATES } from '../data/templates';

const STORAGE_KEY = 'design_studio_projects';

// Helper to get all projects
const getProjects = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
};

// Helper to save all projects
const saveProjects = (projects) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};

export const getAllDesigns = () => {
    return getProjects().sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
};

export const getDesignsByType = (type) => {
    return getProjects()
        .filter(p => p.type === type)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
};

export const getDesignById = (id) => {
    return getProjects().find(p => p.id === id);
};

export const saveDesign = (design) => {
    const projects = getProjects();
    const index = projects.findIndex(p => p.id === design.id);

    const updatedDesign = {
        ...design,
        updatedAt: new Date().toISOString()
    };

    if (index >= 0) {
        projects[index] = updatedDesign;
    } else {
        updatedDesign.createdAt = new Date().toISOString();
        projects.push(updatedDesign);
    }

    saveProjects(projects);
    return updatedDesign;
};

export const deleteDesign = (id) => {
    const projects = getProjects().filter(p => p.id !== id);
    saveProjects(projects);
};

export const renameDesign = (id, newName) => {
    const projects = getProjects();
    const project = projects.find(p => p.id === id);
    if (project) {
        project.name = newName;
        project.updatedAt = new Date().toISOString();
        saveProjects(projects);
        return project;
    }
    return null;
};

export const createDesignFromAi = (name, html, css, type = 'invitation') => {
    const newDesign = {
        id: uuidv4(),
        templateId: 'ai-generated',
        type: type,
        name: name || 'AI Generated Design',
        html: html,
        css: css,
        content: null, // AI designs start with raw HTML/CSS, not GrapesJS JSON
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };

    saveDesign(newDesign);
    return newDesign;
};

export const createDesignFromTemplate = (templateId) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) throw new Error('Template not found');

    const newDesign = {
        id: uuidv4(),
        templateId: template.id,
        type: template.type,
        name: `My ${template.name}`,
        content: template.content, // Initial content from template matches GrapesJS format
        html: template.html, // Snapshot for preview
        css: template.css,   // Snapshot for preview
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
    };

    saveDesign(newDesign);
    return newDesign;
};

// AI Configuration
export const getAiConfig = () => {
    const data = localStorage.getItem('gemini_ai_config');
    return data ? JSON.parse(data) : { apiKey: '', model: 'gemini-1.5-flash' };
};

export const saveAiConfig = (config) => {
    localStorage.setItem('gemini_ai_config', JSON.stringify(config));
};
