package br.com.bttr.user.client;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import br.com.bttr.shared.exception.ApiException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

class KeycloakIdentityProviderTest {
  HttpServer server;
  KeycloakIdentityProvider provider;
  List<Request> requests;

  @BeforeEach
  void setup() throws Exception {
    server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
    provider = new KeycloakIdentityProvider();
    provider.json = new ObjectMapper();
    provider.server = "http://localhost:" + server.getAddress().getPort();
    provider.realm = "test";
    provider.clientId = "test";
    provider.clientSecret = "test";
    requests = new CopyOnWriteArrayList<>();
    server.start();
  }

  @AfterEach
  void cleanup() {
    server.stop(0);
  }

  void response(int status, String error) {
    server.createContext(
        "/realms/test/protocol/openid-connect/token",
        exchange -> {
          byte[] body = ("{\"error\":\"" + error + "\"}").getBytes(StandardCharsets.UTF_8);
          exchange.getResponseHeaders().add("Content-Type", "application/json");
          exchange.sendResponseHeaders(status, body.length);
          try (var output = exchange.getResponseBody()) {
            output.write(body);
          }
        });
  }

  @Test
  void invalidCredentialsReturnedAs401ByKeycloakRemain401() {
    response(401, "invalid_grant");
    assertEquals(
        401,
        assertThrows(ApiException.class, () -> provider.authenticate("a@example.com", "wrong"))
            .status);
  }

  @Test
  void invalidGrantReturnedAs400IsAlsoUnauthorized() {
    response(400, "invalid_grant");
    assertEquals(
        401,
        assertThrows(ApiException.class, () -> provider.authenticate("a@example.com", "wrong"))
            .status);
  }

  @Test
  void invalidClientConfigurationIsServiceUnavailable() {
    response(401, "invalid_client");
    assertEquals(
        503,
        assertThrows(ApiException.class, () -> provider.authenticate("a@example.com", "wrong"))
            .status);
  }

  @Test
  void invalidUsernameReturnedByKeycloakHasSpecificMessage() {
    server.createContext(
        "/realms/test/protocol/openid-connect/token",
        exchange -> {
          byte[] body = "{\"access_token\":\"admin-token\"}".getBytes(StandardCharsets.UTF_8);
          exchange.sendResponseHeaders(200, body.length);
          try (var output = exchange.getResponseBody()) {
            output.write(body);
          }
        });
    server.createContext(
        "/admin/realms/test/users",
        exchange -> {
          byte[] body =
              "{\"field\":\"username\",\"errorMessage\":\"error-username-invalid-character\"}"
                  .getBytes(StandardCharsets.UTF_8);
          exchange.sendResponseHeaders(400, body.length);
          try (var output = exchange.getResponseBody()) {
            output.write(body);
          }
        });

    ApiException exception =
        assertThrows(
            ApiException.class,
            () -> provider.create("Developer Local", "developer@example.com", "!Dev1234"));

    assertEquals(400, exception.status);
    assertEquals("nome de usuário contém caracteres inválidos.", exception.getMessage());
  }

  @Test
  void authenticatesWithEncodedCredentialsAndRetrievesTheProfile() throws Exception {
    respond("/realms/test/protocol/openid-connect/token", 200, "{\"access_token\":\"user-token\"}");
    respond(
        "/realms/test/protocol/openid-connect/userinfo",
        200,
        "{\"sub\":\"user-1\",\"preferred_username\":\"Alice\",\"email\":\"a+b@example.com\"}");

    var login = provider.authenticate("a+b@example.com", "p&= value");

    assertEquals("user-token", login.token());
    assertEquals(
        new IdentityProvider.Profile("user-1", "Alice", "a+b@example.com"), login.profile());
    assertEquals("POST", requests.getFirst().method());
    assertTrue(requests.getFirst().body().contains("username=a%2Bb%40example.com"));
    assertTrue(requests.getFirst().body().contains("password=p%26%3D+value"));
    assertTrue(requests.getFirst().body().contains("client_secret=test"));
    assertEquals("Bearer user-token", requests.getLast().authorization());
  }

