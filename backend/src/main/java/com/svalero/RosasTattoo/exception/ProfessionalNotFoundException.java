package com.svalero.RosasTattoo.exception;

public class ProfessionalNotFoundException extends Exception {
    public ProfessionalNotFoundException() {
        super("Professional not found");
    }
}