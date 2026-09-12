package br.com.bttr.time.resource;

import br.com.bttr.shared.dtos.MessageResponse;
import br.com.bttr.shared.dtos.PageResponse;
import br.com.bttr.shared.pagination.Pagination;
import br.com.bttr.time.dtos.TimeDtos.*;
import br.com.bttr.time.service.TimeService;
import io.quarkus.security.Authenticated;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.*;
import org.eclipse.microprofile.openapi.annotations.Operation;
import org.eclipse.microprofile.openapi.annotations.tags.Tag;

@Path("/times")
@Authenticated
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@Tag(name = "Tempos")
public class TimeResource {
    @Inject TimeService service;
    @GET @Path("/times_by_page")
    @Operation(summary = "Paginar tempos (5 por página, mais recentes primeiro)")
    public PageResponse<TimeView> page(@QueryParam("page") @DefaultValue("1") int page, @Context UriInfo uri) {
        return Pagination.response(service.page(page), page, uri);
    }
    @GET @Path("/times_by_date")
    @Operation(summary = "Listar tempos de uma habilidade no intervalo inclusivo de datas ISO-8601")
    public TimesResponse byDate(@QueryParam("skill_id") @NotNull @Positive Long skillId,
                                @QueryParam("date_initial") @NotBlank String initial,
                                @QueryParam("date_final") @NotBlank String end) {
        return new TimesResponse(service.byDate(skillId, initial, end));
    }
    @GET @Path("/time_by_id/{id}")
    @Operation(summary = "Consultar registro de tempo")
    public TimeResponse one(@PathParam("id") @Positive Long id) { return new TimeResponse(service.one(id)); }
    @POST @Path("/create_time")
    @Operation(summary = "Registrar tempo dedicado a uma habilidade")
    public MessageResponse create(@NotNull @Valid TimeInput input) {
        service.create(input);
        return new MessageResponse("tempo foi criado com sucesso.");
    }
    @PUT @Path("/update_time_by_id/{id}")
    @Operation(summary = "Atualizar registro de tempo")
    public MessageResponse update(@PathParam("id") @Positive Long id, @NotNull @Valid TimeInput input) {
        service.update(id, input);
        return new MessageResponse("tempo alterado com sucesso.");
    }
    @DELETE @Path("/delete_time_by_id/{id}")
    @Operation(summary = "Excluir registro de tempo")
    public MessageResponse delete(@PathParam("id") @Positive Long id) {
        service.delete(id);
        return new MessageResponse("tempo excluido com sucesso.");
    }
}