  @Test
  void createsAnEnabledUserWithANonTemporaryPassword() throws Exception {
    adminToken();
    server.createContext(
        "/admin/realms/test/users",
        exchange -> {
          capture(exchange);
          exchange
              .getResponseHeaders()
              .add("Location", provider.server + "/admin/realms/test/users/new-user");
          exchange.sendResponseHeaders(201, -1);
          exchange.close();
        });

    assertEquals("new-user", provider.create("Alice", "alice@example.com", "secret"));

    var request = requests.getLast();
    assertEquals("POST", request.method());
    assertEquals("Bearer admin-token", request.authorization());
    var payload = provider.json.readTree(request.body());
    assertEquals("Alice", payload.path("username").asText());
    assertEquals("alice@example.com", payload.path("email").asText());
    assertTrue(payload.path("enabled").asBoolean());
    assertFalse(payload.path("emailVerified").asBoolean());
    assertEquals("secret", payload.path("credentials").get(0).path("value").asText());
    assertFalse(payload.path("credentials").get(0).path("temporary").asBoolean());
  }

  @Test
  void missingCreatedUserLocationIsReportedAsUnavailable() {
    adminToken();
    respond("/admin/realms/test/users", 201, "");

    assertStatus(503, () -> provider.create("Alice", "alice@example.com", "secret"));
  }

  @ParameterizedTest
  @ValueSource(strings = {"email already exists", "username already exists"})
  void duplicateIdentityHasAConflictMessageForTheCorrectField(String message) {
    adminToken();
    respond("/admin/realms/test/users", 409, "{\"errorMessage\":\"" + message + "\"}");

    ApiException failure =
        assertThrows(
            ApiException.class, () -> provider.create("Alice", "alice@example.com", "secret"));

    assertEquals(409, failure.status);
    assertEquals(
        message.startsWith("email")
            ? "usuário com e-mail já existente."
            : "nome de usuário já existente.",
        failure.getMessage());
  }

  @ParameterizedTest
  @ValueSource(ints = {400, 404, 500})
  void mapsAdministrativeErrorsToTheExpectedApiStatus(int status) {
    adminToken();
    respond("/admin/realms/test/users", status, "{}");

    assertStatus(
        status == 500 ? 503 : status,
        () -> provider.create("Alice", "alice@example.com", "secret"));
  }

  @Test
  void loadsAnEnabledProfile() {
    adminToken();
    respond(
        "/admin/realms/test/users/user-1",
        200,
        "{\"id\":\"user-1\",\"username\":\"Alice\",\"email\":\"alice@example.com\",\"enabled\":true}");

    assertEquals(
        new IdentityProvider.Profile("user-1", "Alice", "alice@example.com"),
        provider.profile("user-1"));
  }

  @Test
  void disabledProfilesCannotAuthenticate() {
    adminToken();
    respond("/admin/realms/test/users/user-1", 200, "{\"enabled\":false}");

    assertStatus(401, () -> provider.profile("user-1"));
  }

  @ParameterizedTest
  @ValueSource(strings = {"new@example.com", "ALICE@example.com"})
  void updatesUserAndResetsEmailVerificationOnlyWhenTheEmailChanges(String email) throws Exception {
    adminToken();
    server.createContext(
        "/admin/realms/test/users/user-1",
        exchange -> {
          capture(exchange);
          byte[] body =
              "{\"id\":\"user-1\",\"username\":\"Alice\",\"email\":\"alice@example.com\",\"enabled\":true}"
                  .getBytes(StandardCharsets.UTF_8);
          exchange.sendResponseHeaders(200, body.length);
          try (var output = exchange.getResponseBody()) {
            output.write(body);
          }
        });

    provider.update("user-1", "Updated Alice", email);

    var request = requests.getLast();
    assertEquals("PUT", request.method());
    var payload = provider.json.readTree(request.body());
    assertEquals("Updated Alice", payload.path("username").asText());
    assertEquals(email, payload.path("email").asText());
    assertEquals(email.startsWith("new"), payload.has("emailVerified"));
    if (payload.has("emailVerified")) assertFalse(payload.path("emailVerified").asBoolean());
  }

  @ParameterizedTest
  @ValueSource(ints = {204, 404})
  void deletesUsersIdempotently(int status) {
    adminToken();
    respond("/admin/realms/test/users/user-1", status, "{}");

    provider.delete("user-1");

    assertEquals("DELETE", requests.getLast().method());
  }

