package com.svalero.RosasTattoo.service;

import com.svalero.RosasTattoo.domain.Client;
import com.svalero.RosasTattoo.domain.Professional;
import com.svalero.RosasTattoo.domain.Tattoo;
import com.svalero.RosasTattoo.dto.TattooInDto;
import com.svalero.RosasTattoo.dto.TattooDto;
import com.svalero.RosasTattoo.exception.ClientNotFoundException;
import com.svalero.RosasTattoo.exception.DuplicateTattooException;
import com.svalero.RosasTattoo.exception.ProfessionalNotFoundException;
import com.svalero.RosasTattoo.exception.TattooNotFoundException;
import com.svalero.RosasTattoo.repository.ClientRepository;
import com.svalero.RosasTattoo.repository.ProfessionalRepository;
import com.svalero.RosasTattoo.repository.TattooRepository;
import org.modelmapper.ModelMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TattooService {

    @Autowired
    private TattooRepository tattooRepository;
    @Autowired
    private ClientRepository clientRepository;
    @Autowired
    private ProfessionalRepository professionalRepository;
    @Autowired
    private ModelMapper modelMapper;

    private TattooDto toDto(Tattoo tattoo) {
        TattooDto dto = modelMapper.map(tattoo, TattooDto.class);

        if (tattoo.getClient() != null) {
            dto.setClientId(tattoo.getClient().getId());

            String name = tattoo.getClient().getClientName();
            String surname = tattoo.getClient().getClientSurname();

            String fullName = ((name != null ? name : "") + " " +
                    (surname != null ? surname : "")).trim();

            dto.setClientName(fullName.isBlank() ? null : fullName);
        }

        if (tattoo.getProfessional() != null) {
            dto.setProfessionalId(tattoo.getProfessional().getId());
            dto.setProfessionalName(tattoo.getProfessional().getProfessionalName());
        } else {
            dto.setProfessionalName(null);
        }

        return dto;
    }

    public List<TattooDto> findAll(String style, Boolean coverUp, Boolean color, Long professionalId) {
        List<Tattoo> tattoos = tattooRepository.findByFilters(style, coverUp, color, professionalId);
        return tattoos.stream().map(this::toDto).toList();
    }

    public TattooDto findById(long id) throws TattooNotFoundException {
        Tattoo tattoo = tattooRepository.findById(id)
                .orElseThrow(TattooNotFoundException::new);

        return toDto(tattoo);
    }

    public TattooDto add(TattooInDto tattooInDto) throws ClientNotFoundException, ProfessionalNotFoundException {
        Client client = clientRepository.findById(tattooInDto.getClientId())
                .orElseThrow(ClientNotFoundException::new);

        Professional professional = professionalRepository.findById(tattooInDto.getProfessionalId())
                .orElseThrow(ProfessionalNotFoundException::new);

        if (tattooRepository.existsByClient_IdAndProfessional_IdAndTattooDate(
                client.getId(),
                professional.getId(),
                tattooInDto.getTattooDate()
        )) {
            throw new DuplicateTattooException("Ya existe un tattoo del showroom asociado a esta cita");
        }

        Tattoo tattoo = modelMapper.map(tattooInDto, Tattoo.class);
        tattoo.setClient(client);
        tattoo.setProfessional(professional);

        if (tattoo.getSessions() <= 0) {
            tattoo.setSessions(1);
        }

        Tattoo saved = tattooRepository.save(tattoo);
        return toDto(saved);
    }

    public TattooDto modify(long id, TattooInDto tattooInDto)
            throws TattooNotFoundException, ClientNotFoundException, ProfessionalNotFoundException {

        Tattoo existing = tattooRepository.findById(id)
                .orElseThrow(TattooNotFoundException::new);

        Client client = clientRepository.findById(tattooInDto.getClientId())
                .orElseThrow(ClientNotFoundException::new);

        Professional professional = professionalRepository.findById(tattooInDto.getProfessionalId())
                .orElseThrow(ProfessionalNotFoundException::new);

        modelMapper.map(tattooInDto, existing);
        existing.setId(id);
        existing.setClient(client);
        existing.setProfessional(professional);

        if (existing.getSessions() <= 0) {
            existing.setSessions(1);
        }

        Tattoo saved = tattooRepository.save(existing);
        return toDto(saved);
    }

    public void delete(long id) throws TattooNotFoundException {
        Tattoo tattoo = tattooRepository.findById(id)
                .orElseThrow(TattooNotFoundException::new);

        tattooRepository.delete(tattoo);
    }
}