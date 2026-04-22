package com.svalero.RosasTattoo.service;

import com.svalero.RosasTattoo.domain.Professional;
import com.svalero.RosasTattoo.domain.UnavailabilityBlock;
import com.svalero.RosasTattoo.dto.UnavailabilityBlockDto;
import com.svalero.RosasTattoo.dto.UnavailabilityBlockInDto;
import com.svalero.RosasTattoo.exception.ProfessionalNotFoundException;
import com.svalero.RosasTattoo.exception.UnavailabilityBlockNotFoundException;
import com.svalero.RosasTattoo.repository.ProfessionalRepository;
import com.svalero.RosasTattoo.repository.UnavailabilityBlockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UnavailabilityBlockService {

    @Autowired
    private UnavailabilityBlockRepository unavailabilityBlockRepository;

    @Autowired
    private ProfessionalRepository professionalRepository;

    public List<UnavailabilityBlockDto> getByProfessional(long professionalId) {
        return unavailabilityBlockRepository.findAllByProfessional(professionalId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public UnavailabilityBlockDto create(long professionalId, UnavailabilityBlockInDto inDto) throws ProfessionalNotFoundException {
        if (inDto.getEndDateTime().isBefore(inDto.getStartDateTime()) || inDto.getEndDateTime().isEqual(inDto.getStartDateTime())) {
            throw new IllegalArgumentException("La fecha/hora final debe ser más tarde que la de inicio.");
        }

        Professional professional = professionalRepository.findById(professionalId)
                .orElseThrow(ProfessionalNotFoundException::new);

        UnavailabilityBlock b = new UnavailabilityBlock();
        b.setProfessional(professional);
        b.setStartDateTime(inDto.getStartDateTime());
        b.setEndDateTime(inDto.getEndDateTime());
        b.setReason(inDto.getReason());
        b.setEnabled(true);

        return toDto(unavailabilityBlockRepository.save(b));
    }

    public UnavailabilityBlockDto toggle(long blockId) throws UnavailabilityBlockNotFoundException {
        UnavailabilityBlock b = unavailabilityBlockRepository.findById(blockId)
                .orElseThrow(() -> new UnavailabilityBlockNotFoundException("Unavailability block not found"));

        b.setEnabled(!b.isEnabled());
        return toDto(unavailabilityBlockRepository.save(b));
    }

    public void delete(long blockId) throws UnavailabilityBlockNotFoundException{
        UnavailabilityBlock b = unavailabilityBlockRepository.findById(blockId)
                .orElseThrow(() -> new UnavailabilityBlockNotFoundException("Unavailability block not found"));
        unavailabilityBlockRepository.delete(b);
    }

    private UnavailabilityBlockDto toDto(UnavailabilityBlock b) {
        UnavailabilityBlockDto dto = new UnavailabilityBlockDto();
        dto.setId(b.getId());
        dto.setProfessionalId(b.getProfessional().getId());
        dto.setProfessionalName(b.getProfessional().getProfessionalName());
        dto.setStartDateTime(b.getStartDateTime());
        dto.setEndDateTime(b.getEndDateTime());
        dto.setEnabled(b.isEnabled());
        dto.setReason(b.getReason());
        return dto;
    }
}