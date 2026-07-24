$ErrorActionPreference = 'Stop'
Set-Location "$PSScriptRoot\.."
$vite = Start-Process -FilePath "npx" -ArgumentList "vite --host 0.0.0.0 --port 5173" -PassThru -WindowStyle Hidden
Start-Sleep -Seconds 3
npx local-ssl-proxy --source 5174 --target 5173 --cert localhost.pem --key localhost-key.pem
