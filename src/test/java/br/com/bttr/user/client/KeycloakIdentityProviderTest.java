package br.com.bttr.user.client;

import br.com.bttr.shared.exception.ApiException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import static org.junit.jupiter.api.Assertions.*;

class KeycloakIdentityProviderTest {
    HttpServer server;
    KeycloakIdentityProvider provider;
    @BeforeEach
    void setup() throws Exception {
        server = HttpServer.create(new InetSocketAddress("localhost", 0), 0);
        provider = new KeycloakIdentityProvider();
        provider.json = new ObjectMapper();
        provider.server = "http://localhost:" + server.getAddress().getPort();
        provider.realm = "test";
        provider.clientId = "test";
        provider.clientSecret = "test";
        server.start();
    }
    @AfterEach
    void cleanup() { server.stop(0); }
    void response(int status, String error) {
        server.createContext("/realms/test/protocol/openid-connect/token", exchange -> {
            byte[] body = ("{\"error\":\"" + error + "\"}").getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(status, body.length);
            try (var output = exchange.getResponseBody()) { output.write(body); }
        });
    }
    @Test
    void invalidCredentialsReturnedAs401ByKeycloakRemain401() {
        response(401, "invalid_grant");
        assertEquals(401, assertThrows(ApiException.class, () -> provider.authenticate("a@example.com", "wrong")).status);
    }
    @Test
    void invalidGrantReturnedAs400IsAlsoUnauthorized() {
        response(400, "invalid_grant");
        assertEquals(401, assertThrows(ApiException.class, () -> provider.authenticate("a@example.com", "wrong")).status);
    }
    @Test
    void invalidClientConfigurationIsServiceUnavailable() {
        response(401, "invalid_client");
        assertEquals(503, assertThrows(ApiException.class, () -> provider.authenticate("a@example.com", "wrong")).status);
    }
}
