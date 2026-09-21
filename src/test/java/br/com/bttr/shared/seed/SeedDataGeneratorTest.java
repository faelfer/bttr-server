package br.com.bttr.shared.seed;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

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

  private SeedConfiguration configuration(long randomSeed) {
    return new SeedConfiguration() {
      @Override
      public boolean enabled() {
        return true;
      }

      @Override
      public boolean reset() {
        return false;
      }

      @Override
      public long randomSeed() {
        return randomSeed;
      }

      @Override
      public int users() {
        return 2;
      }

      @Override
      public int skillsPerUser() {
        return 3;
      }

      @Override
      public int entriesPerSkill() {
        return 4;
      }

      @Override
      public String password() {
        return "!Dev1234";
      }

      @Override
      public List<String> allowedHosts() {
        return List.of("localhost");
      }
    };
  }
}
