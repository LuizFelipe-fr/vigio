@echo off
chcp 65001 >nul
title Vigio - iniciar app
cd /d "%~dp0"

echo.
echo  ======================================
echo    Vigio - garantias e notas sob controle
echo  ======================================
echo.

REM Verifica se o Node esta instalado
where node >nul 2>nul
if errorlevel 1 (
  echo [ERRO] Node.js nao encontrado. Instale em https://nodejs.org
  echo.
  pause
  exit /b 1
)

REM Instala dependencias na primeira vez
if not exist "node_modules" (
  echo Instalando dependencias pela primeira vez... isso pode levar um minuto.
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao instalar dependencias.
    pause
    exit /b 1
  )
)

echo Iniciando o servidor...
echo O app vai abrir no navegador em instantes.
echo Para parar o servidor, feche esta janela ou pressione Ctrl+C.
echo.

REM Abre o navegador depois de alguns segundos (em paralelo)
start "" /b cmd /c "timeout /t 5 >nul & start "" http://localhost:3000"

REM Sobe o servidor de desenvolvimento
call npm run dev
