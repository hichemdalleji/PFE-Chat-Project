import React, { Component } from 'react';
import platform from 'platform';

import socket from '@/socket';
import action from '@/state/action';
import { Tabs, TabPane, TabContent, ScrollableInkTabBar } from '@/components/Tabs';
import Input from '@/components/Input';
import Message from '@/components/Message';
import './Login.less';

class Login extends Component {
    handleLogin = () => {
        socket.emit('login', {
            username: this.loginUsername.getValue(),
            password: this.loginPassword.getValue(),
            os: platform.os.family,
            browser: platform.name,
            environment: platform.description,
        }, (res) => {
            if (typeof res === 'string') {
                Message.error(res);
            } else {
                action.setUser(res);
                action.closeLoginDialog();
                window.localStorage.setItem('token', res.token);
            }
        });
    }
    handleRegister = () => {
        socket.emit('register', {
            username: this.registerUsername.getValue(),
            password: this.registerPassword.getValue(),
            os: platform.os.family,
            browser: platform.name,
            environment: platform.description,
        }, (res) => {
            if (typeof res === 'string') {
                Message.error(res);
            } else {
                Message.success('Registration successfully completed!');
                action.setUser(res);
                action.closeLoginDialog();
                window.localStorage.setItem('token', res.token);
            }
        });
    }
    renderLogin() {
        return (
            <div className="pane">
                <h3>Username</h3>
                <Input ref={i => this.loginUsername = i} onEnter={this.handleLogin} />
                <h3>Password</h3>
                <Input type="password" ref={i => this.loginPassword = i} onEnter={this.handleLogin} />
                <button onClick={this.handleLogin}>Log in</button>
            </div>
        );
    }
    renderRegister() {
        return (
            <div className="pane">
                <h3>Username</h3>
                <Input ref={i => this.registerUsername = i} onEnter={this.handleRegister} placeholder="Choose a nickname" />
                <h3>Password</h3>
                <Input type="password" ref={i => this.registerPassword = i} onEnter={this.handleRegister} placeholder="Password" />
                <button onClick={this.handleRegister}>Sign up</button>
            </div>
        );
    }
    render() {
        return (
            <Tabs
                className="main-login"
                defaultActiveKey="login"
                renderTabBar={() => <ScrollableInkTabBar />}
                renderTabContent={() => <TabContent />}
            >
                <TabPane tab="Login" key="login">
                    {this.renderLogin()}
                </TabPane>
                <TabPane tab="Register" key="register">
                    {this.renderRegister()}
                </TabPane>
            </Tabs>
        );
    }
}

export default Login;
