@echo off
:loop
node main.js
timeout /t 1
goto loop
