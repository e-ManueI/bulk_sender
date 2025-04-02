import pika
import time
import json
from django.core.mail import send_mail

def connect_with_retry(max_retries=10, delay=10):
    retries = 0
    while retries < max_retries:
        try:
            connection = pika.BlockingConnection(pika.ConnectionParameters('rabbitmq'))
            print("Connected to RabbitMQ successfully!")
            return connection
        except Exception as e:
            retries += 1
            print(f"Connection failed, retrying {retries}/{max_retries}... ({e})")
            time.sleep(delay)
    raise Exception("Failed to connect to RabbitMQ after retries")

def email_worker():
    connection = connect_with_retry()
    channel = connection.channel()
    channel.queue_declare(queue='email_queue', durable=True)
    
    def callback(ch, method, properties, body):
        try:
            data = json.loads(body.decode())
            name = data['name']
            email = data['email']
            message = data['message']
            
            # Attempt to send the email
            send_mail(
                subject=f'Hello {name}',
                message=message,
                from_email='manueltylan@gmail.com',
                recipient_list=[email],
                fail_silently=False,
            )
            time.sleep(1)  # Rate limit to one email per second
            ch.basic_ack(delivery_tag=method.delivery_tag)  # Acknowledge on success
        except Exception as e:
            print(f'Error processing message: {e}')
            # Reject and requeue the message for retry
            ch.basic_reject(delivery_tag=method.delivery_tag, requeue=True)
            # Optional: Add a small delay to avoid rapid reprocessing
            time.sleep(1)

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue='email_queue', on_message_callback=callback)
    channel.start_consuming()

if __name__ == "__main__":
    email_worker()