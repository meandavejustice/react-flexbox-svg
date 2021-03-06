import React from 'react';
import EventEmitter from 'wolfy87-eventemitter';
import computeLayout from 'css-layout';
import isFlexBoxProperty from './flexbox-props';

const { Component } = React;

let stylesRoot = { children: [] };

function setStyle (style = {}, styles = stylesRoot, path = []) {
  if (styles.style === undefined) {
    styles.style = style;
  } else {
    let childStyle = { style: style, children: [] };
    styles.children.push(childStyle);
    path.push(styles.children.length - 1);

    styles = childStyle;
  }

  return {
    path: path.slice(),
    setStyle : function (childStyle) {
      return setStyle(childStyle, styles, path.slice());
    }
  }
}

export class FlexContext extends Component {
  static childContextTypes = {
    styleTools: React.PropTypes.object.isRequired,
    waitForLayoutCalculation: React.PropTypes.func.isRequired
  }

  constructor (props, context) {
    super(props);

    this.layoutNotifier = new EventEmitter();
    this.styleTools = {};
  }

  waitForLayoutCalculation = (cb) => {
    this.layoutNotifier.once('layout-update', cb);
  }

  getChildContext () {
    return {
      styleTools: this.styleTools,
      waitForLayoutCalculation: this.waitForLayoutCalculation
    }
  }

  render () {
    return <g>{this.props.children}</g>;
  }

  startNewStyleTree () {
    stylesRoot = { children: [] };
    const { setStyle: layoutFunc } = setStyle();
    this.styleTools.setStyle = layoutFunc;
  }

  computeLayoutAndBroadcastResults () {
    const flexLayout = computeLayout(stylesRoot);
    this.layoutNotifier.emit('layout-update', flexLayout);
  }

  componentWillMount () {
    this.startNewStyleTree();
  }

  componentDidMount () {
    this.computeLayoutAndBroadcastResults();
  }

  componentWillUpdate () {
    this.startNewStyleTree();
  }

  componentDidUpdate () {
    this.computeLayoutAndBroadcastResults();
  }

}

export const FlexBox = (Composed, componentStyles = {}) => class extends Component {
  static displayName = 'FlexBox';

  static contextTypes = {
    styleTools: React.PropTypes.object.isRequired,
    waitForLayoutCalculation: React.PropTypes.func.isRequired
  }

  static childContextTypes = {
    styleTools: React.PropTypes.object.isRequired
  }

  getMyLayout (layout) {
    this.pathToNode.forEach(childIndex => {
      layout = layout.children[childIndex]
    });

    return layout;
  }

  constructor (props, context) {
    super(props);

    const styles = Object.assign(componentStyles, props.styles);
    const { svgStyles, flexStyles } = partitionStyles(styles)

    this.flexStyles = flexStyles;
    this.styleTools = {};

    this.state = {
      layout: { top: 0, left: 0, width: 0, height: 0 },
      styles: svgStyles
    };
  }

  componentWillMount () {
    const { setStyle: setStyleFunc, path} = this.context.styleTools.setStyle(this.flexStyles);

    this.styleTools.setStyle = setStyleFunc;
    this.pathToNode = path;

    this.context.waitForLayoutCalculation(layout => {
      this.setState({ layout: this.getMyLayout(layout) });
    });
  }

  componentWillReceiveProps () {
    const { setStyle: setStyleFunc, path} = this.context.styleTools.setStyle(this.flexStyles);

    this.styleTools.setStyle = setStyleFunc;
    this.pathToNode = path;

    this.context.waitForLayoutCalculation(layout => {
      this.setState({ layout: this.getMyLayout(layout) });
    });

  }

  getChildContext () {
    return {
      styleTools: this.styleTools
    }
  }

  render () {
    const transformation = `translate(${this.state.layout.left},${this.state.layout.top})`
    return (
      <g transform={transformation}>
        <Composed layout={this.state.layout} style={this.state.styles} {...this.props}/>
      </g>
    );
  }

}

function partitionStyles (styles) {
  return Object.keys(styles).reduce((partitions, property) => {
    if (isFlexBoxProperty(property)) {
      partitions.flexStyles[property] = styles[property];
    } else {
      partitions.svgStyles[property] = styles[property];
    }

    return partitions;
  }, { svgStyles: {}, flexStyles: {} });
}
