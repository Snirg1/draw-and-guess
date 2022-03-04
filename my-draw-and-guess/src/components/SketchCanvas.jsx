import React from "react";
import {ReactSketchCanvas} from "react-sketch-canvas";
import "./style.css"

class SketchCanvas extends React.Component {
    constructor(props) {
        super(props);
        this.canvas = React.createRef(); // an immutable object with a single mutable value
        this.socketRef = props.socketRef;
        this.wordToDraw = props.wordToDraw;
        this.wordLevel = props.wordLevel
        this.state = {
            isImgExported: false,
            img64Base: null,
        }
    }

    render() {
        return (
            <div>
                {!this.state.isImgExported &&
                    <ReactSketchCanvas
                        className="sketch-canvas"
                        ref={this.canvas}
                        strokeWidth={2}
                        strokeColor="black"
                        width="100%"
                        height="80%"
                    />}
                {!this.state.isImgExported && <button
                    onClick={() => {
                        this.canvas.current.exportImage("png")
                            .then(img => {
                                this.socketRef.current.emit("drawer_turn_finished", {
                                    image: img,
                                    wordToDraw: this.wordToDraw,
                                    wordLevel: this.wordLevel
                                })
                                this.setState({isImgExported: true, img64Base: img});
                            })
                            .catch(e => {
                                console.log(e);
                            });
                    }}
                >Send!
                </button>}
                {this.state.isImgExported && <h1>The final draw is: </h1>}
                {this.state.isImgExported && <img src={this.state.img64Base} alt={null}/>}
                {this.state.isImgExported && <h2>Waiting to other player to guess...</h2>}
            </div>
        )
    }
}

export default SketchCanvas

