import json

# Load JSON data from a file or string
with open("hikaru09.json", "r") as f:
    data = json.load(f)

games = data.get("games", [])

# Iterate over all games
for i, game in enumerate(games, start=1):
    if game.get("rated") is True:
        if "eco" in game and game["eco"]:
           continue
        else:
            print(f"Game {i} eco: {game}")
            break