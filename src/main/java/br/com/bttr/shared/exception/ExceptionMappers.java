package br.com.bttr.shared.exception;

import br.com.bttr.shared.dtos.MessageResponse;
import io.quarkus.security.AuthenticationFailedException;
import io.quarkus.security.UnauthorizedException;
import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.server.ServerExceptionMapper;

public class ExceptionMappers {
    private static final Logger LOG = Logger.getLogger(ExceptionMappers.class);

    private Response error(int status, String message) {
        return Response.status(status).entity(new MessageResponse(message)).build();
    }

    @ServerExceptionMapper
    public Response api(ApiException e) {
        return error(e.status, e.getMessage());
    }

    @ServerExceptionMapper
    public Response validation(ConstraintViolationException e) {
        String message = e.getConstraintViolations().stream()
                .map(v -> v.getPropertyPath() + ": " + v.getMessage()).sorted()
                .reduce((a, b) -> a + "; " + b).orElse("dados inválidos.");
        return error(400, message);
    }

    @ServerExceptionMapper
    public Response unauthorized(UnauthorizedException e) {
        return error(401, "autenticação necessária.");
    }

    @ServerExceptionMapper
    public Response authentication(AuthenticationFailedException e) {
        return error(401, "token inválido ou expirado.");
    }

    @ServerExceptionMapper
    public Response web(WebApplicationException e) {
        int status = e.getResponse().getStatus();
        return error(status, status == 404 ? "recurso não foi encontrado." : "requisição inválida.");
    }

    @ServerExceptionMapper
    public Response database(org.hibernate.exception.ConstraintViolationException e) {
        return error(409, "registro em conflito com os dados existentes.");
    }

    @ServerExceptionMapper
    public Response unexpected(Exception e) {
        LOG.error("Falha ao processar requisição", e);
        return error(500, "não foi possível concluir a operação.");
    }
}
