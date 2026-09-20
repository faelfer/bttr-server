# Bttr Server

Backend Java 21 / Quarkus 3.33.3.2 LTS, com Gradle Wrapper 8.14.3, Hibernate ORM with Panache, PostgreSQL, Flyway, Jakarta Bean Validation, SmallRye OpenAPI/Swagger UI, Keycloak e métricas Micrometer no formato Prometheus. E-mails do Keycloak são capturados pelo Mailpit no ambiente local. Os testes usam JUnit 5, RestAssured, Mockito e k6.

Implementado a partir de `bttr-client-react/src/services/{user,skill,time}/api.*`, dos formulários e dos mocks E2E do cliente.

## Arquitetura

O código Java usa **arquitetura em camadas modularizada por funcionalidade** (package by feature). Cada módulo concentra as classes de uma capacidade do sistema e as separa por responsabilidade técnica:

```text
br/com/bttr/
├── user/
│   ├── client/       # integração com o provedor de identidade/Keycloak
│   ├── dtos/         # contratos de entrada e saída de usuários
│   ├── entities/     # entidade JPA do usuário
│   ├── mapper/       # conversão de entidade/provedor para DTO
│   ├── repository/   # persistência com Panache
│   ├── resource/     # API REST
│   └── service/      # regras de negócio
├── skill/
│   ├── dtos/ entities/ mapper/ repository/ resource/ service/
├── time/
│   ├── dtos/ entities/ mapper/ repository/ resource/ service/
└── shared/
    ├── config/       # configuração transversal
    ├── dtos/         # respostas compartilhadas
    ├── exception/    # erros e mapeamento HTTP
    └── pagination/   # paginação compartilhada
```

O fluxo principal de cada funcionalidade é `requisição HTTP → Resource → Service → Repository → banco de dados`. Resources lidam apenas com HTTP e DTOs; services coordenam regras e casos de uso; repositories encapsulam consultas Panache; mappers convertem entidades em DTOs. Classes transversais, sem pertencimento exclusivo a uma funcionalidade, ficam em `shared`.

## Executar localmente

Requisitos: JDK **21**, Docker com Compose e portas 8000, 8180, 5432, 8025 e 1025 disponíveis. Configure `JAVA_HOME` para o JDK 21. O wrapper baixa o Gradle automaticamente.

```bash
cp .env.example .env
docker compose up -d --wait
./gradlew quarkusDev
```

As migrações rodam automaticamente e o Hibernate valida o esquema. O Compose importa o realm `bttr`, configura um cliente confidencial e conecta o SMTP do Keycloak ao Mailpit. O PostgreSQL da aplicação e o PostgreSQL do Keycloak têm volumes separados.

| Serviço | Endereço / acesso local |
| --- | --- |
| API | http://localhost:8000 |
| Swagger UI | http://localhost:8000/q/swagger-ui |
| OpenAPI | http://localhost:8000/q/openapi |
| Readiness | http://localhost:8000/q/health/ready |
| Métricas Prometheus | http://localhost:8000/q/metrics |
| Keycloak | http://localhost:8180 — `admin` / `admin_local` |
| Mailpit | http://localhost:8025 |
| PostgreSQL | `localhost:5432/bttr` — `bttr` / `bttr_local` |

Essas credenciais e o `start-dev` destinam-se ao ambiente local. A importação do Keycloak só cria o realm quando ele ainda não existe; editar o JSON não altera um realm já importado.

No `.env` de **bttr-client-react**:

```dotenv
REACT_APP_API=http://localhost:8000
```

Reinicie o cliente depois de alterar essa variável. A API aceita o cabeçalho que ele já envia: `Authorization: Token <access_token>`. No Swagger, faça `POST /users/sign_in` e cole **Token seguido de espaço e do token** em **Authorize**.

## Contrato HTTP

