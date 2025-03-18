// src/services/FileService.ts

import { FileNode, ApiResponse } from '../types';
import {
  getLocalDirectoryTree,
  readLocalFile,
} from './LocalFileService';

/**
 * Directories or subdirectories to ignore
 */
const STANDARD_DIRS = new Set([
  'node_modules', 'dist', 'build', '.git', '.idea', '.vscode',
  'coverage', 'vendor', '__pycache__', 'env', 'venv'
]);

/**
 * File extensions considered "text" for concatenation
 */
const TEXT_EXTENSIONS = new Set([
  '.txt', '.md', '.py', '.js', '.html', '.css', '.json', '.xml',
  '.yaml', '.yml', '.sh', '.bat', '.ps1', '.java', '.c', '.cpp',
  '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.ts', '.jsx',
  '.tsx', '.vue', '.scala', '.kt', '.groovy', '.gradle', '.sql',
  '.gitignore', '.env', '.cfg', '.ini', '.toml', '.csv'
]);

/**
 * Helper to decide if a given file is textual
 */
export const isTextFile = (filename: string): boolean => {
  if (filename === '.cursorrules') return true;
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
};

/**
 * Helper to skip "standard" directories
 */
export const isStandardLibraryPath = (path: string): boolean => {
  return Array.from(STANDARD_DIRS).some((dir) =>
    path.toLowerCase().includes(`/${dir.toLowerCase()}/`)
  );
};

/**
 * Map file extensions to syntax highlights (for the Markdown code fence)
 */
export const getLanguageFromExtension = (filename: string): string => {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
  const languageMap: Record<string, string> = {
    '.py': 'python',
    '.js': 'javascript',
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.jsx': 'javascript',
    '.html': 'html',
    '.css': 'css',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.rb': 'ruby',
    '.php': 'php',
    '.go': 'go',
    '.rs': 'rust',
    '.sql': 'sql',
  };
  return languageMap[ext] || 'text';
};

/**
 * getDirectoryTree
 * Recursively fetches a local directory tree, then converts it
 * into a FileNode structure, skipping standard directories.
 */
export const getDirectoryTree = async (rootPath: string): Promise<FileNode> => {
  try {
    // Sanitize the path input
    const normalizedPath = rootPath.trim();
    if (!normalizedPath) {
      throw new Error('Root path cannot be empty');
    }

    // Add logging for debugging
    console.log('Attempting to fetch directory tree for:', normalizedPath);
    
    const rawTree = await getLocalDirectoryTree(normalizedPath);
    
    // Add validation for the response
    if (!rawTree || typeof rawTree !== 'object') {
      throw new Error('Invalid directory tree response');
    }

    const buildTree = (entry: any): FileNode | null => {
      if (!entry || !entry.path) {
        return null;
      }

      // If it's a standard library path, skip it
      if (isStandardLibraryPath(entry.path)) {
        return null;
      }

      const node: FileNode = {
        title: entry.path,
        key: entry.path,
        isLeaf: entry.type === 'file',
        children: [],
      };

      if (entry.type === 'directory' && entry.children) {
        for (const child of entry.children) {
          const childNode = buildTree(child);
          if (childNode) {
            node.children?.push(childNode);
          }
        }
      }
      return node;
    };

    const treeNode = buildTree(rawTree);
    if (!treeNode) {
      throw new Error('Root directory is excluded or invalid');
    }
    return treeNode;
  } catch (error) {
    console.error('Error in getDirectoryTree:', error);
    throw error;
  }
};

// export const concatenateFiles = async (
//   selectedPaths: string[],
//   prNumber: string
// ): Promise<ApiResponse<string>> => {
//   ...
// };
