package br.com.bttr.skill.resource;

import br.com.bttr.shared.dtos.MessageResponse;
import br.com.bttr.shared.dtos.PageResponse;
import br.com.bttr.shared.pagination.Pagination;
import br.com.bttr.skill.dtos.SkillDtos.SkillInput;
import br.com.bttr.skill.dtos.SkillDtos.SkillResponse;
import br.com.bttr.skill.dtos.SkillDtos.SkillView;
import br.com.bttr.skill.dtos.SkillDtos.SkillsResponse;
import br.com.bttr.skill.service.SkillService;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.DefaultValue;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.UriInfo;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/skills")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Habilidades")
public class SkillResource {
  @Inject SkillService service;

  @GET
  @Path("/skills_from_user")
  @Operation(summary = "Listar todas as habilidades do usuário")
  public SkillsResponse all() {
    return new SkillsResponse(service.all());
  }

  @GET
  @Path("/skills_by_page")
  @Operation(summary = "Paginar habilidades (5 por página, começando em 1)")
  public PageResponse<SkillView> page(
      @QueryParam("page") @DefaultValue("1") int page, @Context UriInfo uri) {
    return Pagination.response(service.page(page), page, uri);
  }

  @GET
  @Path("/skill_by_id/{id}")
  @Operation(summary = "Consultar habilidade do usuário")
  public SkillResponse one(@PathParam("id") @Positive Long id) {
    return new SkillResponse(service.one(id));
  }

  @POST
  @Path("/create_skill")
  @Operation(summary = "Criar habilidade")
  public MessageResponse create(@NotNull @Valid SkillInput input) {
    service.create(input);
    return new MessageResponse("habilidade foi criada com sucesso.");
  }

  @PUT
  @Path("/update_skill_by_id/{id}")
  @Operation(summary = "Atualizar habilidade")
  public MessageResponse update(
      @PathParam("id") @Positive Long id, @NotNull @Valid SkillInput input) {
    service.update(id, input);
    return new MessageResponse("habilidade alterada com sucesso.");
  }

  @DELETE
  @Path("/delete_skill_by_id/{id}")
  @Operation(summary = "Excluir habilidade e seus registros de tempo")
  public MessageResponse delete(@PathParam("id") @Positive Long id) {
    service.delete(id);
    return new MessageResponse("habilidade excluida com sucesso.");
  }
}
