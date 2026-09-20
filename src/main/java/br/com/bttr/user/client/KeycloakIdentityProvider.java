package br.com.bttr.user.client;

import br.com.bttr.shared.exception.ApiException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class KeycloakIdentityProvider implements IdentityProvider {
  @Inject ObjectMapper json;

  @ConfigProperty(name = "bttr.keycloak.url")
  String server;

  @ConfigProperty(name = "bttr.keycloak.realm")
  String realm;

  @ConfigProperty(name = "bttr.keycloak.client-id")
  String clientId;

  @ConfigProperty(name = "bttr.keycloak.client-secret")
  String clientSecret;

  private final HttpClient http =
      HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

  private String oidc() {
    return server + "/realms/" + encode(realm) + "/protocol/openid-connect";
  }

  private String users() {
    return server + "/admin/realms/" + encode(realm) + "/users";
  }

  private static String encode(String value) {
    return URLEncoder.encode(value, StandardCharsets.UTF_8);
  }

  private HttpResponse<String> request(
      String method, String url, String token, String body, String contentType) {
    var builder =
        HttpRequest.newBuilder(URI.create(url))
            .timeout(Duration.ofSeconds(10))
            .header("Accept", "application/json");
    if (token != null) builder.header("Authorization", "Bearer " + token);
    if (body != null) builder.header("Content-Type", contentType);
    builder.method(
        method,
        body == null
            ? HttpRequest.BodyPublishers.noBody()
            : HttpRequest.BodyPublishers.ofString(body));
    try {
      return http.send(builder.build(), HttpResponse.BodyHandlers.ofString());
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      throw unavailable();
    } catch (IOException e) {
      throw unavailable();
    }
  }

  private ApiException unavailable() {
    return new ApiException(503, "serviço de autenticação indisponível.");
  }

  private JsonNode read(HttpResponse<String> response) {
    try {
      return json.readTree(response.body());
    } catch (IOException e) {
      throw unavailable();
    }
  }

  private String serialize(Object value) {
    try {
      return json.writeValueAsString(value);
    } catch (IOException e) {
      throw new IllegalStateException(e);
    }
  }

  private void success(HttpResponse<String> response) {
    if (response.statusCode() >= 200 && response.statusCode() < 300) return;
    if (response.statusCode() == 409) {
      String message = read(response).path("errorMessage").asText("").toLowerCase(Locale.ROOT);
      throw new ApiException(
          409,
          message.contains("email")
              ? "usuário com e-mail já existente."
              : "nome de usuário já existente.");
    }
    if (response.statusCode() == 404) throw ApiException.notFound("usuário");
    if (response.statusCode() == 400)
      throw new ApiException(400, "dados rejeitados pelo serviço de autenticação.");
    throw unavailable();
  }

  private HttpResponse<String> token(Map<String, String> values) {
    var fields = new HashMap<>(values);
    fields.put("client_id", clientId);
    fields.put("client_secret", clientSecret);
    String form =
        fields.entrySet().stream()
            .map(e -> encode(e.getKey()) + "=" + encode(e.getValue()))
            .collect(Collectors.joining("&"));
    return request("POST", oidc() + "/token", null, form, "application/x-www-form-urlencoded");
  }

  private String adminToken() {
    var response = token(Map.of("grant_type", "client_credentials"));
    if (response.statusCode() != 200) throw unavailable();
    return read(response).path("access_token").asText();
  }

  private HttpResponse<String> admin(String method, String url, Object body) {
    var response =
        request(
            method, url, adminToken(), body == null ? null : serialize(body), "application/json");
    success(response);
    return response;
  }

  @Override
  public String create(String username, String email, String password) {
    var body =
        Map.of(
            "username",
            username,
            "email",
            email,
            "firstName",
            username,
            "lastName",
            "Bttr",
            "enabled",
            true,
            "emailVerified",
            false,
            "credentials",
            List.of(Map.of("type", "password", "value", password, "temporary", false)));
    var response = admin("POST", users(), body);
    String location = response.headers().firstValue("Location").orElseThrow(this::unavailable);
    return location.substring(location.lastIndexOf('/') + 1);
  }

  @Override
  public Login authenticate(String email, String password) {
    var response =
        token(
            Map.of(
                "grant_type",
                "password",
                "username",
                email,
                "password",
                password,
                "scope",
                "openid profile email"));
    if ((response.statusCode() == 400 || response.statusCode() == 401)
        && read(response).path("error").asText().equals("invalid_grant")) {
      throw new ApiException(401, "e-mail ou senha incorretos.");
    }
    if (response.statusCode() != 200) throw unavailable();
    String accessToken = read(response).path("access_token").asText();
    var userInfo = request("GET", oidc() + "/userinfo", accessToken, null, null);
    if (userInfo.statusCode() != 200) throw unavailable();
    JsonNode user = read(userInfo);
    return new Login(
        accessToken,
        new Profile(
            user.path("sub").asText(),
            user.path("preferred_username").asText(),
            user.path("email").asText()));
  }

  @Override
  public Profile profile(String subject) {
    JsonNode user = read(admin("GET", users() + "/" + encode(subject), null));
    if (!user.path("enabled").asBoolean()) throw new ApiException(401, "usuário desativado.");
    return new Profile(
        user.path("id").asText(), user.path("username").asText(), user.path("email").asText());
  }

  @Override
  public void update(String subject, String username, String email) {
    Profile before = profile(subject);
    var body = new HashMap<String, Object>();
    body.put("username", username);
    body.put("email", email);
    if (!email.equalsIgnoreCase(before.email())) body.put("emailVerified", false);
    admin("PUT", users() + "/" + encode(subject), body);
  }

  @Override
  public void delete(String subject) {
    try {
      admin("DELETE", users() + "/" + encode(subject), null);
    } catch (ApiException e) {
      if (e.status != 404) throw e;
    }
  }

  @Override
  public void changePassword(String subject, String password) {
    admin(
        "PUT",
        users() + "/" + encode(subject) + "/reset-password",
        Map.of("type", "password", "value", password, "temporary", false));
  }

  @Override
  public void sendPasswordReset(String email) {
    JsonNode matches =
        read(admin("GET", users() + "?email=" + encode(email) + "&exact=true", null));
    for (JsonNode user : matches) {
      if (user.path("email").asText().equalsIgnoreCase(email) && user.path("enabled").asBoolean()) {
        admin(
            "PUT",
            users()
                + "/"
                + encode(user.path("id").asText())
                + "/execute-actions-email?lifespan=900",
            List.of("UPDATE_PASSWORD"));
        return;
      }
    }
    // A mesma resposta evita revelar se um endereço está cadastrado.
  }
}
