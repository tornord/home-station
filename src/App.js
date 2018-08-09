import React, { Component } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import * as SunCalc from "suncalc";
// import { TimePicker } from "antd";
import moment from "moment";
import { Switch } from "./Switch";
import axios from "axios";
import { Cogwheel } from "./Svgs";

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
        axios.get("/config").then((response) => {
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
		var switches = config.switches.map(sw => {
			let s = new Switch(sw.name, sw.house, sw.group, sw.wakeUp, sw.goToBed, sw.weekendWakeUp, sw.weekendGoToBed, config.latitude, config.longitude);
			let state = s.getState(now);
			let nextEvent = s.nextEvent(now);
			let nextNextEvent = s.nextEvent(nextEvent.timestamp);
			return { name: sw.name, state, nextEvent, nextNextEvent };
		});
        if (state.hasError) {
            return (
                <div className="App">
                    <div className="App-header">
                        <h2>Error</h2>
                    </div>
                </div>
            );
        }
        // <p>Månens fas är {moonIllumination.fraction.toFixed(2)}</p>
		// Klockan är <TimePicker value={moment(now.getTime())} format={timeFormat} onChange={(e) => this.timePickerChange(this, e)} />
        return (
            <div className="App">
                <div className="App-header">
					<Link to="/setup"><Cogwheel /></Link>
                    <h2 className="with-cogwheel">{config.name}</h2>
                </div>
                <div className="container">
                    <div className="row">
                        <div className="col-12">
                            <h3>Välkommen!</h3>
                            <p>
                            	Klockan är {showTime(now)}
                            </p>
							<hr />
							{ switches.map((d,i) => <div key={ i }>
									<p> 
										{ d.name } är <span className="timestamp"> {d.state ? "PÅ" : "AV"}</span>
									</p>
									<p>
										De {d.nextEvent.state ? "tänds" : "släcks"} {showTime(d.nextEvent.timestamp)}
										&nbsp;därefter {d.nextNextEvent.state ? "tänds" : "släcks"} de {showTime(d.nextNextEvent.timestamp)}
									</p>
									<hr />
								</div>) }
							<p>
        						Solen går upp {showTime(times.sunrise)} och ned {showTime(times.sunset)}
        					</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default App;
