export type UserAccountDto = {
  email: string;
  phone: string | null;
  showPhoto: boolean;
  clientId: number;
  clientName: string;
  clientSurname: string;
};

export type UserAccountUpdateDto = {
  email: string;
  phone: string | null;
  showPhoto: boolean;
};

export type ChangePasswordDto = {
  currentPassword: string;
  newPassword: string;
};