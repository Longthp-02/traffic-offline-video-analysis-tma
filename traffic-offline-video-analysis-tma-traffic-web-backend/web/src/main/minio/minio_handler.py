import random
from datetime import datetime, timedelta
import json
from minio import Minio
from fastapi.encoders import jsonable_encoder
import json
from typing import Dict

class MinioHandler():
    __instance = None

    @staticmethod
    def get_instance():
        """ Static access method. """
        if not MinioHandler.__instance:
            MinioHandler.__instance = MinioHandler()
        return MinioHandler.__instance

    def __init__(self):
        self.minio_url = 'localhost:9000'
        self.access_key = 'minioadmin'
        self.secret_key = 'minioadmin'
        self.bucket_name = 'fastapi-minio'
        self.client = Minio(
            self.minio_url,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=False,
        )
        self.make_bucket()

    def make_bucket(self) -> str:
        if not self.client.bucket_exists(self.bucket_name):
            self.client.make_bucket(self.bucket_name)
        return self.bucket_name

    def presigned_get_object(self, bucket_name, object_name):
        # Request URL expired after 7 days
        url = self.client.presigned_get_object(
            bucket_name=bucket_name,
            object_name=object_name,
            expires=timedelta(days=7)
        )
        return url

    def check_file_name_exists(self, bucket_name, file_name):
        try:
            self.client.stat_object(bucket_name=bucket_name, object_name=file_name)
            return True
        except Exception as e:
            print(f'[x] Exception: {e}')
            return False

    def put_object(self, file_data, file_name, content_type,metadata):
        try:
            object_name = f"{file_name}"
            while self.check_file_name_exists(bucket_name=self.bucket_name, file_name=object_name):
                 random_prefix = random.randint(1, 1000)
                 object_name = f"{file_name}_{random_prefix}"
            
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                data=file_data,
                content_type=content_type,
                length=-1,
                part_size=10 * 1024 * 1024, # Add metadata here,
                metadata=metadata
            )
            
            url = self.presigned_get_object(bucket_name=self.bucket_name, object_name=object_name)
            data_file = {
                'bucket_name': self.bucket_name,
                'file_name': object_name,
                'url': url
            }
            return data_file
        except Exception as e:
            raise Exception(e)

    def get_objects_with_prefix(self, prefix):
        objects = self.client.list_objects(self.bucket_name, prefix=prefix, recursive=True)
        file_list = []
        for obj in objects:
            # Fetch metadata for the current object
            metadata = self.client.stat_object(self.bucket_name, obj.object_name).metadata
            metadata_dict = {k.replace('x-amz-meta-', ''): v for k, v in metadata.items()}

            
            url = self.presigned_get_object(bucket_name=self.bucket_name, object_name=obj.object_name)
            file_info = {
                'file_name': obj.object_name,
                'url': url,
                'VehicleType': metadata_dict["vehicle"],
                'timestamp': metadata_dict["timestamp"], 
                'id': metadata_dict["id"], 
                'license_plate':metadata_dict["license-plate"]
                # 'video_name':metadata_dict["video_name"]
            }
            file_list.append(file_info)
        return json.dumps(file_list, indent=4)
    def check_file_prefix_exists(self, prefix):
        objects = self.client.list_objects(self.bucket_name, prefix=prefix, recursive=True)
        return len(list(objects)) > 0