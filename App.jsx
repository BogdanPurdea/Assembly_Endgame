import { clsx } from "clsx";
import { useState } from "react";
import { languages } from "./languages";
import { getRandomWord, getFarewellText, formatTime } from "./utils";
import { useCountdown } from "./useCountdown";
import { useWindowSize } from 'react-use';
import Confetti from 'react-confetti';

export default function App() {
    //State variables
    const [currentWord, setCurrentWord] = useState(() => getRandomWord());
    const [guessedLetters, setGuessedLetters] = useState([]);
    const [farewellMessage, setFarewellMessage] = useState(getFarewellText(languages[0].name));
    
    //Custom hook to handle a countdown
    const { timeLeft, isRunning, startTimer, stopTimer, resetTimer } = useCountdown(120);

    //Derived variables
    const totalGuesses = languages.length - 1;
    const wrongGuessCount = guessedLetters.reduce((count, letter) => {
        if (!currentWord.includes(letter)) {
            count = count + 1
        }
        return count
    }, 0)
    const numGuessesLeft = totalGuesses - wrongGuessCount;
    const isGameWon = currentWord.split('').every(letter => guessedLetters.includes(letter));
    const isGameLost = wrongGuessCount >= totalGuesses || timeLeft === 0;
    const isGameOver = isGameWon || isGameLost;

    const lastGuess = guessedLetters[guessedLetters.length - 1]
    const isLastGuessWrong = lastGuess && !currentWord.includes(lastGuess)
    if (isGameOver && isRunning) stopTimer();

    //Constant variables
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    const { width, height } = useWindowSize();

    const languageChips = languages.map((language, index) => {
        const isLost = index < wrongGuessCount
        const style = {
            backgroundColor: language.backgroundColor,
            color: language.color
        }
        const className = clsx("chip", isLost && "lost")
        return (
            <span key={index} style={style} className={className}>{language.name}</span>
        )
    })

    const wordLetters = currentWord.split('').map((letter, index) => {
        const shouldRevealLetter = isGameLost || guessedLetters.includes(letter);
        const className = clsx(
            isGameLost && !guessedLetters.includes(letter) && "missed-letter"
        )
        return (
            <span key={index} className={className}>{shouldRevealLetter ? letter.toUpperCase() : ""}</span>
        )
    })
    function addGuessedLetter(letter) {
        setGuessedLetters(prev => prev.includes(letter) ? prev : [...prev, letter])
    }
    function handleKeyboardClick(letter) {
        addGuessedLetter(letter);
        if (!isRunning) startTimer();
        if (!isGameOver && isLastGuessWrong) {
            setFarewellMessage(getFarewellText(languages[wrongGuessCount].name));
        }
    }
    const keyboardButtons = alphabet.split('').map(letter => {
        const isGuessed = guessedLetters.includes(letter)
        const isRight = isGuessed && currentWord.includes(letter)
        const isWrong = isGuessed && !currentWord.includes(letter)
        const className = clsx({
            correct: isRight,
            wrong: isWrong
        })
        return (
            <button
                key={letter}
                disabled={isGameOver || guessedLetters.includes(letter)}
                className={className}
                onClick={() => handleKeyboardClick(letter)}
                aria-disabled={guessedLetters.includes(letter)}
                aria-label={`Letter ${letter}`}>
                {letter.toUpperCase()}
            </button>
        )
    }
    );

    function startNewGame() {
        setCurrentWord(getRandomWord());
        setGuessedLetters([]);
        resetTimer();
    }

    const gameStatusClassName = clsx("game-status", {
        won: isGameWon,
        lost: isGameLost,
        farewell: !isGameOver && isLastGuessWrong
    })

    function renderGameStatus() {
        if (!isGameOver && isLastGuessWrong) {
            return (
                <p className="farewell-message">{farewellMessage}</p>
            )
        }
        if (isGameWon) {
            return (
                <>
                    <h2>You win!</h2>
                    <p>Well done! 🎉</p>
                </>
            )

        }
        if (isGameLost) {
            return (
                <>
                    <h2>Game over!</h2>
                    <p>You lose! Better start learning Assembly 😭</p>
                </>
            )
        }
        return null;
    }


    return (
        <main>
            {isGameWon && <Confetti
                width={width}
                height={height}
                recycle={false}
                numberOfPieces={1000}
            />}
            <header>
                <h1>Assembly: Endgame</h1>
                <p>Guess the word within 8 attempts to keep the programming world safe from Assembly!</p>
            </header>
            <div>{timeLeft === 0 ? "Time's Up!" : formatTime(timeLeft)}</div>
            <section
                aria-live="polite"
                role="status"
                className={gameStatusClassName}
            >
                {renderGameStatus()}
            </section>
            <section className="language-chips">
                {languageChips}
            </section>

            <section className="word">
                {wordLetters}
            </section>
            <p>{isGameWon ? `You guessed the word with ${numGuessesLeft} attempts left.` : `You have ${numGuessesLeft} attempts left.`}</p>
            <section
                className="sr-only"
                aria-live="polite"
                role="status"
            >
                <p>
                    {currentWord.includes(lastGuess) ?
                        `Correct! The letter ${lastGuess} is in the word.` :
                        `Sorry, the letter ${lastGuess} is not in the word.`
                    }
                    You have {numGuessesLeft} attempts left.
                </p>
                <p>Current word: {currentWord.split("").map(letter =>
                    guessedLetters.includes(letter) ? letter + "." : "blank.")
                    .join(" ")}</p>

            </section>
            <section className="keyboard">
                {keyboardButtons}
            </section>
            {isGameOver && <button className="new-game" onClick={startNewGame}>New game</button>}
        </main>
    );
}