package br.com.bttr.time.repository;

import br.com.bttr.shared.pagination.PageResult;
import br.com.bttr.shared.pagination.Pagination;
import br.com.bttr.time.entities.TimeEntity;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class TimeRepository implements PanacheRepository<TimeEntity> {
  public Optional<TimeEntity> findOwned(Long id, Long userId) {
    return find(
            "from TimeEntity t join fetch t.skill s where t.id = ?1 and s.user.id = ?2", id, userId)
        .firstResultOptional();
  }

  public PageResult<TimeEntity> pageByUser(Long userId, int page) {
    return Pagination.query(
        find(
            "from TimeEntity t join fetch t.skill s where s.user.id = ?1 order by t.created desc, t.id desc",
            userId),
        page);
  }

  public List<TimeEntity> listBySkillAndPeriod(
      Long skillId, Long userId, Instant from, Instant to) {
    return list(
        "from TimeEntity t join fetch t.skill s where s.id = ?1 and s.user.id = ?2 "
            + "and t.created >= ?3 and t.created <= ?4 order by t.created, t.id",
        skillId,
        userId,
        from,
        to);
  }
}