As operações bem-sucedidas retornam HTTP 200, inclusive criação/exclusão, com JSON `{ "message": "..." }` nas mutações. Erros retornam `{ "message": "..." }`: 400 para dados inválidos, 401 para autenticação, 404 para recurso inexistente ou de outro usuário, 409 para conflito e 503 para indisponibilidade do Keycloak.

| Método | Rota | Entrada / saída |
| --- | --- | --- |
| POST | `/users/sign_up` | `{username,email,password}` → mensagem |
| POST | `/users/sign_in` | `{email,password}` → `{token,user,message}` |
| POST | `/users/forgot_password` | `{email}` → mensagem genérica |
| GET | `/users/profile` | `{user}` |
| PATCH | `/users/profile` | `{username,email}` → mensagem |
| DELETE | `/users/profile` | Exclui identidade, habilidades e tempos |
| POST | `/users/redefine_password` | `{password,new_password}` → mensagem |
| GET | `/skills/skills_from_user` | `{skills:[...]}` |
| GET | `/skills/skills_by_page?page=1` | `{count,next,previous,results}` |
| GET | `/skills/skill_by_id/{id}` | `{skill}` |
| POST | `/skills/create_skill` | `{name,daily}` → mensagem |
| PUT | `/skills/update_skill_by_id/{id}` | `{name,daily}` → mensagem |
| DELETE | `/skills/delete_skill_by_id/{id}` | Exclui habilidade e tempos associados |
| GET | `/times/times_by_page?page=1` | `{count,next,previous,results}` |
| GET | `/times/times_by_date` | Query `skill_id,date_initial,date_final` → `{times:[...]}` |
| GET | `/times/time_by_id/{id}` | `{time}` |
| POST | `/times/create_time` | `{skill_id,minutes}` → mensagem |
| PUT | `/times/update_time_by_id/{id}` | `{skill_id,minutes}` → mensagem |
| DELETE | `/times/delete_time_by_id/{id}` | Exclui tempo |

Apenas cadastro, login e recuperação de senha são públicos. Documentação e health checks também são públicos.

- Paginação começa em 1, com **5 itens**, do mais recente ao mais antigo e desempate por ID. Página além do fim retorna lista vazia.
- `user`: `{id,username,email,created}`; `skill`: `{id,name,daily,created}`; `time`: `{id,minutes,created,skill}`. O tempo contém a habilidade completa, conforme o cliente espera.
- IDs e minutos enviados como strings numéricas pelos formulários são aceitos. As respostas usam números. `daily` e `minutes` são inteiros de 1 a 1440.
- Datas usam ISO-8601 com fuso (`2026-09-01T03:00:00.000Z`). Os dois limites do filtro são inclusivos; o horário de criação é gerado pelo servidor e preservado nas edições.
- Nomes de habilidades são únicos por usuário, ignorando maiúsculas/minúsculas. Todas as consultas e mutações verificam o proprietário.
- Senhas ficam exclusivamente no Keycloak. O banco local armazena o ID estável da identidade e os dados de domínio. Cadastro compensa a criação no Keycloak se a persistência local falhar. Contas devem ser criadas pela API para terem seu vínculo local.

### Autenticação e recuperação

O login usa **Direct Access Grants** do Keycloak para manter o formulário atual de e-mail/senha. O token tem validade local de 30 minutos. O cliente atual não possui renovação de token; após expirar, é necessário entrar novamente. O Keycloak valida credenciais e aplica proteção contra tentativas repetidas. A API valida assinatura, emissor, audiência e validade dos tokens via OIDC.

A recuperação mantém o endpoint e o payload, mas envia um **link de redefinição válido por 15 minutos**, em vez de uma senha em texto. Abra o Mailpit e siga o link para definir a nova senha no Keycloak. A resposta é igual para e-mails cadastrados ou inexistentes. Recomenda-se atualizar a frase “Enviaremos uma senha temporária” na tela `ForgotPassword` do cliente para “Enviaremos um link para redefinir sua senha”.

