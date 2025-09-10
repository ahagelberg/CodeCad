@echo off
REM Setup script for nodist environment
echo Setting up nodist environment...

REM Set environment variables
setx NODIST_PREFIX "C:\Program Files (x86)\Nodist"
setx PATH "%PATH%;C:\Program Files (x86)\Nodist\bin"

echo.
echo Environment variables set successfully!
echo.
echo You may need to restart your terminal or IDE for changes to take effect.
echo.
echo To test, run:
echo   node --version
echo   npm --version
echo.
pause
