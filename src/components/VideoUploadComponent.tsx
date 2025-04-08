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
import MovieIcon from '@mui/icons-material/Movie';
import { createFilePreview, uploadFile } from '../services/FileUploadService';

export interface UploadedVideo {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  preview: string;
  duration?: number;
}

interface VideoUploadComponentProps {
  onVideosChange: (videos: UploadedVideo[]) => void;
}

const VideoUploadComponent: React.FC<VideoUploadComponentProps> = ({ onVideosChange }) => {
  const [videos, setVideos] = useState<UploadedVideo[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
  const MAX_DURATION = 120; // 2 minutes (in seconds)

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => {
        reject(new Error("Error loading video metadata"));
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const handleVideoUpload = useCallback(async (files: FileList) => {
    setError(null);
    setIsUploading(true);

    const uploadedVideos: UploadedVideo[] = [];
    const newVideos = Array.from(files);

    // Validate files
    for (const file of newVideos) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`File type not supported: ${file.type}. Please upload videos only (MP4, WebM, MOV, AVI).`);
        setIsUploading(false);
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        setError(`File too large: ${file.name}. Maximum size is 25MB.`);
        setIsUploading(false);
        return;
      }

      try {
        // Check video duration
        const duration = await getVideoDuration(file);
        if (duration > MAX_DURATION) {
          setError(`Video too long: ${file.name}. Maximum duration is 2 minutes.`);
          setIsUploading(false);
          return;
        }
      } catch (err) {
        console.error('Error checking video duration:', err);
      }
    }

    try {
      for (const file of newVideos) {
        // Create preview locally
        const preview = await createFilePreview(file);
        
        // Get duration
        let duration;
        try {
          duration = await getVideoDuration(file);
        } catch (err) {
          console.error('Error getting video duration:', err);
        }
        
        // Upload to server
        const uploadedFile = await uploadFile(file);
        
        // Add to videos array
        uploadedVideos.push({
          ...uploadedFile,
          preview,
          duration
        });
      }

      // Update state
      const updatedVideos = [...videos, ...uploadedVideos];
      setVideos(updatedVideos);
      onVideosChange(updatedVideos);
    } catch (err) {
      setError(`Failed to upload videos: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Error uploading videos:', err);
    } finally {
      setIsUploading(false);
    }
  }, [videos, onVideosChange]);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleVideoUpload(e.target.files);
      // Reset input value to allow uploading the same file again
      e.target.value = '';
    }
  };

  const handleRemoveVideo = (id: string) => {
    const updatedVideos = videos.filter(video => video.id !== id);
    setVideos(updatedVideos);
    onVideosChange(updatedVideos);
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
      handleVideoUpload(e.dataTransfer.files);
    }
  };

  // Format seconds to MM:SS
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Upload Explanation Video (Optional)
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Upload a short video explaining the implementation. Supported formats: MP4, WebM, MOV, AVI. Max size: 25MB. Max duration: 2 minutes.
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
          accept="video/*"
          multiple
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />
        <MovieIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body1" gutterBottom>
          Drag and drop your video here
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

      {videos.length > 0 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Uploaded Videos ({videos.length})
          </Typography>
          <Grid container spacing={2}>
            {videos.map((video) => (
              <Grid item xs={12} sm={6} key={video.id}>
                <Paper
                  sx={{
                    p: 1,
                    position: 'relative',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <Box sx={{ position: 'relative' }}>
                    <Box
                      component="video"
                      controls
                      sx={{
                        width: '100%',
                        height: 'auto',
                        maxHeight: 150,
                        mb: 1
                      }}
                      src={video.url}
                    />
                  </Box>
                  <Typography variant="body2" noWrap title={video.name}>
                    {video.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(video.size / (1024 * 1024)).toFixed(1)}MB • {formatDuration(video.duration)}
                  </Typography>
                  <IconButton
                    size="small"
                    sx={{ position: 'absolute', top: 0, right: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveVideo(video.id);
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

export default VideoUploadComponent; 