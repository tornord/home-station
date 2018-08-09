import React, { Component } from "react";
import "./App.css";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import * as SunCalc from "suncalc";
import { TimePicker } from "antd";
import moment from "moment";
import { Switch } from "./Switch";
import { Config } from "./Config";
import axios from "axios";

//SunCalc.addTime(-0.83, "customRise", "customSet");

//https://developers.google.com/maps/documentation/javascript/tutorial

const timeFormat = "HH:mm";

//var toHHMM = (d) => d.getHours().toString().padStart(2,"0")+":"+d.getMinutes().toString().padStart(2,"0");
//var showTime = (d) => <TimePicker defaultValue={ moment(d.valueOf()) } format={ timeFormat } disabled={ true } />;
var showTime = (d) => <span className="timestamp">{moment(d).format(timeFormat)}</span>;

export class App extends Component {
    static propTypes = {
        match: PropTypes.object
    };

    constructor() {
        super();
        this.state = { hasError: false, now: new Date(), simulated: null, config: null };
    }

    //https://opendata-download-metfcst.smhi.se/api/category/pmp2g/version/2/geotype/point/lon/16/lat/58/data.json

    componentDidMount() {
        this.tickId = window.setInterval(() => this.tick(this), 5000);
        axios.get("http://localhost:8080/config").then((response) => {
            if (response.status === 200) {
                var config = response.data;
                this.setState((prevState, props) => ({ ...prevState, config }));
                this.hourTick(this);
                this.hourTickId = window.setInterval(() => this.hourTick(this), 3600 * 1000);
            }
        });
    }

    componentWillUnmount() {
        if (this.tickId) {
            window.clearInterval(this.tickId);
        }
        if (this.hourTickId) {
            window.clearInterval(this.hourTickId);
        }
    }

    hourTick(_this) {
        var { config } = _this;
        if (!config) {
            return;
        }
        var url = `https://opendata-download-metfcst.smhi.se/api/category/pmp2g/version/2/geotype/point/lon/${config.longitude.toFixed(4)}/lat/${config.latitude.toFixed(4)}/data.json`;
        axios.get(url).then((response) => {
            if (response.status === 200) {
                console.log(response.data.timeSeries[0]);
                console.log(response.data.timeSeries.map((d) => [new Date(d.validTime), d.parameters[1].values[0]]));
            }
        });
    }

    tick(_this) {
        var now = new Date();
        if (_this.state.simulated || Switch.dateToMinutes(_this.state.now) === Switch.dateToMinutes(now)) {
            return;
        }
        _this.setState((prevState, props) => {
            return { hasError: false, now, simulated: null };
        });
    }

    componentDidCatch(error, info) {
        this.setState({ hasError: true });
    }

    timePickerChange(_this, e) {
        console.log(Switch.dateToMinutes(e.toDate()));
        _this.setState((prevState, props) => {
            return { hasError: false, simulated: e.toDate(), now: null };
        });
    }

    render() {
        var state = this.state;
        var now = state.now ? state.now : state.simulated;
        var config = state.config;
        if (!config) {
            return (
                <div className="App">
                    <div className="App-header">
                        <h2>Loading ..</h2>
                    </div>
                </div>
            );
        }
        var times = SunCalc.getTimes(now, config.latitude, config.longitude);
        var moonIllumination = SunCalc.getMoonIllumination(now, config.latitude, config.longitude); // https://stardate.org/nightsky/moon
        //var ms = [...Array(24)].map((d,i)=>SunCalc.getMoonIllumination(new Date(2018, 7, i+1), config.latitude, config.longitude));
        var s = new Switch("Hello", "123", 0, "06:15", "23.15", "07:30", "00:30", config.latitude, config.longitude);
        var switchState = s.getState(now);
        var nextEvent = s.nextEvent(now);
        var nextNextEvent = s.nextEvent(nextEvent.timestamp);
        if (state.hasError) {
            return (
                <div className="App">
                    <div className="App-header">
                        <h2>Error</h2>
                    </div>
                </div>
            );
        }
        // 	<p>
        // 	Solen går upp {showTime(times.sunrise)} och ned {showTime(times.sunset)}
        // </p>
        // <p>Månens fas är {moonIllumination.fraction.toFixed(2)}</p>
        return (
            <div className="App">
                <div className="App-header">
                    <h2>{config.name}</h2>
                </div>
                <div className="container">
                    <div className="row">
                        <div className="col-12">
                            <p>Välkommen!</p>
                            <p>
                                Klockan är <TimePicker value={moment(now.getTime())} format={timeFormat} onChange={(e) => this.timePickerChange(this, e)} />
                            </p>
                            <p>Lamporna är {switchState ? "PÅ" : "AV"}</p>
                            <p>
                                De {nextEvent.state ? "tänds" : "släcks"} {showTime(nextEvent.timestamp)}
                            </p>
                            <p>
                                Därefter {nextNextEvent.state ? "tänds" : "släcks"} de {showTime(nextNextEvent.timestamp)}
                            </p>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-12">
                            <Config value={config} />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
