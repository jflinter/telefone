import Image from "next/image";
import { useState } from "react";

const MAX_MOVES = 10;

type Game = {
  playerNames: string[];
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
  const [splash, setSplash] = useState<boolean>(false);
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
        <h1 className="text-4xl font-bold">Telefone</h1>
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
      <h1 className="text-4xl font-bold">Telefone</h1>
      <div>
        <ul>
          {names.map((name, index) => (
            <li key={index}>{name}</li>
          ))}
        </ul>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Enter a name"
        />
        <button onClick={handleAddName}>Add Name</button>
        <button
          onClick={() => onStarted(shuffleArray(names))}
          disabled={names.length < 2}
        >
          Done
        </button>
      </div>
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
          OK, pass the fone to {playerName}! {playerName}, hit Ready when
          you&apos;ve got the fone!
        </h1>
        <button
          className="px-4 py-2 text-lg font-bold text-white bg-blue-500 rounded-lg"
          onClick={() => setSplash(false)}
        ></button>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
      <h1 className="text-4xl font-bold">
        OK {playerName}, describe a scene. Adding details about both style and
        content will help create a rich image, but do whatever you want!
        Examples (it&apos;s ok to go longer):
      </h1>
      <ul>
        {examples.map((example) => (
          <li key={example}>{example}</li>
        ))}
      </ul>
      <input
        type="text"
        placeholder="Enter a caption"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <button
        className="px-4 py-2 text-lg font-bold text-white bg-blue-500 rounded-lg"
        onClick={() => onCaption(caption)}
        disabled={caption.trim() === ""}
      ></button>
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
          OK, pass the fone to {playerName}! {playerName}, hit Ready when
          you&apos;ve got the fone!
        </h1>
        <button
          className="px-4 py-2 text-lg font-bold text-white bg-blue-500 rounded-lg"
          onClick={() => setSplash(false)}
        ></button>
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
      <h1 className="text-4xl font-bold">
        {playerName}, what&apos;s the caption for this image?
      </h1>
      <Image src={imageUrl} alt="Telefone" />
      <input
        type="text"
        placeholder="Enter a caption"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
      />
      <button
        className="px-4 py-2 text-lg font-bold text-white bg-blue-500 rounded-lg"
        onClick={() => onCaption(caption)}
        disabled={caption.trim() === ""}
      ></button>
    </div>
  );
};

export default function Home() {
  const [game, setGame] = useState<Game | null>(null);
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

  if (moves.length === 0) {
    return (
      <InitialTurnScreen
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
          generateImageUrl(caption).then((imageUrl) => {
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
          });
        }}
      />
    );
  }

  if (moves.length >= MAX_MOVES) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
        <h1 className="text-4xl font-bold">Game Over!</h1>
        <ul>
          {moves.map((move) => (
            <li key={move.id}>
              {move.playerName}: {move.caption}
              {move.imageUrl && (
                <Image src={move.imageUrl} alt={move.caption} />
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
        generateImageUrl(caption).then((imageUrl) => {
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
        });
      }}
    />
  );
}
