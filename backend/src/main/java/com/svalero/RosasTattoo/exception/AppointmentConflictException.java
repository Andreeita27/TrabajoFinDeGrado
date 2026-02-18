package com.svalero.RosasTattoo.exception;

public class AppointmentConflictException extends RuntimeException {

    public AppointmentConflictException(String message) {
        super(message);
    }
}