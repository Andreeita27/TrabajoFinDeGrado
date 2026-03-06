export type GoogleReviewDto = {
  authorName: string | null;
  authorPhotoUri: string | null;
  authorUri: string | null;
  rating: number | null;
  text: string | null;
  relativePublishTimeDescription: string | null;
  publishTime: string | null;
};

export type GoogleReviewsResponseDto = {
  placeDisplayName: string | null;
  rating: number | null;
  userRatingCount: number | null;
  googleMapsUri: string | null;
  reviewsSortInfo: string | null;
  reviews: GoogleReviewDto[];
};