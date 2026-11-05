Add-Type -AssemblyName System.Drawing

function Resize-File($src, $dst, $size) {
  $img = [System.Drawing.Image]::FromFile($src)
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.DrawImage($img, 0, 0, $size, $size)
  $g.Dispose()
  $img.Dispose()
  $bmp.Save($dst, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

Resize-File "public\images\products\large\prod-tumbler.png" "public\images\products\medium\prod-tumbler.png" 800
Resize-File "public\images\products\large\prod-tumbler.png" "public\images\products\thumbnail\prod-tumbler.png" 400

Copy-Item "public\images\products\medium\prod-tumbler.png" "out\images\products\medium\prod-tumbler.png" -Force
Copy-Item "public\images\products\thumbnail\prod-tumbler.png" "out\images\products\thumbnail\prod-tumbler.png" -Force

Write-Host "Tumbler medium & thumbnail resized successfully!"
