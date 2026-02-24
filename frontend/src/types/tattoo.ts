export type TattooDto = {
  id: number;
  clientId: number;
  professionalId: number;
  professionalName: string;
  tattooDate: string;
  style: string;
  tattooDescription: string;
  imageUrl: string;
  sessions: number;
  coverUp: boolean;
  color: boolean;
};

export type TattooInDto = {
  clientId: number;
  professionalId: number;
  style: string;
  tattooDescription: string;
  tattooDate: string;
  imageUrl?: string | null;
  sessions: number;
  coverUp: boolean;
  color: boolean;
};