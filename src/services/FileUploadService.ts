import axios from 'axios';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  preview: string;
}

/**
 * Uploads a file to the server
 * @param file The file to upload
 * @returns Promise with uploaded file metadata
 */
export const uploadFile = async (file: File): Promise<UploadedFile> => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      return response.data.file;
    } else {
      throw new Error(response.data.error || 'Failed to upload file');
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Deletes an uploaded file
 * @param fileId The ID of the file to delete
 * @returns Promise with success status
 */
export const deleteUploadedFile = async (fileId: string): Promise<boolean> => {
  try {
    const response = await axios.delete(`/api/upload/${fileId}`);
    return response.data.success;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

/**
 * Creates a local preview URL for a file
 * @param file The file to create a preview for
 * @returns Promise with the preview URL
 */
export const createFilePreview = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(file);
  });
}; 