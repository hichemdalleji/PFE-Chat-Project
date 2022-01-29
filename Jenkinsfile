#!/usr/bin/env groovy

/*library identifier: 'Jenkins-Shared-Library@master', retriever: modernSCM(
    [$class: 'GitSCMSource',
     remote: 'git@github.com:hichemdalleji/Jenkins-Shared-Library.git',
     credentialsId: 'github-shared-lib'
    ]
)*/
/* groovylint-disable-next-line CompileStatic */
@Library ('jenkins-shared-lib') //If the library is global, underscore is added to separate lib from pipeline

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
                    //sh 'chmod 777 version.sh'
                    sh "chmod 777 version.sh"
                    APPL_VERSION = sh(
                        script: "./version.sh",
                        returnStdout: true
                    ).trim()

                    env.IMAGE_NAME = "${APPL_VERSION}-${BUILD_NUMBER}"
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
        /* stage('commit version update') {
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: 'github-credentials',
                        passwordVariable: 'PASS',
                        sernameVariable: 'USER'
                    )])
                {
                    sh 'git config --global user.email "jenkins@example.com"'
                    sh 'git config --global user.name "jenkins"'
                    sh "git remote set-url origin http://${PASS}${USER}@github.com/hichemdalleji/PFE-Chat-Project.git"
                    sh 'git add .'
                    sh 'git commit -m "ci: version bump"'
                    sh 'git push origin HEAD:master'
                }
                }
            }
        } */
    }
}