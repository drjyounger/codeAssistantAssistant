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
  },
  {
    id: 'db-schema',
    name: 'Database Schema',
    type: 'schema',
    path: 'src/references/databaseSchema.js'
  },
  {
    id: 'business-context',
    name: 'Business Context',
    type: 'business-context',
    path: 'src/references/businessContext.js'
  }
]; 