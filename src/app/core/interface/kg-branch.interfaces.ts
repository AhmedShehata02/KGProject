export interface KindergartenDTO {
  id: number;
  nameAr: string;
  nameEn: string;
  kgCode?: string;
  address: string;
  branches?: BranchDTO[];
}

export interface BranchDTO {
  id: number;
  nameAr: string;
  nameEn: string;
  address: string;
  phone: string;
  email: string;
  branchCode?: string;
  kindergartenId: number;
}

export interface KGBranchDTO {
  kg: KindergartenDTO;
  branches: BranchDTO[];
}
