package br.com.bttr.skill.dtos;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public final class SkillDtos {
    private SkillDtos() {}

    public record SkillInput(
            @NotBlank @Size(min = 2, max = 120) String name,
            @NotNull @Min(1) @Max(1440) Integer daily) {}

    public record SkillView(Long id, String name, Integer daily, Instant created) {}

    public record SkillResponse(SkillView skill) {}

    public record SkillsResponse(List<SkillView> skills) {}
}
