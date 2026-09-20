package br.com.bttr.time.service;

import br.com.bttr.shared.exception.ApiException;
import br.com.bttr.shared.pagination.PageResult;
import br.com.bttr.skill.service.SkillService;
import br.com.bttr.time.dtos.TimeDtos.TimeInput;
import br.com.bttr.time.dtos.TimeDtos.TimeView;
import br.com.bttr.time.entities.TimeEntity;
import br.com.bttr.time.mapper.TimeMapper;
import br.com.bttr.time.repository.TimeRepository;
import br.com.bttr.user.service.CurrentUserService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.List;

@ApplicationScoped
public class TimeService {
  @Inject CurrentUserService currentUser;
  @Inject SkillService skills;
  @Inject TimeRepository repository;
  @Inject TimeMapper mapper;

  private TimeEntity owned(Long id) {
    return repository
        .findOwned(id, currentUser.get().id)
        .orElseThrow(() -> ApiException.notFound("tempo"));
  }

  public PageResult<TimeView> page(int page) {
    return repository.pageByUser(currentUser.get().id, page).map(mapper::toView);
  }

  public TimeView one(Long id) {
    return mapper.toView(owned(id));
  }

  public List<TimeView> byDate(Long skillId, String initial, String end) {
    skills.owned(skillId);
    try {
      Instant from = Instant.parse(initial);
      Instant to = Instant.parse(end);
      if (from.isAfter(to))
        throw new ApiException(400, "data inicial deve ser anterior ou igual à data final.");
      return repository.listBySkillAndPeriod(skillId, currentUser.get().id, from, to).stream()
          .map(mapper::toView)
          .toList();
    } catch (DateTimeParseException e) {
      throw new ApiException(400, "datas devem estar no formato ISO-8601 com fuso horário.");
    }
  }

  @Transactional
  public void create(TimeInput input) {
    var time = new TimeEntity();
    time.skill = skills.owned(input.skillId());
    time.minutes = input.minutes();
    repository.persistAndFlush(time);
  }

  @Transactional
  public void update(Long id, TimeInput input) {
    TimeEntity time = owned(id);
    time.skill = skills.owned(input.skillId());
    time.minutes = input.minutes();
  }

  @Transactional
  public void delete(Long id) {
    repository.delete(owned(id));
  }
}
