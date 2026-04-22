package com.svalero.RosasTattoo.exception;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.HashMap;
import java.util.Map;

@Data
@AllArgsConstructor(access = AccessLevel.PRIVATE)
public class ErrorResponse {

    public int code;
    public String title;
    public String message;
    private Map<String, String> errors;

    public static ErrorResponse generalError(int code, String title, String message) {
        return new ErrorResponse(code, title, message, new HashMap<>());
    }

    public static ErrorResponse notFound(String message) {
        return new ErrorResponse(404, "not-found", message, new HashMap<>());
    }

    public static ErrorResponse badRequest(String message) {
        return new ErrorResponse(400, "bad-request", message, new HashMap<>());
    }

    public static ErrorResponse validationError(Map<String, String> errors) {
        return new ErrorResponse(400, "bad-request", "Validation error", errors);
    }

    public static ErrorResponse conflict(String message) {
        return new ErrorResponse(409, "conflict", message, new HashMap<>());
    }

    public static ErrorResponse forbidden(String message) {
        return new ErrorResponse(403, "forbidden", message, new HashMap<>());
    }

    public static ErrorResponse unauthorized(String message) {
        return new ErrorResponse(401, "unauthorized", message, new HashMap<>());
    }

    public static ErrorResponse internalServerError(String message) {
        return new ErrorResponse(500, "internal-server-error", message, new HashMap<>());
    }
}