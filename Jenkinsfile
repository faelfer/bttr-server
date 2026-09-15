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
                    sh './gradlew build --no-daemon'
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
