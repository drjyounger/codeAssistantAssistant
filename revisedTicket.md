# Title: Update Dental Practice Management Software Selection System with Satisfaction Rating

## Technical Description

This task involves enhancing the dental practice management software selection functionality in three specific areas of the application: 1) signup flow, 2) location profile page, and 3) implementing a new one-time modal for existing users. Additionally, we need to extend the database schema to store software satisfaction ratings. The implementation will use different software lists based on the user's country (US or Canada).

The application is using a React/TypeScript frontend with a relational database backend. The Location model already contains a `software` field that stores the currently selected dental management software.

## File Paths and Code Locations

### Database Changes
- `migrations/[timestamp]_add_software_happy_to_locations.js` - Create new migration file
- `models/Location.js` - Update model to include the new field

### Frontend Components
- `components/SignUp/DentalOfficeSoftwareSelect.tsx` - Update with new software lists
- `components/LocationProfile/SoftwareSelection.tsx` - Update with new software lists
- `components/Modals/SoftwareUpdateModal.tsx` - Create new component for one-time modal
- `components/common/SatisfactionRating.tsx` - Create new reusable satisfaction rating component
- `pages/PostShift/PostShiftSuccess.tsx` - Modify to conditionally show the one-time modal

### Configuration and Utilities
- `config/dentalSoftwareOptions.ts` - Update or create this file to store the US and Canadian software lists
- `utils/locationHelpers.ts` - Add functions to check if software update is needed

## Input/Output Specifications

### Database Schema Extension
```sql
ALTER TABLE Locations
ADD COLUMN softwareHappy INTEGER CHECK (softwareHappy >= 1 AND softwareHappy <= 5);
```

### Software List Data Structure
```typescript
interface SoftwareOption {
  id: string;
  name: string;
  country: 'US' | 'CA' | 'BOTH';
}

const softwareOptions: SoftwareOption[] = [
  // Canadian options
  { id: 'dentrix_ca', name: 'Dentrix', country: 'CA' },
  { id: 'abeldent_ca', name: 'ABELDent', country: 'CA' },
  // Additional options...
  
  // US options
  { id: 'maxident_us', name: 'MaxiDent', country: 'US' },
  { id: 'cleardent_us', name: 'ClearDent', country: 'US' },
  // Additional options...
  
  // Options for both countries
  { id: 'open_dental', name: 'Open Dental', country: 'BOTH' }
];
```

### Modal Trigger Logic
- Input: User context including:
  - User ID
  - Location ID
  - User registration date
  - Current Location.software value
  - Feature release date
- Output: Boolean indicating whether to show the one-time modal

### Satisfaction Rating Component
- Input:
  - Initial rating value (1-5)
  - onChange handler function
  - Optional label text
- Output: Selected satisfaction rating (1-5)

## Detailed Acceptance Criteria

1. The `Location` table must have a new `softwareHappy` column of type INTEGER with a constraint to accept only values 1-5.

2. When the software dropdown is rendered in the signup form:
   - Canadian dental offices must see exactly 10 options: Dentrix, ABELDent, ClearDent, Paradigm Clinical, Tracker, Progident/Clinique, Power Practice, Open Dental, Dentitek, MaxiDent.
   - US dental offices must see exactly 10 options: MaxiDent, ClearDent, Dentrix, Curve Dental/Curve Hero, Open Dental, ABELDent, ADSTRA Dental, Oryx Dental Software, CareStack, EagleSoft.
   - The correct country-specific list must be shown based on the user's country selection during registration.
   - The selected software value must be saved to the Location.software field.

3. When a dental office edits their profile:
   - The software dropdown must show the same country-specific options as described in criterion 2.
   - The currently selected software must be pre-selected in the dropdown.
   - Changes must be saved to the Location.software field when the form is submitted.

4. One-time update modal specifications:
   - The modal must appear only once per location after successfully posting a shift.
   - The modal must not appear for dental offices registered on or after the feature release date.
   - The modal must show the country-specific software options as described in criterion 2.
   - The modal must include a satisfaction rating component with options 1-5.
   - The modal must not be dismissible without selecting both software and satisfaction rating.
   - The modal submission must update both Location.software and Location.softwareHappy fields.

5. The satisfaction rating component must:
   - Display 5 selectable stars or a numeric scale from 1-5.
   - Provide visual feedback for the selected rating.
   - Validate that the input is between 1-5.
   - Return the selected value to the parent component.

## Code Examples

### Software Options Configuration
```typescript
// config/dentalSoftwareOptions.ts

export const FEATURE_RELEASE_DATE = '2023-04-01';

export const DENTAL_SOFTWARE_OPTIONS = {
  CA: [
    { value: 'dentrix', label: 'Dentrix' },
    { value: 'abeldent', label: 'ABELDent' },
    { value: 'cleardent', label: 'ClearDent' },
    { value: 'paradigm', label: 'Paradigm Clinical' },
    { value: 'tracker', label: 'Tracker' },
    { value: 'progident', label: 'Progident/Clinique' },
    { value: 'power_practice', label: 'Power Practice' },
    { value: 'open_dental', label: 'Open Dental' },
    { value: 'dentitek', label: 'Dentitek' },
    { value: 'maxident', label: 'MaxiDent' }
  ],
  US: [
    { value: 'maxident', label: 'MaxiDent' },
    { value: 'cleardent', label: 'ClearDent' },
    { value: 'dentrix', label: 'Dentrix' },
    { value: 'curve_dental', label: 'Curve Dental/Curve Hero' },
    { value: 'open_dental', label: 'Open Dental' },
    { value: 'abeldent', label: 'ABELDent' },
    { value: 'adstra', label: 'ADSTRA Dental' },
    { value: 'oryx', label: 'Oryx Dental Software' },
    { value: 'carestack', label: 'CareStack' },
    { value: 'eaglesoft', label: 'EagleSoft' }
  ]
};

export function getSoftwareOptionsForCountry(countryCode: 'US' | 'CA') {
  return DENTAL_SOFTWARE_OPTIONS[countryCode] || [];
}
```

