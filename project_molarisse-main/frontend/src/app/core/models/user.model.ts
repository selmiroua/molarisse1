export interface Role {
  id: number;
  nom: string;
}

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string | Role;
  profilePicturePath?: string | null;
  address?: string;
  phoneNumber?: string;
  enabled: boolean;
  accountLocked: boolean;
  dateNaissance?: string;
  specialization?: string;
  specialities?: string[];
  assignedDoctor?: User;
  secretaryStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
  cvFilePath?: string;
  secretaries?: User[];
} 