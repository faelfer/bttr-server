package br.com.bttr.user.service;

import br.com.bttr.shared.exception.ApiException;
import br.com.bttr.user.client.IdentityProvider;
import br.com.bttr.user.dtos.UserDtos.ForgotPassword;
import br.com.bttr.user.dtos.UserDtos.ProfileUpdate;
import br.com.bttr.user.dtos.UserDtos.RedefinePassword;
import br.com.bttr.user.dtos.UserDtos.SignIn;
import br.com.bttr.user.dtos.UserDtos.SignInResponse;
import br.com.bttr.user.dtos.UserDtos.SignUp;
import br.com.bttr.user.dtos.UserDtos.UserView;
import br.com.bttr.user.entities.UserEntity;
import br.com.bttr.user.mapper.UserMapper;
import br.com.bttr.user.repository.UserRepository;
import io.quarkus.narayana.jta.QuarkusTransaction;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.Locale;
import org.jboss.logging.Logger;

@ApplicationScoped
public class UserService {
  @Inject IdentityProvider identities;
  @Inject CurrentUserService currentUser;
  @Inject UserRepository users;
  @Inject UserMapper mapper;
  private static final Logger LOG = Logger.getLogger(UserService.class);

  private String email(String email) {
    return email.trim().toLowerCase(Locale.ROOT);
  }

  private String username(String username) {
    String result = username.trim();
    if (result.length() < 2)
      throw new ApiException(400, "nome de usuário deve conter pelo menos 2 caracteres.");
    return result;
  }

  public void signUp(SignUp input) {
    String subject =
        identities.create(username(input.username()), email(input.email()), input.password());
    try {
      QuarkusTransaction.requiringNew()
          .run(
              () -> {
                var user = new UserEntity();
                user.keycloakId = subject;
                users.persistAndFlush(user);
              });
    } catch (RuntimeException failure) {
      try {
        identities.delete(subject);
      } catch (RuntimeException compensation) {
        LOG.errorf("Falha ao compensar cadastro Keycloak %s", subject);
      }
      throw failure;
    }
  }

  public SignInResponse signIn(SignIn input) {
    var login = identities.authenticate(email(input.email()), input.password());
    UserEntity user =
        users
            .findByKeycloakId(login.profile().id())
            .orElseThrow(() -> new ApiException(401, "usuário não foi encontrado."));
    return new SignInResponse(
        login.token(), mapper.toView(user, login.profile()), "autenticação realizada com sucesso.");
  }

  public UserView profile() {
    UserEntity user = currentUser.get();
    return mapper.toView(user, identities.profile(user.keycloakId));
  }

  public void update(ProfileUpdate input) {
    identities.update(
        currentUser.get().keycloakId, username(input.username()), email(input.email()));
  }

  public void delete() {
    UserEntity user = currentUser.get();
    // Remova primeiro a identidade. Se o banco falhar, uma nova tentativa pode concluir a limpeza.
    identities.delete(user.keycloakId);
    QuarkusTransaction.requiringNew().run(() -> users.deleteById(user.id));
  }

  public void redefine(RedefinePassword input) {
    UserEntity user = currentUser.get();
    var profile = identities.profile(user.keycloakId);
    var login = identities.authenticate(profile.email(), input.password());
    if (!user.keycloakId.equals(login.profile().id()))
      throw new ApiException(401, "senha preenchida é incorreta.");
    identities.changePassword(user.keycloakId, input.newPassword());
  }

  public void forgot(ForgotPassword input) {
    identities.sendPasswordReset(email(input.email()));
  }
}
