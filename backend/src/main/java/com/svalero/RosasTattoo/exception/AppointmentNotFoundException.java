package com.svalero.RosasTattoo.exception;

public class AppointmentNotFoundException extends Exception {
    public AppointmentNotFoundException() {
        super("Appointment not found");
    }
}