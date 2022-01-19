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


        stage('commit version update') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: 'github-credentials', passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                    sh 'git config --global user.email "jenkins@example.com"'
                    sh 'git config --global user.name "jenkins"'
                    sh "git remote set-url origin https://www.github.com/hichemdalleji/PFE-Chat-Project.git"
                    sh 'git add .'
                    sh 'git commit -m "ci: version bump"'
                    sh 'git push origin HEAD:master'
                    }
                }
            }
        }
    }
}