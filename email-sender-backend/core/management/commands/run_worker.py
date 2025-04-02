from django.core.management.base import BaseCommand
from email_sender_backend.worker import email_worker

class Command(BaseCommand):
    help = 'Runs the email worker to process the RabbitMQ queue'

    def handle(self, *args, **options):
        self.stdout.write("Starting email worker...")
        email_worker()