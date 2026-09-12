package br.com.bttr.time.mapper;

import br.com.bttr.skill.mapper.SkillMapper;
import br.com.bttr.time.dtos.TimeDtos.TimeView;
import br.com.bttr.time.entities.TimeEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class TimeMapper {
    @Inject SkillMapper skillMapper;

    public TimeView toView(TimeEntity time) {
        return new TimeView(time.id, time.minutes, time.created, skillMapper.toView(time.skill));
    }
}
