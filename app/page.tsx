/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import html2canvas from "html2canvas";

const MAX_MOVES = 8;

function convertImageToDataUrl(imgElement: HTMLImageElement): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create an off-screen canvas
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Set canvas dimensions
    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;

    // Draw the image on canvas
    ctx?.drawImage(imgElement, 0, 0);

    // Convert canvas to Data URL
    resolve(canvas.toDataURL("image/png"));
  });
}

async function convertImagesToDataUrls(parentElement: HTMLElement) {
  const images = parentElement.getElementsByTagName("img");
  Array.from(images).forEach(async (img) => {
    if (!img.src.startsWith("data:")) {
      // Check if not already a Data URL
      try {
        const dataUrl = await convertImageToDataUrl(img);
        img.src = dataUrl;
      } catch (error) {
        console.error("Error converting image to data URL:", error);
      }
    }
  });
}

const exportPDF = () => {
  const divElement = document.getElementById("game-contents");
  if (divElement) {
    html2canvas(divElement, { scale: 1, useCORS: true }).then((canvas) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "screenshot.png", {
            type: "image/png",
          });

          // Attempt to share using the Web Share API
          if (navigator.share) {
            navigator
              .share({
                title: "Telefone!",
                files: [file],
              })
              .then(() => {
                console.log("Shared successfully!");
              })
              .catch((error) => {
                console.error("Error sharing:", error);
              });
          } else {
            console.error("Web Share API is not supported.");
          }
        }
      }, "image/png");
    });
  }
};

type Game = {
  playerNames: string[];
  moves: {
    id: string;
    playerName: string;
    caption: string;
    imageUrl: string | null;
    error: unknown | null;
  }[];
};

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Error reading localStorage key:", key, error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error("Error setting localStorage key:", key, error);
    }
  };

  const removeValue = () => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error("Error removing localStorage key:", key, error);
    }
  };

  React.useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        setStoredValue(
          event.newValue ? JSON.parse(event.newValue) : initialValue
        );
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

async function getFirstSuccessful<ResultType>(
  promise1: Promise<ResultType>,
  promise2: Promise<ResultType>
): Promise<ResultType> {
  const [result1, result2] = await Promise.all([
    promise1
      .then((value) => ({ status: "fulfilled" as const, value }))
      .catch((error) => ({ status: "rejected" as const, error })),
    promise2
      .then((value) => ({ status: "fulfilled" as const, value }))
      .catch((error) => ({ status: "rejected" as const, error })),
  ]);

  if (result1.status === "fulfilled") {
    return result1.value;
  } else if (result2.status === "fulfilled") {
    return result2.value;
  } else {
    throw new Error("Both promises failed");
  }
}

async function generateDalleImageUrl(caption: string): Promise<string> {
  const response = await fetch("/api/dalle", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ caption }),
  });
  const { imageUrl } = await response.json();
  return imageUrl;
}

async function generateStableDiffusionImageUrl(
  caption: string
): Promise<string> {
  const response = await fetch("/api/stablediffusion", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ caption }),
  });
  const { imageUrl } = await response.json();
  return imageUrl;
}

async function generateImageUrl(caption: string): Promise<string> {
  return getFirstSuccessful(
    generateDalleImageUrl(caption),
    generateStableDiffusionImageUrl(caption)
  );
}

function shuffleArray<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Swap elements
  }
  return array;
}

