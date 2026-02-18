package com.svalero.RosasTattoo.service;

import com.svalero.RosasTattoo.domain.Professional;
import com.svalero.RosasTattoo.dto.ProfessionalDto;
import com.svalero.RosasTattoo.dto.ProfessionalInDto;
import com.svalero.RosasTattoo.exception.ProfessionalNotFoundException;
import com.svalero.RosasTattoo.repository.ProfessionalRepository;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProfessionalService {

    @Autowired
    private ProfessionalRepository professionalRepository;
    @Autowired
    private ModelMapper modelMapper;

    public List<ProfessionalDto> findAll(String name, Boolean booksOpened, Integer yearsExperience) {
        List<Professional> professionals = professionalRepository.findByFilters(name, booksOpened, yearsExperience);
        return modelMapper.map(professionals, new TypeToken<List<ProfessionalDto>>() {}.getType());
    }

    public ProfessionalDto findById(long id) throws ProfessionalNotFoundException {
        Professional professional = professionalRepository.findById(id)
                .orElseThrow(ProfessionalNotFoundException::new);

        return modelMapper.map(professional, ProfessionalDto.class);
    }

    public ProfessionalDto add(ProfessionalInDto professionalInDto) {
        Professional professional = modelMapper.map(professionalInDto, Professional.class);
        Professional saved = professionalRepository.save(professional);

        return modelMapper.map(saved, ProfessionalDto.class);
    }

    public ProfessionalDto modify(long id, ProfessionalInDto professionalInDto) throws ProfessionalNotFoundException {
        Professional existing = professionalRepository.findById(id)
                .orElseThrow(ProfessionalNotFoundException::new);

        modelMapper.map(professionalInDto, existing);
        existing.setId(id);

        Professional saved = professionalRepository.save(existing);
        return modelMapper.map(saved, ProfessionalDto.class);
    }

    public void delete(long id) throws ProfessionalNotFoundException {
        Professional professional = professionalRepository.findById(id)
                .orElseThrow(ProfessionalNotFoundException::new);

        professionalRepository.delete(professional);
    }
}