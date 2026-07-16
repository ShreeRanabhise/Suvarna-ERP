@echo off
echo ===================================================
echo   Pushing Suvarna GoldLoan ERP to GitHub
echo ===================================================
echo.

:: Initialize Git
git init

:: Set up remote origin
git remote remove origin
git remote add origin https://github.com/ShreeRanabhise/Suvarna-ERP.git
git branch -M main

:: Stage and Commit
echo Staging files...
git add .
echo.
echo Committing changes...
git commit -m "feat: complete gold loan ERP with clean structure"
echo.

:: Push to main branch
echo Pushing to GitHub...
git push -u origin main --force
echo.

echo ===================================================
echo   Push Complete! Press any key to close.
echo ===================================================
pause
