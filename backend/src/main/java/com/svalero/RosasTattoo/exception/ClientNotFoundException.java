package com.svalero.RosasTattoo.exception;

public class ClientNotFoundException extends Exception {

    public ClientNotFoundException() {
        super("Client not found");
    }
}