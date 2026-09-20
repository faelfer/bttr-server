package br.com.bttr;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.emptyString;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.notNullValue;

import io.quarkus.test.junit.QuarkusIntegrationTest;
import org.junit.jupiter.api.Test;

@QuarkusIntegrationTest
class PackagedApplicationIT {
  @Test
  void startsPackagedApplicationWithDatabaseAndPublishesItsContract() {
    given().get("/q/health/ready").then().statusCode(200).body("status", is("UP"));

    given()
        .accept("application/json")
        .get("/q/openapi")
        .then()
        .statusCode(200)
        .body("paths.'/users/sign_up'.post", notNullValue())
        .body("paths.'/skills/create_skill'.post", notNullValue())
        .body("paths.'/times/create_time'.post", notNullValue());
  }

  @Test
  void enforcesValidationAndAuthenticationAtThePackagedHttpBoundary() {
    given()
        .contentType("application/json")
        .body("{}")
        .post("/users/sign_up")
        .then()
        .statusCode(400)
        .body("message", not(emptyString()));

    given().get("/users/profile").then().statusCode(401).body("message", not(emptyString()));
  }
}
