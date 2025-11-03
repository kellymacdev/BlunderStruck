from django.urls import path

from chess import views



urlpatterns = [
    path("", views.index, name="index"),
    path("<str:username>", views.index, name="index"),
    path('api/games/', views.fetch_recent_games, name='fetch_recent_games'),
    path('api/month/', views.fetch_month_games, name='fetch_month_games'),
]