package br.com.bttr.shared.seed;

import br.com.bttr.shared.exception.ApiException;
import br.com.bttr.shared.seed.SeedDataGenerator.SkillSeed;
import br.com.bttr.shared.seed.SeedDataGenerator.UserSeed;
import br.com.bttr.skill.entities.SkillEntity;
import br.com.bttr.skill.repository.SkillRepository;
import br.com.bttr.time.entities.TimeEntity;
import br.com.bttr.time.repository.TimeRepository;
import br.com.bttr.user.client.IdentityProvider;
import br.com.bttr.user.entities.UserEntity;
import br.com.bttr.user.repository.UserRepository;
import io.quarkus.arc.profile.IfBuildProfile;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

@ApplicationScoped
@IfBuildProfile("dev")
public class LocalDataSeeder {
  private static final Logger LOG = Logger.getLogger(LocalDataSeeder.class);

  @Inject SeedConfiguration configuration;
  @Inject IdentityProvider identities;
  @Inject UserRepository users;
  @Inject SkillRepository skills;
  @Inject TimeRepository times;

  @ConfigProperty(name = "quarkus.datasource.jdbc.url")
  String databaseUrl;

  @ConfigProperty(name = "bttr.keycloak.url")
  String keycloakUrl;

  void seed(@Observes StartupEvent ignored) {
    if (!configuration.enabled()) {
      LOG.info("Seed local desabilitado.");
      return;
    }
    LocalEnvironmentGuard.verify(databaseUrl, keycloakUrl, configuration.allowedHosts());
    Instant reference = Instant.now().truncatedTo(ChronoUnit.DAYS);
    var seedUsers = SeedDataGenerator.generate(configuration, reference);
    int createdSkills = 0;
    int createdEntries = 0;
    for (UserSeed seedUser : seedUsers) {
      String subject = ensureIdentity(seedUser);
      SeedResult result =
          QuarkusTransaction.requiringNew().call(() -> seedDomainData(subject, seedUser));
      createdSkills += result.skills();
      createdEntries += result.entries();
    }
    LOG.infof(
        "Seed local pronto: %d usuários, %d habilidades novas e %d tempos novos. "
            + "Login: developer1@bttr.local (senha em BTTR_SEED_PASSWORD).",
        seedUsers.size(), createdSkills, createdEntries);
  }

  private String ensureIdentity(UserSeed seedUser) {
    try {
      return identities.authenticate(seedUser.email(), configuration.password()).profile().id();
    } catch (ApiException authenticationFailure) {
      if (authenticationFailure.status != 401) throw authenticationFailure;
      try {
        return identities.create(seedUser.username(), seedUser.email(), configuration.password());
      } catch (ApiException creationFailure) {
        if (creationFailure.status == 409) {
          throw new IllegalStateException(
              "A identidade local "
                  + seedUser.email()
                  + " já existe, mas não aceita BTTR_SEED_PASSWORD.",
              creationFailure);
        }
        throw creationFailure;
      }
    }
  }

  private SeedResult seedDomainData(String subject, UserSeed seedUser) {
    UserEntity user =
        users
            .findByKeycloakId(subject)
            .orElseGet(
                () -> {
                  var created = new UserEntity();
                  created.keycloakId = subject;
                  users.persistAndFlush(created);
                  return created;
                });
    if (configuration.reset()) {
      skills.delete("user.id", user.id);
      skills.flush();
    }
    int createdSkills = 0;
    int createdEntries = 0;
    for (SkillSeed seedSkill : seedUser.skills()) {
      SkillEntity skill =
          skills.findByNameIgnoreCase(user.id, seedSkill.name().toLowerCase(Locale.ROOT));
      if (skill == null) {
        skill = new SkillEntity();
        skill.user = user;
        skill.name = seedSkill.name();
        skill.daily = seedSkill.daily();
        skills.persistAndFlush(skill);
        createdSkills++;
      }
      long existingEntries = times.count("skill.id", skill.id);
      for (long index = existingEntries; index < seedSkill.entries().size(); index++) {
        var seedEntry = seedSkill.entries().get((int) index);
        var time = new TimeEntity();
        time.skill = skill;
        time.minutes = seedEntry.minutes();
        time.created = seedEntry.created();
        times.persist(time);
        createdEntries++;
      }
    }
    times.flush();
    return new SeedResult(createdSkills, createdEntries);
  }

  private record SeedResult(int skills, int entries) {}
}
