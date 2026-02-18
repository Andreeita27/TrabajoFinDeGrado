package com.svalero.RosasTattoo.exception;

public class ReviewNotFoundException extends Exception {
    public ReviewNotFoundException() {
        super("Review not found");
    }
}