  @Test
  void deletionDoesNotHideUnexpectedServiceErrors() {
    adminToken();
    respond("/admin/realms/test/users/user-1", 500, "{}");

    assertStatus(503, () -> provider.delete("user-1"));
  }

  @Test
  void changesPasswordWithoutMakingItTemporary() throws Exception {
    adminToken();
    respond("/admin/realms/test/users/user-1/reset-password", 204, "");

    provider.changePassword("user-1", "new-secret");

    assertEquals("PUT", requests.getLast().method());
    var payload = provider.json.readTree(requests.getLast().body());
    assertEquals("password", payload.path("type").asText());
    assertEquals("new-secret", payload.path("value").asText());
    assertFalse(payload.path("temporary").asBoolean());
  }

  @Test
  void passwordResetSelectsAnEnabledExactEmailMatch() throws Exception {
    adminToken();
    respond(
        "/admin/realms/test/users",
        200,
        "[{\"id\":\"different\",\"email\":\"another@example.com\",\"enabled\":true},"
            + "{\"id\":\"disabled\",\"email\":\"alice@example.com\",\"enabled\":false},"
            + "{\"id\":\"user-1\",\"email\":\"ALICE@example.com\",\"enabled\":true}]");
    respond("/admin/realms/test/users/user-1/execute-actions-email", 204, "");

    provider.sendPasswordReset("alice@example.com");

    var request = requests.getLast();
    assertEquals("PUT", request.method());
    assertEquals(
        "/admin/realms/test/users/user-1/execute-actions-email?lifespan=900", request.uri());
    assertEquals("UPDATE_PASSWORD", provider.json.readTree(request.body()).get(0).asText());
  }

  @ParameterizedTest
  @ValueSource(strings = {"[]", "[{\"email\":\"alice@example.com\",\"enabled\":false}]"})
  void passwordResetDoesNotRevealMissingOrDisabledAccounts(String matches) {
    adminToken();
    respond("/admin/realms/test/users", 200, matches);

    provider.sendPasswordReset("alice@example.com");

    assertEquals(2, requests.size());
    assertTrue(requests.stream().noneMatch(request -> request.method().equals("PUT")));
  }

  @Test
  void invalidJsonIsReportedAsUnavailable() {
    respond("/realms/test/protocol/openid-connect/token", 200, "not-json");

    assertStatus(503, () -> provider.authenticate("alice@example.com", "secret"));
  }

  @Test
  void unavailableUserInfoIsNotAcceptedAsALogin() {
    respond("/realms/test/protocol/openid-connect/token", 200, "{\"access_token\":\"token\"}");
    respond("/realms/test/protocol/openid-connect/userinfo", 401, "{}");

    assertStatus(503, () -> provider.authenticate("alice@example.com", "secret"));
  }

  @Test
  void rejectedAdminCredentialsAreReportedAsUnavailable() {
    respond("/realms/test/protocol/openid-connect/token", 401, "{}");

    assertStatus(503, () -> provider.profile("user-1"));
  }

  @Test
  void connectionFailuresAreReportedAsUnavailable() {
    server.stop(0);

    assertStatus(503, () -> provider.authenticate("alice@example.com", "secret"));
  }

  private void adminToken() {
    respond(
        "/realms/test/protocol/openid-connect/token", 200, "{\"access_token\":\"admin-token\"}");
  }

  private void respond(String path, int status, String body) {
    server.createContext(
        path,
        exchange -> {
          capture(exchange);
          byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
          exchange.sendResponseHeaders(
              status, status == 204 || bytes.length == 0 ? -1 : bytes.length);
          try (var output = exchange.getResponseBody()) {
            if (status != 204 && bytes.length > 0) output.write(bytes);
          }
        });
  }

  private void capture(com.sun.net.httpserver.HttpExchange exchange) throws java.io.IOException {
    requests.add(
        new Request(
            exchange.getRequestMethod(),
            exchange.getRequestURI().toString(),
            exchange.getRequestHeaders().getFirst("Authorization"),
            new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8)));
  }

  private void assertStatus(int expected, org.junit.jupiter.api.function.Executable operation) {
    assertEquals(expected, assertThrows(ApiException.class, operation).status);
  }

  private record Request(String method, String uri, String authorization, String body) {}
}
