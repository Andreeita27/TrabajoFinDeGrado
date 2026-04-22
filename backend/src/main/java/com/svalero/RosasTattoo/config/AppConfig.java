package com.svalero.RosasTattoo.config;

import com.svalero.RosasTattoo.domain.Appointment;
import com.svalero.RosasTattoo.domain.Tattoo;
import com.svalero.RosasTattoo.dto.AppointmentDto;
import com.svalero.RosasTattoo.dto.TattooDto;
import org.modelmapper.ModelMapper;
import org.modelmapper.convention.MatchingStrategies;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {
    @Bean
    public ModelMapper modelMapper() {
        ModelMapper modelMapper = new ModelMapper();
        modelMapper.getConfiguration().setMatchingStrategy(MatchingStrategies.STRICT);

        modelMapper.typeMap(Appointment.class, AppointmentDto.class)
                .addMappings(mapper -> {
                    mapper.map(src -> src.getClient().getId(), AppointmentDto::setClientId);
                    mapper.map(src -> src.getProfessional().getId(), AppointmentDto::setProfessionalId);
                    mapper.map(src -> src.getProfessional().getProfessionalName(), AppointmentDto::setProfessionalName);
                });

        modelMapper.typeMap(Tattoo.class, TattooDto.class)
                .addMappings(mapper -> {
                    mapper.map(src -> src.getClient().getId(), TattooDto::setClientId);
                    mapper.map(src -> src.getProfessional().getId(), TattooDto::setProfessionalId);
                });

        return modelMapper;
    }
}
