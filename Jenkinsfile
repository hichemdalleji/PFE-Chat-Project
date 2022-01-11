#!/usr/bin/env groovy

/*library identifier: 'jenkins-shared-library@master', retriever: modernSCM(
    [$class: 'GitSCMSource',
     remote: 'add remote here',
     credentialsId: 'gitlab-credentials'
    ]
) */

pipeline {
    agent any
    tools {
        nodejs 'NodeJS'
    }

    stages {
        stage('increment version') {
            steps {
                script {
                    echo 'incrementing app version...'
                    sh 'npm version patch --no-git-tag-version' //other options are "major" or "minor"
                    sh 'npm version > version.txt'
                    //def matcher = readFile('version.txt') =~ '"ChatProject":(.+)'
                    def version = sh 'cat version.txt'
                    env.IMAGE_NAME = "$version-$BUILD_NUMBER"
                }
            }
        }

        stage('build app') {
            steps {
               script {
                  echo 'building application jar...'
                  buildJar()
               }
            }
        }
        stage('build image') {
            steps {
                script {
                   echo 'building docker image...'
                   buildImage(env.IMAGE_NAME)
                   dockerLogin()
                   dockerPush(env.IMAGE_NAME)
                }
            }
        }
        stage('deploy to EC2') {
            steps {
                script {
                   echo 'deploying docker image to EC2...'

                   def shellCmd = "bash ./server-cmds.sh ${IMAGE_NAME}"
                   def ec2Instance = "ec2-user@35.180.251.121"

                   sshagent(['ec2-server-key']) {
                       sh "scp server-cmds.sh ${ec2Instance}:/home/ec2-user"
                       sh "scp docker-compose.yaml ${ec2Instance}:/home/ec2-user"
                       sh "ssh -o StrictHostKeyChecking=no ${ec2Instance} ${shellCmd}"
                   }
                }
            }
        }
        stage('commit version update') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'gitlab-credentials', passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                    // git config here for the first time run
                    sh 'git config --global user.email "jenkins@example.com"'
                    sh 'git config --global user.name "jenkins"'
                    sh "git remote set-url origin https://${USER}:${PASS}@gitlab.com/nanuchi/java-maven-app.git"
                    sh 'git add .'
                    sh 'git commit -m "ci: version bump"'
                    sh 'git push origin HEAD:jenkins-jobs'
                    }
                }
            }
        }

    }
}
