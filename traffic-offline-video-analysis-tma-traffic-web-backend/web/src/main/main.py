import json
from flask import Flask, request, jsonify
from pathlib import Path
import os
import pandas as pd
import subprocess
from flask_cors import CORS
import logging
    
app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/process-video', methods=['POST'])
def process_video():
    # Check if a video file is part of the request
    if 'video' not in request.files:
        return jsonify({"error": "No video file provided"}), 400
    
    # Define the URL for the DELETE request
    url = "http://0.0.0.0:3000/delete/all-files/minio"

    # Prepare the curl command for the DELETE request
    curl_command = [
        "curl", "-X", "DELETE", url,
        "-H", "accept: application/json"
    ]

    # Log the action of cleaning the database
    logging.info("Cleaning the database...")

    # Execute the curl command
    result = subprocess.run(curl_command, capture_output=True, text=True)

    # Check and log the result of the curl command
    if result.returncode == 0:
        logging.info("Database cleaned successfully.")
    else:
        logging.error(f"Error cleaning the database: {result.stderr}")

    # Get the video file from the request
    video_file = request.files['video']

    # Save the video to a temporary location
    temp_dir = Path("temp_videos")
    temp_dir.mkdir(parents=True, exist_ok=True)
    video_path = temp_dir / video_file.filename
    video_file.save(video_path)
    
    output_video_path = 'web/src/main/results/video/result.mp4'
    
    data = request.form.get('data')
    if not data:
        return jsonify({"error": "No data provided"}), 400

    try: 
        # subprocess.run(["python", "web/src/resources/yolov9_demo/yolo_detection.py", "--weights", "web/src/resources/yolov9_demo/models/yolov9/traffic_light/Traffic_Light_YoloV9_1.pt", "--conf", "0.7", "--source", video_path, "--device", "cpu"])
        
        json_data = json.loads(data)
        logging.info(f"Check: {json_data}")
        first_rectangle_points = json_data.get("firstRectanglePoints")
        violation_option = json_data.get("selectedViolationOption")
        
        first_rectangle_json = json.dumps(first_rectangle_points)
        
        if(violation_option == "Parking Violation"):
            if not first_rectangle_points:
                return jsonify({"error": "Missing rectangle points"}), 400
            
            selectedParkingViolation = json_data.get("selectedParkingViolation")
            
            subprocess.run(
                ["python", "web/src/main/parking_violation/parking_violation.py", 
                "--input", str(video_path), 
                "--output", output_video_path, 
                "--first_rectangle_points", first_rectangle_json,
                "--selected_parking_violation", selectedParkingViolation],
                check=True
            )
        else:
            second_rectangle_points = json_data.get("secondRectanglePoints")
            second_rectangle_json = json.dumps(second_rectangle_points)
                                    
            if not first_rectangle_points or not second_rectangle_points:
                return jsonify({"error": "Missing rectangle points"}), 400
            
            
            subprocess.run(
                ["python", "web/src/main/traffic_light_violation/traffic_violation_detect.py", 
                "--input", str(video_path), 
                "--output", output_video_path, 
                "--first_rectangle_points", first_rectangle_json,
                "--second_rectangle_points", second_rectangle_json],
                check=True
            )
        
        
        # TODO: Delete the video when finished
        
        # Dummy result object, replace this with actual data to be returned
        results = {"message": "Video processed successfully"}
        
        # Return results as a JSON response
        return jsonify(results), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        # Clean up the temporary file
        if video_path.exists():
            video_path.unlink()
    
if __name__ == "__main__":
    app.run(debug=True, port=8090)
    
