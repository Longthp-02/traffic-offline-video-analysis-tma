# Setup
sudo npm install --legacy-peer-deps

# Run

Run the web using this command to disable cors 

For Mac:
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security 

For Window:
"[PATH_TO_CHROME]\chrome.exe" --disable-web-security --disable-gpu --user-data-dir=%LOCALAPPDATA%\Google\chromeTemp

Start-Process -FilePath "C:\Program Files\Google\Chrome\Application\chrome.exe" -ArgumentList '--disable-web-security', '--disable-gpu', '--user-data-dir=$env:LOCALAPPDATA\Google\chromeTemp'

Run the client:

npm run dev


