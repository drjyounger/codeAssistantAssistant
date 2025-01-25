// Jira related types
export interface JiraTicket {
  key: string;
  summary: string;
  description: string;
}

// GitHub related types
export interface GitHubFile {
  filename: string;
  status: 'added' | 'modified' | 'removed';
  patch: string | undefined;
}

export interface GitHubPR {
  title: string;
  description: string;
  number: number;
  repo: {
    owner: string;
    name: string;
  };
  changedFiles: GitHubFile[];
  author?: string;
  createdAt?: string;
  isMerged?: boolean;
  mergeable?: boolean;
  labels?: string[];
}

export interface PRDetails {
  frontend: GitHubPR | null;
  backend: GitHubPR | null;
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
  jiraTickets: JiraTicket[];
  selectedFiles: string[];
  additionalFiles: string[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
} 