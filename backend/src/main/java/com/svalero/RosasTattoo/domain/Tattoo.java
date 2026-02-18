package com.svalero.RosasTattoo.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;

@Setter
@Getter
@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity(name = "tattoo")
public class Tattoo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(name = "tattoo_date")
    @JsonFormat(pattern = "yyyy-MM-dd")
    @NotNull(message = "This field is mandatory")
    private LocalDate tattooDate;

    @Column
    @NotBlank(message = "Style is mandatory")
    private String style;

    @Column(name = "tattoo_description")
    @NotBlank(message = "Description is mandatory")
    private String tattooDescription;

    @Column(name = "image_url")
    @NotBlank(message = "An image must be uploaded")
    private String imageUrl;

    @Column
    private int sessions;

    @Column(name = "cover_up")
    private boolean coverUp;

    @Column
    private boolean color;

    @ManyToOne
    @JoinColumn(name = "client_id")
    @NotNull(message = "Client is mandatory")
    private Client client;

    @ManyToOne
    @JoinColumn(name = "professional_id")
    @NotNull(message = "Professional is mandatory")
    private Professional professional;

}