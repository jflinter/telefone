/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

const MAX_MOVES = 8;

type Game = {
  playerNames: string[];
  statusOverride: "gameOver" | null;
  moves: {
    id: string;
    playerName: string;
    caption: string;
    imageUrl: string | null;
  }[];
};

async function generateImageUrl(caption: string): Promise<string> {
  const response = await fetch("/api/images", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ caption }),
  });
  const { imageUrl } = await response.json();
  return imageUrl;
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
        <button
          className="px-4 py-2 text-lg font-bold text-white bg-blue-500 rounded-lg"
          onClick={() => setSplash(false)}
        >
          Start
        </button>
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
        <button
          className="px-4 py-2 text-lg font-bold text-white bg-blue-500 rounded-lg"
          onClick={() => setSplash(false)}
        >
          Ready
        </button>
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
      <button
        className="px-4 py-2 text-lg font-bold text-white bg-blue-500 rounded-lg"
        onClick={() => onCaption(caption)}
        disabled={caption.trim() === ""}
      >
        Done
      </button>
    </div>
  );
};

const NotInitialTurnScreen: React.FC<{
  playerName: string;
  imageUrl: string | null;
  onCaption: (caption: string) => void;
}> = ({ playerName, imageUrl, onCaption }) => {
  const [splash, setSplash] = useState<boolean>(true);
  const [caption, setCaption] = useState<string>("");
  if (splash) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
        <h1 className="text-4xl font-bold">
          OK, pass the telefone to {playerName}! {playerName}, hit Ready when
          you&apos;ve got the telefone!
        </h1>
        <button
          className="px-4 py-2 text-lg font-bold text-white bg-blue-500 rounded-lg"
          onClick={() => setSplash(false)}
        >
          Ready
        </button>
      </div>
    );
  }
  if (!imageUrl) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
        <h1 className="text-4xl font-bold">
          Waiting for image (this will just be a second)...
        </h1>
      </div>
    );
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
      <button
        className="px-4 py-2 text-lg font-bold text-white bg-blue-500 rounded-lg"
        onClick={() => onCaption(caption)}
        disabled={caption.trim() === ""}
      >
        Done
      </button>
    </div>
  );
};

export default function Home() {
  const [game, setGame] = useState<Game | null>(null);
  if (game === null) {
    return (
      <StartScreen
        onStarted={(playerNames) =>
          setGame({ playerNames, moves: [], statusOverride: null })
        }
      />
    );
  }
  const { playerNames, moves } = game;
  const currentPlayerIndex = moves.length % playerNames.length;
  const currentPlayer = playerNames[currentPlayerIndex];

  if (moves.length === 0) {
    return (
      <InitialTurnScreen
        key={moves.length}
        playerName={currentPlayer}
        onCaption={(caption) => {
          const id = makeid();
          setGame({
            ...game,
            moves: [
              ...moves,
              {
                id,
                playerName: currentPlayer,
                caption,
                imageUrl: null,
              },
            ],
          });
          generateImageUrl(caption)
            .then((imageUrl) => {
              setGame((game) => {
                if (!game) return game;
                return {
                  ...game,
                  moves: game.moves.map((move) => {
                    if (move.id === id) {
                      move.imageUrl = imageUrl;
                    }
                    return move;
                  }),
                };
              });
            })
            .catch((error) => {
              setGame((game) => {
                if (!game) return game;
                return { ...game, statusOverride: "gameOver" };
              });
            });
        }}
      />
    );
  }

  const maxMoves = Math.max(playerNames.length, MAX_MOVES);
  if (moves.length >= maxMoves || game.statusOverride === "gameOver") {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
        <h1 className="text-4xl font-bold">Game Over!</h1>
        <ul>
          {moves.map((move) => (
            <li key={move.id}>
              {move.playerName}: {move.caption}
              {move.imageUrl && (
                <img
                  src={move.imageUrl}
                  alt={move.caption}
                  width={500}
                  height={500}
                />
              )}
            </li>
          ))}
        </ul>
        <button onClick={() => setGame(null)}>Play Again (same players)</button>
        <button
          onClick={() =>
            setGame({
              playerNames: shuffleArray(playerNames),
              moves: [],
              statusOverride: null,
            })
          }
        >
          Play Again (new players)
        </button>
      </div>
    );
  }

  return (
    <NotInitialTurnScreen
      key={moves.length}
      playerName={currentPlayer}
      imageUrl={moves[moves.length - 1].imageUrl}
      onCaption={(caption) => {
        const id = makeid();
        setGame({
          ...game,
          moves: [
            ...moves,
            {
              id,
              playerName: currentPlayer,
              caption,
              imageUrl: null,
            },
          ],
        });
        generateImageUrl(caption)
          .then((imageUrl) => {
            setGame((game) => {
              if (!game) return game;
              return {
                ...game,
                moves: game.moves.map((move) => {
                  if (move.id === id) {
                    move.imageUrl = imageUrl;
                  }
                  return move;
                }),
              };
            });
          })
          .catch((error) => {
            setGame((game) => {
              if (!game) return game;
              return { ...game, statusOverride: "gameOver" };
            });
          });
      }}
    />
  );
}
