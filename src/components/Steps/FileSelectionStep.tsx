// src/components/Steps/FileSelectionStep.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Alert,
  TextField,
} from '@mui/material';

import { FileTree } from '../FileTree';
import { GitHubPR, GitHubFile } from '../../types';
import { formatConcatenatedFiles } from '../../utils';

interface FileTreeProps {
  rootPath: string;
  onSelect: (files: string[]) => void;
  changedFiles: GitHubFile[];
  onError: (error: Error) => void;
}

const FileSelectionStep: React.FC = () => {
  const navigate = useNavigate();
  const [rootPath, setRootPath] = useState<string>('');
  const [showTree, setShowTree] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pr, setPR] = useState<GitHubPR | null>(null);
  const [concatenatedContent, setConcatenatedContent] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  const changedFiles = useMemo(() => pr?.changedFiles || [], [pr]);

  useEffect(() => {
    // Load PR data from localStorage
    try {
      const prData = localStorage.getItem('githubPRs');
      if (prData) {
        setPR(JSON.parse(prData));
      }
    } catch (err) {
      console.error('Error loading PR data:', err);
    }
  }, []);

  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRootPath(e.target.value);
    setShowTree(false); // Hide tree when path changes
    setError(null);
  };

  const handleFetchDirectory = () => {
    setLoading(true);
    setError(null);
    
    try {
      const trimmedPath = rootPath.trim();
      if (!trimmedPath) {
        throw new Error('Please enter a valid root directory path');
      }

      console.log('Fetching directory for path:', trimmedPath);
      setShowTree(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid path');
      setShowTree(false);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (files: string[]) => {
    console.log('Selected files:', files);
    setSelectedFiles(files);
  };

  const handleConcatenate = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setLoading(true);
    setError(null);
    setShowSuccess(false);

    try {
      // Function to get file content
      const getFileContent = async (filePath: string): Promise<string> => {
        const response = await fetch('/api/local/file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filePath })
        });
        
        const data = await response.json();
        if (!data.success) throw new Error(data.error);
        return data.content;
      };

      const finalContent = await formatConcatenatedFiles(selectedFiles, getFileContent);
      setConcatenatedContent(finalContent);
      setShowSuccess(true);
      
      // Store in localStorage for next step
      localStorage.setItem('concatenatedFiles', finalContent);

      // Scroll to the concatenated content
      setTimeout(() => {
        document.getElementById('concatenated-content')?.scrollIntoView({ 
          behavior: 'smooth' 
        });
      }, 100);
    } catch (err) {
      console.error('Error processing files:', err);
      setError(err instanceof Error ? err.message : 'Failed to process selected files');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (concatenatedContent) {
      localStorage.setItem('concatenatedFiles', concatenatedContent);
      navigate('/additional-files');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Step 3: Select Files for Review
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {showSuccess && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Files successfully concatenated! Scroll down to view the result.
        </Alert>
      )}

      <Box component="form" sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Root Directory Path
        </Typography>
        <TextField
          fullWidth
          value={rootPath}
          onChange={handlePathChange}
          placeholder="/path/to/your/project"
          sx={{ mb: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleFetchDirectory}
          disabled={loading || !rootPath.trim()}
        >
          {loading ? <CircularProgress size={24} /> : 'Fetch Directory'}
        </Button>
      </Box>

      {showTree && !error && (
        <Box sx={{ mb: 3, height: '400px', overflow: 'auto' }}>
          <FileTree
            rootPath={rootPath}
            onSelect={handleFileSelect}
            changedFiles={changedFiles}
            onError={(error: Error) => setError(error.message)}
          />
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/github-pr')}
          disabled={loading}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleConcatenate}
          disabled={loading || selectedFiles.length === 0}
        >
          {loading ? <CircularProgress size={20} /> : 'Concatenate Files'}
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={loading || !concatenatedContent}
        >
          Next
        </Button>
      </Box>

      {/* Display concatenated content */}
      {concatenatedContent && (
        <Box sx={{ mt: 2 }} id="concatenated-content">
          <Typography variant="h6" gutterBottom>
            Concatenated Files
          </Typography>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '1rem',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '400px',
            border: '1px solid #e0e0e0'
          }}>
            {concatenatedContent}
          </pre>
        </Box>
      )}
    </Paper>
  );
};

export default FileSelectionStep;

