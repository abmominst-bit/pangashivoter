export interface Voter {
  id: string;
  sl: number;
  name: string;
  nameBn: string;
  voterNo: string;
  dob: string;
  nid: string;
  fatherName: string;
  fatherNameBn: string;
  motherName: string;
  motherNameBn: string;
  gender: 'Male' | 'Female';
  union: string;
  village: string;
  photo?: string; // Base64 data URI or placeholder
}

export interface UnionData {
  name: string;
  nameBn: string;
  villages: { name: string; nameBn: string }[];
}

export type VisitorTab = 'dashboard' | 'voterList';
export type AdminTab = 'home' | 'unionAdd' | 'uploadJson' | 'uploadImg' | 'settings';

export interface SystemSettings {
  maintenanceMode: boolean;
  visitorPageLocked: boolean;
  visitorLockPassword?: string;
  adminEmail?: string;
  adminPassword?: string;
  candidateName?: string;
  candidateSlogan?: string;
  candidatePhoto?: string;
  candidateSymbol?: string;
  candidateSymbolName?: string;
  candidateNameByUnion?: Record<string, string>;
  candidateSloganByUnion?: Record<string, string>;
  candidatePhotoByUnion?: Record<string, string>;
  candidateSymbolByUnion?: Record<string, string>;
  candidateSymbolNameByUnion?: Record<string, string>;
}

