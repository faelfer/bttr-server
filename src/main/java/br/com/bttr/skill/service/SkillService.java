package br.com.bttr.skill.service;

import br.com.bttr.shared.exception.ApiException;
import br.com.bttr.shared.pagination.PageResult;
import br.com.bttr.skill.dtos.SkillDtos.*;
import br.com.bttr.skill.entities.SkillEntity;
import br.com.bttr.skill.mapper.SkillMapper;
import br.com.bttr.skill.repository.SkillRepository;
import br.com.bttr.user.service.CurrentUserService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;
import java.util.Locale;

@ApplicationScoped
public class SkillService {
    @Inject CurrentUserService currentUser;
    @Inject SkillRepository repository;
    @Inject SkillMapper mapper;

    public SkillEntity owned(Long id) {
        return repository.findOwned(id, currentUser.get().id)
                .orElseThrow(() -> ApiException.notFound("habilidade"));
    }

    public List<SkillView> all() {
        return repository.listByUser(currentUser.get().id).stream().map(mapper::toView).toList();
    }

    public PageResult<SkillView> page(int page) {
        return repository.pageByUser(currentUser.get().id, page).map(mapper::toView);
    }

    public SkillView one(Long id) {
        return mapper.toView(owned(id));
    }

    private String validateName(String raw, Long ignoreId) {
        String name = raw.trim();
        if (name.length() < 2) throw new ApiException(400, "nome de habilidade deve conter pelo menos 2 caracteres.");
        SkillEntity existing = repository.findByNameIgnoreCase(currentUser.get().id, name.toLowerCase(Locale.ROOT));
        if (existing != null && !existing.id.equals(ignoreId)) throw new ApiException(409, "nome de habilidade já existente.");
        return name;
    }

    @Transactional
    public void create(SkillInput input) {
        var skill = new SkillEntity();
        skill.user = currentUser.get();
        skill.name = validateName(input.name(), null);
        skill.daily = input.daily();
        repository.persistAndFlush(skill);
    }

    @Transactional
    public void update(Long id, SkillInput input) {
        SkillEntity skill = owned(id);
        skill.name = validateName(input.name(), id);
        skill.daily = input.daily();
        repository.flush();
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(owned(id));
    }
}
