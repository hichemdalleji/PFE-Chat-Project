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
    }

}