from django.shortcuts import render
import requests
from django.http import JsonResponse

def fetch_recent_games(request):
    """
    Proxy endpoint to fetch the most recent months of games for a given username.
    Example: /api/games?username=Kris_Lemon&months=1
    """
    username = request.GET.get('username')
    months_back = int(request.GET.get('months'))

    headers = {
        "User-Agent": "MyChessApp/1.0 (https://yourwebsite.com)"
    }
    # Fetch archives
    archives_url = f"https://api.chess.com/pub/player/{username}/games/archives"
    response = requests.get(archives_url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to fetch archives: {response.status_code}")
        archives = []
    else:
        try:
            archives = response.json().get("archives", [])
        except ValueError as e:
            print(f"JSON decode error on archives: {e}")
            archives = []

    # Fetch latest month
    if archives:
        recent_games = []
        latest_months = archives[-months_back:]
        for month_url in latest_months:
            response = requests.get(month_url, headers=headers)
            if response.status_code != 200:
                print(f"Failed to fetch games for {month_url}: {response.status_code}")
                games_data = []
            else:
                try:
                    games_data = response.json().get("games", [])
                except ValueError as e:
                    print(f"JSON decode error on monthly games: {e}")
                    games_data = []
            recent_games.append(games_data)
    return JsonResponse({"games": recent_games})

def fetch_month_games(request):
    """
        Proxy endpoint to fetch the most recent months of games for a given username.
        Example: /api/games?username=Kris_Lemon&months=1
        """
    username = request.GET.get('username')
    year = int(request.GET.get('year'))
    month = int(request.GET.get('month'))

    headers = {
        "User-Agent": "MyChessApp/1.0 (https://yourwebsite.com)"
    }
    # Fetch archives
    archives_url = f"https://api.chess.com/pub/player/{username}/games/archives"
    response = requests.get(archives_url, headers=headers)
    if response.status_code != 200:
        print(f"Failed to fetch archives: {response.status_code}")
        archives = []
    else:
        try:
            archives = response.json().get("archives", [])
        except ValueError as e:
            print(f"JSON decode error on archives: {e}")
            archives = []

    # Fetch requested month
    if archives:
        month_str = f"{int(month):02d}"
        target = f"{year}/{month_str}"
        games_data = []
        for url in archives:
            if url.endswith(target):
                month_url= url
                response = requests.get(month_url, headers=headers)
                if response.status_code != 200:
                    print(f"Failed to fetch games for {month_url}: {response.status_code}")
                    games_data = []
                else:
                    try:
                        games_data = response.json().get("games", [])
                    except ValueError as e:
                        print(f"JSON decode error on monthly games: {e}")
                        games_data = []
                break
        if games_data is None:
            print("no data for that month")
    else:
        games_data = []
    return JsonResponse({"games": games_data})


def index(request):
    return render(request, 'chess/index.html')
