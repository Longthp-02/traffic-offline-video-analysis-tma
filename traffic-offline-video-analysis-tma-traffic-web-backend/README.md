# Project Title
Traffic Offline Video Analysis

# Description
The Traffic Offline Video Analysis project aims to tackle the challenge of monitoring and enforcing traffic regulations in urban areas with high vehicle volumes, where violations like red light crossing and illegal parking are common. Law enforcement struggles to manually identify offenders, affecting traffic flow and road safety. This project seeks to develop an AI-based system capable of analyzing offline traffic footage to automatically detect these violations, reducing the need for human intervention. The system includes an AI video analysis engine and a user-friendly website for inputting videos and reviewing results, making it accessible for traffic authorities. Beyond its practical application in law enforcement, the project contributes to AI-based video analysis, offering a scalable solution that enhances road safety and efficiency in traffic regulation.

# Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

## Prerequisites
### Frontend Requirements
- [ReactTS](https://react.dev/learn/installation)
- [Tailwind Css](https://tailwindcss.com/docs/installation)
### Backend Requirements
- [MinIO](https://min.io/download)
- [Python3.8](https://www.python.org/downloads/release/python-380/)

**IMPORTANT: Make sure that you use Python3.8 to create the venv**

## Backend Installation
### For Mac
1. Create a virtual environment:
```
python3.8 -m venv env
```
2. Activate the virtual environment:
```
source env/bin/activate
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
