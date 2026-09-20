# Contribuindo com o Bttr Server

Há várias formas de contribuir com o projeto: enviar código, relatar bugs e propor melhorias.

## Enviando código

1. Abra o projeto Bttr Server no GitLab e crie um fork.
2. No fork, selecione **Code**, copie a URL SSH ou HTTPS e clone o repositório:

   ```bash
   git clone <URL_DO_SEU_FORK>
   ```

3. Crie uma branch baseada em `master` para a alteração.
4. Instale o JDK 21 e o Docker com Compose. Inicie PostgreSQL, Keycloak e Mailpit:

   ```bash
   cp .env.example .env
   docker compose up -d --wait
   ```

5. Implemente a alteração, aplique a formatação e valide o build antes de enviá-la:

   ```bash
   ./gradlew spotlessApply
   ./gradlew build
   ./gradlew quarkusIntTest
   mkdir -p build/reports/k6
   docker compose -f compose.performance.yaml up -d --build --wait api prometheus
   docker compose -f compose.performance.yaml run --rm --no-deps k6
   docker compose -f compose.performance.yaml down --volumes --remove-orphans
   ```

6. Faça commits com mensagens claras e envie a branch ao seu fork:

   ```bash
   git push -u origin <NOME_DA_BRANCH>
   ```

7. No GitLab, abra uma merge request para `master`. Descreva a motivação, os testes executados e referencie as issues relacionadas, por exemplo com `Closes #49`.

Consulte o [README](README.md) para detalhes da configuração local, da arquitetura e do contrato da API.

## Diretrizes

- Use Google Java Style (dois espaços), aplicado por `./gradlew spotlessApply`.
- Use imports explícitos e siga as regras de nomenclatura do Checkstyle. `./gradlew check` valida formatação, lint e testes JVM. `./gradlew quarkusIntTest` valida o artefato empacotado; o teste k6 valida os limites de performance e o scrape do Prometheus. O CI executa os três e falha quando houver violações.
- Mantenha a merge request focada em uma única alteração.
- Inclua ou atualize testes e documentação quando necessário.
- Verifique se o pipeline Jenkins concluiu com sucesso.

## Relatando bugs

Antes de criar uma issue, procure por relatos abertos e encerrados no projeto do GitLab. Para um novo problema, selecione o template `bug` e informe:

- um título claro e descritivo;
- os passos exatos para reproduzir o comportamento;
- o comportamento atual e o esperado;
- a versão ou o commit afetado;
- logs ou capturas de tela sem dados sensíveis;
- um exemplo mínimo, quando possível.

## Propondo melhorias

Procure primeiro por uma issue existente sobre o tema. Se ainda não houver uma, crie uma nova issue descrevendo o problema, a solução proposta, alternativas consideradas e possíveis impactos.
