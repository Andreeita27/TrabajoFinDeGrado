package com.svalero.RosasTattoo.service;

import com.svalero.RosasTattoo.domain.AvailabilityWindow;
import com.svalero.RosasTattoo.domain.Professional;
import com.svalero.RosasTattoo.dto.AvailabilityWindowDto;
import com.svalero.RosasTattoo.dto.AvailabilityWindowInDto;
import com.svalero.RosasTattoo.exception.ProfessionalNotFoundException;
import com.svalero.RosasTattoo.repository.AvailabilityWindowRepository;
import com.svalero.RosasTattoo.repository.ProfessionalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AvailabilityWindowService {

    @Autowired
    private AvailabilityWindowRepository availabilityWindowRepository;

    @Autowired
    private ProfessionalRepository professionalRepository;

    public List<AvailabilityWindowDto> getByProfessional(long professionalId) {
        return availabilityWindowRepository.findAllByProfessional(professionalId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public AvailabilityWindowDto create(long professionalId, AvailabilityWindowInDto inDto) throws ProfessionalNotFoundException {
        if (inDto.getEndDateTime().isBefore(inDto.getStartDateTime()) || inDto.getEndDateTime().isEqual(inDto.getStartDateTime())) {
            throw new IllegalArgumentException("endDateTime must be after startDateTime");
        }

        Professional professional = professionalRepository.findById(professionalId)
                .orElseThrow(ProfessionalNotFoundException::new);

        AvailabilityWindow w = new AvailabilityWindow();
        w.setProfessional(professional);
        w.setStartDateTime(inDto.getStartDateTime());
        w.setEndDateTime(inDto.getEndDateTime());
        w.setNote(inDto.getNote());
        w.setEnabled(true);

        return toDto(availabilityWindowRepository.save(w));
    }

    public AvailabilityWindowDto toggle(long windowId) {
        AvailabilityWindow w = availabilityWindowRepository.findById(windowId)
                .orElseThrow(() -> new IllegalArgumentException("AvailabilityWindow not found"));

        w.setEnabled(!w.isEnabled());
        return toDto(availabilityWindowRepository.save(w));
    }

    public void delete(long windowId) {
        AvailabilityWindow w = availabilityWindowRepository.findById(windowId)
                .orElseThrow(() -> new IllegalArgumentException("AvailabilityWindow not found"));
        availabilityWindowRepository.delete(w);
    }

    private AvailabilityWindowDto toDto(AvailabilityWindow w) {
        AvailabilityWindowDto dto = new AvailabilityWindowDto();
        dto.setId(w.getId());
        dto.setProfessionalId(w.getProfessional().getId());
        dto.setProfessionalName(w.getProfessional().getProfessionalName());
        dto.setStartDateTime(w.getStartDateTime());
        dto.setEndDateTime(w.getEndDateTime());
        dto.setEnabled(w.isEnabled());
        dto.setNote(w.getNote());
        return dto;
    }
}