import pika
import json
from django.http import JsonResponse
from django.views import View
import pandas as pd
from rest_framework.views import APIView

class UploadExcelView(APIView):
    def post(self, request):
        try:
            file = request.FILES['file']
            df = pd.read_excel(file)
            # Validate required columns
            required_columns = {'name', 'email', 'message'}
            if not required_columns.issubset(df.columns):
                return JsonResponse({'status': 'error', 'message': 'Missing required columns'}, status=400)
            
            connection = pika.BlockingConnection(pika.ConnectionParameters('rabbitmq'))
            channel = connection.channel()
            channel.queue_declare(queue='email_queue', durable=True)
            
            for index, row in df.iterrows():
                data = {
                    'name': str(row['name']),
                    'email': str(row['email']),
                    'message': str(row['message'])
                }
                message = json.dumps(data)
                channel.basic_publish(
                    exchange='',
                    routing_key='email_queue',
                    body=message.encode(),
                    properties=pika.BasicProperties(delivery_mode=2)  # Persistent messages
                )
            connection.close()
            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)