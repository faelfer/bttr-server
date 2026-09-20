FROM wiremock/wiremock:3.13.2

COPY --chown=1001:0 wiremock /home/wiremock

USER 1001:0

CMD ["--verbose"]
