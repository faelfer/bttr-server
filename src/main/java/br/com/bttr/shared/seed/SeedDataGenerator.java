package br.com.bttr.shared.seed;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import net.datafaker.Faker;

final class SeedDataGenerator {
  private static final int MAX_SKILL_NAME = 120;
  private static final Duration HISTORY = Duration.ofDays(90);

  private SeedDataGenerator() {}

  static List<UserSeed> generate(SeedConfiguration configuration, Instant reference) {
    validate(configuration);
    var random = new Random(configuration.randomSeed());
    var faker = new Faker(random);
    var users = new ArrayList<UserSeed>();
    for (int userIndex = 1; userIndex <= configuration.users(); userIndex++) {
      var skills = new ArrayList<SkillSeed>();
      for (int skillIndex = 1; skillIndex <= configuration.skillsPerUser(); skillIndex++) {
        String label = "Skill %02d - %s".formatted(skillIndex, faker.lorem().word());
        String name = label.substring(0, Math.min(label.length(), MAX_SKILL_NAME));
        int daily = 15 + random.nextInt(106);
        var entries = new ArrayList<TimeSeed>();
        for (int entryIndex = 0; entryIndex < configuration.entriesPerSkill(); entryIndex++) {
          int minutes = 15 + random.nextInt(106);
          long age = random.nextLong(HISTORY.toSeconds() + 1);
          entries.add(new TimeSeed(minutes, reference.minusSeconds(age)));
        }
        skills.add(new SkillSeed(name, daily, entries));
      }
      // Keycloak's default username validator rejects whitespace and other display-name
      // characters. Keep the local login identifier deliberately simple and predictable.
      String username = "developer%d".formatted(userIndex);
      users.add(
          new UserSeed(
              username.substring(0, Math.min(username.length(), 100)),
              "developer%d@bttr.local".formatted(userIndex),
              skills));
    }
    return List.copyOf(users);
  }

  private static void validate(SeedConfiguration configuration) {
    if (configuration.users() < 1 || configuration.users() > 25) {
      throw new IllegalArgumentException("bttr.seed.users deve estar entre 1 e 25.");
    }
    if (configuration.skillsPerUser() < 1 || configuration.skillsPerUser() > 50) {
      throw new IllegalArgumentException("bttr.seed.skills-per-user deve estar entre 1 e 50.");
    }
    if (configuration.entriesPerSkill() < 0 || configuration.entriesPerSkill() > 500) {
      throw new IllegalArgumentException("bttr.seed.entries-per-skill deve estar entre 0 e 500.");
    }
    long totalEntries =
        (long) configuration.users()
            * configuration.skillsPerUser()
            * configuration.entriesPerSkill();
    if (totalEntries > 100_000) {
      throw new IllegalArgumentException(
          "O seed local não pode exceder 100000 registros de tempo.");
    }
    if (configuration.password().isBlank()) {
      throw new IllegalArgumentException("bttr.seed.password não pode estar vazio.");
    }
  }

  record UserSeed(String username, String email, List<SkillSeed> skills) {}

  record SkillSeed(String name, int daily, List<TimeSeed> entries) {}

  record TimeSeed(int minutes, Instant created) {}
}
