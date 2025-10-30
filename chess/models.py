from django.db import models

class Game(models.Model):
    chesscom_id = models.CharField(max_length=50, unique=True)
    date = models.DateField()
    white_player = models.CharField(max_length=50)
    black_player = models.CharField(max_length=50)
    kris_rating = models.IntegerField()
    opp_rating = models.IntegerField()
    kris_result = models.CharField(max_length=10)  # "win", "loss", "draw"
    opp_result = models.CharField(max_length=10)
    time_control = models.CharField(max_length=20)
    pgn = models.TextField()
    opening = models.CharField(max_length=100, blank=True)