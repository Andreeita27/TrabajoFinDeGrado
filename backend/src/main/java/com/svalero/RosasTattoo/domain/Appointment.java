package com.svalero.RosasTattoo.domain;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.svalero.RosasTattoo.domain.enums.AppointmentState;
import com.svalero.RosasTattoo.domain.enums.TattooSize;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;

@Setter
@Getter
@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity(name = "appointment")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(name = "start_date_time")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @NotNull(message = "This field is mandatory")
    private LocalDateTime startDateTime;

    @Column(name = "body_placement")
    @NotNull(message = "This field is mandatory")
    private String bodyPlacement;

    @Column(name = "idea_description")
    @NotNull(message = "You must describe your idea")
    private String ideaDescription;

    @Column(name = "first_time")
    private boolean firstTime;

    @Enumerated(EnumType.STRING)
    @Column(name = "tattoo_size")
    private TattooSize tattooSize;

    @Column(name = "reference_image_url")
    private String referenceImageUrl;

    @Column(name = "duration_minutes")
    private int durationMinutes;

    @Column
    private float price;

    @Enumerated(EnumType.STRING)
    @Column (name = "appointment_state")
    private AppointmentState state = AppointmentState.PENDING;

    @Column(name = "deposit_paid")
    private boolean depositPaid;

    @ManyToOne
    @JoinColumn(name = "client_id")
    @NotNull(message = "Client is mandatory")
    private Client client;

    @ManyToOne
    @JoinColumn(name = "professional_id")
    @NotNull(message = "Professional is mandatory")
    private Professional professional;
}
