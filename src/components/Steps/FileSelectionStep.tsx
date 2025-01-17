// src/components/Steps/FileSelectionStep.tsx

import React, { useState, useEffect } from 'react';
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

import FileTree from '../FileTree';
import { concatenateFiles } from '../../services/FileService';
import { GitHubPR } from '../../types';

const FileSelectionStep: React.FC = () => {
  const navigate = useNavigate();
  const [rootPath, setRootPath] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pr, setPR] = useState<GitHubPR | null>(null);

  // On mount, retrieve the PR from localStorage (optional)
  useEffect(() => {
    const prData = localStorage.getItem('githubPR');
    if (!prData) {
      // If no PR info, possibly redirect
      navigate('/github-pr');
      return;
    }
    setPR(JSON.parse(prData));
  }, [navigate]);

  /**
   * Handle the "Root Path" form submission
   */
  const handlePathSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootPath) {
      setError('Please enter a root directory path');
      return;
    }
    setError(null);
  };

  /**
   * Called when the user selects/deselects files in the FileTree
   */
  const handleFileSelect = (files: string[]) => {
    setSelectedFiles(files);
  };

  /**
   * When user clicks "Next", we actually concatenate the selected files
   * and store the result for the next step
   */
  const handleNext = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // We pass pr?.number.toString() only if we care about it; for local, it's optional
      const concatenatedContent = await concatenateFiles(
        selectedFiles,
        pr?.number.toString() || ''
      );

      if (concatenatedContent.success && concatenatedContent.data) {
        // Save the big markdown in localStorage
        localStorage.setItem('concatenatedFiles', concatenatedContent.data);
        navigate('/additional-files');
      } else {
        throw new Error(concatenatedContent.error);
      }
    } catch (err) {
      setError('Failed to process selected files');
      console.error(err);
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

      {/* Simple form for user to type the local directory path */}
      <form onSubmit={handlePathSubmit}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            label="Root Directory Path"
            value={rootPath}
            onChange={(e) => setRootPath(e.target.value)}
            placeholder="e.g., /Users/jamie/my-project"
            disabled={loading}
          />
        </Box>
      </form>

      {/* Only show the FileTree if we have a root path */}
      {rootPath && (
        <Box sx={{ mb: 3, height: '400px', overflow: 'auto' }}>
          <FileTree
            rootPath={rootPath}
            onSelect={handleFileSelect}
            changedFiles={pr?.changedFiles || []}
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
          endIcon={loading && <CircularProgress size={20} />}
        >
          Next
        </Button>
      </Box>
    </Paper>
  );
};

export default FileSelectionStep;
