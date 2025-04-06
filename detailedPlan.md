# Implementation Plan: Adding Screenshot Upload Functionality

## Overview
This implementation plan outlines the steps needed to add image upload functionality to the existing AI coding assistant project. The feature will allow users to upload screenshots of designs during the "Additional Context" step, which will then be included in the API submission to the Gemini 2.5 Pro model.

## Prerequisites
- Understanding of React/TypeScript for frontend modifications
- Understanding of Express.js for backend file handling
- Access to the Google Gemini API documentation for multimodal input integration

## Implementation Steps

### 1. Frontend Changes

#### 1.1 Update the Additional Context Component
- Modify the existing "Additional Context" component to include an image upload section
- Add a drag-and-drop area with "Browse" button functionality
- Implement preview thumbnails for uploaded images
- Add ability to remove individual uploaded images
- Ensure the UI clearly labels this as an optional step

#### 1.2 State Management
- Extend the existing state management to handle image files
- Create state for tracking uploaded images (array of file objects)
- Handle image selection, preview generation, and removal
- Add validation for file types (restrict to common image formats: jpg, png, gif, etc.)
- Add validation for file sizes (implement reasonable size limits)

#### 1.3 UI/UX Considerations
- Add loading indicators during image upload
- Implement error handling for failed uploads
- Add tooltips explaining the purpose of image uploads
- Ensure responsive design for mobile compatibility
- Maintain accessibility standards (ARIA attributes, keyboard navigation)

### 2. Backend Changes

#### 2.1 File Handling in Local Express Server
- Create a new Express route to handle image uploads
- Implement multipart form data handling using a library like Multer
- Set up temporary file storage in a local directory
- Generate unique identifiers for each uploaded image
- Implement basic validation for file types and sizes

#### 2.2 File Management
- Create utility functions for file handling (save, retrieve, delete)
- Implement appropriate error handling and logging
- Set up cleanup mechanisms to remove temporary files after processing

### 3. Gemini API Integration

#### 3.1 File Upload to Gemini
- Implement the Gemini File Upload API using the endpoint `https://generativelanguage.googleapis.com/upload/v1beta/files`
- Create a wrapper function around `client.files.upload()` to handle file uploading
- Store complete file metadata returned from the upload API, not just URIs
- Implement file status checking to ensure files are in `ACTIVE` state before use:
  ```python
  # Example check (pseudocode)
  if file.state == "ACTIVE":
      # File is ready to use
  else:
      # Wait or handle error
  ```
- Add error handling for upload failures

#### 3.2 Content Generation Formatting
- Structure the content array correctly according to Gemini API requirements:
  ```python
  # Example format (pseudocode)
  contents = [
      uploaded_file_object,  # Direct reference to file object
      "\n\n",
      "Analyze this design screenshot in the context of the Jira ticket requirements",
      # Additional text prompts...
  ]
  ```
- Support multiple image files in the content array
- Position images appropriately within the prompt sequence for optimal context
- Include specific instructions about image content in the prompt text

#### 3.3 File Lifecycle Management
- Track file metadata including `expirationTime` from the API response
- Implement client-side tracking of uploaded files and their Gemini API IDs
- Create a cleanup process to call `files.delete()` for files that are no longer needed
- Implement error handling for file deletion failures
- Add logging for file lifecycle events
  
#### 3.4 API Request Formation
- Modify the system prompt to specifically instruct Gemini on how to interpret the images:
  ```
  "This prompt includes screenshots of UI designs. Please analyze these designs in relation to the Jira ticket requirements and incorporate them into your implementation plan."
  ```
- Structure the entire prompt with images positioned strategically for best comprehension
- Ensure the API call specifies a model that supports multimodal inputs (gemini-2.5-pro)
- Handle potential increased latency in responses due to image processing

### 4. Data Flow Updates

#### 4.1 Wizard Step Integration
- Ensure the image data flows correctly between wizard steps
- Update the "Next" button handler in the Additional Context step
- Add validation to ensure images are processed before proceeding
- Make the image upload section clearly optional for users

