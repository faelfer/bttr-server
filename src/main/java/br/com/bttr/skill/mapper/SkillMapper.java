package br.com.bttr.skill.mapper;

import br.com.bttr.skill.dtos.SkillDtos.SkillView;
import br.com.bttr.skill.entities.SkillEntity;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class SkillMapper {
  public SkillView toView(SkillEntity skill) {
    return new SkillView(skill.id, skill.name, skill.daily, skill.created);
  }
}
