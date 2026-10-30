package br.com.bttr.shared.seed;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.anyLong;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import br.com.bttr.shared.exception.ApiException;
import br.com.bttr.skill.entities.SkillEntity;
import br.com.bttr.skill.repository.SkillRepository;
import br.com.bttr.time.entities.TimeEntity;
import br.com.bttr.time.repository.TimeRepository;
import br.com.bttr.user.client.IdentityProvider;
import br.com.bttr.user.entities.UserEntity;
import br.com.bttr.user.repository.UserRepository;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.runtime.StartupEvent;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

@QuarkusTest
class LocalDataSeederTest {
  private static final String EMAIL = "developer1@bttr.local";
  private static final String PASSWORD = "seed-test-password";
  private static final String SUBJECT = "seed-subject";

  @Inject UserRepository users;
  @Inject SkillRepository skills;
  @Inject TimeRepository times;

  SeedConfiguration configuration;
  IdentityProvider identities;
  LocalDataSeeder seeder;

  @BeforeEach
  void setup() {
    QuarkusTransaction.requiringNew()
        .run(
            () -> {
              times.deleteAll();
              skills.deleteAll();
              users.deleteAll();
            });
    configuration = mock(SeedConfiguration.class);
    when(configuration.enabled()).thenReturn(true);
    when(configuration.allowedHosts()).thenReturn(List.of("localhost"));
    when(configuration.randomSeed()).thenReturn(42L);
    when(configuration.users()).thenReturn(1);
    when(configuration.skillsPerUser()).thenReturn(2);
    when(configuration.entriesPerSkill()).thenReturn(3);
    when(configuration.password()).thenReturn(PASSWORD);
    identities = mock(IdentityProvider.class);
    when(identities.authenticate(EMAIL, PASSWORD))
        .thenReturn(
            new IdentityProvider.Login(
                "access-token", new IdentityProvider.Profile(SUBJECT, "developer1", EMAIL)));
    seeder =
        new LocalDataSeeder(
            configuration,
            identities,
            users,
            skills,
            times,
            "jdbc:postgresql://localhost/bttr",
            "http://localhost:8180");
  }

  @Test
  void disabledSeedDoesNotContactIdentityProviderOrCreateData() {
    when(configuration.enabled()).thenReturn(false);

    seed();

    verifyNoInteractions(identities);
    assertCounts(0, 0, 0);
  }

  @Test
  void remoteServicesAreRejectedBeforeAuthentication() {
    when(configuration.allowedHosts()).thenReturn(List.of("another-host"));

    assertThrows(IllegalStateException.class, this::seed);

    verifyNoInteractions(identities);
    assertCounts(0, 0, 0);
  }

  @Test
  void createsDomainDataForAnExistingIdentityWithoutRecreatingIt() {
    seed();

    assertCounts(1, 2, 6);
    verify(identities, never()).create(anyString(), anyString(), anyString());
    QuarkusTransaction.requiringNew()
        .run(
            () -> {
              UserEntity user = users.findByKeycloakId(SUBJECT).orElseThrow();
              for (SkillEntity skill : skills.listByUser(user.id)) {
                assertEquals(user.id, skill.user.id);
                assertEquals(3, times.count("skill.id", skill.id));
                assertTrue(skill.daily >= 15 && skill.daily <= 120);
              }
            });
  }

  @Test
  void missingIdentityIsCreatedWithTheConfiguredPassword() {
    when(identities.authenticate(EMAIL, PASSWORD)).thenThrow(new ApiException(401, "missing"));
    when(identities.create("developer1", EMAIL, PASSWORD)).thenReturn(SUBJECT);

    seed();

    verify(identities).create("developer1", EMAIL, PASSWORD);
    assertCounts(1, 2, 6);
  }

  @Test
  void repeatedSeedPreservesExistingSkillsAndEntries() {
    seed();
    List<Long> originalIds = skillIds();

    seed();

    assertCounts(1, 2, 6);
    assertEquals(originalIds, skillIds());
  }

  @Test
  void addsOnlyMissingEntriesAndPreservesUserChanges() {
    seed();
    Long skillId = skillIds().getFirst();
    QuarkusTransaction.requiringNew()
        .run(
            () -> {
              SkillEntity skill = skills.findById(skillId);
              skill.daily = 7;
              List<TimeEntity> entries = times.list("skill.id", skillId);
              times.deleteById(entries.getFirst().id);
            });

    seed();

    assertCounts(1, 2, 6);
    QuarkusTransaction.requiringNew().run(() -> assertEquals(7, skills.findById(skillId).daily));
  }

