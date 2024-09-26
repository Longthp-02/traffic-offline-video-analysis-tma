# Traffic Offline Video Analysis

# Description
The Traffic Offline Video Analysis project addresses the challenge of monitoring and enforcing traffic regulations in urban areas with heavy vehicle traffic, where violations such as red light running and illegal parking are common. Manual identification of offenders can be time-consuming and prone to errors, affecting both traffic flow and road safety. This project aims to develop an AI-based system that automatically analyzes offline traffic footage to detect such violations, reducing the need for human intervention. The system features an AI-powered video analysis engine and a user-friendly website where users can upload videos and review analysis results, making it highly accessible to traffic authorities. Beyond law enforcement, the project contributes to the field of AI-based video analysis, offering a scalable solution for improving road safety and traffic regulation efficiency.

![Thumbnail](https://github.com/Longthp-02/traffic-offline-video-analysis-tma/blob/main/public/thumbnail-fixed.png)

# Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

## Prerequisites
### Frontend Requirements
- [ReactTS 18.3.1](https://react.dev/learn/installation)
- [Tailwind Css 3.4.3](https://tailwindcss.com/docs/installation)
### Backend Requirements
- [MinIO version RELEASE.2024-08-03T04-33-23Z](https://min.io/download)
- [Python3.8](https://www.python.org/downloads/release/python-380/)

## Frontend Installation
### Mac
Install denpendencies
```
sudo npm install --legacy-peer-deps
```

### Windows
Install denpendencies
```
npm install --legacy-peer-deps
```


# Running the Frontend

**IMPORTANT: Please run this line to run web for disabling cors**
## For Mac
To disable CORS, run the following command:
```
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security 
```
## For Window
```
"[PATH_TO_CHROME]\chrome.exe" --disable-web-security --user-data-dir="C:\Users\MSI\ChromeUserData"
```
Replace [PATH_TO_CHROME] with the actual path to your Chrome executable.

## Start the Web Server
Run the following command to start the web server:
```
npm run dev
```

## Backend Installation
### For Mac
1. Create a virtual environment:
```
python3.8 -m venv env
```
2. Activate the virtual environment:
```
source venv/bin/activate
```

### Windows (Powershell)
1. Allow script execution: Run the following to allow running scripts:
```
RemoteSigned -Scope CurrentUser
```
2. Activate the virtual environment:
```
./env/Scripts/activate
```

### Install Backend Dependencies (Both OS)
Install the required Python dependencies:
```
pip install -r requirements.txt
```
If have error during installing dependencies maybe need to update pip
```
python -m pip install --upgrade pip
```

### Running the Backend
1. Run MinIO server:
```
minio server env/share 
```
2. Run MinIO Python script:
```
python web/src/main/minio/main.py
```
3. Start the backend server:
```
python web/src/main/main.py
```

### Debug Backend
1. If you encounter an error where certain modules are not found, please uncomment line 8 in both parking_violation.py and traffic_violation.py and modify the path to your virtual environment's site-packages directory:
```
# sys.path.append('path\\to\\env\\Lib\\site-packages')
```
Replace 'path\\to\\env' with the actual path to your virtual environment.
2. If you encounter an error related to typing_extensions, resolve it by upgrading the package with the following command:
```
pip install --upgrade typing_extensions
```
This should now provide clear instructions for debugging module-related issues in your backend system.

# Demo


https://github.com/user-attachments/assets/64158845-b0b1-42db-bdb3-b3535821919d
