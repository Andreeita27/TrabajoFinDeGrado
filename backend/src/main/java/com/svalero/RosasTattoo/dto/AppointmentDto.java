package com.svalero.RosasTattoo.dto;

import com.svalero.RosasTattoo.domain.enums.AppointmentState;
import com.svalero.RosasTattoo.domain.enums.AppointmentType;
import com.svalero.RosasTattoo.domain.enums.TattooSize;
import lombok.*;

import java.time.LocalDateTime;

@Setter
@Getter
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentDto {
    private long id;
    private AppointmentType appointmentType;
    private LocalDateTime startDateTime;
    private String professionalName;
    private long professionalId;
    private long clientId;
    private String clientName;
    private String clientSurname;
    private String clientFullName;
    private String bodyPlacement;
    private String ideaDescription;
    private boolean firstTime;
    private TattooSize tattooSize;
    private String referenceImageUrl;
    private int durationMinutes;
    private AppointmentState state;
    private boolean depositPaid;
    private boolean showroomTattooCreated;
    private Long showroomTattooId;

    public String getClientFullName() {
        String name = clientName == null ? "" : clientName;
        String surname = clientSurname == null ? "" : clientSurname;
        return (name + " " + surname).trim();
    }
}