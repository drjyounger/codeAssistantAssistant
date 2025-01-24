import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert
} from '@mui/material';
import { REFERENCE_FILES, ReferenceFile } from '../../references/referenceManifest';
import { readReferenceFile } from '../../services/LocalFileService';

const AdditionalFilesStep: React.FC = () => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verify we have required data from previous steps
    const concatenatedFiles = localStorage.getItem('concatenatedFiles');
    if (!concatenatedFiles) {
      navigate('/file-selection');
    }
  }, [navigate]);

  const handleFileToggle = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleNext = async () => {
    try {
      // Store selected reference file IDs
      const selectedFilesArray = Array.from(selectedFiles);
      localStorage.setItem('selectedReferenceIds', JSON.stringify(selectedFilesArray));
      
      // Also store the actual reference file contents
      const referenceContents: Record<string, string> = {};
      
      for (const fileId of selectedFilesArray) {
        const referenceFile = REFERENCE_FILES.find(f => f.id === fileId);
        if (referenceFile) {
          try {
            const content = await readReferenceFile(referenceFile.path);
            referenceContents[fileId] = content;
          } catch (err) {
            console.error(`Failed to read reference file ${fileId}:`, err);
          }
        }
      }
      
      localStorage.setItem('referenceContents', JSON.stringify(referenceContents));
      navigate('/submit-review');
    } catch (err) {
      setError('Failed to save selected reference files');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h5" component="h1" gutterBottom>
        Step 4: Select Additional Reference Files
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <FormGroup sx={{ mb: 3 }}>
        {REFERENCE_FILES.map((file) => (
          <FormControlLabel
            key={file.id}
            control={
              <Checkbox
                checked={selectedFiles.has(file.id)}
                onChange={() => handleFileToggle(file.id)}
              />
            }
            label={`${file.name} (${file.type})`}
          />
        ))}
      </FormGroup>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={() => navigate('/file-selection')}
        >
          Back
        </Button>
        <Button
          variant="contained"
          onClick={handleNext}
        >
          Next
        </Button>
      </Box>
    </Paper>
  );
};

export default AdditionalFilesStep; 