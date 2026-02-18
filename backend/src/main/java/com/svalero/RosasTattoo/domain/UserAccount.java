package com.svalero.RosasTattoo.domain;

import com.svalero.RosasTattoo.domain.enums.Role;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "user_account")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(unique = true)
    @NotBlank(message = "An email is required")
    private String email;

    @Column(name = "password_hash")
    @NotBlank(message = "Password is required")
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column
    private boolean enabled;

    @OneToOne
    @JoinColumn(name = "client_id")
    private Client client;
}