function makeid() {
  const length = 5;
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

const Button: React.FC<{
  onClick: () => void;
  title: string;
  disabled?: boolean;
}> = ({ onClick, title, disabled = false }) => (
  <button
    className="px-4 py-2 text-lg font-bold text-white bg-blue-500 rounded-lg"
    onClick={onClick}
    disabled={disabled}
  >
    {title}
  </button>
);

const StartScreen: React.FC<{ onStarted: (playerNames: string[]) => void }> = ({
  onStarted,
}) => {
  const [splash, setSplash] = useState<boolean>(true);
  const [names, setNames] = useState<string[]>([]);
  const [newName, setNewName] = useState("");

  const handleAddName = () => {
    if (newName.trim() !== "") {
      setNames([...names, newName.trim()]);
      setNewName("");
    }
  };

  if (splash) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
        <h1 className="text-4xl font-bold">Telefone!</h1>
        <Button onClick={() => setSplash(false)} title="Start" />
      </div>
    );
  }
  return (
    // UI to enter a list of player names
    <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
      <h1 className="text-4xl font-bold">Who is playing?</h1>
      <ul>
        {names.map((name, index) => (
          <li key={index}>{name}</li>
        ))}
      </ul>
      <div className="flex gap-2">
        <input
          className="border-2 border-black rounded-lg px-2 py-1 text-black"
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          // @ts-expect-error
          enterKeyHint="Add"
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              !event.shiftKey &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault();
              handleAddName();
            }
          }}
          placeholder="Enter a name"
        />
        <button
          className="px-2 py-1 text-md font-semibold text-white bg-blue-500 rounded-lg"
          onClick={handleAddName}
        >
          Add
        </button>
      </div>
      {names.length >= 2 && (
        <button
          className="px-4 py-2 text-lg font-bold text-white bg-blue-500 rounded-lg"
          onClick={() => onStarted(shuffleArray(names))}
        >
          Done
        </button>
      )}
    </div>
  );
};

const InitialTurnScreen: React.FC<{
  playerName: string;
  onCaption: (caption: string) => void;
}> = ({ playerName, onCaption }) => {
  const [splash, setSplash] = useState<boolean>(true);
  const [caption, setCaption] = useState<string>("");
  const examples = [
    '"A ham in a hammock"',
    '"Unattended children at a desert rave"',
    '"A meme about the phenomenon of being “so over” or things being “so back” in the painting style of Eugene Delacroix"',
    '"A fat throbbing mushroom with two grapes in a pouch beneath it"',
    '"A painting in the style of Edward hopper of an anthropomorphic hotdog who failed at being a boat captain so now he hangs out at the local bar by the dock, drinking and talking to anyone who will listen."',
    '"An image in the style of a cave painting describing the feeling of no longer being a girl, and now being a woman"',
    "Just look around you and describe exactly what you see, request it in the style of your favorite artist",
    "Imagine a core formative memory and describe it, request it in the style of your least favorite artist.",
    "A scene from your favorite movie rendered in the imagery of a different historical period",
  ];

  if (splash) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
        <h1 className="text-4xl font-bold">
          OK, pass the telefone to {playerName}! {playerName}, hit Ready when
          you&apos;re, you know, ready!
        </h1>
        <Button onClick={() => setSplash(false)} title="Ready" />
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
      <h1 className="text-4xl font-bold">OK {playerName}, describe a scene.</h1>
      <h2 className="text-2xl font-semibold">
        Adding details about both style and content can be funny, but do
        whatever you want! Examples (it&apos;s ok to go longer):
      </h2>
      <ul>
        {examples.map((example) => (
          <li key={example}>{example}</li>
        ))}
      </ul>
      <textarea
        rows={5}
        className="border-2 border-black rounded-lg px-2 py-1 text-black w-full"
        placeholder={`Get creative, ${playerName}`}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <Button
        onClick={() => onCaption(caption)}
        title="Done"
        disabled={caption.trim() === ""}
      />
    </div>
  );
};

const LoadingScreen = () => {
  const [counter, setCounter] = useState(0);
  useInterval(() => {
    setCounter((c) => c + 1);
  }, 1000);
  return (
    <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
      <h1 className="text-4xl font-bold">
        Waiting for image (this will just be a second){".".repeat(counter)}
      </h1>
    </div>
  );
};

const NotInitialTurnScreen: React.FC<{
  playerName: string;
  imageUrl: string | null;
  onCaption: (caption: string) => void;
  onEndGame: null | (() => void);
}> = ({ playerName, imageUrl, onCaption, onEndGame }) => {
  const [splash, setSplash] = useState<boolean>(true);
  const [caption, setCaption] = useState<string>("");
  if (splash) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
        <h2 className="text-2xl font-bold">
          OK, pass the telefone to {playerName}! {playerName}, hit Ready when
          you&apos;ve got the telefone!
        </h2>
        <Button onClick={() => setSplash(false)} title="Ready" />
        {onEndGame && (
          <>
            <h3 className="text-xl font-semibold">
              Or, if you&apos;re ready to end the game...
            </h3>
            <Button onClick={onEndGame} title="End the game!" />
          </>
        )}
      </div>
    );
  }
  if (!imageUrl) {
    return <LoadingScreen />;
  }
  return (
    <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
      <h1 className="text-4xl font-bold">{playerName}, describe this image?</h1>
      <h2 className="text-2xl font-semibold">
        Be as vague or as specific as you want. You can focus on the literal
        contents, the overall style, the way it makes you feel, or any
        combination of the above.
      </h2>
      <img src={imageUrl} alt="Telefone" width={500} height={500} />
      <textarea
        rows={5}
        className="border-2 border-black rounded-lg px-2 py-1 text-black w-full"
        placeholder={`Get creative, ${playerName}`}
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <Button
        onClick={() => onCaption(caption)}
        title="Done"
        disabled={caption.trim() === ""}
      />
    </div>
  );
};

