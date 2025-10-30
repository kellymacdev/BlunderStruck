import requests

username = "kris_lemon"
url = f"https://api.chess.com/pub/player/{username}/games/archives"

headers = {
    "User-Agent": "MyChessApp/1.0 (https://yourwebsite.com)"
}

response = requests.get(url, headers=headers)
print(response.status_code)
print(response.text[:200])  # print first 200 chars to see what you got

# Only parse JSON if status code is 200
if response.status_code == 200:
    data = response.json()
    archives = data["archives"]
else:
    print(f"Error fetching archives: {response.status_code}")
