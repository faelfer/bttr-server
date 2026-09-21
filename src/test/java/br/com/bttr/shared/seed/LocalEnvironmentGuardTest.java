package br.com.bttr.shared.seed;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.List;
import org.junit.jupiter.api.Test;

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
}
