Add-Type -AssemblyName System.Drawing

function Install-Asset($src, $prodId) {
  $prodRoot = "public\images\products"
  $outRoot = "out\images\products"

  $img = [System.Drawing.Image]::FromFile($src)
  
  # 1600x1600
  $bmp1600 = New-Object System.Drawing.Bitmap 1600, 1600
  $g = [System.Drawing.Graphics]::FromImage($bmp1600)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.Clear([System.Drawing.Color]::White)
  $scale = [Math]::Min(1600 / $img.Width, 1600 / $img.Height)
  $dw = [int]($img.Width * $scale)
  $dh = [int]($img.Height * $scale)
  $dx = [int]((1600 - $dw) / 2)
  $dy = [int]((1600 - $dh) / 2)
  $g.DrawImage($img, $dx, $dy, $dw, $dh)
  $g.Dispose()

  $bmp1600.Save("$prodRoot\original\$prodId.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp1600.Save("$prodRoot\large\$prodId.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp1600.Save("$prodRoot\ai_enhanced\$prodId.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp1600.Save("$outRoot\original\$prodId.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp1600.Save("$outRoot\large\$prodId.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp1600.Save("$outRoot\ai_enhanced\$prodId.png", [System.Drawing.Imaging.ImageFormat]::Png)

  # 800x800
  $bmp800 = New-Object System.Drawing.Bitmap 800, 800
  $g8 = [System.Drawing.Graphics]::FromImage($bmp800)
  $g8.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g8.DrawImage($bmp1600, 0, 0, 800, 800)
  $g8.Dispose()
  $bmp800.Save("$prodRoot\medium\$prodId.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp800.Save("$outRoot\medium\$prodId.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $legacyName = $prodId.Replace("-", "_")
  $bmp800.Save("$prodRoot\$legacyName.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp800.Save("$outRoot\$legacyName.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp800.Dispose()

  # 400x400
  $bmp400 = New-Object System.Drawing.Bitmap 400, 400
  $g4 = [System.Drawing.Graphics]::FromImage($bmp400)
  $g4.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g4.DrawImage($bmp1600, 0, 0, 400, 400)
  $g4.Dispose()
  $bmp400.Save("$prodRoot\thumbnail\$prodId.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp400.Save("$outRoot\thumbnail\$prodId.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp400.Dispose()

  $bmp1600.Dispose()
  $img.Dispose()
  Write-Host "Installed $prodId"
}

Install-Asset "C:\Users\ROCAT\.gemini\antigravity\brain\63820f42-4d3d-483c-a089-ae4741f6cd2b\chacha_hoodie_1793854801492.jpg" "prod-hoodie"
Install-Asset "C:\Users\ROCAT\.gemini\antigravity\brain\63820f42-4d3d-483c-a089-ae4741f6cd2b\chacha_socks_1793854802491.jpg" "prod-socks"
