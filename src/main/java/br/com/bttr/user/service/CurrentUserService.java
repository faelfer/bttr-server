package br.com.bttr.user.service;

import br.com.bttr.shared.exception.ApiException;
import br.com.bttr.user.entities.UserEntity;
import br.com.bttr.user.repository.UserRepository;
import jakarta.enterprise.context.RequestScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.jwt.JsonWebToken;

@RequestScoped
public class CurrentUserService {
    @Inject JsonWebToken token;
    @Inject UserRepository users;

    public UserEntity get() {
        String subject = token.getSubject();
        if (subject == null || subject.isBlank()) {
            throw new ApiException(401, "autenticação necessária.");
        }
        return users.findByKeycloakId(subject)
                .orElseThrow(() -> new ApiException(401, "usuário não foi encontrado."));
    }
}
