Add-Type -AssemblyName System.Drawing

$root = "c:\Users\ROCAT\Desktop\cnu-chacha-store\public\images"
$prodRoot = "$root\products"

# 1. Create required multi-resolution directories
$dirs = @(
  "$prodRoot\legacy_original",
  "$prodRoot\original",
  "$prodRoot\ai_enhanced",
  "$prodRoot\large",
  "$prodRoot\medium",
  "$prodRoot\thumbnail",
  "$prodRoot\lifestyle"
)
foreach ($d in $dirs) {
  if (!(Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
}

# 2. Preserve legacy 125x125 images untouched in legacy_original/
Get-ChildItem -Path $prodRoot -File -Filter "prod_*.png" | ForEach-Object {
  Copy-Item $_.FullName "$prodRoot\legacy_original\$($_.Name)" -Force
}

# Load the 3 official 1024x1024 New ChaCha images (never upscaled above 1024x1024!)
$imgBasic = [System.Drawing.Image]::FromFile("$root\chacha\fitting_basic.jpg")
$imgVarsity = [System.Drawing.Image]::FromFile("$root\chacha\fitting_varsity.jpg")
$imgGrad = [System.Drawing.Image]::FromFile("$root\chacha\fitting_graduation.jpg")

function New-RoundedRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

$products = @(
  @{ id = "prod-hoodie"; sku = "CNU-APP-001"; name = "차차 헤비웨이트 후드티"; sub = "CNU SIGNATURE HEAVYWEIGHT HOODIE"; cat = "APPAREL"; c1 = "#0F172A"; c2 = "#1E3A8A"; acc = "#38BDF8"; char = "varsity" },
  @{ id = "prod-socks"; sku = "CNU-APP-002"; name = "차차 자수 데일리 양말"; sub = "COMBED COTTON EMBROIDERY SOCKS"; cat = "APPAREL"; c1 = "#EFF6FF"; c2 = "#DBEAFE"; acc = "#1E40AF"; char = "basic" },
  @{ id = "prod-memo"; sku = "CNU-STA-001"; name = "차차 100매 떡메모지"; sub = "100G PREMIUM STUDY MEMO PAD"; cat = "STATIONERY"; c1 = "#FFFBEB"; c2 = "#FEF3C7"; acc = "#D97706"; char = "basic" },
  @{ id = "prod-limited-sticker"; sku = "CNU-LIM-003"; name = "시즌 한정 홀로그램 스티커"; sub = "LIMITED HOLOGRAM REMOVABLE STICKER PACK"; cat = "LIMITED"; c1 = "#FDF4FF"; c2 = "#FAE8FF"; acc = "#C026D3"; char = "grad" },
  @{ id = "prod-griptok"; sku = "CNU-ACC-001"; name = "차차 맥세이프 스마트톡"; sub = "NEODYMIUM MAGSAFE ACRYLIC GRIPTOK"; cat = "ACCESSORIES"; c1 = "#F0F9FF"; c2 = "#E0F2FE"; acc = "#0284C7"; char = "varsity" },
  @{ id = "prod-keyring"; sku = "CNU-ACC-002"; name = "말랑 입체 PVC 키링"; sub = "3D SOFT PVC MASCOT KEYRING"; cat = "ACCESSORIES"; c1 = "#FFF1F2"; c2 = "#FFE4E6"; acc = "#E11D48"; char = "basic" },
  @{ id = "prod-tumbler"; sku = "CNU-ACC-003"; name = "차차 진공 보온보냉 텀블러"; sub = "500ML STAINLESS VACUUM TUMBLER"; cat = "ACCESSORIES"; c1 = "#F8FAFC"; c2 = "#E2E8F0"; acc = "#0F172A"; char = "varsity" },
  @{ id = "prod-figure"; sku = "CNU-ACC-004"; name = "차차 캠퍼스 랜덤 피규어"; sub = "CAMPUS LIFE BLIND BOX FIGURE"; cat = "ACCESSORIES"; c1 = "#F5F3FF"; c2 = "#EDE9FE"; acc = "#7C3AED"; char = "grad" },
  @{ id = "prod-laptop-pouch"; sku = "CNU-ACC-005"; name = "차차 퀼팅 노트북 파우치"; sub = "15-16 INCH PROTECTIVE LAPTOP SLEEVE"; cat = "ACCESSORIES"; c1 = "#EEF2FF"; c2 = "#E0E7FF"; acc = "#3730A3"; char = "varsity" },
  @{ id = "prod-powerbank"; sku = "CNU-ACC-006"; name = "차차 10000mAh 보조배터리"; sub = "20W PD FAST CHARGING POWER BANK"; cat = "ACCESSORIES"; c1 = "#ECFEFF"; c2 = "#CFFAFE"; acc = "#0891B2"; char = "basic" },
  @{ id = "prod-toothbrush"; sku = "CNU-ACC-007"; name = "차차 휴대용 양치도구 세트"; sub = "PORTABLE CAMPUS DENTAL CARE KIT"; cat = "ACCESSORIES"; c1 = "#F0FDFA"; c2 = "#CCFBF1"; acc = "#0D9488"; char = "basic" },
  @{ id = "prod-travel-pouch"; sku = "CNU-ACC-008"; name = "차차 여행용 파우치 3종 세트"; sub = "WATERPROOF MESH TRAVEL ORGANIZER 3PCS"; cat = "ACCESSORIES"; c1 = "#EFF6FF"; c2 = "#E0F2FE"; acc = "#1D4ED8"; char = "varsity" },
  @{ id = "prod-car-freshener"; sku = "CNU-ACC-009"; name = "차차 통풍구 차량 방향제"; sub = "PREMIUM SIGNATURE SCENT DIFFUSER"; cat = "ACCESSORIES"; c1 = "#FFF7ED"; c2 = "#FFEDD5"; acc = "#EA580C"; char = "grad" },
  @{ id = "prod-ecobag"; sku = "CNU-ACC-010"; name = "차차 캔버스 숄더 에코백"; sub = "HEAVY CANVAS CAMPUS TOTE & ECOBAG"; cat = "ACCESSORIES"; c1 = "#FAF5EF"; c2 = "#F3EADF"; acc = "#78350F"; char = "basic" },
  @{ id = "prod-custom-doll"; sku = "CNU-LIM-001"; name = "커스텀 의상 차차 인형 (25cm)"; sub = "UPCYCLED VARSITY CUSTOM PLUSH DOLL"; cat = "LIMITED"; c1 = "#0F172A"; c2 = "#1E293B"; acc = "#F59E0B"; char = "varsity" },
  @{ id = "prod-season-doll"; sku = "CNU-LIM-002"; name = "졸업 시즌 한정 차차 인형"; sub = "GRADUATION EDITION COLLECTIBLE PLUSH"; cat = "LIMITED"; c1 = "#FFF1F2"; c2 = "#FCE7F3"; acc = "#BE185D"; char = "grad" }
)

$fontFamily = New-Object System.Drawing.FontFamily("Malgun Gothic")
$fontTitle = New-Object System.Drawing.Font($fontFamily, 58, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fontSub = New-Object System.Drawing.Font($fontFamily, 26, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fontBadge = New-Object System.Drawing.Font($fontFamily, 24, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$fontSpec = New-Object System.Drawing.Font($fontFamily, 22, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

function Save-Downsampled([System.Drawing.Bitmap]$sourceBmp, [int]$targetW, [int]$targetH, [string]$destPath) {
  # Policy Rule 1 & 2: Never upscale if source is smaller than target
  $finalW = [Math]::Min($sourceBmp.Width, $targetW)
  $finalH = [Math]::Min($sourceBmp.Height, $targetH)
  $outBmp = New-Object System.Drawing.Bitmap($finalW, $finalH)
  $outBmp.SetResolution(300, 300)
  $g = [System.Drawing.Graphics]::FromImage($outBmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.DrawImage($sourceBmp, 0, 0, $finalW, $finalH)
  $g.Dispose()
  $outBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
  $outBmp.Dispose()
}

foreach ($p in $products) {
  $id = $p.id
  $charImg = if ($p.char -eq "varsity") { $imgVarsity } elseif ($p.char -eq "grad") { $imgGrad } else { $imgBasic }
  $col1 = [System.Drawing.ColorTranslator]::FromHtml($p.c1)
  $col2 = [System.Drawing.ColorTranslator]::FromHtml($p.c2)
  $colAcc = [System.Drawing.ColorTranslator]::FromHtml($p.acc)
  $isDark = ($p.c1 -eq "#0F172A")

  # 1600x1600 Native Studio Graphic
  $bmp1600 = New-Object System.Drawing.Bitmap(1600, 1600)
  $bmp1600.SetResolution(300, 300)
  $g = [System.Drawing.Graphics]::FromImage($bmp1600)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  $rect = New-Object System.Drawing.Rectangle(0, 0, 1600, 1600)
  $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, $col1, $col2, 135.0)
  $g.FillRectangle($bgBrush, $rect)
  $bgBrush.Dispose()

  $cardPath = New-RoundedRectPath 140 160 1320 1120 72
  $cardBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $g.FillPath($cardBrush, $cardPath)
  $borderPen = New-Object System.Drawing.Pen($colAcc, 6)
  $g.DrawPath($borderPen, $cardPath)
  $cardBrush.Dispose()
  $borderPen.Dispose()
  $cardPath.Dispose()

  # Draw 1024x1024 ChaCha character at 860x860 (DOWN-sampled, zero upscaling)
  $g.DrawImage($charImg, 370, 220, 860, 860)

  $badgePath = New-RoundedRectPath 200 210 380 58 29
  $badgeBrush = New-Object System.Drawing.SolidBrush($colAcc)
  $g.FillPath($badgeBrush, $badgePath)
  $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
  $g.DrawString("CNU OFFICIAL · $($p.sku)", $fontBadge, $whiteBrush, 228, 224)
  $badgeBrush.Dispose()
  $badgePath.Dispose()

  $resTagBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(240, 248, 255))
  $resTagPath = New-RoundedRectPath 1120 210 280 54 27
  $g.FillPath($resTagBrush, $resTagPath)
  $navyBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0, 32, 91))
  $g.DrawString("1600×1600 HD", $fontSpec, $navyBrush, 1175, 223)
  $resTagBrush.Dispose()
  $resTagPath.Dispose()

  $titleBrush = if ($isDark) { $whiteBrush } else { $navyBrush }
  $subBrush = New-Object System.Drawing.SolidBrush($colAcc)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = [System.Drawing.StringAlignment]::Center
  $g.DrawString($p.name, $fontTitle, $titleBrush, 800, 1330, $sf)
  $g.DrawString($p.sub, $fontSub, $subBrush, 800, 1418, $sf)

  $g.Dispose()

  # Policy Rule 8: Save original, ai_enhanced, large, medium, thumbnail
  $bmp1600.Save("$prodRoot\original\$id.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp1600.Save("$prodRoot\ai_enhanced\$id.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp1600.Save("$prodRoot\large\$id.png", [System.Drawing.Imaging.ImageFormat]::Png)
  Save-Downsampled $bmp1600 800 800 "$prodRoot\medium\$id.png"
  Save-Downsampled $bmp1600 400 400 "$prodRoot\thumbnail\$id.png"
  $bmp1600.Dispose()

  # 1600x2000 Lifestyle Editorial
  $bmpLife = New-Object System.Drawing.Bitmap(1600, 2000)
  $bmpLife.SetResolution(300, 300)
  $gl = [System.Drawing.Graphics]::FromImage($bmpLife)
  $gl.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $gl.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
  $gl.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

  $rectLife = New-Object System.Drawing.Rectangle(0, 0, 1600, 2000)
  $bgLife = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rectLife, [System.Drawing.Color]::FromArgb(15, 23, 42), [System.Drawing.Color]::FromArgb(30, 58, 138), 120.0)
  $gl.FillRectangle($bgLife, $rectLife)
  $bgLife.Dispose()

  $lifeCard = New-RoundedRectPath 120 260 1360 1240 64
  $gl.FillPath([System.Drawing.Brushes]::White, $lifeCard)
  $lifeCard.Dispose()

  $gl.DrawImage($charImg, 310, 340, 980, 980)
  $gl.DrawString("CNU CAMPUS LIFESTYLE LOOKBOOK", $fontSub, [System.Drawing.Brushes]::SkyBlue, 800, 110, $sf)
  $gl.DrawString($p.name, $fontTitle, [System.Drawing.Brushes]::White, 800, 1600, $sf)
  $gl.DrawString("충남대학교 공식 브랜드 스토어 · 1600×2000 STUDIO EDITORIAL", $fontSpec, [System.Drawing.Brushes]::LightSlateGray, 800, 1700, $sf)

  $gl.Dispose()
  $bmpLife.Save("$prodRoot\lifestyle\$id.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $bmpLife.Dispose()

  $whiteBrush.Dispose()
  $navyBrush.Dispose()
  $subBrush.Dispose()
  $sf.Dispose()
}

# 1920x800 Hero Banner
$bmpHero = New-Object System.Drawing.Bitmap(1920, 800)
$bmpHero.SetResolution(300, 300)
$gh = [System.Drawing.Graphics]::FromImage($bmpHero)
$gh.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gh.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$gh.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

$rectHero = New-Object System.Drawing.Rectangle(0, 0, 1920, 800)
$bgHero = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rectHero, [System.Drawing.Color]::FromArgb(15, 29, 64), [System.Drawing.Color]::FromArgb(28, 64, 148), 25.0)
$gh.FillRectangle($bgHero, $rectHero)
$bgHero.Dispose()

$cards = @(
  @{ x = 100; img = $imgBasic; label = "DAILY WHITE SETUP" },
  @{ x = 680; img = $imgVarsity; label = "CNU VARSITY JACKET" },
  @{ x = 1260; img = $imgGrad; label = "GRADUATION EDITION" }
)
foreach ($c in $cards) {
  $cp = New-RoundedRectPath $c.x 90 540 620 44
  $gh.FillPath([System.Drawing.Brushes]::White, $cp)
  $gh.DrawImage($c.img, ($c.x + 30), 110, 480, 480)
  $sfHero = New-Object System.Drawing.StringFormat
  $sfHero.Alignment = [System.Drawing.StringAlignment]::Center
  $gh.DrawString($c.label, $fontBadge, [System.Drawing.Brushes]::DarkBlue, ($c.x + 270), 625, $sfHero)
  $sfHero.Dispose()
  $cp.Dispose()
}

$gh.Dispose()
$bmpHero.Save("$root\chacha\hero_exhibition_1920x800.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmpHero.Dispose()

$fontTitle.Dispose()
$fontSub.Dispose()
$fontBadge.Dispose()
$fontSpec.Dispose()
$fontFamily.Dispose()
$imgBasic.Dispose()
$imgVarsity.Dispose()
$imgGrad.Dispose()

Write-Output "GENERATION_DONE"
