import React, { Component } from "react";
import * as configSchema from "./configSchema";
import Form from "react-jsonschema-form";

export class Config extends Component {
    render() {
        return (
            <Form schema={configSchema} formData={this.props.value}>
                <button className="btn btn-primary" type="submit">
                    Save
                </button>
            </Form>
        );
    }
}