  @Test
  void resetReplacesSkillsAndEntriesButRetainsTheUser() {
    seed();
    List<Long> originalIds = skillIds();
    Long userId =
        QuarkusTransaction.requiringNew()
            .call(() -> users.findByKeycloakId(SUBJECT).orElseThrow().id);
    when(configuration.reset()).thenReturn(true);

    seed();

    assertCounts(1, 2, 6);
    assertNotEquals(originalIds, skillIds());
    QuarkusTransaction.requiringNew()
        .run(() -> assertEquals(userId, users.findByKeycloakId(SUBJECT).orElseThrow().id));
  }

  @Test
  void entriesBeyondTheConfiguredCountAreNotDeleted() {
    seed();
    Long skillId = skillIds().getFirst();
    QuarkusTransaction.requiringNew()
        .run(
            () -> {
              var extra = new TimeEntity();
              extra.skill = skills.findById(skillId);
              extra.minutes = 60;
              extra.created = Instant.now();
              times.persist(extra);
            });

    seed();

    assertCounts(1, 2, 7);
  }

  @Test
  void emptyHistoryCreatesSkillsWithoutTimeEntries() {
    when(configuration.entriesPerSkill()).thenReturn(0);

    seed();

    assertCounts(1, 2, 0);
  }

  @ParameterizedTest
  @ValueSource(ints = {403, 500, 503})
  void authenticationFailuresArePropagatedWithoutCreatingData(int status) {
    ApiException failure = new ApiException(status, "identity failure");
    when(identities.authenticate(EMAIL, PASSWORD)).thenThrow(failure);

    assertSame(failure, assertThrows(ApiException.class, this::seed));

    verify(identities, never()).create(anyString(), anyString(), anyString());
    assertCounts(0, 0, 0);
  }

  @Test
  void passwordConflictExplainsHowToFixTheLocalIdentity() {
    when(identities.authenticate(EMAIL, PASSWORD)).thenThrow(new ApiException(401, "missing"));
    ApiException conflict = new ApiException(409, "existing identity");
    when(identities.create("developer1", EMAIL, PASSWORD)).thenThrow(conflict);

    IllegalStateException failure = assertThrows(IllegalStateException.class, this::seed);

    assertEquals(
        "A identidade local " + EMAIL + " já existe, mas não aceita BTTR_SEED_PASSWORD.",
        failure.getMessage());
    assertSame(conflict, failure.getCause());
    assertCounts(0, 0, 0);
  }

  @Test
  void unexpectedCreationFailureIsPropagatedWithoutCreatingData() {
    when(identities.authenticate(EMAIL, PASSWORD)).thenThrow(new ApiException(401, "missing"));
    ApiException failure = new ApiException(503, "unavailable");
    when(identities.create("developer1", EMAIL, PASSWORD)).thenThrow(failure);

    assertSame(failure, assertThrows(ApiException.class, this::seed));

    assertCounts(0, 0, 0);
  }

  @Test
  void domainFailureRollsBackTheNewUser() {
    SkillRepository failingSkills = mock(SkillRepository.class);
    when(failingSkills.findByNameIgnoreCase(anyLong(), anyString()))
        .thenThrow(new IllegalStateException("storage failure"));
    seeder =
        new LocalDataSeeder(
            configuration,
            identities,
            users,
            failingSkills,
            times,
            "jdbc:postgresql://localhost/bttr",
            "http://localhost:8180");

    assertThrows(IllegalStateException.class, this::seed);

    assertCounts(0, 0, 0);
  }

  private void seed() {
    seeder.seed(new StartupEvent());
  }

  private List<Long> skillIds() {
    return QuarkusTransaction.requiringNew()
        .call(() -> skills.listAll().stream().map(skill -> skill.id).sorted().toList());
  }

  private void assertCounts(long expectedUsers, long expectedSkills, long expectedEntries) {
    QuarkusTransaction.requiringNew()
        .run(
            () -> {
              assertEquals(expectedUsers, users.count());
              assertEquals(expectedSkills, skills.count());
              assertEquals(expectedEntries, times.count());
            });
  }
}
