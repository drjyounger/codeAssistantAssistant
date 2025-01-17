// src/services/LocalFileService.ts

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
    const response = await fetch('/api/local/directory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rootPath }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to read local directory');
    }
  
    return response.json();
  };
  
  /**
   * readLocalFile
   * Sends a POST to /api/local/file with { filePath }
   * Returns file content as text
   */
  export const readLocalFile = async (filePath: string): Promise<string> => {
    const response = await fetch('/api/local/file', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ filePath }),
    });
  
    if (!response.ok) {
      throw new Error('Failed to read local file');
    }
  
    return response.text();
  };
  