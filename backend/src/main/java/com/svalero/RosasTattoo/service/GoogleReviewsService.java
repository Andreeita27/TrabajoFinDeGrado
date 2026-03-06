package com.svalero.RosasTattoo.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.svalero.RosasTattoo.dto.GoogleReviewDto;
import com.svalero.RosasTattoo.dto.GoogleReviewsResponseDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

@Service
public class GoogleReviewsService {

    @Value("${google.places.api-key:}")
    private String apiKey;

    @Value("${google.places.place-id:}")
    private String placeId;

    private final ObjectMapper objectMapper;

    public GoogleReviewsService(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public GoogleReviewsResponseDto getGoogleReviews() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("Falta configurar google.places.api-key en application.properties");
        }

        if (placeId == null || placeId.isBlank()) {
            throw new IllegalStateException("Falta configurar google.places.place-id en application.properties");
        }

        try {
            RestClient restClient = RestClient.create();

            String response = restClient.get()
                    .uri("https://places.googleapis.com/v1/places/{placeId}", placeId)
                    .header("X-Goog-Api-Key", apiKey)
                    .header("X-Goog-FieldMask", "displayName,rating,userRatingCount,reviews.text,reviews.originalText,reviews.rating,reviews.relativePublishTimeDescription,reviews.publishTime,reviews.authorAttribution,googleMapsUri")
                    .retrieve()
                    .body(String.class);

            JsonNode root = objectMapper.readTree(response);

            GoogleReviewsResponseDto dto = new GoogleReviewsResponseDto();
            dto.setPlaceDisplayName(readText(root, "displayName", "text"));
            dto.setRating(readDouble(root, "rating"));
            dto.setUserRatingCount(readInt(root, "userRatingCount"));
            dto.setGoogleMapsUri(readText(root, "googleMapsUri"));
            dto.setReviewsSortInfo("Opiniones de Google · ordenadas por relevancia");

            List<GoogleReviewDto> reviews = new ArrayList<>();
            JsonNode reviewsNode = root.get("reviews");

            if (reviewsNode != null && reviewsNode.isArray()) {
                for (JsonNode reviewNode : reviewsNode) {
                    GoogleReviewDto review = new GoogleReviewDto();
                    review.setAuthorName(readText(reviewNode, "authorAttribution", "displayName"));
                    review.setAuthorPhotoUri(readText(reviewNode, "authorAttribution", "photoUri"));
                    review.setAuthorUri(readText(reviewNode, "authorAttribution", "uri"));
                    review.setRating(readInt(reviewNode, "rating"));
                    String originalText = readText(reviewNode, "originalText", "text");
                    String translatedText = readText(reviewNode, "text", "text");

                    review.setText(
                            originalText != null && !originalText.isBlank()
                                    ? originalText
                                    : translatedText
                    );
                    review.setRelativePublishTimeDescription(readText(reviewNode, "relativePublishTimeDescription"));
                    review.setPublishTime(readText(reviewNode, "publishTime"));
                    reviews.add(review);
                }
            }

            dto.setReviews(reviews);
            return dto;

        } catch (Exception e) {
            throw new IllegalStateException("No se pudieron cargar las reseñas de Google: " + e.getMessage(), e);
        }
    }

    private String readText(JsonNode node, String... path) {
        JsonNode current = node;
        for (String part : path) {
            if (current == null) return null;
            current = current.get(part);
        }
        if (current == null || current.isNull()) return null;
        return current.asText();
    }

    private Integer readInt(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) return null;
        return value.asInt();
    }

    private Double readDouble(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) return null;
        return value.asDouble();
    }
}