export type ClientDto = {
  id: number;
  clientName: string;
  clientSurname: string;
  email: string;
  phone?: string | null;
  birthDate?: string | null;
  showPhoto: boolean;
  visits: number;
};

export type ClientInDto = {
  clientName: string;
  clientSurname: string;
  email: string;
  phone?: string | null;
  birthDate?: string | null;
  showPhoto: boolean;
};