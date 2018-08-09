import React, { Component } from "react";
import axios from "axios";
import * as configSchema from "./configSchema";
import Form from "react-jsonschema-form";
import { Redirect } from "react-router-dom";

export class Setup extends Component {
    componentDidMount() {
        axios.get("/config").then((response) => {
            if (response.status === 200) {
                var config = response.data;
                this.setState((prevState, props) => ({ config }));
            }
        });
    }
    save(data) {
		var { formData } = data;
		delete formData.schema;
		delete formData.uiSchema;
		delete formData.idSchema;
		delete formData.errorSchema;
		delete formData.edit;
		delete formData.formData;
		delete formData.errors;
		delete formData.status;
		console.log(formData);
        axios.put("/config", formData).then((response) => {
            if (response.status === 200) {
				this.setState((prevState, props) => ({ status: "Saved" }));            
            }
        });
    }
    render() {
		if (this.state && this.state.status === "Saved") {
			return <Redirect to="/" />;
		}
		if (!this.state || !this.state.config) {
			return <div className="container">
				<div className="row">
					<div className="col-12">
						<h3>Loading ...</h3>
					</div>
				</div>
			</div>;
		}
		var { config } = this.state;
        return <div>
			<div className="App">
				<div className="App-header">
					<h2>{config.name}</h2>
				</div>
			</div>
			<div className="container">
				<div className="row">
					<div className="col-12">
						<Form schema={configSchema} formData={config} onSubmit={(data)=> { this.save(data); }}>
							<button className="btn btn-primary" type="submit">
								Save
							</button>
						</Form>
					</div>
				</div>
			</div>
		</div>;
	}
}
