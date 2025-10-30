from django.core.management.base import BaseCommand
import requests
from chess.models import Game
import datetime

class Command(BaseCommand):
    help = 'Fetch latest games from Chess.com API'

    def handle(self, *args, **kwargs):
        username = "kris_lemon"
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
            latest_months = archives[-3:]
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

                for g in games_data:
                    if g["white"]["username"] == "Kris_Lemon":
                        kris_colour = "white"
                        opp_colour = "black"
                        opener = g["eco"].split('/')[-1].replace('-', ' ')
                    else:
                        kris_colour = "black"
                        opp_colour = "white"
                        opener = ""
                    Game.objects.get_or_create(
                        chesscom_id=g["url"].split("/")[-1],
                        date=datetime.datetime.fromtimestamp(g["end_time"]).date(),
                        white_player=g["white"]["username"],
                        black_player=g["black"]["username"],
                        kris_rating=g[kris_colour]["rating"],
                        opp_rating=g[opp_colour]["rating"],
                        kris_result=g[kris_colour]["result"],
                        opp_result = g[opp_colour]["result"],
                        time_control=g["time_control"],
                        pgn=g["pgn"],
                        opening=opener
                    )
                self.stdout.write(self.style.SUCCESS('Games fetched successfully!'))

