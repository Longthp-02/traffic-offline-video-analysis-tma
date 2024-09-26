import uvicorn

from fastapi import FastAPI, Path, Query, HTTPException
from starlette.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from io import BytesIO
from fastapi import File, UploadFile, Path
from fastapi.responses import JSONResponse
from starlette.responses import StreamingResponse
from minio import Minio
from minio.error import S3Error
from minio_handler import MinioHandler
import base64
import json
import psycopg2
from typing import List
from typing import Optional

def get_application() -> FastAPI:
    application = FastAPI(
        title='FastAPI with Minio',
        description='Integrate FastAPI with Minio',
        openapi_url="/openapi.json",
        docs_url="/docs"
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=['*'],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return application


app = get_application()


@app.get('/', tags=[''])
def get():
    return 'Hello World'


class CustomException(Exception):
    http_code: int
    code: str
    message: str

    def __init__(self, http_code: int = None, code: str = None, message: str = None):
        self.http_code = http_code if http_code else 500
        self.code = code if code else str(self.http_code)
        self.message = message


class UploadFileResponse(BaseModel):
    bucket_name: str
    file_name: str
    url: str
# Connection parameters
conn_params = {
    'dbname': 'postgres',
    'user': 'postgres',
    'password': 'postgres',
    'host': 'localhost',
    'port': 5432
}

app = FastAPI()

class User(BaseModel):
    id: int
    email: str
    password: str
    username: str
class User2(BaseModel):
    email: str
    password: str
    username: str

@app.post("/upload/minio", response_model=UploadFileResponse)
async def upload_file_to_minio(
    file: UploadFile = File(...), 
    vehicle_type: str = Query(None, title="The image class"),
    timestamp: str = Query(None, title="The timestamp"),
    id: int = Query(None, title="The id"),
    license_plate: str = Query(None, title="The plate"),
    video_name: str = Query(None, title="The video name"),
    image_type: str = Query(None, title="The image type"),
):
    try:
        # Process the first image file
        data = file.file.read()
        file_name = " ".join(file.filename.strip().split())
        metadata_value = {
            "Vehicle": vehicle_type,
            "Timestamp": timestamp,
            "Id": id,
            "License-Plate": license_plate,
            "Video-Name": video_name,
            "Image-Type": image_type
        }
        data_file = MinioHandler().get_instance().put_object(
            file_name=file_name,
            file_data=BytesIO(data),
            content_type=file.content_type,
            metadata=metadata_value
        )

        return data_file
    except CustomException as e:
        raise e
    except Exception as e:
        if e.__class__.__name__ == 'MaxRetryError':
            raise CustomException(http_code=400, code='400', message='Can not connect to Minio')
        raise CustomException(code='999', message='Server Error')
    
@app.post("/upload/video/minio", response_model=UploadFileResponse)
async def upload_video_to_minio(
    file: UploadFile = File(...)
):
    try:
        # Read the video file
        data = file.file.read()
        file_name = " ".join(file.filename.strip().split())
        metadata_value = {
            "Video-Name": file_name,
        }
        
        # Store the video file in Minio
        data_file = MinioHandler().get_instance().put_object(
            file_name=file_name,
            file_data=BytesIO(data),
            content_type=file.content_type,
            metadata=metadata_value
        )

        return data_file
    except CustomException as e:
        raise e
    except Exception as e:
        if e.__class__.__name__ == 'MaxRetryError':
            raise CustomException(http_code=400, code='400', message='Cannot connect to Minio')
        raise CustomException(code='999', message='Server Error')

@app.get("/download/minio/{filePath}")
def download_file_from_minio(
        *, filePath: str = Path(..., title="The relative path to the file", min_length=1, max_length=500)):
    try:
        minio_client = MinioHandler().get_instance()
        if not minio_client.check_file_name_exists(minio_client.bucket_name, filePath):
            raise CustomException(http_code=400, code='400',
                                  message='File not exists')

        file = minio_client.client.get_object(minio_client.bucket_name, filePath).read()
        base64_encoded = base64.b64encode(file).decode('utf-8')
        return JSONResponse(content={"image": base64_encoded})
    except CustomException as e:
        raise e
    except Exception as e:
        if e.__class__.__name__ == 'MaxRetryError':
            raise CustomException(http_code=400, code='400', message='Can not connect to Minio')
        raise CustomException(code='999', message='Server Error')
@app.get("/link/minio/{filePath}")
def get_file_from_minio(
        *, filePath: str = Path(..., title="The relative path to the file", min_length=1, max_length=500)):
    try:
        minio_client = MinioHandler().get_instance()
        if not minio_client.check_file_name_exists(minio_client.bucket_name, filePath):
            raise CustomException(http_code=400, code='400',
                                  message='File not exists')

        file = minio_client.client.presigned_get_object(minio_client.bucket_name, filePath)
        return JSONResponse(content={"image": file})
    except CustomException as e:
        raise e
    except Exception as e:
        if e.__class__.__name__ == 'MaxRetryError':
            raise CustomException(http_code=400, code='400', message='Can not connect to Minio')
        raise CustomException(code='999', message='Server Error')
@app.get("/linklist/minio/")
async def list_minio(prefix: str = Query(None, title="The prefix to filter files by")):
    if prefix is None:
        raise CustomException(http_code=400, code='400',
                                  message='File not exists')

    minio_client = MinioHandler.get_instance()
    json_file_list = minio_client.get_objects_with_prefix(prefix)
    file_list = json.loads(json_file_list)
    return JSONResponse(content=file_list)
@app.get("/find-by-video-name/")
async def find_files_by_video_name(video_name: str):
    try:
        minio_client = MinioHandler().get_instance()
        objects = minio_client.client.list_objects(minio_client.bucket_name)
        matching_files = []

        for obj in objects:
            # Get the object's metadata
            metadata = minio_client.client.stat_object(minio_client.bucket_name, obj.object_name).metadata
            metadata_dict = {k.replace('x-amz-meta-', ''): v for k, v in metadata.items()}
            # Check if the metadata contains the video name
            if metadata.get("X-Amz-Meta-Video-Name") == video_name and 'image' in metadata.get('Content-Type', ''):
                # Generate a presigned URL for the object
                url = minio_client.client.presigned_get_object(minio_client.bucket_name, obj.object_name)
                # Append the matching object details to the list
                matching_files.append({
                    "object_name": metadata_dict,
                    'vehicle_type': metadata_dict["vehicle"],
                    'timestamp': metadata_dict["timestamp"], 
                    'id': metadata_dict["id"], 
                    'license_plate':metadata_dict["license-plate"],
                    "url": url,
                    "image_type": metadata_dict["image-type"]
            })

        if not matching_files:
            raise HTTPException(status_code=404, detail="No files found with the specified video name.")

        return {"matching_files": matching_files}

    except Exception as e:
        return {"error": str(e)}

@app.get("/find-video-url-by-video-name/")
async def find__video_url_files_by_video_name(video_name: str):
    try:
        minio_client = MinioHandler().get_instance()
        objects = minio_client.client.list_objects(minio_client.bucket_name)
        matching_files = []

        for obj in objects:
            # Get the object's metadata
            metadata = minio_client.client.stat_object(minio_client.bucket_name, obj.object_name).metadata
            metadata_dict = {k.replace('x-amz-meta-', ''): v for k, v in metadata.items()}
            # Check if the metadata contains the video name
            if metadata.get("X-Amz-Meta-Video-Name") == video_name and 'video' in metadata.get('Content-Type', ''):
                # Generate a presigned URL for the object
                url = minio_client.client.presigned_get_object(minio_client.bucket_name, obj.object_name)
                # Append the matching object details to the list
                matching_files.append({
                    "url": url,
                    "video_name": metadata_dict['video-name']
            })

        if not matching_files:
            raise HTTPException(status_code=404, detail="No files found with the specified video name.")

        return {"matching_files": matching_files}

    except Exception as e:
        return {"error": str(e)}
    
@app.delete("/delete/all-files/minio", summary="Delete all files from Minio")
async def delete_all_files_from_minio():
    try:
        minio_client = MinioHandler().get_instance()

        # List all objects in the bucket
        objects = minio_client.client.list_objects(minio_client.bucket_name, recursive=True)

        deleted_files = []
        for obj in objects:
            # Delete each object
            minio_client.client.remove_object(minio_client.bucket_name, obj.object_name)
            deleted_files.append(obj.object_name)
        
        if not deleted_files:
            raise HTTPException(status_code=404, detail="No files found to delete")

        return {"message": "All files deleted successfully", "deleted_files": deleted_files}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)