O backend aceita senhas de 4 a 128 caracteres com maiúscula, minúscula, número e símbolo para preservar o mínimo do cliente legado. O cliente limita senhas a 8 caracteres; uma política mais forte deve ser aplicada conjuntamente ao cliente, à validação da API e ao realm.

## Testes e build

O Gradle gerencia Spotless 8.10.2, google-java-format 1.36.1 e Checkstyle 14.1.0.
O código Java de produção e testes segue Google Java Style, com dois espaços.
O Checkstyle verifica imports explícitos, redundantes ou não utilizados e convenções
de nomenclatura. Código gerado fica fora dessas verificações.

```bash
./gradlew spotlessApply                    # Corrigir a formatação localmente
./gradlew spotlessCheck checkstyleMain checkstyleTest checkstyleIntegrationTest
./gradlew check                            # Formatação, lint e testes
```

As verificações também fazem parte de `build` e falham ao encontrar violações.
O CI somente verifica o código; execute `spotlessApply` antes de fazer commit.
Relatórios Checkstyle: `build/reports/checkstyle/{main,test}.{html,xml}`.
As ferramentas são baixadas pelo Gradle e não exigem instalação manual no Jenkins.

```bash
./gradlew test
./gradlew build
./gradlew quarkusIntTest
```

Docker deve estar disponível. Os testes criam um **PostgreSQL isolado via Dev Services**, aplicam as migrações reais e simulam o provedor de identidade com Mockito. Não usam o banco de desenvolvimento. Cobrem contratos HTTP, validação, paginação, datas, isolamento entre usuários, cascatas e falhas de autenticação. Relatório: `build/reports/tests/test/index.html`.

`quarkusIntTest` executa os testes de `src/integrationTest` como caixa-preta contra o
JAR produzido pelo build, usando o perfil de produção. A suíte confirma que o artefato
empacotado inicia conectado ao PostgreSQL, publica health e OpenAPI e aplica validação e
autenticação na fronteira HTTP. Ela não usa injeção CDI nem mocks internos. Relatório:
`build/reports/tests/quarkusIntTest/index.html`.

Para executar a suíte com Java 21 e PostgreSQL fornecidos pelo Compose de CI:

```bash
export CI_UID="$(id -u)" CI_GID="$(id -g)"
docker compose -f compose.ci.yaml run --rm tests
docker compose -f compose.ci.yaml down --volumes --remove-orphans
```

O `compose.ci.yaml` é independente do ambiente de desenvolvimento. Ele executa `./gradlew clean build quarkusIntTest`, aguarda o PostgreSQL ficar saudável e desativa Dev Services nos testes JVM. O mesmo banco temporário, sem portas publicadas, é fornecido ao JAR durante os testes de integração. Os relatórios ficam em `build/` e o cache Gradle em `.gradle/ci`. As variáveis `CI_UID` e `CI_GID` mantêm os arquivos gerados com o usuário do agente. O comando `run` retorna o código de saída dos testes; execute `down` também após falhas.

Com Compose e a API em execução, verifique também os **20 endpoints contra Keycloak e Mailpit reais** (Python 3, sem dependências):

```bash
python3 scripts/smoke.py
```

O script cria duas contas temporárias e as exclui ao terminar. `BTTR_API` e `MAILPIT_API` permitem alterar os endereços de teste.

### Teste de performance

O Quarkus publica métricas da JVM, do sistema e das requisições HTTP em `/q/metrics`
por meio do Micrometer Prometheus Registry. O ambiente de performance inicia a aplicação
empacotada, PostgreSQL, Keycloak, Mailpit, Prometheus 3.14.0 e k6 2.2.0 em uma rede
isolada e sem portas expostas no host.

```bash
export CI_UID="$(id -u)" CI_GID="$(id -g)"
mkdir -p build/reports/k6
docker compose -f compose.performance.yaml up -d --build --wait api prometheus
docker compose -f compose.performance.yaml run --rm --no-deps k6
docker compose -f compose.performance.yaml down --volumes --remove-orphans
```

