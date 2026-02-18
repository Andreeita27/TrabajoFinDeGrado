package com.svalero.RosasTattoo.config;

import com.svalero.RosasTattoo.domain.UserAccount;
import com.svalero.RosasTattoo.domain.enums.Role;
import com.svalero.RosasTattoo.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminSeedConfig {

    @Bean
    CommandLineRunner seedAdmin(UserAccountRepository userRepo,
                                PasswordEncoder encoder,
                                @Value("${app.admin.email}") String adminEmail,
                                @Value("${app.admin.password}") String adminPassword) {

        return args -> {
            if (userRepo.existsByEmail(adminEmail)) return;

            UserAccount admin = new UserAccount();
            admin.setEmail(adminEmail);
            admin.setPasswordHash(encoder.encode(adminPassword));
            admin.setRole(Role.ADMIN);
            admin.setEnabled(true);
            admin.setClient(null);

            userRepo.save(admin);
        };
    }
}