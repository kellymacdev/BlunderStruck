from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render, redirect
from django.urls import reverse
from django import forms
from django.utils.functional import empty
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics
from chess.models import Game
from chess.serializers import GameSerializer
from django.core.serializers.json import DjangoJSONEncoder
import json
from datetime import timedelta, date
from collections import Counter

class GameListAPI(generics.ListAPIView):
    queryset = Game.objects.all().order_by('-date')
    serializer_class = GameSerializer

def index(request):
    all_games = Game.objects.filter(opp_result="win").order_by('-date')
    most_recent_loss = all_games[0]
    return render(request, "chess/index2.html",{
        "most_recent_loss": most_recent_loss,
    })

def monthly_games(request, yearmonth):
    month_list = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    month = int(yearmonth[4:6])
    year = int(yearmonth[0:4])
    month_name = month_list[month - 1]
    all_games = Game.objects.filter(date__year=year, date__month=month).order_by('date')
    openings = [g.opening for g in all_games if g.opening!=""]
    opening_counts = Counter(openings)
    opening_counts = dict(opening_counts)
    filtered_openings = {k: v for k, v in opening_counts.items() if v >= 2}
    print(opening_counts)
    start_date = all_games.first().date
    end_date = all_games.last().date

    all_days = [(start_date + timedelta(days=i)).strftime('%Y-%m-%d')
                for i in range((end_date - start_date).days + 1)]

    # Build a mapping for ratings per day
    rating_map = {g.date.strftime('%Y-%m-%d'): g.kris_rating for g in all_games}

    dates = []
    ratings = []
    prev_rating = None
    for day in all_days:
        rating = rating_map.get(day, prev_rating)
        if rating is not None:
            prev_rating = rating  # carry forward
        dates.append(day)
        ratings.append(prev_rating)

    num_games = len(all_games)
    wins = 0
    losses = 0
    draws = 0
    resigned = 0
    checkmated = 0
    opp_resigned = 0
    opp_checkmated = 0
    for game in all_games:
        if game.kris_result == 'win':
            wins += 1
            if game.opp_result == 'resigned':
                opp_resigned += 1
            elif game.opp_result == 'checkmated':
                opp_checkmated += 1
        elif game.kris_result == 'draw':
            draws += 1
        else:
            losses += 1
            if game.kris_result == 'resigned':
                resigned += 1
            elif game.kris_result == 'checkmated':
                checkmated += 1

    elo_change = ratings[-1] - ratings[0]
    return render(request, "chess/monthly_games.html", {
        "month_name": month_name,
        "num_games": num_games,
        "wins": wins,
        "losses": losses,
        "draws": draws,
        "win_rate": round(wins*100/num_games, 2),
        "resigned": resigned,
        "checkmated": checkmated,
        "opp_resigned": opp_resigned,
        "opp_checkmated": opp_checkmated,
        "elo_change": elo_change,
        "openings": json.dumps(filtered_openings),
        'chart_data': json.dumps({
            'dates': dates,
            'ratings': ratings,
        }, cls=DjangoJSONEncoder)
    })



