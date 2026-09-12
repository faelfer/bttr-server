package br.com.bttr;

import br.com.bttr.shared.exception.ApiException;
import br.com.bttr.skill.entities.SkillEntity;
import br.com.bttr.skill.repository.SkillRepository;
import br.com.bttr.time.entities.TimeEntity;
import br.com.bttr.time.repository.TimeRepository;
import br.com.bttr.user.client.IdentityProvider;
import br.com.bttr.user.entities.UserEntity;
import br.com.bttr.user.repository.UserRepository;
import io.quarkus.narayana.jta.QuarkusTransaction;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.quarkus.test.security.oidc.Claim;
import io.quarkus.test.security.oidc.OidcSecurity;
import jakarta.inject.Inject;
import org.junit.jupiter.api.*;
import java.time.Instant;
import java.util.Map;
import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.anyString;
import static org.mockito.Mockito.doThrow;

@QuarkusTest
@TestSecurity(user = "alice")
@OidcSecurity(claims = @Claim(key = "sub", value = "alice"))
class ApiContractTest {
    @InjectMock IdentityProvider identities;
    @Inject UserRepository users;
    @Inject SkillRepository skills;
    @Inject TimeRepository times;
    Long aliceId;
    Long skillId;
    Long bobSkillId;
    Long timeId;
    Long bobTimeId;

    @BeforeEach
    void setup() {
        reset(identities);
        QuarkusTransaction.requiringNew().run(() -> {
            times.deleteAll();
            skills.deleteAll();
            users.deleteAll();
            var alice = user("alice");
            var bob = user("bob");
            aliceId = alice.id;
            skillId = skill(alice, "Java").id;
            bobSkillId = skill(bob, "Privado").id;
            timeId = time(skillId, Instant.parse("2026-09-01T03:00:00Z")).id;
            bobTimeId = time(bobSkillId, Instant.parse("2026-09-01T03:00:00Z")).id;
        });
        when(identities.profile("alice")).thenReturn(new IdentityProvider.Profile("alice", "Alice", "alice@example.com"));
    }

    private UserEntity user(String subject) {
        var user = new UserEntity(); user.keycloakId = subject; users.persistAndFlush(user); return user;
    }
    private SkillEntity skill(UserEntity user, String name) {
        var skill = new SkillEntity(); skill.user = user; skill.name = name; skill.daily = 30;
        skills.persistAndFlush(skill); return skill;
    }
    private TimeEntity time(Long id, Instant created) {
        var time = new TimeEntity(); time.skill = skills.findById(id); time.minutes = 20; time.created = created;
        times.persistAndFlush(time); return time;
    }

    @Test
    void listsOnlyOwnedSkillsAndPaginatesFiveItems() {
        QuarkusTransaction.requiringNew().run(() -> {
            UserEntity alice = users.findById(aliceId);
            for (int i = 0; i < 6; i++) skill(alice, "Skill " + i);
        });
        given().get("/skills/skills_from_user").then().statusCode(200)
                .body("skills", hasSize(7)).body("skills.name", not(hasItem("Privado")));
        given().get("/skills/skills_by_page").then().statusCode(200)
                .body("count", is(7)).body("results", hasSize(5)).body("previous", nullValue())
                .body("next", endsWith("page=2"));
        given().queryParam("page", 2).get("/skills/skills_by_page").then().statusCode(200)
                .body("results", hasSize(2)).body("next", nullValue()).body("previous", endsWith("page=1"));
        given().queryParam("page", 3).get("/skills/skills_by_page").then().statusCode(200).body("results", hasSize(0));
        given().queryParam("page", 0).get("/skills/skills_by_page").then().statusCode(400).body("message", not(emptyString()));
    }

    @Test
    void createsAndUpdatesSkillsWithNumericStringsFromClient() {
        given().contentType("application/json").body(Map.of("name", " Quarkus ", "daily", "60"))
                .post("/skills/create_skill").then().statusCode(200).body("message", is("habilidade foi criada com sucesso."));
        given().get("/skills/skills_from_user").then().body("skills.name", hasItem("Quarkus"));
        given().contentType("application/json").body(Map.of("name", "Kotlin", "daily", "45"))
                .put("/skills/update_skill_by_id/" + skillId).then().statusCode(200);
        given().get("/skills/skill_by_id/" + skillId).then().statusCode(200)
                .body("skill.name", is("Kotlin")).body("skill.daily", is(45));
        given().contentType("application/json").body(Map.of("name", " kotlin ", "daily", 10))
                .post("/skills/create_skill").then().statusCode(409);
    }

