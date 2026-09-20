package br.com.bttr;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.emptyString;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;

import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

@QuarkusTest
class AnonymousAccessTest {
  @Test
  void allowsAngularDevelopmentOrigin() {
    given()
        .header("Origin", "http://localhost:4200")
        .contentType("application/json")
        .body("{}")
        .post("/users/sign_in")
        .then()
        .statusCode(400)
        .header("Access-Control-Allow-Origin", "http://localhost:4200");
  }

  @Test
  void requiresAuthentication() {
    for (String path :
        new String[] {
          "/users/profile",
          "/skills/skills_from_user",
          "/skills/skills_by_page",
          "/times/times_by_page"
        }) {
      given().get(path).then().statusCode(401).body("message", not(emptyString()));
    }
  }

  @Test
  void validatesPublicEndpointsAndIgnoresStaleClientHeaderOnLogin() {
    given()
        .header("Authorization", "Token null")
        .contentType("application/json")
        .body("{}")
        .post("/users/sign_in")
        .then()
        .statusCode(400);
    given()
        .contentType("application/json")
        .body("{}")
        .post("/users/sign_up")
        .then()
        .statusCode(400);
  }

  @Test
  void publishesOpenApiAndHealth() {
    given()
        .accept("application/json")
        .get("/q/openapi")
        .then()
        .statusCode(200)
        .body("paths.'/skills/create_skill'.post", notNullValue())
        .body("paths.'/users/profile'.patch", notNullValue());
    given().get("/q/health/ready").then().statusCode(200).body("status", is("UP"));
  }
}
