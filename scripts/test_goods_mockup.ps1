Add-Type -AssemblyName System.Drawing

$root = "c:\Users\ROCAT\Desktop\cnu-chacha-store\public\images"
$imgBasic = [System.Drawing.Image]::FromFile("$root\chacha\fitting_basic.jpg")
$imgVarsity = [System.Drawing.Image]::FromFile("$root\chacha\fitting_varsity.jpg")

function New-RoundedPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

# --- 1. ECOBAG ---
$bmpEco = New-Object System.Drawing.Bitmap 1600, 1600
$bmpEco.SetResolution(300, 300)
$g = [System.Drawing.Graphics]::FromImage($bmpEco)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

# Studio background: warm minimalist studio light
$bgRect = New-Object System.Drawing.Rectangle 0, 0, 1600, 1600
$bgBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new($bgRect, [System.Drawing.Color]::FromArgb(248, 249, 250), [System.Drawing.Color]::FromArgb(233, 236, 239), 90.0)
$g.FillRectangle($bgBrush, $bgRect)
$bgBrush.Dispose()

# Floor contact shadow for ecobag
$shadowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(35, 100, 110, 120))
$g.FillEllipse($shadowBrush, 360, 1420, 880, 70)
$shadowBrush.Color = [System.Drawing.Color]::FromArgb(50, 60, 70, 80)
$g.FillEllipse($shadowBrush, 440, 1435, 720, 45)
$shadowBrush.Dispose()

# Canvas tote straps (shoulder handles)
$strapPenBack = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(215, 208, 195), 44)
$strapPenBack.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
$strapPenBack.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
# Back strap loop
$strapPointsBack = @(
  [System.Drawing.PointF]::new(620, 560),
  [System.Drawing.PointF]::new(620, 180),
  [System.Drawing.PointF]::new(980, 180),
  [System.Drawing.PointF]::new(980, 560)
)
$g.DrawCurve($strapPenBack, $strapPointsBack, 0.6)
$strapPenBack.Dispose()

# Canvas Tote Bag Body (Natural ecru cotton fabric)
$bagPath = New-Object System.Drawing.Drawing2D.GraphicsPath
# Trapezoidal tote shape with soft rounded corners
$bagPath.AddLine(460, 520, 1140, 520)
$bagPath.AddArc(1100, 1380, 80, 80, 0, 90)
$bagPath.AddLine(1140, 1420, 460, 1420)
$bagPath.AddArc(420, 1380, 80, 80, 90, 90)
$bagPath.CloseFigure()

# Bag body gradient (natural fabric lighting)
$bagRect = New-Object System.Drawing.Rectangle 420, 520, 760, 940
$bagBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new($bagRect, [System.Drawing.Color]::FromArgb(250, 248, 242), [System.Drawing.Color]::FromArgb(238, 233, 222), 45.0)
$g.FillPath($bagBrush, $bagPath)
$bagBrush.Dispose()

# Subtle side depth fold shadows
$foldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(18, 0, 0, 0))
$g.FillRectangle($foldBrush, 440, 540, 50, 860)
$g.FillRectangle($foldBrush, 1110, 540, 50, 860)
$foldBrush.Dispose()

# Top hem fold band
$topHemPath = New-RoundedPath 440 520 720 70 12
$hemBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(235, 230, 218))
$g.FillPath($hemBrush, $topHemPath)
$hemBrush.Dispose()
$topHemPath.Dispose()

# Top stitching line (double line)
$stitchPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(195, 188, 175), 3)
$stitchPen.DashStyle = [System.Drawing.Drawing2D.DashStyle]::Dash
$g.DrawLine($stitchPen, 450, 540, 1150, 540)
$g.DrawLine($stitchPen, 450, 580, 1150, 580)
$stitchPen.Dispose()

# Front strap loop
$strapPenFront = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(235, 228, 215), 44)
$strapPointsFront = @(
  [System.Drawing.PointF]::new(600, 580),
  [System.Drawing.PointF]::new(600, 160),
  [System.Drawing.PointF]::new(1000, 160),
  [System.Drawing.PointF]::new(1000, 580)
)
$g.DrawCurve($strapPenFront, $strapPointsFront, 0.6)
$strapPenFront.Dispose()

# Strap stitch boxes at attachments
$stitchBoxBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 212, 198))
$g.FillRectangle($stitchBoxBrush, 580, 560, 44, 70)
$g.FillRectangle($stitchBoxBrush, 980, 560, 44, 70)
$stitchBoxBrush.Dispose()

# DRAW CHACHA GRAPHIC PRINT ON ECOBAG (center front)
$g.DrawImage($imgBasic, 550, 680, 500, 500)

# Screenprint brand label below graphic
$font = New-Object System.Drawing.Font("Arial", 28, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$printBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(0, 44, 118))
$g.DrawString("CHUNGNAM NATIONAL UNIVERSITY", $font, $printBrush, 800, 1220, $sf)
$subFont = New-Object System.Drawing.Font("Arial", 20, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$g.DrawString("ORIGINAL CNU CHACHA CAMPUS ECO BAG", $subFont, $printBrush, 800, 1265, $sf)

$printBrush.Dispose()
$font.Dispose()
$subFont.Dispose()
$sf.Dispose()
$bagPath.Dispose()
$g.Dispose()

$bmpEco.Save("public\images\test_ecobag_mockup.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmpEco.Dispose()

Write-Host "Ecobag mockup generated!"
