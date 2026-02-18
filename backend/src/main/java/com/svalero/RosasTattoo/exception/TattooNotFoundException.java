package com.svalero.RosasTattoo.exception;

public class TattooNotFoundException extends Exception {
    public TattooNotFoundException() {
        super("Tattoo not found");
    }
}