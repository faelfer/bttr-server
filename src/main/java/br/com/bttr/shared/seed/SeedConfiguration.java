package br.com.bttr.shared.seed;

import io.smallrye.config.ConfigMapping;
import io.smallrye.config.WithDefault;
import java.util.List;

@ConfigMapping(prefix = "bttr.seed")
public interface SeedConfiguration {
  @WithDefault("false")
  boolean enabled();

  @WithDefault("false")
  boolean reset();

  @WithDefault("42")
  long randomSeed();

  @WithDefault("3")
  int users();

  @WithDefault("5")
  int skillsPerUser();

  @WithDefault("20")
  int entriesPerSkill();

  @WithDefault("!Dev1234")
  String password();

  @WithDefault("localhost,127.0.0.1")
  List<String> allowedHosts();
}
