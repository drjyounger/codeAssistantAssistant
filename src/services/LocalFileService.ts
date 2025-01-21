// src/services/LocalFileService.ts

import { FileNode } from '../types';

interface DirectoryResponse {
    path: string;
    type: 'file' | 'directory';
    children?: DirectoryResponse[];
  }
  
  /**
   * getLocalDirectoryTree
   * Sends a POST to /api/local/directory with { rootPath }
   * Expects a recursive JSON describing folder contents
   */
  export const getLocalDirectoryTree = async (rootPath: string): Promise<DirectoryResponse> => {
    try {
      console.log('Attempting to read directory:', rootPath);
      
      const response = await fetch('/api/local/directory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rootPath }),
      });
  
      // Get the response text first
      const responseText = await response.text();
      
      if (!response.ok) {
        console.error('Server response:', responseText);
        throw new Error(`Failed to read local directory: ${responseText}`);
      }
  
      // Try to parse the response as JSON
      try {
        const data = JSON.parse(responseText);
        
        // Validate the response structure
        if (!data || typeof data !== 'object' || !data.path) {
          throw new Error('Invalid directory response format');
        }
        
        return data;
      } catch (parseError) {
        console.error('Failed to parse server response:', responseText);
        throw new Error('Invalid JSON response from server');
      }
    } catch (error) {
      console.error('Error in getLocalDirectoryTree:', error);
      throw error;
    }
  };
  
  /**
   * readLocalFile
   * Sends a POST to /api/local/file with { filePath }
   * Returns file content as text
   */
  export const readLocalFile = async (filePath: string): Promise<string> => {
    try {
      const response = await fetch('/api/local/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });

      if (!response.ok) {
        throw new Error(`Failed to read file: ${response.statusText}`);
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Error reading local file:', error);
      throw error;
    }
  };
  
  const API_BASE_URL = 'http://localhost:3001/api';
  
  export const readLocalDirectory = async (rootPath: string) => {
    try {
      const response = await fetch('/api/local/directory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rootPath }),
      });

      if (!response.ok) {
        throw new Error(`Failed to read directory: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error reading local directory:', error);
      throw error;
    }
  };
  