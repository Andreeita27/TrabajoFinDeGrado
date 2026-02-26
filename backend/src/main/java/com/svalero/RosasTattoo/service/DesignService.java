package com.svalero.RosasTattoo.service;

import com.svalero.RosasTattoo.domain.Design;
import com.svalero.RosasTattoo.domain.Professional;
import com.svalero.RosasTattoo.dto.DesignDto;
import com.svalero.RosasTattoo.dto.DesignInDto;
import com.svalero.RosasTattoo.exception.ProfessionalNotFoundException;
import com.svalero.RosasTattoo.repository.DesignRepository;
import com.svalero.RosasTattoo.repository.ProfessionalRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DesignService {

    @Autowired private DesignRepository designRepository;
    @Autowired private ProfessionalRepository professionalRepository;

    private DesignDto toDto(Design d) {
        DesignDto dto = new DesignDto();
        dto.setId(d.getId());
        dto.setImageUrl(d.getImageUrl());
        dto.setActive(d.isActive());
        dto.setTitle(d.getTitle());

        Professional p = d.getProfessional();
        if (p != null) {
            dto.setProfessionalId(p.getId());
            dto.setProfessionalName(p.getProfessionalName());
        }
        return dto;
    }

    public List<DesignDto> getPublicDesigns() {
        return designRepository.findByActiveTrueOrderByIdDesc().stream().map(this::toDto).toList();
    }

    public List<DesignDto> getAll() {
        return designRepository.findAllByOrderByIdDesc().stream().map(this::toDto).toList();
    }

    public DesignDto create(DesignInDto in) throws ProfessionalNotFoundException {
        Professional p = professionalRepository.findById(in.getProfessionalId())
                .orElseThrow(ProfessionalNotFoundException::new);

        Design d = new Design();
        d.setProfessional(p);
        d.setImageUrl(in.getImageUrl().trim());
        d.setTitle(in.getTitle() == null ? null : in.getTitle().trim());
        d.setActive(in.getActive() == null ? true : in.getActive());

        return toDto(designRepository.save(d));
    }

    public DesignDto update(long id, DesignInDto in) throws ProfessionalNotFoundException {
        Design d = designRepository.findById(id).orElseThrow(() -> new IllegalStateException("Design not found"));

        Professional p = professionalRepository.findById(in.getProfessionalId())
                .orElseThrow(ProfessionalNotFoundException::new);

        d.setProfessional(p);
        d.setImageUrl(in.getImageUrl().trim());
        d.setTitle(in.getTitle() == null ? null : in.getTitle().trim());
        d.setActive(in.getActive() == null ? d.isActive() : in.getActive());

        return toDto(designRepository.save(d));
    }

    public DesignDto toggleActive(long id) {
        Design d = designRepository.findById(id).orElseThrow(() -> new IllegalStateException("Design not found"));
        d.setActive(!d.isActive());
        return toDto(designRepository.save(d));
    }

    public void delete(long id) {
        Design d = designRepository.findById(id).orElseThrow(() -> new IllegalStateException("Design not found"));
        designRepository.delete(d);
    }
}