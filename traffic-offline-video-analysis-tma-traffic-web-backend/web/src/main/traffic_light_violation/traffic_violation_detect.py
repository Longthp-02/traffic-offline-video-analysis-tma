import numbers
import shutil
import subprocess
import argparse
import os
import platform
import sys
import supervision as sv
import numpy as np
import pandas as pd
from tabulate import tabulate
from collections import defaultdict
import time
import datetime
from pathlib import Path
from ultralytics import YOLO
import easyocr
import cv2
import logging
import json
import hashlib

from glob import glob
import os
import random
import cv2
import re
import string
import numpy as np
from scipy.ndimage import rotate
from paddleocr import PaddleOCR

# Define the directory for the log file
log_dir = 'web/src/main/results/logs'  # Change this to your desired directory
# os.makedirs(log_dir, exist_ok=True)  # Create the directory if it doesn't exist

# Configure logging to output to a file in the specified directory
logging.basicConfig(
    filename=os.path.join(log_dir, 'output.log'),  # Log to this file in the 'logs' directory
    level=logging.INFO,                            # Log all INFO and above level messages
    format='%(asctime)s - %(levelname)s - %(message)s'
)

logging.basicConfig(level=logging.INFO)
# Initialize logging
logging.info('Starting YoloV9 Traffic Light Violation Script...')

# Initialize global variables
frame_count_df = pd.DataFrame(columns=['tracker_id', 'vehicle_type', 'timestamp', 'license plate'])
frame_count = defaultdict(int)
first_detection_timestamps = {}
first_detection_time = defaultdict(int)
last_detection_timestamps = {}

# Class IDs of interest - car, motorcycle, bus, and truck
logging.info('Setting up YOLOv8 model...')
selected_classes = [2, 3, 5, 7]
MODEL = "web/src/resources/models/yolo_v8/vehicles/yolov8x.pt"

# Models
model_pretrained_license_plate = YOLO('web/src/resources/models/yolo_v8/license_plate/license_plate_detector.pt')
model_traffic_light = YOLO('web/src/resources/models/yolo_v8/traffic_light/best.pt')
model_tracking_vehicles = YOLO(MODEL)

# Initialize the OCR reader
logging.info('Initializing OCR reader...')
reader = PaddleOCR(use_angle_cls=True, lang='en', use_gpu=False)

# Initialize uploaded images hash
uploaded_images = set()

def get_bottom_line(polygon):
    # Sort points by y-coordinate
    sorted_polygon = polygon[polygon[:, 1].argsort()]

    # The bottom line consists of the two points with the largest y-coordinates
    bottom_line = sorted_polygon[-2:]
    return bottom_line

# Set up the polygon zones and other necessary configurations
def setup_zones(first_rectangle_points, second_rectangle_points, cap):
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    def scale_points(points):
        # Assuming points are normalized (between 0 and 1), scale by width and height
        return np.array([[int(point['x'] * width), int(point['y'] * height)] for point in points])
    
    polygon = scale_points(first_rectangle_points)
    big_polygon = scale_points(second_rectangle_points)
    
    bottom_line = get_bottom_line(polygon)
    
    LINE_START, LINE_END = [sv.Point(x, y) for x, y in bottom_line]

    zone = sv.PolygonZone(polygon=polygon, triggering_anchors=(sv.Position.BOTTOM_CENTER, sv.Position.TOP_CENTER, sv.Position.CENTER))
    big_zone = sv.PolygonZone(polygon=big_polygon)

    return zone, big_zone, LINE_START, LINE_END

