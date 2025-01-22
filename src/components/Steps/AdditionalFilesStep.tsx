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

interface ReferenceFile {
  id: string;
  name: string;
  type: 'coding-standard' | 'schema' | 'reference' | 'business-context';
  path: string;
}

const REFERENCE_FILES: ReferenceFile[] = [
  {
    id: 'coding-standards',
    name: 'Design & Coding Standards',
    type: 'coding-standard',
    path: '/references/designCodingStandards.md'
  },
  {
    id: 'db-schema',
    name: 'Database Schema',
    type: 'schema',
    path: '/references/databaseSchema.md'
  },
  {
    id: 'business-context',
    name: 'Business Context',
    type: 'business-context',
    path: '/references/businessContext.md'
  }
];

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

  const handleNext = () => {
    try {
      // Store selected reference files
      localStorage.setItem('referenceFiles', JSON.stringify(Array.from(selectedFiles)));
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