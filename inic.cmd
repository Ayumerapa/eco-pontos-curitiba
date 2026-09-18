@echo off
setlocal
cd /d "%~dp0"
set "ECO_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%ECO_NODE%" goto bundled
where node >nul 2>nul
if errorlevel 1 goto missing
node "%~dp0servidor.cjs"
goto finish
:bundled
"%ECO_NODE%" "%~dp0servidor.cjs"
goto finish
:missing
echo Instale Node.js LTS de https://nodejs.org 
:finish
pause
