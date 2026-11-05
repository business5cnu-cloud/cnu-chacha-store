Add-Type -AssemblyName System.Drawing

function Install-ProductAsset([string]$srcPath, [string]$prodId) {
  if (!(Test-Path $srcPath)) {
    Write-Warning "Source not found: $srcPath"
    return
  }

  $prodRoot = "public\images\products"
  $outRoot = "out\images\products"

  $img = [System.Drawing.Image]::FromFile($srcPath)
  $origW = $img.Width
  $origH = $img.Height

  # 1. Save original, ai_enhanced, large (1:1 aspect or square padded)
  $size1600 = 1600
  $bmp1600 = New-Object System.Drawing.Bitmap $size1600, $size1600
  $g = [System.Drawing.Graphics]::FromImage($bmp1600)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

  # Fill clean studio background if letterboxed, else draw full
  $g.Clear([System.Drawing.Color]::White)
  $scale = [Math]::Min($size1600 / $origW, $size1600 / $origH)
  $drawW = [int]($origW * $scale)
  $drawH = [int]($origH * $scale)
  $drawX = [int](($size1600 - $drawW) / 2)
  $drawY = [int](($size1600 - $drawH) / 2)
  $g.DrawImage($img, $drawX, $drawY, $drawW, $drawH)
  $g.Dispose()

  # Save 1600x1600
  $bmp1600.Save("$prodRoot\original\$prodId.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp1600.Save("$prodRoot\large\$prodId.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp1600.Save("$prodRoot\ai_enhanced\$prodId.png", [System.Drawing.Imaging.ImageFormat]::Png)

  # Copy to out
  $bmp1600.Save("$outRoot\original\$prodId.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp1600.Save("$outRoot\large\$prodId.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp1600.Save("$outRoot\ai_enhanced\$prodId.png", [System.Drawing.Imaging.ImageFormat]::Png)

  # 2. Medium (800x800)
  $bmp800 = New-Object System.Drawing.Bitmap 800, 800
  $g8 = [System.Drawing.Graphics]::FromImage($bmp800)
  $g8.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g8.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g8.DrawImage($bmp1600, 0, 0, 800, 800)
  $g8.Dispose()
  $bmp800.Save("$prodRoot\medium\$prodId.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp800.Save("$outRoot\medium\$prodId.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp800.Dispose()

  # 3. Thumbnail (400x400)
  $bmp400 = New-Object System.Drawing.Bitmap 400, 400
  $g4 = [System.Drawing.Graphics]::FromImage($bmp400)
  $g4.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g4.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g4.DrawImage($bmp1600, 0, 0, 400, 400)
  $g4.Dispose()
  $bmp400.Save("$prodRoot\thumbnail\$prodId.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp400.Save("$outRoot\thumbnail\$prodId.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp400.Dispose()

  # Also save to root product image for legacy fallback
  $legacyName = $prodId.Replace("-", "_")
  $bmp800_2 = New-Object System.Drawing.Bitmap 800, 800
  $g82 = [System.Drawing.Graphics]::FromImage($bmp800_2)
  $g82.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g82.DrawImage($bmp1600, 0, 0, 800, 800)
  $g82.Dispose()
  $bmp800_2.Save("$prodRoot\$legacyName.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp800_2.Save("$outRoot\$legacyName.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp800_2.Dispose()

  $bmp1600.Dispose()
  $img.Dispose()

  Write-Host "Installed $prodId from $srcPath"
}