#### 4.2 Final Submission Updates
- Modify the final submission payload to include image data
- Update any progress indicators to reflect image processing status
- Ensure proper cleanup of temporary files after submission

### 5. Testing Plan

#### 5.1 Unit Testing
- Test image upload component in isolation
- Test file validation logic
- Test state management for image handling
- Test API client modifications

#### 5.2 Integration Testing
- Test end-to-end flow with image uploads
- Test different image types and sizes
- Test error handling scenarios
- Test with and without images to ensure optional nature works

#### 5.3 Performance Testing
- Measure impact on load times with various image sizes
- Test with multiple simultaneous uploads
- Monitor API response times with image data included

### 6. System Prompt Modifications

#### 6.1 Changes to systemPrompt.js
- Update the `generateSystemPrompt` function to accept a new parameter for design images:
  ```javascript
  const generateSystemPrompt = ({
    jiraTickets,
    concatenatedFiles,
    referenceFiles,
    designImages  // New parameter for uploaded design images
  }) => {
    // Existing code...
  };
  ```

- Add a new section in the system prompt specifically for design images:
  ```javascript
  // Format design images information
  const formattedDesignImages = Array.isArray(designImages) && designImages.length > 0
    ? `The following design screenshots have been provided to help with implementation:
       ${designImages.map((image, index) => `Image ${index + 1}: ${image.description || 'Design screenshot'}`).join('\n')}`
    : 'No design screenshots provided.';
  ```

- Insert the design images section into the returned prompt string:
  ```javascript
  return `You are an expert coding assistant...
  
  // ... existing sections ...
  
  =====START DESIGN SCREENSHOTS=====
  
  ${formattedDesignImages}
  
  =====END DESIGN SCREENSHOTS=====
  
  Below you'll find some additional references...
  `;
  ```

#### 6.2 Prompt Instruction Updates
- Add specific instructions for how the model should use the design images:
  ```javascript
  // Add to the existing REVIEW GUIDELINES section
  6. Visual Design Implementation:
     - Refer to the provided design screenshots to ensure accurate implementation
     - Pay close attention to UI elements, layouts, and visual details shown in the designs
     - Provide specific instructions on implementing the UI components shown in the screenshots
     - When relevant, include CSS styling details that match the design screenshots
  ```

- Update the implementation guide section to reference visual elements:
  ```javascript
  3. A HIGHLY DETAILED INSTRUCTION GUIDE FOR IMPLEMENTING THE JIRA TICKET(S)
  - Instructions should be clear and highly-detailed
  - If design screenshots are provided, reference them specifically when describing UI implementation
  - Include notes on how to implement specific visual elements seen in the designs
  // ... existing points ...
  ```

#### 6.3 API Integration Considerations
- The actual images won't be embedded directly in the system prompt text
- Instead, the prompt will include references to the images, while the actual image files will be included in the `contents` array of the Gemini API request
- The `systemPrompt.js` changes are focused on adding textual context about the images, while the actual multimodal handling happens in the API call formation
- The system prompt should explain that the design images will be provided separately in the API request and instruct the model to analyze them

## Technical Considerations for Local Usage

### Local File Storage
- Use a dedicated temporary directory within the application structure
- Implement simple cleanup routines to prevent disk space issues
- Store files with unique names to prevent collisions

### API Usage Considerations
- Be aware of Gemini API rate limits and token usage when including images
- Note that files have expiration times and plan for refreshing if needed
- Consider adding a configuration option to limit maximum file size per upload

### Basic Validation
- Implement basic file type validation (allow only image formats)
- Add reasonable file size limits to prevent accidental large uploads

## Success Criteria
- Users can successfully upload design screenshots during the Additional Context step
- Uploaded images are correctly included in the Gemini API request
- The Gemini model incorporates image context in the generated action plan
- The feature gracefully handles errors and edge cases
- The user experience remains intuitive with the added functionality
