export type TattooSize = "SMALL" | "MEDIUM" | "LARGE" | "XL";

export type AppointmentState =
  | "PENDING"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export type AppointmentDto = {
  id: number;
  startDateTime: string;
  professionalName: string;
  professionalId: number;
  clientId: number;
  bodyPlacement: string;
  ideaDescription: string;
  firstTime: boolean;
  tattooSize: TattooSize;
  referenceImageUrl: string | null;
  durationMinutes: number;
  price: number;
  state: AppointmentState;
  depositPaid: boolean;
  hasReview: boolean;
  clientName?: string;
  clientSurname?: string;
  clientFullName?: string;
};

export type AppointmentInDto = {
  clientId: number;
  professionalId: number;
  startDateTime: string;
  bodyPlacement: string;
  ideaDescription: string;
  firstTime: boolean;
  tattooSize: TattooSize;
  referenceImageUrl?: string | null;
};
