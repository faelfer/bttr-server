package br.com.bttr.skill.repository;

import br.com.bttr.skill.entities.SkillEntity;
import br.com.bttr.shared.pagination.PageResult;
import br.com.bttr.shared.pagination.Pagination;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class SkillRepository implements PanacheRepository<SkillEntity> {
    public Optional<SkillEntity> findOwned(Long id, Long userId) {
        return find("id = ?1 and user.id = ?2", id, userId).firstResultOptional();
    }

    public List<SkillEntity> listByUser(Long userId) {
        return list("user.id = ?1 order by lower(name), id", userId);
    }

    public PageResult<SkillEntity> pageByUser(Long userId, int page) {
        return Pagination.query(find("user.id = ?1 order by created desc, id desc", userId), page);
    }

    public SkillEntity findByNameIgnoreCase(Long userId, String normalizedName) {
        return find("user.id = ?1 and lower(name) = ?2", userId, normalizedName).firstResult();
    }
}
