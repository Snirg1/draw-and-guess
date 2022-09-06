import React, {useEffect, useRef, useState} from "react";
import io from "socket.io-client";
import TextField from "@material-ui/core/TextField";

import SketchCanvas from "./components/SketchCanvas";
import {SERVER_IP} from "./constants.js";

export function App() {

    const [isWordWasSet, setIsWordWasSet] = useState(false);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [currentDrawer, setCurrentDrawer] = useState(0);
    const [wordToDraw, setWordToDraw] = useState(null);
    const [wordToGuess, setWordToGuess] = useState(null);
    const [playerID, setPlayerID] = useState(null);
    const [wordLevel, setWordLevel] = useState(null);
    const [img64BaseSrc, setImg64BaseSrc] = useState(null);
    const [sessionPoints, setSessionPoints] = useState(0);
    const socketRef = useRef()
    const randomWords = require('random-words');
    const pointsDictionary = {easy: 1, medium: 3, hard: 5}


    useEffect(() => {
            socketRef.current = io.connect(SERVER_IP);

            socketRef.current.on("game-started", (msgData) => {
                setCurrentDrawer(msgData.currentDrawer);
                setIsGameStarted(msgData.isGameStarted);
            })

            socketRef.current.on("player_connected", (msgData) => {
                setPlayerID(msgData.playerID);
            });

            socketRef.current.on("drawer_turn", (msgData) => {
                setCurrentDrawer(msgData.currentDrawer);
                setSessionPoints(msgData.sessionPoints);
                setIsWordWasSet(false);
                setImg64BaseSrc(null)
            })

            socketRef.current.on("guesser_turn", (msgData) => {
                setWordToGuess(msgData.wordToDraw); // msg.wordToDraw is the word that the drawer draw according to the current base64 img
                setWordLevel(msgData.wordLevel);
                setImg64BaseSrc(msgData.image);
            })

            socketRef.current.on("other_user_disconnected", (msgData) => {
                console.log(`Is game started: ${msgData.isGameStarted}`)
                setIsGameStarted(msgData.isGameStarted);
                setSessionPoints(msgData.sessionPoints)
            })


            return () => socketRef.current.disconnect()
        }, []
    )

    const renderWelcomeView = () => {
        return (
            <div>
                {!isGameStarted &&
                    <div className="welcome-view-container">
                        {/*<h2> Welcome View</h2>*/}
                        <h2> Welcome To Draw and Guess</h2>
                        <h3>Waiting for other player to join...</h3>
                    </div>
                }
            </div>
        )
    }

    const renderWaitingView = () => {
        return (
            <div>
                <h2> Waiting View :</h2>
                <h2> Waiting to drawer to send his picture... :</h2>
            </div>
        )
    }

    const renderChoosingView = () => {
        let easyWord = randomWords();
        let mediumWord = randomWords();
        let hardWord = randomWords();
        return (
            <div className="choosing-buttons">
                <h2> Choosing view (Drawer)</h2>
                <button onClick={() => onClickWordFunc(easyWord, "easy")}>Easy: {easyWord}</button>
                <button onClick={() => onClickWordFunc(mediumWord, "medium")}>Medium: {mediumWord}</button>
                <button onClick={() => onClickWordFunc(hardWord, "hard")}>Hard: {hardWord}</button>
            </div>
        )
    }

    const renderDrawingView = () => {
        return (
            <div>.
                {playerID === currentDrawer && <h2> Drawing View :</h2>}
                {isWordWasSet && <h1 className="try-to-draw"> Please draw: {wordToDraw}</h1>}
                <SketchCanvas wordToDraw={wordToDraw} socketRef={socketRef} wordLevel={wordLevel}/>
            </div>
        )
    }

    const renderGuessingView = () => {
        return (
            <div className="guessing-view">
                <h2> Guessing View :</h2>
                <img src={img64BaseSrc} alt={null}/>
                <TextField id="guess-input-id" name="guess-input"
                           onChange={(e) => onTextChange(e)} label="Guess here:"/>
                <button onClick={onGuessSubmit}>Send your Guess!</button>
            </div>
        )
    }

    let inputWord;
    const onTextChange = (e) => {
        inputWord = e.target.value;
        e.preventDefault();
    }

    const onGuessSubmit = () => {
        if (wordToGuess === inputWord) {
            let totalSessionPoints = sessionPoints + pointsDictionary[wordLevel];
            alert(`you have earned ${pointsDictionary[wordLevel]} points!`);
            socketRef.current.emit("guesser_turn_finished", {totalSessionPoints: totalSessionPoints})
            setSessionPoints(totalSessionPoints);
        } else {
            alert("Wrong guess... Please try again");
            inputWord = "";
            document.getElementById("guess-input-id").value = inputWord;
        }
    }

    const onClickWordFunc = (word, wordLevel) => {
        setWordToDraw(word)
        setWordLevel(wordLevel);
        setIsWordWasSet(true);
    }
    const backgroundImageUrl = "https://media.istockphoto.com/vectors/vector-kids-drawing-border-frame-background-vector-id1304010646?k=20&m=1304010646&s=612x612&w=0&h=-eWEZXxUjCjzGHKQF1Nvyax9gy25zciq9tbocmqXhUc="
    const myStyle = {
        backgroundImage: `url(${backgroundImageUrl})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        width: '100vw',
        height: '100vh',
        fontSize: '55px',

    };

    return (
        <div className="title" style={myStyle}>
            <h1> DRAW & GUESS </h1>

            {!isGameStarted && renderWelcomeView()}
            {isGameStarted && playerID === currentDrawer && !isWordWasSet && renderChoosingView()}
            {isGameStarted && playerID === currentDrawer && isWordWasSet && renderDrawingView()}
            {isGameStarted && playerID !== currentDrawer && img64BaseSrc && renderGuessingView()}
            {isGameStarted && playerID !== currentDrawer && !img64BaseSrc && renderWaitingView()}

            <h2 className="session-points"> Session Points: {sessionPoints} </h2>
        </div>
    )
}

export default App;