O cenário em `performance/smoke.js` cria e autentica uma conta temporária, valida o
scrape real do Prometheus e exercita perfil, habilidades e registros de tempo com dois
usuários virtuais por 30 segundos. Ele falha se houver checks inválidos, se a taxa de
erros HTTP chegar a 1%, se o p95 global alcançar 1 segundo, se o p99 alcançar 2 segundos
ou se o p95 de perfil alcançar 750 ms. Ajuste localmente com `PERFORMANCE_VUS` e
`PERFORMANCE_DURATION`.
Os artefatos ficam em `build/reports/k6`: dashboard HTML, resumo JSON e thresholds em
JUnit XML.

### Testes de segurança

O pipeline usa Trivy 0.74.0 para examinar vulnerabilidades, segredos e configurações no
repositório e na imagem final. Vulnerabilidades `HIGH` ou `CRITICAL` fazem a etapa falhar;
na imagem, achados sem correção disponível são mantidos no relatório, mas não bloqueiam
o build. O OWASP ZAP 2.17.0 importa o contrato OpenAPI e executa passive e active scan
com a política `Dev CICD`.

O scan ZAP cria uma conta temporária no Keycloak, verifica o token no endpoint de perfil
e adiciona `Authorization: Token <token>` às requisições. Operações de identidade e a
exclusão do perfil ficam fora do active scan para preservar a sessão. A conta, as
habilidades e os tempos criados durante o teste são removidos ao terminar.

Para executar os dois scanners no ambiente isolado:

```bash
export CI_UID="$(id -u)" CI_GID="$(id -g)"
export COMPOSE_PROJECT_NAME=bttr-security-local
export BTTR_API_IMAGE=bttr-server-security:local
./scripts/security.sh
```

Os relatórios HTML, JSON e SARIF ficam em `build/reports/security`. O Trivy bloqueia
achados altos ou críticos no repositório e vulnerabilidades altas ou críticas com
correção disponível na imagem; o ZAP bloqueia alertas de risco alto. Alertas médios e
baixos permanecem visíveis para triagem.

### Pipeline Jenkins

O pipeline de integração contínua está definido no `Jenkinsfile` da raiz. Ele limpa o workspace, faz checkout do repositório e usa `compose.ci.yaml` para executar `./gradlew clean build quarkusIntTest --no-daemon --console=plain`, incluindo Spotless, Checkstyle, testes JVM e testes black-box do artefato. Depois, `compose.performance.yaml` executa o smoke test autenticado e confirma que o Prometheus coleta as métricas da aplicação. A etapa de segurança analisa o código e a imagem com Trivy e executa o ZAP autenticado contra uma nova instância efêmera da API. Cada build usa projetos Compose exclusivos, removidos ao terminar mesmo em caso de falha. O Jenkins publica os resultados JUnit dos testes Gradle e dos thresholds k6, além de arquivar os relatórios de testes, Checkstyle, k6, Trivy e ZAP.

Configure o job como **Pipeline from SCM**, apontando para este repositório do GitLab e usando `Jenkinsfile` como **Script Path**. O agente Jenkins deve ser Linux/Unix e ter Docker com Compose v2 ou superior acessível pelo usuário do agente; o JDK 21 é fornecido pelo contêiner. O Compose fornece um PostgreSQL exclusivo e define `_TEST_QUARKUS_DATASOURCE_DEVSERVICES_ENABLED=false`, `_TEST_QUARKUS_DATASOURCE_JDBC_URL`, `_TEST_QUARKUS_DATASOURCE_USERNAME` e `_TEST_QUARKUS_DATASOURCE_PASSWORD`. Se o agente Jenkins roda em contêiner usando o Docker do host, informe o caminho correspondente no host conforme descrito abaixo. Também são necessários os plugins Pipeline, JUnit e GitLab.

A imagem oficial `jenkins/jenkins` não inclui Docker CLI. Para executar este pipeline no Jenkins em contêiner, a infraestrutura deve fornecer:

