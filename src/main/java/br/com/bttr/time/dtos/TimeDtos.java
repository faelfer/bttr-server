package br.com.bttr.time.dtos;

import br.com.bttr.skill.dtos.SkillDtos.SkillView;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.Instant;
import java.util.List;

public final class TimeDtos {
  private TimeDtos() {}

  public record TimeInput(
      @JsonProperty("skill_id") @NotNull @Positive Long skillId,
      @NotNull @Min(1) @Max(1440) Integer minutes) {}

  public record TimeView(Long id, Integer minutes, Instant created, SkillView skill) {}

  public record TimeResponse(TimeView time) {}

  public record TimesResponse(List<TimeView> times) {}
}