### One-Time Modal Component
```tsx
// components/Modals/SoftwareUpdateModal.tsx

import React, { useState } from 'react';
import { Modal, Select, Button, FormControl, FormLabel } from '../ui-components';
import SatisfactionRating from '../common/SatisfactionRating';
import { getSoftwareOptionsForCountry } from '../../config/dentalSoftwareOptions';
import { updateLocationSoftware } from '../../api/locations';

interface SoftwareUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: number;
  countryCode: 'US' | 'CA';
  currentSoftware: string;
}

const SoftwareUpdateModal: React.FC<SoftwareUpdateModalProps> = ({
  isOpen,
  onClose,
  locationId,
  countryCode,
  currentSoftware
}) => {
  const [software, setSoftware] = useState(currentSoftware);
  const [satisfaction, setSatisfaction] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const softwareOptions = getSoftwareOptionsForCountry(countryCode);
  
  const handleSubmit = async () => {
    if (!software || !satisfaction) {
      setError('Please select both your software and satisfaction rating');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await updateLocationSoftware(locationId, { 
        software, 
        softwareHappy: satisfaction 
      });
      onClose();
    } catch (err) {
      setError('Failed to update software information');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Modal isOpen={isOpen} title="Update Practice Management Software">
      <FormControl>
        <FormLabel>Which dental practice management software do you use?</FormLabel>
        <Select
          value={software}
          onChange={(e) => setSoftware(e.target.value)}
          options={softwareOptions}
        />
      </FormControl>
      
      <FormControl mt={4}>
        <FormLabel>How satisfied are you with your current software? (1-5)</FormLabel>
        <SatisfactionRating
          value={satisfaction}
          onChange={setSatisfaction}
        />
      </FormControl>
      
      {error && <Alert status="error">{error}</Alert>}
      
      <Button
        mt={4}
        colorScheme="blue"
        isLoading={isSubmitting}
        disabled={!software || !satisfaction}
        onClick={handleSubmit}
      >
        Submit
      </Button>
    </Modal>
  );
};

export default SoftwareUpdateModal;
```

### Modal Display Logic
```typescript
// utils/locationHelpers.ts

import { FEATURE_RELEASE_DATE } from '../config/dentalSoftwareOptions';

export function shouldShowSoftwareUpdateModal(location) {
  // Don't show for locations created after feature release
  if (new Date(location.createdAt) >= new Date(FEATURE_RELEASE_DATE)) {
    return false;
  }
  
  // Don't show if already completed the survey
  if (location.softwareHappy !== null && location.softwareHappy !== undefined) {
    return false;
  }
  
  return true;
}
```

## Dependencies and Related Information

- Database migration must be applied before deploying the frontend changes
- Feature release date must be set in configuration (default: 2023-04-01)
- Existing `Location` model assumes the following structure:
  ```typescript
  interface Location {
    id: number;
    name: string;
    country: 'US' | 'CA';
    software: string;
    // other fields...
  }
  ```

## Testing Instructions

### Unit Tests
1. Create tests for `getSoftwareOptionsForCountry` to verify:
   - It returns the correct list for 'US'
   - It returns the correct list for 'CA'
   - Each country has exactly 10 options

2. Create tests for `shouldShowSoftwareUpdateModal` to verify:
   - Returns false for locations created after feature release date
   - Returns false for locations with existing softwareHappy value
   - Returns true for locations meeting the criteria

### Integration Tests
1. Test signup flow with both US and Canadian locations
2. Test location profile editing with both US and Canadian locations
3. Test one-time modal appearance logic after posting a shift

### QA Checklist
- Verify dropdown renders correctly in all three locations (signup, profile, modal)
- Verify correct saving of both software and satisfaction rating
- Test with existing users and newly registered users
- Verify proper handling of edge cases (null values, missing data)
- Test on multiple browsers: Chrome, Firefox, Safari, Edge
- Test responsive behavior on desktop and mobile devices

## Comparison with Original Ticket

This revised ticket differs from the original in the following key ways:

1. **Technical Specificity**: Added precise technical implementation details including file paths, component structure, and data models.

2. **Code Examples**: Provided actual code snippets showing implementation approach rather than just requirements.

3. **Structured Acceptance Criteria**: Converted narrative Gherkin-style criteria into more specific, technically-focused test cases.

4. **Database Details**: Added explicit SQL for the schema change and type constraints.

5. **Integration Points**: Clarified how components should interact and where data should flow.

These changes make the ticket much more amenable to AI implementation by providing clear, explicit technical guidance rather than relying on the AI to infer implementation details from general requirements.
