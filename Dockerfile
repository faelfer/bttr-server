FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --chown=1001:0 build/quarkus-app/ /app/
USER 1001
EXPOSE 8000
ENV QUARKUS_HTTP_HOST=0.0.0.0
ENTRYPOINT ["java", "-jar", "/app/quarkus-run.jar"]
