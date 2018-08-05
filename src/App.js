import React, { Component } from 'react';
import './App.css';
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import * as SunCalc from "suncalc";
import { TimePicker } from 'antd';
import moment from 'moment';
import { Lamp } from './Lamp';
import axios from 'axios';

//SunCalc.addTime(-0.83, "customRise", "customSet");

const timeFormat = 'HH:mm';

const config = {
	name: "Röjningsstigen 5",
	nexaHouseId: "4107678",
	latitude: 59.3237778, //https://developers.google.com/maps/documentation/javascript/tutorial
	longitude: 17.9531639
}

//var toHHMM = (d) => d.getHours().toString().padStart(2,"0")+":"+d.getMinutes().toString().padStart(2,"0");
//var showTime = (d) => <TimePicker defaultValue={ moment(d.valueOf()) } format={ timeFormat } disabled={ true } />;
var showTime = (d) => <span className="timestamp">{ moment(d).format(timeFormat) }</span>;

export class App extends Component {
	static propTypes = {
		match: PropTypes.object
	};

	constructor() {
		super();
		this.state = { hasError: false, now: new Date(), simulated: null };
	}

	//https://opendata-download-metfcst.smhi.se/api/category/pmp2g/version/2/geotype/point/lon/16/lat/58/data.json

	componentDidMount() {
		this.tickId = window.setInterval(() => this.tick(this), 5000);
		var url = `https://opendata-download-metfcst.smhi.se/api/category/pmp2g/version/2/geotype/point/lon/${config.longitude.toFixed(4)}/lat/${config.latitude.toFixed(4)}/data.json`
		axios.get(url).then(response => {
			if (response.status===200) {
				console.log(response.data.timeSeries[0]);
				console.log(response.data.timeSeries.map(d=>[new Date(d.validTime), d.parameters[1].values[0]]));
			}
		});
	}

	componentWillUnmount() {
		if (this.tickId) {
			window.clearInterval(this.tickId);
		}
 	}

	tick(_this) {
		if (_this.state.simulated || (Lamp.totalHours(_this.state.now) === Lamp.totalHours(new Date()))) {
			return;
		}
		_this.setState((prevState, props) => {
			return { hasError: false, now: new Date(), simulated: null };
		});
	}

	componentDidCatch(error, info) {
		this.setState({ hasError: true });
	}

	timePickerChange(_this, e) {
		console.log(Lamp.totalHours(e.toDate()));
		_this.setState((prevState, props) => {
			return { hasError: false, simulated: e.toDate(), now: null };
		});
	}

	render() {
		var state = this.state;
		var now = state.now ? state.now : state.simulated;
		var times = SunCalc.getTimes(now, config.latitude, config.longitude);
		var moonIllumination = SunCalc.getMoonIllumination(now, config.latitude, config.longitude) // https://stardate.org/nightsky/moon
		//var ms = [...Array(24)].map((d,i)=>SunCalc.getMoonIllumination(new Date(2018, 7, i+1), config.latitude, config.longitude));
		var lamp = new Lamp(87654321, 0, 6.25, 23.25, 7.5, 0.5, config.latitude, config.longitude);
		var lampState = lamp.getState(now.getDay(), Lamp.totalHours(now), lamp.getSun(now));
		var nextSwitch = lamp.nextSwitch(now);
		var nextNextSwitch = lamp.nextSwitch(nextSwitch.timestamp);
		if (state.hasError) {
			return <div className="App">
				<div className="App-header">
					<h2>Error</h2>
				</div>
			</div>;
		}
		return <div className="App">
			<div className="App-header">
				<h2>{ config.name }</h2>
				</div>
			<div className="container">
				<div className="row">
					<div className="col-12">
						<p>Välkommen!</p>
						<p>Klockan är <TimePicker value={ moment(now.getTime()) } format={ timeFormat } onChange={ (e) => this.timePickerChange(this, e) } /></p>
						<p>Lamporna är { lampState ? "PÅ" : "AV" }</p>
						<p>De { nextSwitch.state ? "tänds" : "släcks" } { showTime(nextSwitch.timestamp) }</p>
						<p>Därefter { nextNextSwitch.state ? "tänds" : "släcks" } de { showTime(nextNextSwitch.timestamp) }</p>
						<p>Solen går upp { showTime(times.sunrise) } och ned { showTime(times.sunset) }</p>
						<p>Månens fas är { moonIllumination.fraction.toFixed(2) }</p>
					</div>
				</div>
			</div>
		</div>;
	}
}

export default App;
