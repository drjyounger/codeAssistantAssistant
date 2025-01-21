import { PRDetails } from '../types';

export const STORAGE_KEYS = {
  GITHUB_PRS: 'githubPRs',
  REVIEW_RESULT: 'reviewResult',
  SELECTED_FILES: 'selectedFiles',
} as const;

export const saveGitHubPRs = (prs: PRDetails) => {
  localStorage.setItem(STORAGE_KEYS.GITHUB_PRS, JSON.stringify(prs));
};

export const getGitHubPRs = (): PRDetails | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.GITHUB_PRS);
  return stored ? JSON.parse(stored) : null;
}; 