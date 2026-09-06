@echo off
chcp 65001 >nul
title Ucharbek - GitHub'ga yuklash
echo ==============================================================
echo   Ucharbek loyihasini GitHub'ga yuklash (Push)
echo ==============================================================
echo.
cd /d "%~dp0"
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo ==============================================================
    echo   MUVAFFAQIYATLI YUKLANDI! 
    echo   Endi Vercel'ga otib, Deploy tugmasini bemalol bosishingiz mumkin.
    echo ==============================================================
) else (
    echo   Yuklashda xatolik yuz berdi.
)
echo.
pause
