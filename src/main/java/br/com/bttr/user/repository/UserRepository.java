package br.com.bttr.user.repository;

import br.com.bttr.user.entities.UserEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Optional;

@ApplicationScoped
public class UserRepository implements PanacheRepository<UserEntity> {
  public Optional<UserEntity> findByKeycloakId(String keycloakId) {
    return find("keycloakId", keycloakId).firstResultOptional();
  }
}
