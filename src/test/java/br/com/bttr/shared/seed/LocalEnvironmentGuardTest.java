package br.com.bttr.shared.seed;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

class LocalEnvironmentGuardTest {
  private static final List<String> LOCAL = List.of("localhost", "127.0.0.1");

  @Test
  void acceptsLocalServices() {
    assertDoesNotThrow(
        () ->
            LocalEnvironmentGuard.verify(
                "jdbc:postgresql://localhost:5432/bttr", "http://127.0.0.1:8180", LOCAL));
  }

  @Test
  void rejectsRemoteDatabaseOrIdentityProvider() {
    assertThrows(
        IllegalStateException.class,
        () ->
            LocalEnvironmentGuard.verify(
                "jdbc:postgresql://production.example.com/bttr", "http://localhost:8180", LOCAL));
    assertThrows(
        IllegalStateException.class,
        () ->
            LocalEnvironmentGuard.verify(
                "jdbc:postgresql://localhost:5432/bttr", "https://identity.example.com", LOCAL));
  }

  @Test
  void rejectsMalformedUrlsAndEmptyAllowList() {
    assertThrows(
        IllegalStateException.class,
        () -> LocalEnvironmentGuard.verify("bttr", "http://localhost:8180", LOCAL));
    assertThrows(
        IllegalStateException.class,
        () ->
            LocalEnvironmentGuard.verify(
                "jdbc:postgresql://localhost:5432/bttr", "http://localhost:8180", List.of()));
  }

  @Test
  void normalizesHostnamesAndIgnoresBlankAllowListEntries() {
    assertDoesNotThrow(
        () ->
            LocalEnvironmentGuard.verify(
                "jdbc:postgresql://LOCALHOST:5432/bttr",
                "http://LOCALHOST:8180",
                List.of(" localhost ", "", "  ", "LOCALHOST")));
  }

  @Test
  void rejectsAllowListsContainingOnlyWhitespace() {
    List<String> blankHosts = List.of(" ", "");
    assertThrows(
        IllegalStateException.class,
        () ->
            LocalEnvironmentGuard.verify(
                "jdbc:postgresql://localhost/bttr", "http://localhost", blankHosts));
  }

  @ParameterizedTest
  @NullSource
  @ValueSource(
      strings = {
        "",
        "postgresql://localhost/bttr",
        "jdbc:postgresql:bttr",
        "jdbc:postgresql://[invalid"
      })
  void rejectsInvalidDatabaseUrls(String databaseUrl) {
    assertThrows(
        IllegalStateException.class,
        () -> LocalEnvironmentGuard.verify(databaseUrl, "http://localhost:8180", LOCAL));
  }

  @ParameterizedTest
  @ValueSource(strings = {"", "localhost:8180", "http://[invalid", "http://"})
  void rejectsInvalidIdentityProviderUrls(String keycloakUrl) {
    assertThrows(
        IllegalStateException.class,
        () -> LocalEnvironmentGuard.verify("jdbc:postgresql://localhost/bttr", keycloakUrl, LOCAL));
  }
}
