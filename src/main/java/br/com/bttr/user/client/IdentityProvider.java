package br.com.bttr.user.client;

public interface IdentityProvider {
  record Profile(String id, String username, String email) {}

  record Login(String token, Profile profile) {}

  String create(String username, String email, String password);

  Login authenticate(String email, String password);

  Profile profile(String subject);

  void update(String subject, String username, String email);

  void delete(String subject);

  void changePassword(String subject, String password);

  void sendPasswordReset(String email);
}