export default function Home() {
  const [game, setGame] = useState<Game | null>(null);
  const [gameOver, setGameOver] = useState(false);
  if (game === null) {
    return (
      <StartScreen
        onStarted={(playerNames) => setGame({ playerNames, moves: [] })}
      />
    );
  }
  const { playerNames, moves } = game;
  const currentPlayerIndex = moves.length % playerNames.length;
  const currentPlayer = playerNames[currentPlayerIndex];

  const onCaption = (caption: string) => {
    const id = makeid();
    const temporaryGame = {
      ...game,
      moves: [
        ...moves,
        {
          id,
          playerName: currentPlayer,
          caption,
          imageUrl: null,
          error: null,
        },
      ],
    };
    setGame(temporaryGame);
    generateImageUrl(caption)
      .then((imageUrl) => {
        const newGame = {
          ...temporaryGame,
          moves: temporaryGame.moves.map((move) => {
            if (move.id === id) {
              move.imageUrl = imageUrl;
            }
            return move;
          }),
        };
        setGame(newGame);
      })
      .catch((error) => {
        setGame({
          ...temporaryGame,
          moves: temporaryGame.moves.map((move) => {
            if (move.id === id) {
              move.error = error;
            }
            return move;
          }),
        });
      });
  };

  if (moves.length === 0) {
    return (
      <InitialTurnScreen
        key={moves.length}
        playerName={currentPlayer}
        onCaption={onCaption}
      />
    );
  }

  if (gameOver) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
        <h1 className="text-4xl font-bold">Game Over!</h1>
        <div id="game-contents">
          <ul>
            {moves.map((move) => (
              <li key={move.id}>
                {move.playerName}: {move.caption}
                {move.error
                  ? "Sadly there was an error making this pic (sometimes the AI is cowardly) so we skipped it."
                  : ""}
                {move.imageUrl ? (
                  <img
                    src={move.imageUrl}
                    alt={move.caption}
                    width={500}
                    height={500}
                    className="mb-6"
                  />
                ) : (
                  "Image still loading :)"
                )}
              </li>
            ))}
          </ul>
        </div>
        <Button onClick={exportPDF} title="Share game" />
        <Button
          onClick={() => {
            setGame({
              playerNames: shuffleArray(playerNames),
              moves: [],
            });
            setGameOver(false);
          }}
          title="Play Again (same players)"
        />
        <Button
          onClick={() => {
            setGame(null);
            setGameOver(false);
          }}
          title="Play Again (new players)"
        />
      </div>
    );
  }

  let imageToUse = moves[moves.length - 1].imageUrl;
  if (moves[moves.length - 1].error) {
    imageToUse = moves[moves.length - 1].imageUrl;
  }
  const onEndGame = () => {
    setGameOver(true);
  };
  return (
    <NotInitialTurnScreen
      key={moves.length}
      playerName={currentPlayer}
      imageUrl={imageToUse}
      onCaption={onCaption}
      onEndGame={moves.length > 2 ? onEndGame : null}
    />
  );
}

function useInterval(
  callback: () => void,
  delay: number | null
): React.MutableRefObject<number | null> {
  const intervalRef = React.useRef<number | null>(null);
  const savedCallback = React.useRef<() => void>(callback);
  React.useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  React.useEffect(() => {
    const tick = () => savedCallback.current();
    if (typeof delay === "number") {
      intervalRef.current = window.setInterval(tick, delay);
      return () => window.clearInterval(intervalRef.current ?? undefined);
    }
  }, [delay]);
  return intervalRef;
}
