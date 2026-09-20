package br.com.bttr.user.resource;

import br.com.bttr.shared.dtos.MessageResponse;
import br.com.bttr.user.dtos.UserDtos.ForgotPassword;
import br.com.bttr.user.dtos.UserDtos.ProfileUpdate;
import br.com.bttr.user.dtos.UserDtos.RedefinePassword;
import br.com.bttr.user.dtos.UserDtos.SignIn;
import br.com.bttr.user.dtos.UserDtos.SignInResponse;
import br.com.bttr.user.dtos.UserDtos.SignUp;
import br.com.bttr.user.dtos.UserDtos.UserResponse;
import br.com.bttr.user.service.UserService;
import io.quarkus.security.Authenticated;
import io.smallrye.common.annotation.Blocking;
import jakarta.annotation.security.PermitAll;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PATCH;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Authenticated
@Blocking
@Tag(name = "Usuários")
public class UserResource {
  @Inject UserService service;

  @POST
  @Path("/sign_up")
  @PermitAll
  @Operation(summary = "Cadastrar usuário no Keycloak e no Bttr")
  public MessageResponse signUp(@NotNull @Valid SignUp input) {
    service.signUp(input);
    return new MessageResponse("usuário foi criado com sucesso.");
  }

  @POST
  @Path("/sign_in")
  @PermitAll
  @Operation(summary = "Autenticar por e-mail e senha e obter token")
  public SignInResponse signIn(@NotNull @Valid SignIn input) {
    return service.signIn(input);
  }

  @POST
  @Path("/forgot_password")
  @PermitAll
  @Operation(summary = "Enviar link de redefinição de senha por e-mail (válido por 15 minutos)")
  public MessageResponse forgot(@NotNull @Valid ForgotPassword input) {
    service.forgot(input);
    return new MessageResponse(
        "se o e-mail estiver cadastrado, enviaremos as instruções para redefinir sua senha.");
  }

  @GET
  @Path("/profile")
  @Operation(summary = "Consultar perfil autenticado")
  public UserResponse profile() {
    return new UserResponse(service.profile());
  }

  @PATCH
  @Path("/profile")
  @Operation(summary = "Alterar nome de usuário e e-mail")
  public MessageResponse update(@NotNull @Valid ProfileUpdate input) {
    service.update(input);
    return new MessageResponse("perfil alterado com sucesso.");
  }

  @DELETE
  @Path("/profile")
  @Operation(summary = "Excluir conta e todos os seus registros")
  public MessageResponse delete() {
    service.delete();
    return new MessageResponse("usuário excluido com sucesso.");
  }

  @POST
  @Path("/redefine_password")
  @Operation(summary = "Alterar senha confirmando a senha atual")
  public MessageResponse redefine(@NotNull @Valid RedefinePassword input) {
    service.redefine(input);
    return new MessageResponse("senha alterada com sucesso.");
  }
}
