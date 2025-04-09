export interface ReferenceFile {
  id: string;
  name: string;
  type: 'coding-standard' | 'schema' | 'reference' | 'business-context';
  path: string;
}

export const REFERENCE_FILES: ReferenceFile[] = [
  {
    id: 'coding-standards',
    name: 'Design & Coding Standards',
    type: 'coding-standard',
    path: 'src/references/designCodingStandards.js'
  }
]; 