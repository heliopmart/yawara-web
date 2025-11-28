import { ArtRole } from '../art'

export interface WorkCard {
  id: string;
  type: 'ART' | 'ARTTC';
  code: string;
  title: string;
  status: 'ACTIVE' | 'FINALIZED';
  role?: ArtRole
} 