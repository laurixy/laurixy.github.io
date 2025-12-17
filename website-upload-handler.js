// ============================================
// WEBSITE UPLOAD HANDLER
// Handles ZIP extraction and website serving
// ============================================

/**
 * Extract ZIP file and save to websites folder
 * @param {string} dataUrl - Base64 encoded ZIP file
 * @param {string} projectId - Project ID
 * @param {string} fileName - Original file name
 */
async function extractAndSaveWebsite(dataUrl, projectId, fileName) {
    try {
        console.log('📦 Starting ZIP extraction...');
        console.log('🆔 Project ID:', projectId);
        
        // Convert data URL to blob
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        
        console.log('✅ Blob created:', blob.size, 'bytes');
        
        // Load JSZip library
        if (typeof JSZip === 'undefined') {
            console.warn('⚠️ JSZip not loaded, loading from CDN...');
            await loadJSZipLibrary();
        }
        
        // Extract ZIP
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(blob);
        
        console.log('✅ ZIP loaded, files found:', Object.keys(zipContent.files).length);
        
        // Extract all files
        const extractedFiles = {};
        for (const [path, file] of Object.entries(zipContent.files)) {
            if (!file.dir) {
                const content = await file.async('string');
                extractedFiles[path] = content;
                console.log('📄 Extracted:', path);
            }
        }
        
        // Save to localStorage (for small files) or IndexedDB (for larger files)
        await saveExtractedFiles(projectId, extractedFiles, fileName);
        
        console.log('✅ Website extracted and saved successfully!');
        return {
            success: true,
            projectId: projectId,
            filesCount: Object.keys(extractedFiles).length,
            url: `./websites/${projectId}/`
        };
        
    } catch (error) {
        console.error('❌ Extraction error:', error);
        throw error;
    }
}

/**
 * Save extracted files to storage
 */
async function saveExtractedFiles(projectId, files, fileName) {
    try {
        // Create storage key
        const storageKey = `website_${projectId}`;
        
        // Save to localStorage (with size check)
        const filesData = {
            projectId: projectId,
            fileName: fileName,
            files: files,
            extractedAt: new Date().toISOString(),
            fileCount: Object.keys(files).length
        };
        
        const dataSize = JSON.stringify(filesData).length;
        console.log('💾 Storage size:', (dataSize / 1024 / 1024).toFixed(2), 'MB');
        
        // Try localStorage first
        try {
            localStorage.setItem(storageKey, JSON.stringify(filesData));
            console.log('✅ Saved to localStorage:', storageKey);
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                console.warn('⚠️ localStorage full, using IndexedDB...');
                await saveToIndexedDB(storageKey, filesData);
            } else {
                throw e;
            }
        }
        
    } catch (error) {
        console.error('❌ Save error:', error);
        throw error;
    }
}

/**
 * Save to IndexedDB for larger files
 */
async function saveToIndexedDB(key, data) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('LAURIXY_Websites', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['websites'], 'readwrite');
            const store = transaction.objectStore('websites');
            store.put({ key: key, data: data });
            
            transaction.oncomplete = () => {
                console.log('✅ Saved to IndexedDB:', key);
                resolve();
            };
            transaction.onerror = () => reject(transaction.error);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('websites')) {
                db.createObjectStore('websites', { keyPath: 'key' });
            }
        };
    });
}

/**
 * Load JSZip library from CDN
 */
function loadJSZipLibrary() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        script.onload = () => {
            console.log('✅ JSZip loaded');
            resolve();
        };
        script.onerror = () => reject(new Error('Failed to load JSZip'));
        document.head.appendChild(script);
    });
}

/**
 * Get website files from storage
 */
async function getWebsiteFiles(projectId) {
    try {
        const storageKey = `website_${projectId}`;
        
        // Try localStorage first
        const localData = localStorage.getItem(storageKey);
        if (localData) {
            console.log('✅ Found in localStorage:', projectId);
            return JSON.parse(localData);
        }
        
        // Try IndexedDB
        const idbData = await getFromIndexedDB(storageKey);
        if (idbData) {
            console.log('✅ Found in IndexedDB:', projectId);
            return idbData;
        }
        
        console.warn('⚠️ Website not found:', projectId);
        return null;
        
    } catch (error) {
        console.error('❌ Get error:', error);
        return null;
    }
}

/**
 * Get from IndexedDB
 */
function getFromIndexedDB(key) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('LAURIXY_Websites', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(['websites'], 'readonly');
            const store = transaction.objectStore('websites');
            const getRequest = store.get(key);
            
            getRequest.onsuccess = () => {
                resolve(getRequest.result ? getRequest.result.data : null);
            };
            getRequest.onerror = () => reject(getRequest.error);
        };
    });
}

/**
 * Serve website from storage
 */
async function serveWebsite(projectId) {
    try {
        const websiteData = await getWebsiteFiles(projectId);
        
        if (!websiteData) {
            console.error('❌ Website not found:', projectId);
            return null;
        }
        
        console.log('🌐 Serving website:', projectId);
        console.log('📁 Files:', websiteData.fileCount);
        
        return websiteData;
        
    } catch (error) {
        console.error('❌ Serve error:', error);
        return null;
    }
}

/**
 * Create virtual server for website
 */
function createWebsiteServer(projectId) {
    return {
        projectId: projectId,
        getFile: async (path) => {
            const websiteData = await getWebsiteFiles(projectId);
            if (!websiteData) return null;
            
            // Try exact path
            if (websiteData.files[path]) {
                return websiteData.files[path];
            }
            
            // Try index.html
            if (path === '/' || path === '') {
                return websiteData.files['index.html'] || websiteData.files['./index.html'];
            }
            
            return null;
        },
        listFiles: async () => {
            const websiteData = await getWebsiteFiles(projectId);
            return websiteData ? Object.keys(websiteData.files) : [];
        }
    };
}

console.log('✅ Website Upload Handler loaded');
