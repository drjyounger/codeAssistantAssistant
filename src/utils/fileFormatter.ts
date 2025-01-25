export const formatConcatenatedFiles = async (
  selectedFiles: string[],
  getFileContent: (path: string) => Promise<string>
): Promise<string> => {
  const stats = {
    processedFiles: 0,
    ignoredFiles: 0,
    errors: 0,
    totalTokens: 0
  };
  // Table of contents
  let concatenated = '## Table of Contents\n\n';
  selectedFiles.forEach(path => {
    concatenated += `- ${path}\n`;
  });
  concatenated += '\n---\n\n';

  // Process each file
  for (const filePath of selectedFiles) {
    try {
      const content = await getFileContent(filePath);
      const extension = filePath.split('.').pop()?.toLowerCase() || 'txt';
      
      concatenated += `## File: ${filePath}\n\n`;
      concatenated += `\`\`\`${extension}\n${content}\n\`\`\`\n\n`;
      stats.processedFiles++;
    } catch (err) {
      stats.errors++;
      concatenated += `## File: ${filePath}\n\n[Error reading file]\n\n`;
    }
  }

  return concatenated;
};

const getLanguageFromExtension = (ext: string): string => {
  const languageMap: Record<string, string> = {
    'py': 'python',
    'js': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'jsx': 'javascript',
    'html': 'html',
    'css': 'css',
    'md': 'markdown',
    'sql': 'sql',
    'sh': 'bash',
    'txt': 'plaintext',
    'env': 'plaintext'
  };

  return languageMap[ext] || 'plaintext';
}; 