// Storage keys
export const STORAGE_KEYS = {
  JIRA_TICKETS: 'jiraTickets',
  CONCATENATED_FILES: 'concatenatedFiles',
  ADDITIONAL_FILES: 'additionalFiles',
};

// Storage functions
export const saveJiraTickets = (tickets: any[]) => {
  localStorage.setItem(STORAGE_KEYS.JIRA_TICKETS, JSON.stringify(tickets));
};

export const getJiraTickets = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.JIRA_TICKETS);
  return stored ? JSON.parse(stored) : null;
};

export const saveConcatenatedFiles = (content: string) => {
  localStorage.setItem(STORAGE_KEYS.CONCATENATED_FILES, content);
};

export const getConcatenatedFiles = () => {
  return localStorage.getItem(STORAGE_KEYS.CONCATENATED_FILES);
};

export const saveAdditionalFiles = (files: string[]) => {
  localStorage.setItem(STORAGE_KEYS.ADDITIONAL_FILES, JSON.stringify(files));
};

export const getAdditionalFiles = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.ADDITIONAL_FILES);
  return stored ? JSON.parse(stored) : [];
}; 