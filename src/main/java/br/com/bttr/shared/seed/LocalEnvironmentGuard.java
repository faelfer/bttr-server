package br.com.bttr.shared.seed;

import java.net.URI;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

final class LocalEnvironmentGuard {
  private static final String JDBC_PREFIX = "jdbc:";

  private LocalEnvironmentGuard() {}

  static void verify(String databaseUrl, String keycloakUrl, List<String> allowedHosts) {
    Set<String> allowed =
        allowedHosts.stream()
            .map(host -> host.trim().toLowerCase(Locale.ROOT))
            .filter(host -> !host.isEmpty())
            .collect(Collectors.toUnmodifiableSet());
    if (allowed.isEmpty()) {
      throw new IllegalStateException("bttr.seed.allowed-hosts não pode estar vazio.");
    }
    verifyHost("PostgreSQL", jdbcHost(databaseUrl), allowed);
    verifyHost("Keycloak", uriHost(keycloakUrl, "Keycloak"), allowed);
  }

  private static String jdbcHost(String url) {
    if (url == null || !url.startsWith(JDBC_PREFIX)) {
      throw invalidUrl("PostgreSQL");
    }
    return uriHost(url.substring(JDBC_PREFIX.length()), "PostgreSQL");
  }

  private static String uriHost(String url, String service) {
    try {
      String host = URI.create(url).getHost();
      if (host == null || host.isBlank()) throw invalidUrl(service);
      return host.toLowerCase(Locale.ROOT);
    } catch (IllegalArgumentException exception) {
      throw invalidUrl(service);
    }
  }

  private static void verifyHost(String service, String host, Set<String> allowed) {
    if (!allowed.contains(host)) {
      throw new IllegalStateException(
          "Seed local bloqueado: host do " + service + " não autorizado: " + host);
    }
  }

  private static IllegalStateException invalidUrl(String service) {
    return new IllegalStateException("Seed local bloqueado: URL inválida para " + service + ".");
  }
}
