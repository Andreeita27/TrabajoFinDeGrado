export type ReviewDto = {
  id: number;
  appointmentId: number;
  clientId: number;
  professionalId: number;
  rating: number;
  comment: string;
  wouldRecommend: boolean;
  createdAt: string;
};
