import React, { Component } from 'react';
import { createDOMID } from '@splunk/ui-utils/id';
import FormRows from '@splunk/react-ui/FormRows';
import Text from '@splunk/react-ui/Text';
import ControlGroup from '@splunk/react-ui/Text';
import Button from '@splunk/react-ui/Text';

const spanStyle = {
    display: 'inline-flex',
    lineHeight: '32px',
    flex: '0 0 30px',
    justifyContent: 'center',
    alignItems: 'center',
};

const keyStyle = {
    flex: '0 0 100px',
};

const valueStyle = {
    flex: '1 0 0',
};

class Header extends Component {
    constructor(props) {
        super(props);

        const items = [
            <FormRows.Row index={0} key="uniqueRowUno" onRequestRemove={this.handleRequestRemove}>
                <div style={{ display: 'flex' }}>
                    <Text inline defaultValue="sourceip" style={keyStyle} />
                    <span style={spanStyle}>=</span>
                    <Text inline defaultValue="192.168.1.1" style={valueStyle} />
                </div>
            </FormRows.Row>,
            <FormRows.Row index={1} key="uniqueRowDos" onRequestRemove={this.handleRequestRemove}>
                <div style={{ display: 'flex' }}>
                    <Text defaultValue="uid" inline style={keyStyle} />
                    <span style={spanStyle}>=</span>
                    <Text inline defaultValue="johndoe" style={valueStyle} />
                </div>
            </FormRows.Row>,
        ];

        this.state = {
            items,
        };
    }

    handleRequestAdd = () => {
        console.log(this.state.items);
        this.setState((state) => ({

            items: FormRows.addRow(
                <FormRows.Row
                    index={state.items.length}
                    key={createDOMID()}
                    onRequestRemove={this.handleRequestRemove}
                >
                    <div style={{ display: 'flex' }}>
                        <Text placeholder="key" inline style={keyStyle} describedBy="header-key" />
                        <span style={spanStyle}>=</span>
                        <Text
                            placeholder="value"
                            inline
                            style={valueStyle}
                            describedBy="header-value"
                        />
                    </div>
                </FormRows.Row>,
                state.items
            ),

        })
        );
    };

    handleRequestMove = ({ fromIndex, toIndex }) => {
        this.setState((state) => ({
            items: FormRows.moveRow(fromIndex, toIndex, state.items),
        }));
    };

    handleRequestRemove = (e, { index }) => {
        this.setState((state) => ({
            items: FormRows.removeRow(index, state.items),
        }));
    };

    handleSubmit =  () => {
        console.log("test");
       console.log(this.state.items);
    };



    render() {
        const header = (
            <div>
                <span
                    style={{
                        display: 'inline-block',
                        width: 130,
                    }}
                    id="header-key"
                >
                    Key
                </span>
                <span style={{ display: 'inline-block' }} id="header-value">
                    Value
                </span>
            </div>
        );

        return (
            <div>
            <FormRows
                addLabel="Add Input"
                header={header}
                onRequestAdd={this.handleRequestAdd}
                onRequestMove={this.handleRequestMove}
                style={{ width: 400 }}
            >
                {this.state.items}
            </FormRows>
             <ControlGroup label="" style={{ float: 'right' }}>
             <Button
                 label="Save"
                 appearance="primary"
                 type="submit"
                 value="Submit"
                 // eslint-disable-next-line react/jsx-no-bind
                 onClick={this.handleSubmit}

             />
             </ControlGroup>
             </div>
        );
    }
}

export default Header;
