import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import 'antd/dist/antd.css'
import { App } from './App';
import registerServiceWorker from './registerServiceWorker';
import { BrowserRouter as Router, Route, Switch, Redirect } from "react-router-dom";
        
ReactDOM.render(<Router>
        <Switch>
            <Route path="/:id" component={App} />
            <Route component={App}/>
        </Switch>
    </Router>, document.getElementById("root"));

registerServiceWorker();
