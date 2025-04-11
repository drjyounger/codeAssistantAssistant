// Storage keys
export const STORAGE_KEYS = {
  JIRA_TICKETS: 'jiraTickets',
  CONCATENATED_FILES: 'concatenatedFiles',
  ADDITIONAL_FILES: 'additionalFiles',
};

// Maximum size for localStorage (5MB in bytes)
const LOCAL_STORAGE_MAX_SIZE = 5 * 1024 * 1024;

// IndexedDB setup
const DB_NAME = 'CodingAssistantDB';
const DB_VERSION = 1;
const STORE_NAME = 'files';

// Initialize IndexedDB
const initIndexedDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => reject(new Error('IndexedDB error'));
    
    request.onsuccess = (event) => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

// Storage functions
export const saveJiraTickets = (tickets: any[]) => {
  localStorage.setItem(STORAGE_KEYS.JIRA_TICKETS, JSON.stringify(tickets));
};

export const getJiraTickets = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.JIRA_TICKETS);
  return stored ? JSON.parse(stored) : null;
};

export const saveConcatenatedFiles = async (content: string): Promise<void> => {
  try {
    // Try localStorage first if content is small enough
    if (content.length < LOCAL_STORAGE_MAX_SIZE) {
      localStorage.setItem(STORAGE_KEYS.CONCATENATED_FILES, content);
      // Clear any previous IndexedDB storage for this key
      try {
        const db = await initIndexedDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete(STORAGE_KEYS.CONCATENATED_FILES);
      } catch (e) {
        console.warn('Failed to clear IndexedDB after saving to localStorage', e);
      }
      return;
    }
    
    // Content is too large for localStorage, use IndexedDB
    const db = await initIndexedDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Save data to IndexedDB
    store.put({
      id: STORAGE_KEYS.CONCATENATED_FILES,
      content: content
    });
    
    // Set a flag in localStorage to indicate content is in IndexedDB
    localStorage.setItem(STORAGE_KEYS.CONCATENATED_FILES, 'STORED_IN_INDEXED_DB');
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(new Error('Error saving to IndexedDB'));
    });
  } catch (error) {
    console.error('Error saving concatenated files:', error);
    throw error;
  }
};

export const getConcatenatedFiles = async (): Promise<string | null> => {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEYS.CONCATENATED_FILES);
    
    // If not in IndexedDB, return from localStorage
    if (!storedValue) return null;
    if (storedValue !== 'STORED_IN_INDEXED_DB') return storedValue;
    
    // Retrieve from IndexedDB
    const db = await initIndexedDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(STORAGE_KEYS.CONCATENATED_FILES);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.content);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(new Error('Error retrieving from IndexedDB'));
    });
  } catch (error) {
    console.error('Error getting concatenated files:', error);
    return null;
  }
};

export const saveAdditionalFiles = (files: string[]) => {
  localStorage.setItem(STORAGE_KEYS.ADDITIONAL_FILES, JSON.stringify(files));
};

export const getAdditionalFiles = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.ADDITIONAL_FILES);
  return stored ? JSON.parse(stored) : [];
}; 