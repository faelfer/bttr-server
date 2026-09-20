package br.com.bttr.user.mapper;

import br.com.bttr.user.client.IdentityProvider;
import br.com.bttr.user.dtos.UserDtos.UserView;
import br.com.bttr.user.entities.UserEntity;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class UserMapper {
  public UserView toView(UserEntity user, IdentityProvider.Profile profile) {
    return new UserView(user.id, profile.username(), profile.email(), user.created);
  }
}
