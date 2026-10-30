export type Gender = 'male' | 'female' | 'other';

export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  tamilName: string;
  gender: Gender;
  birthDate?: string;
  deathDate?: string;
  isDeceased: boolean;
  photoUrl?: string;
  couplePhotoUrl?: string;
  coupleAbout?: string;
  education?: string;
  profession?: string;
  business?: string;
  birthPlace?: string;
  currentCity?: string;
  biography?: string;
  generation: number; // 1 = Founding, 2 = Children, 3 = Grandchildren, 4 = Great-grandchildren, 5 = 5th Gen
  branchId: string;   // e.g., 'root', 'branch-shanmuga', 'branch-palanisamy', 'branch-sivakami', 'branch-muthusamy'
  branchName: string;
  branchNameTamil: string;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  childIds: string[];
  tags?: string[];
}

export interface FamilyBranch {
  id: string;
  name: string;
  tamilName: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  rootPersonId: string;
  description: string;
}

export type ViewTab = 'home' | 'tree' | 'admin';
