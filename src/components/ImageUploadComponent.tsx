import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Alert,
  Paper,
  Grid
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { createFilePreview, uploadFile } from '../services/FileUploadService';

export interface UploadedImage {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  preview: string;
}

interface ImageUploadComponentProps {
  onImagesChange: (images: UploadedImage[]) => void;
}

const ImageUploadComponent: React.FC<ImageUploadComponentProps> = ({ onImagesChange }) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  const handleImageUpload = useCallback(async (files: FileList) => {
    setError(null);
    setIsUploading(true);

    const uploadedImages: UploadedImage[] = [];
    const newImages = Array.from(files);

    // Validate files
    for (const file of newImages) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`File type not supported: ${file.type}. Please upload images only.`);
        setIsUploading(false);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`File too large: ${file.name}. Maximum size is 5MB.`);
        setIsUploading(false);
        return;
      }
    }

    try {
      for (const file of newImages) {
        // Create preview locally
        const preview = await createFilePreview(file);
        
        // Upload to server
        const uploadedFile = await uploadFile(file);
        
        // Add to images array
        uploadedImages.push({
          ...uploadedFile,
          preview
        });
      }

      // Update state
      const updatedImages = [...images, ...uploadedImages];
      setImages(updatedImages);
      onImagesChange(updatedImages);
    } catch (err) {
      setError(`Failed to upload images: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error uploading images:', err);
    } finally {
      setIsUploading(false);
    }
  }, [images, onImagesChange]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageUpload(e.target.files);
      // Reset input value to allow uploading the same file again
      e.target.value = '';
    }
  };

  const handleRemoveImage = (id: string) => {
    const updatedImages = images.filter(img => img.id !== id);
    setImages(updatedImages);
    onImagesChange(updatedImages);
    // Note: We're not deleting the file from the server here, as it will be cleaned up later
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImageUpload(e.dataTransfer.files);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Upload Design Screenshots (Optional)
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Upload screenshots of designs to help with implementation. Supported formats: JPG, PNG, GIF, WEBP. Max size: 5MB per file.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper
        sx={{
          border: '2px dashed',
          borderColor: isDragging ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 3,
          textAlign: 'center',
          backgroundColor: isDragging ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          mb: 2
        }}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />
        <CloudUploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body1" gutterBottom>
          Drag and drop your images here
        </Typography>
        <Typography variant="body2" color="text.secondary">
          or
        </Typography>
        <Button
          variant="outlined"
          sx={{ mt: 1 }}
          disabled={isUploading}
        >
          Browse Files
        </Button>
        {isUploading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Paper>

      {images.length > 0 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Uploaded Images ({images.length})
          </Typography>
          <Grid container spacing={2}>
            {images.map((image) => (
              <Grid item xs={6} sm={4} md={3} key={image.id}>
                <Paper
                  sx={{
                    p: 1,
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Box
                    sx={{
                      height: 120,
                      width: '100%',
                      backgroundImage: `url(${image.preview})`,
                      backgroundSize: 'contain',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      mb: 1
                    }}
                  />
                  <Typography variant="body2" noWrap title={image.name}>
                    {image.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(image.size / 1024).toFixed(0)}KB
                  </Typography>
                  <IconButton
                    size="small"
                    sx={{ position: 'absolute', top: 0, right: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(image.id);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
};

export default ImageUploadComponent; 