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

        stage('Build and test') {
            steps {
                gitlabCommitStatus(name: 'build') {
                    sh '''
                        export CI_UID="$(id -u)" CI_GID="$(id -g)"
                        export COMPOSE_PROJECT_NAME="bttr-ci-$(printf '%s' "$JOB_NAME" | cksum | cut -d ' ' -f 1)-$BUILD_NUMBER"
                        trap 'docker compose -f compose.ci.yaml down --volumes --remove-orphans' EXIT
                        docker compose -f compose.ci.yaml run --rm -T tests \
                            ./gradlew clean build --no-daemon --console=plain
                    '''
                }
            }
        }
    }

    post {
        always {
            junit allowEmptyResults: true,
                testResults: 'build/test-results/test/*.xml'
            archiveArtifacts allowEmptyArchive: true,
                artifacts: 'build/reports/tests/test/**'
        }
    }
}