- Uma imagem Jenkins com Docker CLI e o plugin Compose v2 instalados.
- A montagem de `/var/run/docker.sock` e o grupo suplementar correspondente ao GID desse socket para o usuário `jenkins`.
- A variável `CI_HOST_JENKINS_HOME` com o caminho absoluto no host que está montado como `JENKINS_HOME`. O pipeline usa esse caminho para definir `CI_WORKSPACE`, origem do bind mount em `compose.ci.yaml`. Em agentes instalados diretamente no host, essas variáveis podem ser omitidas.
- A opção SELinux `:z` nas montagens de dados compartilhados entre Jenkins e o contêiner de testes.

Valide `docker compose version` e `docker info` **dentro do agente**, como o usuário que executa os jobs. O acesso ao socket permite que os jobs controlem o Docker do host; use esse agente apenas para pipelines confiáveis. Veja a [documentação de Jenkins com Docker](https://www.jenkins.io/doc/book/installing/docker/) para construir a imagem do agente. O pipeline verifica essas dependências antes de iniciar os serviços de teste.

Para disparar builds em pushes e merge requests e exibir o resultado no GitLab, habilite a integração Jenkins em **Settings > Integrations > Jenkins** no projeto e configure a conexão correspondente no Jenkins. Execute o job manualmente uma vez para o Jenkins registrar os gatilhos definidos no arquivo. Os blocos `gitlabCommitStatus` publicam no commit os estados das etapas `build`, `performance` e `security`.

## Empacotar e configurar

```bash
./gradlew build
docker build -t bttr-server .
```

O artefato JVM está em `build/quarkus-app`; para executá-lo use `java -jar build/quarkus-app/quarkus-run.jar` com as variáveis abaixo. O Dockerfile usa o mesmo artefato e um usuário sem privilégios.

| Variável | Finalidade |
| --- | --- |
| `DATABASE_URL` | URL JDBC PostgreSQL; obrigatória no perfil de produção |
| `DATABASE_USERNAME`, `DATABASE_PASSWORD` | Credenciais PostgreSQL |
| `KEYCLOAK_URL` | URL base acessível do Keycloak e compatível com o emissor dos tokens |
| `KEYCLOAK_REALM` | Realm; padrão `bttr` |
| `KEYCLOAK_CLIENT_ID` | Cliente; padrão `bttr-server` |
| `KEYCLOAK_CLIENT_SECRET` | Segredo; obrigatório em produção |
| `HTTP_PORT` | Porta HTTP; padrão 8000 |
| `CORS_ORIGINS` | Origens permitidas separadas por vírgulas; padrão local `http://localhost:3000,http://localhost:4200` |

Em um ambiente implantado, configure HTTPS, credenciais próprias, SMTP real e o hostname do Keycloak. Para mudar o cliente, preserve a audiência e as permissões da conta de serviço presentes em `infra/keycloak/bttr-realm.json`. Os serviços Docker deste Compose expõem portas apenas em `127.0.0.1`; de outro container, `localhost` aponta para o próprio container.

PostgreSQL e Keycloak não compartilham uma transação distribuída. Em falhas parciais de exclusão, a identidade pode já ter sido removida enquanto os dados locais aguardam limpeza; a exclusão remota é idempotente para permitir uma nova tentativa. Tokens emitidos antes de uma troca de senha podem continuar válidos até expirar; a exclusão pela API remove o vínculo local e bloqueia imediatamente seu acesso aos dados.

## Referências

- [Quarkus e Gradle](https://quarkus.io/guides/gradle-tooling/)
- [Hibernate ORM with Panache](https://quarkus.io/guides/hibernate-orm-panache/)
- [Flyway](https://quarkus.io/guides/flyway/)
- [Autenticação OIDC](https://quarkus.io/guides/security-oidc-bearer-token-authentication/)
- [Keycloak Admin REST API](https://www.keycloak.org/docs-api/latest/rest-api/index.html)
- [Testes Quarkus](https://quarkus.io/guides/getting-started-testing/)
