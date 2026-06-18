pipeline {
    agent any

    tools {
        nodejs 'Node24'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                // Don't fail the build on lint errors yet (560 pre-existing issues to clean up over time).
                // Marks the build UNSTABLE instead of FAILED so it's visible but not blocking.
                catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                    sh 'npm run lint'
                }
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
    }

    post {
        success {
            echo "velson_front build succeeded"
        }
        unstable {
            echo "velson_front build succeeded with lint warnings - see Lint stage output"
        }
        failure {
            echo "velson_front build failed"
        }
    }
}