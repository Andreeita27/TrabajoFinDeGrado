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

export type ReviewInDto = {
  appointmentId: number;
  rating: number; // 1..5
  comment: string;
  wouldRecommend: boolean;
};