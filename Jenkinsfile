#!/usr/bin/env groovy

/*library identifier: 'Jenkins-Shared-Library@master', retriever: modernSCM(
    [$class: 'GitSCMSource',
     remote: 'git@github.com:hichemdalleji/Jenkins-Shared-Library.git',
     credentialsId: 'github-shared-lib'
    ]
)*/ 
@Library ('jenkins-shared-lib')_ //If the library is global, underscore is added to separate lib from pipeline 
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
                    sh 'npm version major --no-git-tag-version' //other options are "major" or "minor"
                    //sh 'npm version > version.txt'
                    //def matcher = readFile('version.txt') =~ '"ChatProject":(.+)'
                    def version = sh 'node -p -e "require('./package.json').version"'
                    env.IMAGE_NAME = "${version}-${BUILD_NUMBER}"
                    sh "echo ${IMAGE_NAME}" 
                }
            }
        }
        /*stage('build app') {
            steps {
               script {
                  echo 'building the chat app...'
                  buildNpm()
               }
            }
        }*/
        stage('build image') {
            steps {
                script {
                   echo 'building docker image...'
                   buildImage(env.IMAGE_NAME)
                   dockerLogin()
                }
            }
        }
              stage('push image') {
            steps {
                script {
                   echo 'pushing docker image...'
                   dockerPush(env.IMAGE_NAME)
                }
            }
        }
        /*stage('deploy to EC2') {
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
        }*/
        stage('commit version update') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'github-credentials', passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                    sh 'git config --global user.email "jenkins@example.com"'
                    sh 'git config --global user.name "jenkins"'
                    sh "git remote set-url origin https://${USER}:${PASS}@github.com/hichemdalleji/PFE-Chat-Project.git"
                    sh 'git add .'
                    sh 'git commit -m "ci: version bump"'
                    sh 'git push origin HEAD:master'
                    }
                }
            }
        }
    }
}
