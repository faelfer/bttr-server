package br.com.bttr.shared.seed;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;

class SeedDataGeneratorTest {
  private static final Instant REFERENCE = Instant.parse("2026-09-21T00:00:00Z");

  @Test
  void generatesDeterministicAndValidData() {
    SeedConfiguration configuration = configuration(42);

    var first = SeedDataGenerator.generate(configuration, REFERENCE);
    var second = SeedDataGenerator.generate(configuration, REFERENCE);

    assertEquals(first, second);
    assertEquals(2, first.size());
    assertEquals("developer1", first.getFirst().username());
    assertEquals("developer1@bttr.local", first.getFirst().email());
    assertEquals(3, first.getFirst().skills().size());
    assertTrue(
        first.stream()
            .flatMap(user -> user.skills().stream())
            .allMatch(skill -> skill.entries().size() == 4));
    assertTrue(
        first.stream()
            .flatMap(user -> user.skills().stream())
            .flatMap(skill -> skill.entries().stream())
            .allMatch(entry -> !entry.created().isAfter(REFERENCE)));
  }

  @Test
  void changesDataWhenRandomSeedChanges() {
    assertNotEquals(
        SeedDataGenerator.generate(configuration(42), REFERENCE),
        SeedDataGenerator.generate(configuration(43), REFERENCE));
  }

  @ParameterizedTest
  @CsvSource({"0,3,4", "26,3,4", "2,0,4", "2,51,4", "2,3,-1", "2,3,501", "25,50,81"})
  void rejectsOutOfRangeSizesAndExcessiveTotalHistory(int users, int skills, int entries) {
    assertThrows(
        IllegalArgumentException.class,
        () ->
            SeedDataGenerator.generate(
                new Configuration(users, skills, entries, "secret", 42), REFERENCE));
  }

  @ParameterizedTest
  @ValueSource(strings = {"", " ", "\t"})
  void rejectsBlankPasswords(String password) {
    assertThrows(
        IllegalArgumentException.class,
        () -> SeedDataGenerator.generate(new Configuration(1, 1, 1, password, 42), REFERENCE));
  }

  @ParameterizedTest
  @CsvSource({"1,1,0", "25,50,0", "1,1,500"})
  void acceptsBoundarySizesAndKeepsGeneratedValuesWithinLimits(int users, int skills, int entries) {
    var generated =
        SeedDataGenerator.generate(
            new Configuration(users, skills, entries, "secret", 42), REFERENCE);

    assertEquals(users, generated.size());
    for (var user : generated) {
      assertTrue(user.username().matches("developer[0-9]+"));
      assertEquals(skills, user.skills().size());
      for (var skill : user.skills()) {
        assertTrue(skill.name().length() <= 120);
        assertTrue(skill.daily() >= 15 && skill.daily() <= 120);
        assertEquals(entries, skill.entries().size());
        for (var entry : skill.entries()) {
          assertTrue(entry.minutes() >= 15 && entry.minutes() <= 120);
          assertTrue(!entry.created().isAfter(REFERENCE));
          assertTrue(!entry.created().isBefore(REFERENCE.minusSeconds(90L * 24 * 60 * 60)));
        }
      }
    }
  }

  private SeedConfiguration configuration(long randomSeed) {
    return new Configuration(2, 3, 4, "!Dev1234", randomSeed);
  }

  private record Configuration(
      int users, int skillsPerUser, int entriesPerSkill, String password, long randomSeed)
      implements SeedConfiguration {
    @Override
    public boolean enabled() {
      return true;
    }

    @Override
    public boolean reset() {
      return false;
    }

    @Override
    public List<String> allowedHosts() {
      return List.of("localhost");
    }
  }
}
