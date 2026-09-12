package br.com.bttr.user.dtos;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;

public final class UserDtos {
    public static final String PASSWORD = "(?s)^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{4,128}$";

    private UserDtos() {}

    public record SignUp(
            @NotBlank @Size(min = 2, max = 100) String username,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Pattern(
                    regexp = PASSWORD,
                    message = "senha deve conter número, símbolo, letra maiúscula e minúscula (4 a 128 caracteres)")
            String password) {}

    public record SignIn(
            @NotBlank @Email String email,
            @NotBlank @Size(max = 128) String password) {}

    public record ForgotPassword(
            @NotBlank @Email @Size(max = 254) String email) {}

    public record ProfileUpdate(
            @NotBlank @Size(min = 2, max = 100) String username,
            @NotBlank @Email @Size(max = 254) String email) {}

    public record RedefinePassword(
            @NotBlank @Size(max = 128) String password,
            @JsonProperty("new_password") @NotBlank @Pattern(regexp = PASSWORD) String newPassword) {}

    public record UserView(Long id, String username, String email, Instant created) {}

    public record UserResponse(UserView user) {}

    public record SignInResponse(String token, UserView user, String message) {}
}
