pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
    }

    triggers {
        gitlab(
            triggerOnPush: true,
            triggerOnMergeRequest: true,
            branchFilterType: 'All'
        )
    }

    stages {
        stage('Checkout') {
            steps {
                deleteDir()
                checkout scm
            }
        }

        stage('Build, lint and test') {
            steps {
                gitlabCommitStatus(name: 'build') {
                    sh '''
                        command -v docker >/dev/null || {
                            echo 'O agente Jenkins precisa de Docker CLI e Compose v2. Consulte README.md.' >&2
                            exit 1
                        }
                        docker compose version
                        docker info >/dev/null

                        if [ -n "${CI_HOST_JENKINS_HOME:-}" ]; then
                            case "$WORKSPACE" in
                                "$JENKINS_HOME"/*)
                                    export CI_WORKSPACE="$CI_HOST_JENKINS_HOME/${WORKSPACE#"$JENKINS_HOME"/}"
                                    ;;
                                *)
                                    echo 'WORKSPACE deve estar dentro de JENKINS_HOME para mapear o caminho no host.' >&2
                                    exit 1
                                    ;;
                            esac
                        fi

                        export CI_UID="$(id -u)" CI_GID="$(id -g)"
                        export COMPOSE_PROJECT_NAME="bttr-ci-$(printf '%s' "$JOB_NAME" | cksum | cut -d ' ' -f 1)-$BUILD_NUMBER"
                        trap 'docker compose -f compose.ci.yaml down --volumes --remove-orphans' EXIT
                        docker compose -f compose.ci.yaml run --rm -T tests \
                            ./gradlew clean build quarkusIntTest --no-daemon --console=plain
                    '''
                }
            }
        }

        stage('Mock API') {
            steps {
                gitlabCommitStatus(name: 'mock-api') {
                    sh '''
                        if [ -n "${CI_HOST_JENKINS_HOME:-}" ]; then
                            case "$WORKSPACE" in
                                "$JENKINS_HOME"/*)
                                    export CI_WORKSPACE="$CI_HOST_JENKINS_HOME/${WORKSPACE#"$JENKINS_HOME"/}"
                                    ;;
                                *)
                                    echo 'WORKSPACE deve estar dentro de JENKINS_HOME para mapear o caminho no host.' >&2
                                    exit 1
                                    ;;
                            esac
                        fi

                        mock_job_hash="$(printf '%s' "$JOB_NAME" | cksum | cut -d ' ' -f 1)"
                        export COMPOSE_PROJECT_NAME="bttr-mock-$mock_job_hash-$BUILD_NUMBER"
                        export BTTR_MOCK_API_IMAGE="bttr-server-mock:$mock_job_hash-$BUILD_NUMBER"
                        export MOCK_API_PORT=0
                        trap 'docker compose -f compose.mock.yaml --profile test down --remove-orphans' EXIT
                        docker compose -f compose.mock.yaml build mock-api
                        docker compose -f compose.mock.yaml up -d --wait mock-api
                        docker compose -f compose.mock.yaml --profile test run --rm -T --no-deps mock-smoke || {
                            docker compose -f compose.mock.yaml logs mock-api
                            exit 1
                        }
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                gitlabCommitStatus(name: 'sonarqube') {
                    withSonarQubeEnv('SonarQube Local') {
                        sh '''
                            if [ -n "${CI_HOST_JENKINS_HOME:-}" ]; then
                                case "$WORKSPACE" in
                                    "$JENKINS_HOME"/*)
                                        export CI_WORKSPACE="$CI_HOST_JENKINS_HOME/${WORKSPACE#"$JENKINS_HOME"/}"
                                        ;;
                                    *)
                                        echo 'WORKSPACE deve estar dentro de JENKINS_HOME para mapear o caminho no host.' >&2
                                        exit 1
                                        ;;
                                esac
                            fi

                            export CI_UID="$(id -u)" CI_GID="$(id -g)"
                            export COMPOSE_PROJECT_NAME="bttr-sonarqube-$(printf '%s' "$JOB_NAME" | cksum | cut -d ' ' -f 1)-$BUILD_NUMBER"
                            trap 'docker compose -f compose.ci.yaml -f compose.jenkins.yaml down --remove-orphans' EXIT
                            # A tarefa sonar depende do teste/JaCoCo e precisa do PostgreSQL do compose.ci.yaml.
                            docker compose -f compose.ci.yaml -f compose.jenkins.yaml run --rm -T tests \
                                ./gradlew sonar --no-daemon --console=plain
                        '''
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Performance smoke') {
            steps {
                gitlabCommitStatus(name: 'performance') {
                    sh '''
                        if [ -n "${CI_HOST_JENKINS_HOME:-}" ]; then
                            case "$WORKSPACE" in
                                "$JENKINS_HOME"/*)
                                    export CI_WORKSPACE="$CI_HOST_JENKINS_HOME/${WORKSPACE#"$JENKINS_HOME"/}"
                                    ;;
                                *)
                                    echo 'WORKSPACE deve estar dentro de JENKINS_HOME para mapear o caminho no host.' >&2
                                    exit 1
                                    ;;
                            esac
                        fi

                        export CI_UID="$(id -u)" CI_GID="$(id -g)"
                        export COMPOSE_PROJECT_NAME="bttr-performance-$(printf '%s' "$JOB_NAME" | cksum | cut -d ' ' -f 1)-$BUILD_NUMBER"
                        mkdir -p build/reports/k6
                        trap 'docker compose -f compose.performance.yaml down --volumes --remove-orphans' EXIT
                        docker compose -f compose.performance.yaml up -d --build --wait api prometheus
                        docker compose -f compose.performance.yaml run --rm -T --no-deps k6
                    '''
                }
            }
        }

        stage('Security scans') {
            steps {
                timeout(time: 90, unit: 'MINUTES') {
                    gitlabCommitStatus(name: 'security') {
                        sh '''
                            if [ -n "${CI_HOST_JENKINS_HOME:-}" ]; then
                                case "$WORKSPACE" in
                                    "$JENKINS_HOME"/*)
                                        export CI_WORKSPACE="$CI_HOST_JENKINS_HOME/${WORKSPACE#"$JENKINS_HOME"/}"
                                        ;;
                                    *)
                                        echo 'WORKSPACE deve estar dentro de JENKINS_HOME para mapear o caminho no host.' >&2
                                        exit 1
                                        ;;
                                esac
                            fi

                            export CI_UID="$(id -u)" CI_GID="$(id -g)"
                            export COMPOSE_PROJECT_NAME="bttr-security-$(printf '%s' "$JOB_NAME" | cksum | cut -d ' ' -f 1)-$BUILD_NUMBER"
                            export BTTR_API_IMAGE="bttr-server-security:$BUILD_NUMBER"
                            ./scripts/security.sh
                        '''
                    }
                }
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true,
                testResults: 'build/test-results/test/*.xml,build/test-results/quarkusIntTest/*.xml,build/reports/k6/junit.xml'
            archiveArtifacts allowEmptyArchive: true,
                artifacts: 'build/generated/openapi/**,build/reports/tests/**,build/reports/checkstyle/**,build/reports/jacoco/**,build/reports/k6/**,build/reports/security/**'
        }
    }
}