    @Test
    void validatesPayloadsAndMalformedJson() {
        given().contentType("application/json").body(Map.of("name", " ", "daily", 0))
                .post("/skills/create_skill").then().statusCode(400).body("message", not(emptyString()));
        given().contentType("application/json").body(Map.of("skill_id", skillId, "minutes", -1))
                .post("/times/create_time").then().statusCode(400);
        given().contentType("application/json").body(Map.of("skill_id", skillId, "minutes", "abc"))
                .post("/times/create_time").then().statusCode(400).body("message", not(emptyString()));
        given().contentType("application/json").body(Map.of("skill_id", skillId, "minutes", 1.5))
                .post("/times/create_time").then().statusCode(400);
        given().contentType("application/json").body("{").post("/skills/create_skill")
                .then().statusCode(400).body("message", not(emptyString()));
        given().contentType("application/json").body("null").post("/skills/create_skill")
                .then().statusCode(400);
        given().get("/times/times_by_date").then().statusCode(400);
    }

    @Test
    void deniesReadingModifyingDeletingAndReferencingOtherUsersData() {
        given().get("/skills/skill_by_id/" + bobSkillId).then().statusCode(404);
        given().delete("/skills/delete_skill_by_id/" + bobSkillId).then().statusCode(404);
        given().contentType("application/json").body(Map.of("name", "Hack", "daily", 1))
                .put("/skills/update_skill_by_id/" + bobSkillId).then().statusCode(404);
        given().get("/times/time_by_id/" + bobTimeId).then().statusCode(404);
        given().delete("/times/delete_time_by_id/" + bobTimeId).then().statusCode(404);
        given().contentType("application/json").body(Map.of("skill_id", skillId, "minutes", 1))
                .put("/times/update_time_by_id/" + bobTimeId).then().statusCode(404);
        given().contentType("application/json").body(Map.of("skill_id", bobSkillId, "minutes", 1))
                .post("/times/create_time").then().statusCode(404);
        given().contentType("application/json").body(Map.of("skill_id", bobSkillId, "minutes", 1))
                .put("/times/update_time_by_id/" + timeId).then().statusCode(404);
        given().queryParam("skill_id", bobSkillId).queryParam("date_initial", "2026-09-01T00:00:00Z")
                .queryParam("date_final", "2026-09-30T23:59:59Z").get("/times/times_by_date").then().statusCode(404);
    }

    @Test
    void timeCrudIncludesNestedSkillAndPreservesCreationDate() {
        given().contentType("application/json").body(Map.of("skill_id", skillId.toString(), "minutes", "50"))
                .post("/times/create_time").then().statusCode(200);
        given().get("/times/times_by_page").then().statusCode(200).body("count", is(2))
                .body("results.skill.name", everyItem(is("Java"))).body("results[0].minutes", is(50));
        given().contentType("application/json").body(Map.of("skill_id", skillId, "minutes", "40"))
                .put("/times/update_time_by_id/" + timeId).then().statusCode(200);
        given().get("/times/time_by_id/" + timeId).then().statusCode(200).body("time.minutes", is(40))
                .body("time.created", is("2026-09-01T03:00:00Z")).body("time.skill.id", is(skillId.intValue()));
        given().delete("/times/delete_time_by_id/" + timeId).then().statusCode(200);
        given().get("/times/time_by_id/" + timeId).then().statusCode(404);
    }

