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
