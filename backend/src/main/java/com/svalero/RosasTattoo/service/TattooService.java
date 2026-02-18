package com.svalero.RosasTattoo.service;

import com.svalero.RosasTattoo.domain.Client;
import com.svalero.RosasTattoo.domain.Professional;
import com.svalero.RosasTattoo.domain.Tattoo;
import com.svalero.RosasTattoo.dto.TattooInDto;
import com.svalero.RosasTattoo.dto.TattooDto;
import com.svalero.RosasTattoo.exception.ClientNotFoundException;
import com.svalero.RosasTattoo.exception.ProfessionalNotFoundException;
import com.svalero.RosasTattoo.exception.TattooNotFoundException;
import com.svalero.RosasTattoo.repository.ClientRepository;
import com.svalero.RosasTattoo.repository.ProfessionalRepository;
import com.svalero.RosasTattoo.repository.TattooRepository;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;
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

    public List<TattooDto> findAll(String style, Boolean coverUp, Boolean color) {
        List<Tattoo> tattoos = tattooRepository.findByFilters(style, coverUp, color);

        return modelMapper.map(tattoos, new TypeToken<List<TattooDto>>() {}.getType());
    }

    public TattooDto findById(long id) throws TattooNotFoundException {
        Tattoo tattoo = tattooRepository.findById(id)
                .orElseThrow(TattooNotFoundException::new);

        return modelMapper.map(tattoo, TattooDto.class);
    }

    public TattooDto add(TattooInDto tattooInDto) throws ClientNotFoundException, ProfessionalNotFoundException {
        Client client = clientRepository.findById(tattooInDto.getClientId())
                .orElseThrow(ClientNotFoundException::new);

        Professional professional = professionalRepository.findById(tattooInDto.getProfessionalId())
                .orElseThrow(ProfessionalNotFoundException::new);

        Tattoo tattoo = modelMapper.map(tattooInDto, Tattoo.class);
        tattoo.setClient(client);
        tattoo.setProfessional(professional);

        Tattoo saved = tattooRepository.save(tattoo);
        return modelMapper.map(saved, TattooDto.class);
    }

    public TattooDto modify(long id, TattooInDto tattooInDto) throws TattooNotFoundException, ClientNotFoundException, ProfessionalNotFoundException {
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

        Tattoo saved = tattooRepository.save(existing);
        return modelMapper.map(saved, TattooDto.class);
    }

    public void delete(long id) throws TattooNotFoundException {
        Tattoo tattoo = tattooRepository.findById(id)
                .orElseThrow(TattooNotFoundException::new);

        tattooRepository.delete(tattoo);
    }
}