# Function to draw bounding boxes for detected traffic lights
def draw_traffic_light_bounding_box(frame: np.ndarray, detected_boxes, class_names: dict) -> np.ndarray:
    if detected_boxes is not None:
        for box, class_id in zip(detected_boxes.xyxy.cpu().numpy(), detected_boxes.cls.cpu().numpy()):
            x1, y1, x2, y2 = map(int, box)
            class_name = class_names[int(class_id)]
            color = (0, 255, 0) if class_name == 'Green' else (0, 0, 255)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            label = f"{class_name}"
            label_size, base_line = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            y1_label = max(y1, label_size[1] + 10)
            cv2.rectangle(frame, (x1, y1_label - label_size[1] - 10), (x1 + label_size[0], y1_label + base_line - 10), color, -1)
            cv2.putText(frame, label, (x1, y1_label - 7), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    return frame

# Function to find the next free path in a sequentially named list of files
def next_path(path_pattern):
    i = 1
    while os.path.exists(path_pattern % i):
        i *= 2
    a, b = (i // 2, i)
    while a + 1 < b:
        c = (a + b) // 2
        a, b = (c, b) if os.path.exists(path_pattern % c) else (a, c)
    return path_pattern % b

# Function to load an image from a directory
def load_image_from_directory(directory_path):
    try:
        all_files = os.listdir(directory_path)
    except FileNotFoundError:
        print(f"Directory {directory_path} not found.")
        return None
    
    image_files = [file for file in all_files if file.lower().endswith(('png', 'jpg', 'jpeg', 'bmp', 'tiff'))]
    if not image_files:
        print("No image files found in the directory.")
        return None

    image_path = os.path.join(directory_path, image_files[0])
    image = cv2.imread(image_path)
    if image is not None:
        print(f"Image {image_files[0]} loaded successfully.")
    else:
        print(f"Failed to load image {image_files[0]}.")
    return image

def get_image_path_from_directory(directory_path):
    try:
        # List all files in the directory
        all_files = os.listdir(directory_path)
    except FileNotFoundError:
        print(f"Directory {directory_path} not found.")
        return None
    
    # Filter to include only image files
    image_files = [file for file in all_files if file.lower().endswith(('png', 'jpg', 'jpeg', 'bmp', 'tiff'))]
    
    if not image_files:
        print("No image files found in the directory.")
        return None

    # Example: Read the first image in the list
    image_path = os.path.join(directory_path, image_files[0])
    logging.info(image_path)
    return image_path

# ============= Read License Plate ====================

# Mapping dictionaries for character conversion
dict_char_to_int = {
        'A':'4',
        'B':'8',
        'C':'0',
        'D':'0',
        # 'E':'E',
        # 'F':'F',
        'G':'6',
        'H':'4',
        'I':'1',
        'J':'1',
        # 'K':'K',
        'L':'4',
        # 'M':'M',
        # 'N':'N',
        'O':'0',
        'P':'6',
        'Q':'0',
        'R':'8',
        'S':'5',
        'T':'1',
        'U':'0',
        'V':'0',
        # 'X':'M',
        'Y':'1',
        'Z':'2',
        'W':'W',
        }
dict_int_to_char = {
        '0':'D',
        '1':'T',
        '2':'Z',
        '3':'B',
        '4':'A',
        '5':'S',
        '6':'G',
        '7':'Z',
        '8':'B',
        #'9':'P'
        }

def enhance_image(image):
    # # Display original cropped image
    # plt.figure(figsize=(10, 6))
    # plt.imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
    # plt.title('Original Cropped License Plate')
    # plt.axis('off')
    # plt.show()

    # Resize the image for better OCR accuracy
    resized_image = cv2.resize(image, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)

    # Apply Gaussian Blur to reduce noise
    blurred = cv2.GaussianBlur(resized_image, (5, 5), 0)

    # Convert to grayscale
    gray = cv2.cvtColor(blurred, cv2.COLOR_BGR2GRAY)

    return gray

def crop_license_plate(image, x1, y1, x2, y2):
    # Try different paddings and choose the best one
    paddings = [2, 1, -1, -2, -3, -4, -5, -6]
    best_top_text, best_bottom_text = "", ""

    for padding in paddings:
        # Calculate the crop area with the current padding
        height, width, _ = image.shape
        x1_padded = max(0, int(x1) - padding)
        y1_padded = max(0, int(y1) - padding)
        x2_padded = min(width, int(x2) + padding)
        y2_padded = min(height, int(y2) + padding)

        # Crop the image with padding
        cropped_image = image[y1_padded:y2_padded, x1_padded:x2_padded]

        # Enhance the cropped image
        enhanced_image = enhance_image(cropped_image)

        # Separate the license plate crop into two regions (top and bottom)
        height = enhanced_image.shape[0]
        mid_point = height // 2

        # Top and bottom halves of the license plate
        top_half = enhanced_image[:mid_point, :]
        bottom_half = enhanced_image[mid_point:, :]

        # Handle OCR detection for top half
        detections_top = reader.ocr(top_half)
        if detections_top and isinstance(detections_top, list) and all(isinstance(line, list) for line in detections_top):
            top_text = ''.join([''.join([word_info[1][0] for word_info in line if word_info[1]]) for line in detections_top])
            cleaned_top_text = re.sub(r'[^A-Za-z0-9]', '', top_text)
            match = re.search(r'\d{2}', cleaned_top_text)
            if match:
                start_idx = match.start()
                cleaned_top_text = cleaned_top_text[start_idx:]
            formatted_top_text = format_top_license(cleaned_top_text)
            validated_top_text = validate_top_line(formatted_top_text)

            if validated_top_text:
                best_top_text = validated_top_text

        # Handle OCR detection for bottom half
        detections_bottom = reader.ocr(bottom_half)
        if detections_bottom and isinstance(detections_bottom, list) and all(isinstance(line, list) for line in detections_bottom):
            bottom_text = ''.join([''.join([word_info[1][0] for word_info in line if word_info[1]]) for line in detections_bottom])
            cleaned_bottom_text = re.sub(r'\D', '', bottom_text)
            formatted_bottom_text = format_bottom_license(cleaned_bottom_text)
            validated_bottom_text = validate_bottom_line(formatted_bottom_text)

            if validated_bottom_text:
                best_bottom_text = validated_bottom_text

        # If both top and bottom lines are validated, break the loop
        if best_top_text and best_bottom_text:
            break

    return best_top_text, best_bottom_text


def format_top_license(text):
    license_plate_top = ''

    mapping = {0: dict_char_to_int, 1: dict_char_to_int, 2: dict_int_to_char}

    if len(text) == 5:
        mapping[3] = dict_int_to_char
        mapping[4] = dict_char_to_int

    for j in range(len(text)):
        if j in mapping and text[j] in mapping[j].keys():
            license_plate_top += mapping[j][text[j]]
        else:
            license_plate_top += text[j]

    return license_plate_top


def format_bottom_license(text):
    license_plate_bottom = ''

    mapping = {0: dict_char_to_int, 1: dict_char_to_int, 2: dict_char_to_int, 3: dict_char_to_int}

    if len(text) == 5:
        mapping[4] = dict_char_to_int

    for j in range(len(text)):
        if j in mapping and text[j] in mapping[j].keys():
            license_plate_bottom += mapping[j][text[j]]
        else:
            license_plate_bottom += text[j]

    return license_plate_bottom


def validate_top_line(text):
    # Check if the cleaned text has between 3 and 5 characters
    if len(text) >= 3 and len(text) <= 5:
        if len(text) == 3:
            # First 2 characters should be numbers, last character a letter
            if text[:2].isdigit() and text[2].isalpha():
                return text[:2] + text[2].upper()
        elif len(text) == 4:
            # First 2 characters should be numbers, third a letter, fourth either letter or number
            if text[:2].isdigit() and text[2].isalpha() and text[3].isalnum():
                return text[:2] + text[2].upper() + text[3].upper()
        elif len(text) == 5:
            # First 2 characters should be numbers, next two "MD", and last a number
            if text[:2].isdigit() and text[2:4].upper() == "MD" and text[4].isdigit():
                return text[:2] + "MD" + text[4]

    return ""


def validate_bottom_line(text):
    # Remove any non-numeric characters
    cleaned_text = re.sub(r'\D', '', text)

    # Check if the cleaned text has 4 or 5 digits
    if len(cleaned_text) == 4 or len(cleaned_text) == 5:
        return cleaned_text
    else:
        return ""

def read_license_plate_from_image(license_plate_crop):
    # Crop the license plate region from the image with multiple paddings
    best_top_text, best_bottom_text = crop_license_plate(image, x1, y1, x2, y2)

    if best_top_text or best_bottom_text:
        print(f"Top line detected text: {best_top_text}")
        print(f"Bottom line detected text: {best_bottom_text}")
    else:
        print("No valid text detected for this license plate.")

    return best_top_text, best_bottom_text

def hash_image(image):
    """Generate a unique hash for a given image (numpy array)."""
    return hashlib.sha256(image.tobytes()).hexdigest()


# Callback function for video processing
def callback(frame: np.ndarray, index: int, framecount, length, zone, big_zone, byte_tracker, line_zone, zone_annotator, zone_annotator2, box_annotator, trace_annotator, line_zone_annotator, base_dir, start_time, video_name) -> np.ndarray:
    logging.info('Applying tracking to detections...')
    
    # Calculate progress percentage
    framecount[0] += 1
    progress = (framecount[0] / length) * 100
    
    logging.info(f'Progress: {progress:.2f}% ({framecount[0]}/{length} frames processed)')
    
    detection_start = time.time()
    results = model_tracking_vehicles(frame, verbose=False)[0]
    detections = sv.Detections.from_ultralytics(results)
    detections = detections[np.isin(detections.class_id, selected_classes) & (detections.confidence > 0.60)]
    detections = byte_tracker.update_with_detections(detections)
    detection_end = time.time()
    logging.info(f'Detection and tracking time: {detection_end - detection_start:.4f} seconds')
    
    labels = [f"#{tracker_id} {'car' if model_tracking_vehicles.model.names[class_id] != 'motorcycle' else 'moto'}"
              for confidence, class_id, tracker_id in zip(detections.confidence, detections.class_id, detections.tracker_id)]
    
    trigger = zone.trigger(detections=detections)
    detectiontrigger = detections[trigger]
    mask = big_zone.trigger(detections=detections)
    detections = detections[mask]

    logging.info('Checking license plate...')
    license_plate_start = time.time()
    for tracker_id, xyxy in zip(detections.tracker_id, detections.xyxy):
        crop = sv.crop_image(image=frame, xyxy=xyxy)
        # tracker_dir = base_dir / f"id_{tracker_id}"
        tracker_dir_vehicles = base_dir / f"id_{tracker_id}/vehicles"
        tracker_dir_plates = base_dir / f"id_{tracker_id}/plates"
        if any(tracker_dir_vehicles.glob("*.png")):
            continue
        
        tracker_dir_vehicles.mkdir(parents=True, exist_ok=True)
        filename_vehicles = f"{tracker_dir_vehicles}/pic-vehicles-{tracker_id}.png"
        cv2.imwrite(filename_vehicles, crop)
        
        if any(tracker_dir_plates.glob("*.png")):
            continue
        confidence_threshold = 0.6
        license_plates = model_pretrained_license_plate.track(crop, conf=confidence_threshold)[0]

        if license_plates and license_plates.boxes:
            tracker_dir_plates.mkdir(parents=True, exist_ok=True)
            filename = f"{tracker_dir_plates}/pic-plates-{tracker_id}.png"
            
            # Get the first detected license plate's bounding box
            box = license_plates.boxes[0].xyxy[0]  # xyxy format: (x1, y1, x2, y2)

            # Extract the coordinates
            x1, y1, x2, y2 = map(int, box)
            
            # Crop the license plate from the original image
            cropped_license_plate = crop_license_plate(crop, x1, y1, x2, y2)
            
            cv2.imwrite(filename, cropped_license_plate)
            
    license_plate_end = time.time()
    logging.info(f'License plate processing time: {license_plate_end - license_plate_start:.4f} seconds')
    
    # Annotation start time
    annotation_start = time.time()
    annotated_frame = trace_annotator.annotate(scene=frame.copy(), detections=detections)
    annotated_frame = box_annotator.annotate(scene=annotated_frame, detections=detections, labels=labels)
    line_zone_annotator.annotate(annotated_frame, line_counter=line_zone)
    zone_annotator.annotate(scene=annotated_frame)
    zone_annotator2.annotate(scene=annotated_frame)
    cv2.putText(annotated_frame, f"count: {line_zone.in_count}", (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 2, (255, 255, 255), 2)
    annotation_end = time.time()
    logging.info(f'Annotation time: {annotation_end - annotation_start:.4f} seconds')

    # Traffic light detection start time
    traffic_light_start = time.time()
    traffic_light = model_traffic_light.track(frame, conf=0.7)[0]
    detected_boxes = traffic_light.boxes

    if detected_boxes is not None:
        class_ids = detected_boxes.cls.cpu().numpy()
        if class_ids.size > 0:
            annotated_frame = draw_traffic_light_bounding_box(annotated_frame, detected_boxes, traffic_light.names)
            if 0 in class_ids:
                for tracker_id, class_id in zip(detectiontrigger.tracker_id, detectiontrigger.class_id):
                    frame_count[tracker_id] += 1
                    if tracker_id not in first_detection_timestamps:
                        first_detection_timestamps[tracker_id] = time.time()
                        first_detection_time[tracker_id] = (framecount[0] / length) * (length / 30)
                    last_detection_timestamps[tracker_id] = time.time()

                    directory_path_plates = base_dir / f"id_{tracker_id}" / "plates"
                    license_plate_crop = load_image_from_directory(directory_path_plates)
                    license_plate_text_db = ""

                    if license_plate_crop is not None:
                        logging.info('Check if the image not saved yet to MinIO')
                        image_hash = hash_image(license_plate_crop)
                        
                        if image_hash in uploaded_images:
                            print(f"Image {license_plate_crop} has already been uploaded. Skipping...")
                            continue
                        
                        uploaded_images.add(image_hash)
                        
                        license_plate_top, license_plate_bottom = read_license_plate_from_image(license_plate_crop)
                        
                        license_plate_text_db = license_plate_top + license_plate_bottom
                        
                        # license_plate_text = read_license_plate(thresh)
                            
                        # if license_plate_text:
                        #     # LOGGER.info("Found license plate")
                        #         license_plate_text_db = license_plate_text
                        
                        url = "http://localhost:3000/upload/minio"
                        params = {
                            "vehicle_type": '',
                            "timestamp": '',
                            "id": tracker_id,
                            "license_plate": '',
                            "video_name": video_name,
                            "image_type": "plate"
                        }
                        
                        # Construct the URL with query parameters
                        query_string = "&".join([f"{key}={value}" for key, value in params.items()])
                        full_url = f"{url}?{query_string}"
                        
                        logging.info('Saving Plate Result to MinIO...')
                        curl_command = [
                            "curl", "-X", "POST", full_url,
                            "-H", "accept: application/json",
                            "-H", "Content-Type: multipart/form-data",
                            "-F", f"file=@{license_plate_crop};type=image/png"
                        ]
                        
                        # Execute the curl command
                        result = subprocess.run(curl_command, capture_output=True, text=True)

                        if result.returncode == 0:
                            response_json = json.loads(result.stdout)
                            print("Response JSON:", response_json)
                        else:
                            print("Response:", result.stdout)
                            

                    # Add data to the DataFrame
                    frame_count_df.loc[tracker_id] = [
                    tracker_id,
                    'car' if model_tracking_vehicles.model.names[class_id] != 'motorcycle' else 'Motorbike',
                    time.strftime("%H:%M:%S", time.gmtime(first_detection_time[tracker_id])),
                    license_plate_text_db
                    ]
                    
                    url = "http://localhost:3000/upload/minio"
                    params = {
                        "vehicle_type": 'car' if model_tracking_vehicles.model.names[class_id] != 'motorcycle' else 'Motorbike',
                        "timestamp": time.strftime("%H:%M:%S", time.gmtime(first_detection_time[tracker_id])),
                        "id": tracker_id,
                        "license_plate": license_plate_text_db,
                        "video_name": video_name,
                        "image_type": "vehicle"
                    }
                    
                    # Construct the URL with query parameters
                    query_string = "&".join([f"{key}={value}" for key, value in params.items()])
                    full_url = f"{url}?{query_string}"
                    
                    directory_path_image_vehicles = base_dir / f"id_{tracker_id}" / "vehicles"
                    file_path = get_image_path_from_directory(directory_path_image_vehicles)
                    
                    if file_path is not None:
                        logging.info('Check if the image not saved yet to MinIO')
                        
                        if file_path in uploaded_images:
                            print(f"Image {file_path} has already been uploaded. Skipping...")
                            continue
                        
                        uploaded_images.add(file_path)
                        
                        logging.info('Saving Vehicle Result to MinIO...')
                        curl_command = [
                            "curl", "-X", "POST", full_url,
                            "-H", "accept: application/json",
                            "-H", "Content-Type: multipart/form-data",
                            "-F", f"file=@{file_path};type=image/png"
                        ]
                        
                        # Execute the curl command
                        result = subprocess.run(curl_command, capture_output=True, text=True)

                        if result.returncode == 0:
                            response_json = json.loads(result.stdout)
                            print("Response JSON:", response_json)
                        else:
                            print("Response:", result.stdout)
    else:
        print("No traffic light detected.")
        
    traffic_light_end = time.time()
    logging.info(f'Traffic light detection time: {traffic_light_end - traffic_light_start:.4f} seconds')
    
    logging.info('Saving results to csv...')
    # Save results to CSV start time
    csv_save_start = time.time()
    frame_count_df.to_csv('web/src/main/results/result.csv', index=False)
    csv_save_end = time.time()
    logging.info(f'CSV saving time: {csv_save_end - csv_save_start:.4f} seconds')
    
    # Log total callback processing time
    end_time = time.time()
    logging.info(f'Total callback processing time: {end_time - start_time:.4f} seconds')
    logging.info('Inference completed.')
    
    return annotated_frame

# Main function to process the video
def process_video(input_video_path, output_video_path, first_rectangle_points, second_rectangle_points):
    cap = cv2.VideoCapture(input_video_path)
    length = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    video_name = os.path.basename(input_video_path)

    if not cap.isOpened():
        print("Error: Could not open video.")
        return

    zone, big_zone, LINE_START, LINE_END = setup_zones(first_rectangle_points, second_rectangle_points, cap)
    byte_tracker = sv.ByteTrack(track_thresh=0.25, track_buffer=30, match_thresh=0.8, frame_rate=30)
    line_zone = sv.LineZone(start=LINE_START, end=LINE_END, triggering_anchors={sv.Position.BOTTOM_CENTER, sv.Position.BOTTOM_LEFT, sv.Position.BOTTOM_RIGHT})
    zone_annotator = sv.PolygonZoneAnnotator(zone=zone, color=sv.Color.WHITE, thickness=3, text_thickness=1, text_scale=1, display_in_zone_count=False)
    zone_annotator2 = sv.PolygonZoneAnnotator(zone=big_zone, color=sv.Color.WHITE, thickness=6, text_thickness=1, text_scale=1, display_in_zone_count=False)
    line_zone_annotator = sv.LineZoneAnnotator(thickness=3, text_thickness=1, text_scale=1, custom_in_text=None, custom_out_text=None, display_in_count=True, display_out_count=False)
    box_annotator = sv.BoxAnnotator(thickness=3, text_thickness=1, text_scale=1)
    trace_annotator = sv.TraceAnnotator(thickness=4, trace_length=50)
    framecount = [0]
    base_dir = Path("web/src/main/images")
    start_time = time.time()

    sv.process_video(
        source_path=input_video_path,
        target_path=output_video_path,
        callback=lambda frame, index: callback(frame, index, framecount, length, zone, big_zone, byte_tracker, line_zone, zone_annotator, zone_annotator2, box_annotator, trace_annotator, line_zone_annotator, base_dir, start_time, video_name)
    )
    
    # Delete all folders in base_dir after processing
    logging.info(f"Deleting all directories in {base_dir}...")
    try:
        for folder in base_dir.iterdir():
            if folder.is_dir():
                shutil.rmtree(folder)
                logging.info(f"Deleted folder: {folder}")
    except Exception as e:
        logging.error(f"Error deleting folders in {base_dir}: {str(e)}")

    logging.info(f"Completed processing for video {input_video_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Process video for vehicle tracking and license plate recognition.")
    parser.add_argument('--input', type=str, required=True, help="Path to the input video.")
    parser.add_argument('--output', type=str, required=True, help="Path to save the processed output video.")
    parser.add_argument('--first_rectangle_points', type=str, required=True, help="JSON string of first rectangle points.")
    parser.add_argument('--second_rectangle_points', type=str, required=True, help="JSON string of second rectangle points.")
        
    args = parser.parse_args()
    
    try:
        first_rectangle_points = json.loads(args.first_rectangle_points)
        second_rectangle_points = json.loads(args.second_rectangle_points)
        
    except json.JSONDecodeError as e:
        logging.error(f"Error parsing rectangle points: {str(e)}")
        exit(1)
    
    args = parser.parse_args()
    logging.info('Running main function...')
    logging.info('Parsing command line arguments...')
    process_video(args.input, args.output, first_rectangle_points, second_rectangle_points)
