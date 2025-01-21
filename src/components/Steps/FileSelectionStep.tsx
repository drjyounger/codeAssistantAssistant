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
import { concatenateFiles } from '../../services/FileService';
import { GitHubPR, GitHubFile } from '../../types';

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

  const handleNext = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the PR number if it exists
      const prNumber = pr?.number?.toString() || '';
      
      // Call the concatenation service
      const response = await fetch('/api/concatenate-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: selectedFiles,
          prNumber
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to concatenate files: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Store the concatenated content
        localStorage.setItem('concatenatedFiles', result.data);
        navigate('/additional-files');
      } else {
        throw new Error(result.error || 'Failed to concatenate files');
      }
    } catch (err) {
      console.error('Error processing files:', err);
      setError(err instanceof Error ? err.message : 'Failed to process selected files');
    } finally {
      setLoading(false);
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

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/github-pr')}
          disabled={loading}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
          disabled={loading || selectedFiles.length === 0}
        >
          {loading ? <CircularProgress size={24} /> : 'Next'}
        </Button>
      </Box>
    </Paper>
  );
};

export default FileSelectionStep;
