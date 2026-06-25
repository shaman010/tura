@echo off
chcp 65001 >nul
REM Открывает доступ к dev-серверу Vite с телефона (порты 5173-5174).
REM ВАЖНО: запускать правым кликом -> "Запуск от имени администратора".
net session >nul 2>&1
if errorlevel 1 (
  echo [!] Нужны права администратора.
  echo     Закройте это окно и запустите файл правым кликом -^> "Запуск от имени администратора".
  pause
  exit /b 1
)
netsh advfirewall firewall delete rule name="Swipd Dev (Vite)" >nul 2>&1
netsh advfirewall firewall add rule name="Swipd Dev (Vite)" dir=in action=allow protocol=TCP localport=5173-5174
echo.
echo [OK] Доступ разрешён. Теперь на телефоне откройте:
echo      http://172.20.10.4:5174
echo.
echo (Если IP другой - посмотрите его командой ipconfig, строка IPv4)
pause
