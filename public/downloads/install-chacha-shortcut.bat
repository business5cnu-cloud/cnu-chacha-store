@echo off
chcp 65001 >nul
set "ICON_DIR=%APPDATA%\CNU-ChaCha-Store"
set "ICON_PATH=%ICON_DIR%\chacha_icon.ico"
set "SHORTCUT_PATH=%USERPROFILE%\Desktop\CNU 차차 스토어.url"

if not exist "%ICON_DIR%" mkdir "%ICON_DIR%"

echo [1/2] 충남대 차차 공식 아이콘을 다운로드하고 있습니다...
curl.exe -L -s -o "%ICON_PATH%" "https://cnu-chacha-store.web.app/images/chacha/chacha_icon.ico"

echo [2/2] 바탕화면에 CNU 차차 스토어 바로가기를 생성하고 있습니다...
(
echo [InternetShortcut]
echo URL=https://cnu-chacha-store.web.app
echo IconIndex=0
echo IconFile=%ICON_PATH%
) > "%SHORTCUT_PATH%"

echo.
echo 완료되었습니다! 바탕화면의 [CNU 차차 스토어] 아이콘을 확인해보세요.
start "" "https://cnu-chacha-store.web.app"
timeout /t 3 >nul
