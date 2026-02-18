package com.svalero.RosasTattoo.service;

import com.svalero.RosasTattoo.domain.Client;
import com.svalero.RosasTattoo.dto.ClientInDto;
import com.svalero.RosasTattoo.dto.ClientDto;
import com.svalero.RosasTattoo.exception.ClientNotFoundException;
import com.svalero.RosasTattoo.repository.ClientRepository;
import org.modelmapper.ModelMapper;
import org.modelmapper.TypeToken;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClientService {

    @Autowired
    private ClientRepository clientRepository;
    @Autowired
    private ModelMapper modelMapper;

    public List<ClientDto> findAll(String name, String surname, Boolean showPhoto) {
        List<Client> clients = clientRepository.findByFilters(name, surname, showPhoto);
        return modelMapper.map(clients, new TypeToken<List<ClientDto>>() {}.getType());
    }

    public ClientDto findById(long id) throws ClientNotFoundException {
        Client client = clientRepository.findById(id)
                .orElseThrow(ClientNotFoundException::new);

        return modelMapper.map(client, ClientDto.class);
    }

    public ClientDto add(ClientInDto clientInDto) {
        Client client = modelMapper.map(clientInDto, Client.class);
        Client saved = clientRepository.save(client);
        return modelMapper.map(saved, ClientDto.class);
    }

    public ClientDto modify(long id, ClientInDto clientInDto) throws ClientNotFoundException {
        Client existing = clientRepository.findById(id)
                .orElseThrow(ClientNotFoundException::new);

        modelMapper.map(clientInDto, existing);
        existing.setId(id);

        Client saved = clientRepository.save(existing);
        return modelMapper.map(saved, ClientDto.class);
    }

    public void delete(long id) throws ClientNotFoundException {
        Client client = clientRepository.findById(id)
                .orElseThrow(ClientNotFoundException::new);

        clientRepository.delete(client);
    }
}