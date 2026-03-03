export type Role = "ADMIN" | "CLIENT";

export type AuthResponseDto = {
  token: string;
  role: Role | string;
  clientId: number | null;
};

export type LoginRequestDto = {
  email: string;
  password: string;
};

export type RegisterRequestDto = {
  clientName: string;
  clientSurname: string;
  email: string;
  phone?: string;
  birthDate?: string;
  showPhoto: boolean;
  password: string;
};
