@echo off
setlocal
echo ==========================================
echo    PullCards - Iniciando Ritual...
echo ==========================================
echo.

:: Verificar se o Node.js está instalado
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Node.js não encontrado!
    echo Este jogo agora requer Node.js para funcionar (Admin, API, etc^).
    echo Por favor, instale em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: Verificar se as dependências existem
if not exist "node_modules\" (
    echo [AVISO] Dependências não encontradas. Restaurando ritual (npm install^)...
    call npm install
)

echo.
echo 1. Abrindo o jogo no seu navegador...
:: Abre o link e continua a execução
start http://localhost:8080

echo.
echo 2. Iniciando o Grande Oráculo (Servidor Node.js)...
echo    [Para encerrar o ritual, feche esta janela ou pressione Ctrl+C]
echo.

node server/server.js

pause
