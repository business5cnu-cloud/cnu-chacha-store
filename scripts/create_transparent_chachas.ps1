Add-Type -AssemblyName System.Drawing

function Convert-ToTransparentOuter($srcPath, $dstPath) {
  $src = [System.Drawing.Bitmap]::FromFile($srcPath)
  $w = $src.Width
  $h = $src.Height

  $dst = [System.Drawing.Bitmap]::new($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  
  # LockBits for ultra-fast processing
  $rect = [System.Drawing.Rectangle]::new(0, 0, $w, $h)
  $srcData = $src.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $dstData = $dst.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)

  $bytes = [Math]::Abs($srcData.Stride) * $h
  $srcRgbValues = New-Object byte[] $bytes
  $dstRgbValues = New-Object byte[] $bytes

  [System.Runtime.InteropServices.Marshal]::Copy($srcData.Scan0, $srcRgbValues, 0, $bytes)

  $visited = New-Object bool[] ($w * $h)
  $queue = New-Object System.Collections.Generic.Queue[int]

  # Enqueue border pixels if near white
  for ($x = 0; $x -lt $w; $x++) {
    $idx0 = $x
    $idxLast = ($h - 1) * $w + $x
    $queue.Enqueue($idx0)
    $queue.Enqueue($idxLast)
    $visited[$idx0] = $true
    $visited[$idxLast] = $true
  }
  for ($y = 0; $y -lt $h; $y++) {
    $idx0 = $y * $w
    $idxLast = $y * $w + ($w - 1)
    if (!$visited[$idx0]) { $queue.Enqueue($idx0); $visited[$idx0] = $true }
    if (!$visited[$idxLast]) { $queue.Enqueue($idxLast); $visited[$idxLast] = $true }
  }

  # BFS Flood Fill
  while ($queue.Count -gt 0) {
    $curr = $queue.Dequeue()
    $cx = $curr % $w
    $cy = [int]($curr / $w)
    $byteOffset = ($cy * $srcData.Stride) + ($cx * 4)

    $b = $srcRgbValues[$byteOffset]
    $g = $srcRgbValues[$byteOffset + 1]
    $r = $srcRgbValues[$byteOffset + 2]

    # If background white / light gray (R,G,B > 235)
    if ($r -gt 235 -and $g -gt 235 -and $b -gt 235) {
      # Mark transparent in dst
      $dstRgbValues[$byteOffset + 3] = 0 # Alpha = 0

      # Check 4 neighbors
      $neighbors = @(
        [int]($curr - 1),
        [int]($curr + 1),
        [int]($curr - $w),
        [int]($curr + $w)
      )

      foreach ($nb in $neighbors) {
        if ($nb -ge 0 -and $nb -lt ($w * $h)) {
          $nx = $nb % $w
          $ny = [int]($nb / $w)
          if ([Math]::Abs($nx - $cx) -le 1 -and [Math]::Abs($ny - $cy) -le 1) {
            if (!$visited[$nb]) {
              $visited[$nb] = $true
              $queue.Enqueue($nb)
            }
          }
        }
      }
    } else {
      # It's an outline or content pixel
      $dstRgbValues[$byteOffset] = $b
      $dstRgbValues[$byteOffset + 1] = $g
      $dstRgbValues[$byteOffset + 2] = $r
      $dstRgbValues[$byteOffset + 3] = 255
    }
  }

  # Fill remaining unvisited inner pixels (the character itself) with full opacity
  for ($i = 0; $i -lt ($w * $h); $i++) {
    if (!$visited[$i]) {
      $cx = $i % $w
      $cy = [int]($i / $w)
      $offset = ($cy * $srcData.Stride) + ($cx * 4)
      $dstRgbValues[$offset] = $srcRgbValues[$offset]
      $dstRgbValues[$offset + 1] = $srcRgbValues[$offset + 1]
      $dstRgbValues[$offset + 2] = $srcRgbValues[$offset + 2]
      $dstRgbValues[$offset + 3] = 255
    }
  }

  [System.Runtime.InteropServices.Marshal]::Copy($dstRgbValues, 0, $dstData.Scan0, $bytes)

  $src.UnlockBits($srcData)
  $dst.UnlockBits($dstData)

  $src.Dispose()
  $dst.Save($dstPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $dst.Dispose()

  Write-Host "Created transparent asset: $dstPath"
}

Convert-ToTransparentOuter "public\images\chacha\fitting_basic.jpg" "public\images\chacha\fitting_basic_transparent.png"
Convert-ToTransparentOuter "public\images\chacha\fitting_varsity.jpg" "public\images\chacha\fitting_varsity_transparent.png"
Convert-ToTransparentOuter "public\images\chacha\fitting_graduation.jpg" "public\images\chacha\fitting_graduation_transparent.png"
