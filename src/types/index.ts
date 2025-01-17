// Jira related types
export interface JiraTicket {
  key: string;
  summary: string;
  description: string;
  acceptanceCriteria: string;
  linkedEpics: Array<{
    key: string;
    summary: string;
  }>;
}

// GitHub related types
export interface GitHubPR {
  number: number;
  title: string;
  description: string;
  changedFiles: Array<{
    filename: string;
    status: 'added' | 'modified' | 'removed';
    patch?: string;
  }>;
}

// File selection types
export interface FileNode {
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  selected?: boolean;
}

// Review context types
export interface ReviewContext {
  jiraTicket: JiraTicket | null;
  githubPR: GitHubPR | null;
  selectedFiles: string[];
  additionalFiles: string[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 