import React from 'react';
import { FlexContext, FlexBox } from 'flex';

const { Component } = React;

class Container extends Component {
  render () {
    return (
      <g>
        <rect
          style={this.props.style}
          fill={this.props.color}
          x="0"
          y="0"
          width={this.props.layout.width}
          height={this.props.layout.height}
        />
        {this.props.children}
      </g>
    );
  }
}

const Backdrop = FlexBox(Container, {
  stroke: 'black',
  strokeWidth: 5,
  flexDirection: 'row',
  flex: 1,
  padding: 40,
  flexWrap: 'wrap',
  justifyContent: 'flex-start'
});

const Square = FlexBox(Container, {
  stroke: 'black',
  height: 40,
  width: 40
});

const containerStyle = {
  width: 400,
  height: 400
}

export default class App extends Component {
  render () {
    const board = [];

    for (let i = 0; i < 64; i++) {
      board[i] = i;
    }

    return (
      <svg height="600" width="600">
        <FlexContext layout={containerStyle}>
          <Backdrop color="#CE6E09">
            {board.map(id =>
              <Square
                key={id}
                color={
                  Math.floor(id / 8) % 2 ?
                    id % 2 ? '#470300' : '#F6B968' :
                    id % 2 ? '#F6B968' : '#470300'
                }
              />
            )}
          </Backdrop>
        </FlexContext>
      </svg>
    )
  }
}
