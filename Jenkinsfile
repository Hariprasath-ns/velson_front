pipeline {
    agent any

    tools {
        nodejs 'Node24'   // match whatever name you used for the backend job
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
                sh 'npm run lint'
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
        failure {
            echo "velson_front build failed"
        }
    }
}