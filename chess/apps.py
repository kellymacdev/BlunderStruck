from django.apps import AppConfig
import threading

class GamesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chess'

    def ready(self):
        # Avoid running multiple times (development reloads)
        import os
        if os.environ.get('RUN_MAIN') != 'true':
            return

        from chess.management.commands.fetch_chess_data import Command
        # Run in a thread so it doesn’t block server start
        threading.Thread(target=Command().handle).start()