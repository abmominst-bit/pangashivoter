import { Voter, UnionData } from './types';

export const UNIONS: UnionData[] = [
  {
    name: 'Baraikhali',
    nameBn: 'বড়ইখালী',
    villages: [
      { name: 'Baraikhali Village', nameBn: 'বড়ইখালী গ্রাম' },
      { name: 'Chonbari', nameBn: 'চনবাড়ী' },
      { name: 'Madhabpur', nameBn: 'মাধবপুর' }
    ]
  },
  {
    name: 'Sreenagar',
    nameBn: 'শ্রীনগর',
    villages: [
      { name: 'Sreenagar Village', nameBn: 'শ্রীনগর গ্রাম' },
      { name: 'Bhagyakul', nameBn: 'ভাগ্যকুল' },
      { name: 'Kamarkhao', nameBn: 'কামারগাঁও' }
    ]
  },
  {
    name: 'Hasara',
    nameBn: 'হাসাড়া',
    villages: [
      { name: 'Hasara Village', nameBn: 'হাসাড়া গ্রাম' },
      { name: 'Laskarpur', nameBn: 'লস্করপুর' },
      { name: 'Kolapara', nameBn: 'ক্যাপাড়া' }
    ]
  },
  {
    name: 'Tantobari',
    nameBn: 'তন্তুবর',
    villages: [
      { name: 'Tantobari Village', nameBn: 'তন্তুবর গ্রাম' },
      { name: 'Gohorpur', nameBn: 'গহরপুর' },
      { name: 'Singpara', nameBn: 'শিংপাড়া' }
    ]
  }
];

export const INITIAL_VOTERS: Voter[] = [];

export function getVoters(): Voter[] {
  return INITIAL_VOTERS;
}

export function saveVoters(voters: Voter[]) {
  // No-op (no localStorage)
}

export function getUnions(): UnionData[] {
  return UNIONS;
}

export function saveUnions(unions: UnionData[]) {
  // No-op (no localStorage)
}

export function getSystemSettings() {
  return {
    maintenanceMode: false
  };
}

export function saveSystemSettings(settings: any) {
  // No-op (no localStorage)
}

