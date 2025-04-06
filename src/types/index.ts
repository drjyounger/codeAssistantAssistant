// API response type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// File types
export interface FileNode {
  title: string;
  key: string;
  isLeaf: boolean;
  children?: FileNode[];
}

// Jira types
export interface JiraTicket {
  key: string;
  fields: {
    summary: string;
    description: string;
    // Add other relevant Jira fields as needed
  };
}

export interface JiraTicketDetails {
  tickets: JiraTicket[];
}

// Design image types
export interface DesignImage {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  preview?: string;
}

// System prompt types
export interface SystemPromptParams {
  jiraTickets: JiraTicket[];
  concatenatedFiles: string;
  referenceFiles: any[];
  designImages?: DesignImage[];
} 