import { AuthService } from '@/lib/services/auth.service';

export interface AccountConflictInfo {
  email: string;
  existingProvider: string;
  hasPassword: boolean;
}

export async function checkAccountConflict(email: string): Promise<AccountConflictInfo | null> {
  return await AuthService.checkAccountConflict(email);
}

export async function canLinkAccount(email: string, provider: string): Promise<boolean> {
  return await AuthService.canLinkAccount(email, provider);
}