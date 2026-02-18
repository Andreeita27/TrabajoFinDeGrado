package com.svalero.RosasTattoo.security;

import com.svalero.RosasTattoo.repository.UserAccountRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserAccountRepository userAccountRepository;

    public JwtAuthFilter(JwtService jwtService, UserAccountRepository userAccountRepository) {
        this.jwtService = jwtService;
        this.userAccountRepository = userAccountRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String auth = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (auth == null || !auth.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = auth.substring(7);
        if (!jwtService.isValid(token)) {
            chain.doFilter(request, response);
            return;
        }

        String email = jwtService.extractEmail(token);

        var accountOpt = userAccountRepository.findByEmail(email);
        if (accountOpt.isEmpty() || !accountOpt.get().isEnabled()) {
            chain.doFilter(request, response);
            return;
        }

        String roleName = accountOpt.get().getRole().name();
        var authToken = new UsernamePasswordAuthenticationToken(
                email,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + roleName))
        );
        SecurityContextHolder.getContext().setAuthentication(authToken);

        chain.doFilter(request, response);
    }
}