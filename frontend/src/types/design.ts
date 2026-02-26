export type DesignDto = {
  id: number;
  professionalId: number;
  professionalName?: string | null;
  imageUrl: string;
  active: boolean;
  title?: string | null;
};

export type DesignInDto = {
  professionalId: number;
  imageUrl: string;
  title?: string | null;
  active?: boolean;
};