    @Test
    void filtersInclusiveDatesAndRejectsInvalidIntervals() {
        QuarkusTransaction.requiringNew().run(() -> {
            time(skillId, Instant.parse("2026-09-02T03:00:00Z"));
            time(skillId, Instant.parse("2026-08-31T23:59:59Z"));
        });
        given().queryParam("skill_id", skillId).queryParam("date_initial", "2026-09-01T00:00:00-03:00")
                .queryParam("date_final", "2026-09-02T03:00:00Z").get("/times/times_by_date")
                .then().statusCode(200).body("times", hasSize(2));
        given().queryParam("skill_id", skillId).queryParam("date_initial", "invalid")
                .queryParam("date_final", "2026-09-02T03:00:00Z").get("/times/times_by_date").then().statusCode(400);
        given().queryParam("skill_id", skillId).queryParam("date_initial", "2026-10-01T00:00:00Z")
                .queryParam("date_final", "2026-09-01T00:00:00Z").get("/times/times_by_date").then().statusCode(400);
    }

    @Test
    void deletingSkillCascadesTimesOnlyForThatSkill() {
        given().delete("/skills/delete_skill_by_id/" + skillId).then().statusCode(200);
        QuarkusTransaction.requiringNew().run(() -> {
            assertNull(times.findById(timeId));
            assertNotNull(times.findById(bobTimeId));
        });
    }

    @Test
    void userLifecycleMatchesClientAndDelegatesCredentialsToKeycloak() {
        when(identities.create("New", "new@example.com", "!Ab1!Ab1")).thenReturn("new-subject");
        given().contentType("application/json").body(Map.of("username", "New", "email", "NEW@example.com", "password", "!Ab1!Ab1"))
                .post("/users/sign_up").then().statusCode(200);
        when(identities.authenticate("alice@example.com", "!Ab1!Ab1"))
                .thenReturn(new IdentityProvider.Login("signed-token", new IdentityProvider.Profile("alice", "Alice", "alice@example.com")));
        given().contentType("application/json").body(Map.of("email", "alice@example.com", "password", "!Ab1!Ab1"))
                .post("/users/sign_in").then().statusCode(200).body("token", is("signed-token"))
                .body("user.id", is(aliceId.intValue())).body("user.password", nullValue());
        given().get("/users/profile").then().statusCode(200).body("user.username", is("Alice"));
        given().contentType("application/json").body(Map.of("username", "Alice2", "email", "NEW@example.com"))
                .patch("/users/profile").then().statusCode(200);
        verify(identities).update("alice", "Alice2", "new@example.com");
        given().contentType("application/json").body(Map.of("password", "!Ab1!Ab1", "new_password", "!Ab2!Ab2"))
                .post("/users/redefine_password").then().statusCode(200);
        verify(identities).changePassword("alice", "!Ab2!Ab2");
    }

    @Test
    void rejectsWrongCurrentPasswordWithoutChangingIt() {
        when(identities.authenticate("alice@example.com", "wrong")).thenThrow(new ApiException(401, "e-mail ou senha incorretos."));
        given().contentType("application/json").body(Map.of("password", "wrong", "new_password", "!Ab2!Ab2"))
                .post("/users/redefine_password").then().statusCode(401);
        verify(identities, never()).changePassword(anyString(), anyString());
    }

    @Test
    void resetDoesNotExposeAccountExistence() {
        given().contentType("application/json").body(Map.of("email", "unknown@example.com"))
                .post("/users/forgot_password").then().statusCode(200)
                .body("message", startsWith("se o e-mail estiver cadastrado"));
        verify(identities).sendPasswordReset("unknown@example.com");
    }

    @Test
    void accountDeletionCascadesAndRejectsPreviouslyIssuedToken() {
        given().delete("/users/profile").then().statusCode(200);
        verify(identities).delete("alice");
        QuarkusTransaction.requiringNew().run(() -> {
            assertNull(users.findById(aliceId));
            assertNull(skills.findById(skillId));
            assertNull(times.findById(timeId));
            assertNotNull(skills.findById(bobSkillId));
        });
        given().get("/skills/skills_from_user").then().statusCode(401);
    }

    @Test
    void identityFailureDoesNotDeleteLocalData() {
        doThrow(new ApiException(503, "indisponível")).when(identities).delete("alice");
        given().delete("/users/profile").then().statusCode(503);
        QuarkusTransaction.requiringNew().run(() -> assertNotNull(users.findById(aliceId)));
    }
}
