using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;

class GenerateGoods {
    static string root = @"c:\Users\ROCAT\Desktop\cnu-chacha-store\public\images";
    static string prodRoot = @"c:\Users\ROCAT\Desktop\cnu-chacha-store\public\images\products";
    static string outRoot = @"c:\Users\ROCAT\Desktop\cnu-chacha-store\out\images\products";

    static Bitmap MakeTransparent(string path) {
        Bitmap src = new Bitmap(path);
        int w = src.Width, h = src.Height;
        Bitmap dst = new Bitmap(w, h, PixelFormat.Format32bppArgb);

        bool[,] visited = new bool[w, h];
        Queue<Point> q = new Queue<Point>();

        for (int x = 0; x < w; x++) {
            q.Enqueue(new Point(x, 0)); visited[x, 0] = true;
            q.Enqueue(new Point(x, h - 1)); visited[x, h - 1] = true;
        }
        for (int y = 0; y < h; y++) {
            if (!visited[0, y]) { q.Enqueue(new Point(0, y)); visited[0, y] = true; }
            if (!visited[w - 1, y]) { q.Enqueue(new Point(w - 1, y)); visited[w - 1, y] = true; }
        }

        while (q.Count > 0) {
            Point p = q.Dequeue();
            Color c = src.GetPixel(p.X, p.Y);
            if (c.R > 235 && c.G > 235 && c.B > 235) {
                dst.SetPixel(p.X, p.Y, Color.FromArgb(0, 255, 255, 255));
                int[] dx = { -1, 1, 0, 0 };
                int[] dy = { 0, 0, -1, 1 };
                for (int i = 0; i < 4; i++) {
                    int nx = p.X + dx[i], ny = p.Y + dy[i];
                    if (nx >= 0 && nx < w && ny >= 0 && ny < h && !visited[nx, ny]) {
                        visited[nx, ny] = true;
                        q.Enqueue(new Point(nx, ny));
                    }
                }
            } else {
                dst.SetPixel(p.X, p.Y, c);
            }
        }

        for (int y = 0; y < h; y++) {
            for (int x = 0; x < w; x++) {
                if (!visited[x, y]) {
                    dst.SetPixel(x, y, src.GetPixel(x, y));
                }
            }
        }
        src.Dispose();
        return dst;
    }

    static void SaveMultiRes(Bitmap bmp1600, string id) {
        string[] dirs = { "original", "large", "ai_enhanced" };
        foreach (var d in dirs) {
            Directory.CreateDirectory(Path.Combine(prodRoot, d));
            Directory.CreateDirectory(Path.Combine(outRoot, d));
            bmp1600.Save(Path.Combine(prodRoot, d, id + ".png"), ImageFormat.Png);
            bmp1600.Save(Path.Combine(outRoot, d, id + ".png"), ImageFormat.Png);
        }

        // 800x800
        using (Bitmap b800 = new Bitmap(800, 800))
        using (Graphics g = Graphics.FromImage(b800)) {
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.DrawImage(bmp1600, 0, 0, 800, 800);
            Directory.CreateDirectory(Path.Combine(prodRoot, "medium"));
            Directory.CreateDirectory(Path.Combine(outRoot, "medium"));
            b800.Save(Path.Combine(prodRoot, "medium", id + ".png"), ImageFormat.Png);
            b800.Save(Path.Combine(outRoot, "medium", id + ".png"), ImageFormat.Png);

            string legName = id.Replace("-", "_") + ".png";
            b800.Save(Path.Combine(prodRoot, legName), ImageFormat.Png);
            b800.Save(Path.Combine(outRoot, legName), ImageFormat.Png);
        }

        // 400x400
        using (Bitmap b400 = new Bitmap(400, 400))
        using (Graphics g = Graphics.FromImage(b400)) {
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.DrawImage(bmp1600, 0, 0, 400, 400);
            Directory.CreateDirectory(Path.Combine(prodRoot, "thumbnail"));
            Directory.CreateDirectory(Path.Combine(outRoot, "thumbnail"));
            b400.Save(Path.Combine(prodRoot, "thumbnail", id + ".png"), ImageFormat.Png);
            b400.Save(Path.Combine(outRoot, "thumbnail", id + ".png"), ImageFormat.Png);
        }
        Console.WriteLine("Saved multi-res assets for: " + id);
    }

    static GraphicsPath RoundedRect(float x, float y, float w, float h, float r) {
        GraphicsPath path = new GraphicsPath();
        float d = r * 2;
        path.AddArc(x, y, d, d, 180, 90);
        path.AddArc(x + w - d, y, d, d, 270, 90);
        path.AddArc(x + w - d, y + h - d, d, d, 0, 90);
        path.AddArc(x, y + h - d, d, d, 90, 90);
        path.CloseFigure();
        return path;
    }

    static void DrawStudioBackground(Graphics g, int w, int h) {
        using (LinearGradientBrush bg = new LinearGradientBrush(new Rectangle(0, 0, w, h),
            Color.FromArgb(248, 250, 252), Color.FromArgb(235, 238, 242), 90f)) {
            g.FillRectangle(bg, 0, 0, w, h);
        }
    }

    static void DrawShadow(Graphics g, float cx, float cy, float rx, float ry) {
        using (SolidBrush s1 = new SolidBrush(Color.FromArgb(25, 30, 41, 59))) {
            g.FillEllipse(s1, cx - rx, cy - ry, rx * 2, ry * 2);
        }
        using (SolidBrush s2 = new SolidBrush(Color.FromArgb(40, 15, 23, 42))) {
            g.FillEllipse(s2, cx - rx * 0.7f, cy - ry * 0.6f, rx * 1.4f, ry * 1.2f);
        }
    }

    static void Main() {
        Console.WriteLine("Starting Goods Generation...");

        Bitmap charBasic = MakeTransparent(Path.Combine(root, "chacha", "fitting_basic.jpg"));
        Bitmap charVarsity = MakeTransparent(Path.Combine(root, "chacha", "fitting_varsity.jpg"));
        Bitmap charGrad = MakeTransparent(Path.Combine(root, "chacha", "fitting_graduation.jpg"));
        Console.WriteLine("Transparent ChaCha assets ready!");

        // 1. ECOBAG (prod-ecobag)
        using (Bitmap b = new Bitmap(1600, 1600))
        using (Graphics g = Graphics.FromImage(b)) {
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            DrawStudioBackground(g, 1600, 1600);
            DrawShadow(g, 800, 1420, 440, 50);

            // Straps back
            using (Pen sp = new Pen(Color.FromArgb(215, 208, 195), 44) { StartCap = LineCap.Round, EndCap = LineCap.Round }) {
                PointF[] pts = { new PointF(620, 560), new PointF(620, 180), new PointF(980, 180), new PointF(980, 560) };
                g.DrawCurve(sp, pts, 0.6f);
            }
            // Body
            using (GraphicsPath bp = new GraphicsPath()) {
                bp.AddLine(440, 520, 1160, 520);
                bp.AddArc(1110, 1370, 90, 90, 0, 90);
                bp.AddLine(1155, 1415, 445, 1415);
                bp.AddArc(400, 1370, 90, 90, 90, 90);
                bp.CloseFigure();
                using (LinearGradientBrush bb = new LinearGradientBrush(new Rectangle(400, 520, 800, 900),
                    Color.FromArgb(250, 248, 242), Color.FromArgb(238, 232, 220), 45f)) {
                    g.FillPath(bb, bp);
                }
                using (Pen bpPen = new Pen(Color.FromArgb(215, 207, 192), 2)) {
                    g.DrawPath(bpPen, bp);
                }
            }
            // Top hem band
            using (GraphicsPath hp = RoundedRect(420, 510, 760, 80, 10))
            using (SolidBrush hb = new SolidBrush(Color.FromArgb(235, 229, 216))) {
                g.FillPath(hb, hp);
            }
            // Straps front
            using (Pen sp = new Pen(Color.FromArgb(235, 228, 215), 44) { StartCap = LineCap.Round, EndCap = LineCap.Round }) {
                PointF[] pts = { new PointF(600, 590), new PointF(600, 160), new PointF(1000, 160), new PointF(1000, 590) };
                g.DrawCurve(sp, pts, 0.6f);
            }
            // ChaCha print (transparent graphic on canvas)
            g.DrawImage(charBasic, 550, 680, 500, 500);

            // Screenprinted brand lettering
            using (Font f1 = new Font("Arial", 28, FontStyle.Bold))
            using (Font f2 = new Font("Arial", 20, FontStyle.Regular))
            using (SolidBrush tb = new SolidBrush(Color.FromArgb(0, 44, 118)))
            using (StringFormat sf = new StringFormat { Alignment = StringAlignment.Center }) {
                g.DrawString("CHUNGNAM NATIONAL UNIVERSITY", f1, tb, 800, 1220, sf);
                g.DrawString("ORIGINAL CNU CHACHA CAMPUS ECO BAG", f2, tb, 800, 1265, sf);
            }
            SaveMultiRes(b, "prod-ecobag");
        }

        // 2. KEYRING (prod-keyring)
        using (Bitmap b = new Bitmap(1600, 1600))
        using (Graphics g = Graphics.FromImage(b)) {
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            DrawStudioBackground(g, 1600, 1600);

            // Shadow under keyring
            DrawShadow(g, 800, 1150, 360, 60);

            // Metal split ring at top
            using (Pen ringPen = new Pen(Color.FromArgb(200, 205, 215), 32)) {
                g.DrawEllipse(ringPen, 680, 120, 240, 240);
            }
            using (Pen ringShine = new Pen(Color.White, 8)) {
                g.DrawArc(ringShine, 700, 140, 200, 200, 200, 80);
            }
            // Chain links
            for (int i = 0; i < 3; i++) {
                int cy = 350 + i * 70;
                using (Pen chainPen = new Pen(Color.FromArgb(180, 185, 195), 18)) {
                    g.DrawEllipse(chainPen, 770, cy, 60, 90);
                }
            }

            // Acrylic charm border (contour following ChaCha)
            using (GraphicsPath ap = RoundedRect(420, 560, 760, 820, 120)) {
                // Clear acrylic glass body
                using (SolidBrush ab = new SolidBrush(Color.FromArgb(60, 255, 255, 255))) {
                    g.FillPath(ab, ap);
                }
                using (Pen aPen = new Pen(Color.FromArgb(140, 255, 255, 255), 14)) {
                    g.DrawPath(aPen, ap);
                }
                using (Pen aBorder = new Pen(Color.FromArgb(70, 0, 100, 200), 4)) {
                    g.DrawPath(aBorder, ap);
                }
            }

            // ChaCha print inside acrylic
            g.DrawImage(charBasic, 470, 600, 660, 660);

            // Diagonal glass reflection sheen
            using (Pen sheenPen = new Pen(Color.FromArgb(70, 255, 255, 255), 35)) {
                g.DrawLine(sheenPen, 480, 620, 750, 1300);
            }
            SaveMultiRes(b, "prod-keyring");
        }

        // 3. GRIPTOK / SMARTTOK (prod-griptok)
        using (Bitmap b = new Bitmap(1600, 1600))
        using (Graphics g = Graphics.FromImage(b)) {
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            DrawStudioBackground(g, 1600, 1600);

            // Base shadow
            DrawShadow(g, 800, 1280, 420, 55);

            // Black MagSafe base ring underneath
            using (SolidBrush bb = new SolidBrush(Color.FromArgb(40, 44, 52))) {
                g.FillEllipse(bb, 420, 420, 760, 760);
            }

            // White circular puck body
            using (LinearGradientBrush pb = new LinearGradientBrush(new Rectangle(440, 400, 720, 720),
                Color.White, Color.FromArgb(235, 240, 245), 45f)) {
                g.FillEllipse(pb, 440, 400, 720, 720);
            }
            using (Pen rimPen = new Pen(Color.FromArgb(200, 210, 220), 6)) {
                g.DrawEllipse(rimPen, 440, 400, 720, 720);
            }

            // ChaCha face graphic (zoomed into face for griptok aesthetic)
            g.DrawImage(charVarsity, 360, 280, 880, 880);

            // Glossy epoxy dome sheen (3D curved highlight)
            using (Pen gloss = new Pen(Color.FromArgb(90, 255, 255, 255), 18)) {
                g.DrawArc(gloss, 480, 440, 640, 640, 200, 80);
            }
            SaveMultiRes(b, "prod-griptok");
        }

        // 4. CUSTOM DOLL (prod-custom-doll) - 3D Plush Mascot Doll
        using (Bitmap b = new Bitmap(1600, 1600))
        using (Graphics g = Graphics.FromImage(b)) {
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            DrawStudioBackground(g, 1600, 1600);
            DrawShadow(g, 800, 1420, 400, 60);

            // Seated plush legs/body base
            using (SolidBrush pb = new SolidBrush(Color.FromArgb(245, 248, 252))) {
                g.FillEllipse(pb, 520, 1180, 240, 160);
                g.FillEllipse(pb, 840, 1180, 240, 160);
            }
            using (Pen sp = new Pen(Color.FromArgb(180, 195, 215), 3) { DashStyle = DashStyle.Dash }) {
                g.DrawEllipse(sp, 520, 1180, 240, 160);
                g.DrawEllipse(sp, 840, 1180, 240, 160);
            }

            // Plush Character body
            g.DrawImage(charVarsity, 360, 260, 880, 1100);

            // Fabric seam line on ears and body
            using (Pen stitch = new Pen(Color.FromArgb(120, 0, 44, 118), 3) { DashStyle = DashStyle.Dot }) {
                g.DrawArc(stitch, 480, 360, 200, 140, 160, 120);
                g.DrawArc(stitch, 920, 360, 200, 140, 260, 120);
            }

            // Authentic plush fabric tag sewn onto hip
            using (GraphicsPath tag = RoundedRect(1140, 1140, 140, 70, 10))
            using (SolidBrush tb = new SolidBrush(Color.FromArgb(0, 44, 118))) {
                g.FillPath(tb, tag);
                using (Font tf = new Font("Arial", 16, FontStyle.Bold))
                using (SolidBrush w = new SolidBrush(Color.White)) {
                    g.DrawString("CNU", tf, w, 1165, 1165);
                }
            }

            SaveMultiRes(b, "prod-custom-doll");
        }

        // 5. SEASON DOLL (prod-season-doll) - Graduation Edition Plush Doll
        using (Bitmap b = new Bitmap(1600, 1600))
        using (Graphics g = Graphics.FromImage(b)) {
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            DrawStudioBackground(g, 1600, 1600);
            DrawShadow(g, 800, 1420, 400, 60);

            // Seated plush legs
            using (SolidBrush pb = new SolidBrush(Color.FromArgb(245, 248, 252))) {
                g.FillEllipse(pb, 520, 1180, 240, 160);
                g.FillEllipse(pb, 840, 1180, 240, 160);
            }

            // Grad Character
            g.DrawImage(charGrad, 360, 240, 880, 1120);

            // Fabric tag
            using (GraphicsPath tag = RoundedRect(1140, 1140, 140, 70, 10))
            using (SolidBrush tb = new SolidBrush(Color.FromArgb(190, 24, 93))) {
                g.FillPath(tb, tag);
                using (Font tf = new Font("Arial", 14, FontStyle.Bold))
                using (SolidBrush w = new SolidBrush(Color.White)) {
                    g.DrawString("GRAD", tf, w, 1155, 1165);
                }
            }

            // Diploma scroll beside doll
            using (GraphicsPath sc = RoundedRect(400, 1260, 240, 80, 40))
            using (SolidBrush scb = new SolidBrush(Color.FromArgb(254, 249, 195))) {
                g.FillPath(scb, sc);
            }
            using (SolidBrush rb = new SolidBrush(Color.FromArgb(225, 29, 72))) {
                g.FillRectangle(rb, 500, 1260, 40, 80);
            }

            SaveMultiRes(b, "prod-season-doll");
        }

        // 6. FIGURE (prod-figure) - Planted on Display Pedestal
        using (Bitmap b = new Bitmap(1600, 1600))
        using (Graphics g = Graphics.FromImage(b)) {
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            DrawStudioBackground(g, 1600, 1600);

            // Display pedestal stand
            DrawShadow(g, 800, 1420, 480, 70);
            using (SolidBrush pb1 = new SolidBrush(Color.FromArgb(215, 222, 232))) {
                g.FillEllipse(pb1, 360, 1180, 880, 200);
            }
            using (LinearGradientBrush pb2 = new LinearGradientBrush(new Rectangle(360, 1140, 880, 200),
                Color.White, Color.FromArgb(232, 238, 246), 90f)) {
                g.FillEllipse(pb2, 360, 1140, 880, 190);
            }
            using (Pen rPen = new Pen(Color.FromArgb(0, 44, 118), 8)) {
                g.DrawEllipse(rPen, 400, 1160, 800, 150);
            }

            // Contact shadow directly beneath figurine feet on the pedestal
            using (SolidBrush footShadow = new SolidBrush(Color.FromArgb(60, 0, 20, 60))) {
                g.FillEllipse(footShadow, 640, 1180, 320, 50);
            }

            // 3D Vinyl toy figure firmly standing on pedestal
            g.DrawImage(charGrad, 420, 475, 760, 840);

            // Specular vinyl gloss highlight arc
            using (Pen sheen = new Pen(Color.FromArgb(70, 255, 255, 255), 16)) {
                g.DrawArc(sheen, 580, 460, 440, 440, 200, 70);
            }
            SaveMultiRes(b, "prod-figure");
        }

        // 7. LAPTOP POUCH (prod-laptop-pouch)
        using (Bitmap b = new Bitmap(1600, 1600))
        using (Graphics g = Graphics.FromImage(b)) {
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            DrawStudioBackground(g, 1600, 1600);
            DrawShadow(g, 800, 1340, 580, 60);

            // Navy quilted sleeve body
            using (GraphicsPath pp = RoundedRect(240, 420, 1120, 820, 60)) {
                using (LinearGradientBrush pb = new LinearGradientBrush(new Rectangle(240, 420, 1120, 820),
                    Color.FromArgb(26, 42, 74), Color.FromArgb(15, 23, 42), 45f)) {
                    g.FillPath(pb, pp);
                }
                // Diamond quilted stitching
                using (Pen qp = new Pen(Color.FromArgb(40, 100, 150, 220), 2)) {
                    for (int x = -400; x < 2000; x += 120) {
                        g.DrawLine(qp, x, 420, x + 820, 1240);
                        g.DrawLine(qp, x + 820, 420, x, 1240);
                    }
                }
                // Top zipper line
                using (Pen zipPen = new Pen(Color.FromArgb(180, 190, 205), 8)) {
                    g.DrawLine(zipPen, 300, 440, 1300, 440);
                }
                using (SolidBrush pull = new SolidBrush(Color.FromArgb(220, 225, 235))) {
                    g.FillRectangle(pull, 290, 430, 40, 60);
                }
            }

            // ChaCha embroidered patch sewn onto bottom right
            using (GraphicsPath patch = RoundedRect(880, 720, 420, 460, 40)) {
                using (SolidBrush pb = new SolidBrush(Color.FromArgb(245, 248, 255))) {
                    g.FillPath(pb, patch);
                }
                using (Pen stitch = new Pen(Color.FromArgb(0, 44, 118), 5) { DashStyle = DashStyle.Dash }) {
                    g.DrawPath(stitch, patch);
                }
            }
            g.DrawImage(charVarsity, 920, 750, 340, 400);

            SaveMultiRes(b, "prod-laptop-pouch");
        }

        // 8. POWERBANK (prod-powerbank)
        using (Bitmap b = new Bitmap(1600, 1600))
        using (Graphics g = Graphics.FromImage(b)) {
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            DrawStudioBackground(g, 1600, 1600);
            DrawShadow(g, 800, 1380, 360, 50);

            // Sleek white power bank casing
            using (GraphicsPath pbp = RoundedRect(480, 320, 640, 1020, 70)) {
                using (LinearGradientBrush pbb = new LinearGradientBrush(new Rectangle(480, 320, 640, 1020),
                    Color.White, Color.FromArgb(238, 242, 246), 45f)) {
                    g.FillPath(pbb, pbp);
                }
                using (Pen edge = new Pen(Color.FromArgb(220, 226, 234), 4)) {
                    g.DrawPath(edge, pbp);
                }
            }

            // Top ports
            using (SolidBrush port = new SolidBrush(Color.FromArgb(40, 45, 55))) {
                g.FillRectangle(port, 680, 310, 100, 18);
                g.FillRectangle(port, 820, 310, 100, 18);
            }

            // 4 LED battery dots
            using (SolidBrush led = new SolidBrush(Color.FromArgb(14, 165, 233))) {
                for (int i = 0; i < 4; i++) {
                    g.FillEllipse(led, 680 + i * 70, 380, 16, 16);
                }
            }

            // ChaCha print center
            g.DrawImage(charBasic, 550, 480, 500, 500);

            // Tech specs lettering
            using (Font tf = new Font("Arial", 22, FontStyle.Bold))
            using (SolidBrush tb = new SolidBrush(Color.FromArgb(140, 150, 165)))
            using (StringFormat sf = new StringFormat { Alignment = StringAlignment.Center }) {
                g.DrawString("10000mAh  |  PD 20W FAST CHARGE", tf, tb, 800, 1140, sf);
                g.DrawString("CNU OFFICIAL POWER BANK", tf, tb, 800, 1190, sf);
            }
            SaveMultiRes(b, "prod-powerbank");
        }

        // 9. TOOTHBRUSH KIT (prod-toothbrush)
        using (Bitmap b = new Bitmap(1600, 1600))
        using (Graphics g = Graphics.FromImage(b)) {
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            DrawStudioBackground(g, 1600, 1600);
            DrawShadow(g, 800, 1400, 280, 50);

            // Frosted outer case
            using (GraphicsPath cp = RoundedRect(560, 200, 480, 1200, 140)) {
                using (LinearGradientBrush cb = new LinearGradientBrush(new Rectangle(560, 200, 480, 1200),
                    Color.FromArgb(240, 253, 250), Color.FromArgb(204, 251, 241), 90f)) {
                    g.FillPath(cb, cp);
                }
                using (Pen cPen = new Pen(Color.FromArgb(94, 234, 212), 8)) {
                    g.DrawPath(cPen, cp);
                }
            }

            // Toothbrush handle (pastel mint green with rubber grip pads)
            using (GraphicsPath th = RoundedRect(720, 360, 70, 840, 35))
            using (SolidBrush thb = new SolidBrush(Color.FromArgb(13, 148, 136))) {
                g.FillPath(thb, th);
            }
            // Bristle head at top
            using (GraphicsPath br = RoundedRect(715, 260, 80, 120, 20))
            using (SolidBrush brb = new SolidBrush(Color.White)) {
                g.FillPath(brb, br);
            }
            // Mini toothpaste tube beside it
            using (GraphicsPath tp = RoundedRect(830, 680, 80, 320, 20))
            using (SolidBrush tpb = new SolidBrush(Color.FromArgb(45, 212, 191))) {
                g.FillPath(tpb, tp);
            }

            // ChaCha graphic on frosted case
            g.DrawImage(charBasic, 620, 720, 360, 360);

            // Campus dental kit branding
            using (Font tf = new Font("Arial", 18, FontStyle.Bold))
            using (SolidBrush tb = new SolidBrush(Color.FromArgb(15, 118, 110)))
            using (StringFormat sf = new StringFormat { Alignment = StringAlignment.Center }) {
                g.DrawString("CNU PORTABLE DENTAL KIT", tf, tb, 800, 1160, sf);
            }

            SaveMultiRes(b, "prod-toothbrush");
        }

        // 10. TRAVEL POUCH (prod-travel-pouch)
        using (Bitmap b = new Bitmap(1600, 1600))
        using (Graphics g = Graphics.FromImage(b)) {
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            DrawStudioBackground(g, 1600, 1600);
            DrawShadow(g, 800, 1400, 560, 60);

            // Large pouch (CNU Navy #1E3A8A)
            using (GraphicsPath lp = RoundedRect(260, 440, 1080, 800, 50))
            using (SolidBrush lb = new SolidBrush(Color.FromArgb(30, 58, 138))) {
                g.FillPath(lb, lp);
            }

            // Medium pouch (Sky Blue #0284C7)
            using (GraphicsPath mp = RoundedRect(340, 520, 920, 680, 40))
            using (SolidBrush mb = new SolidBrush(Color.FromArgb(2, 132, 199))) {
                g.FillPath(mb, mp);
            }

            // Small front pouch (Pastel cyan #E0F2FE)
            using (GraphicsPath sp = RoundedRect(440, 620, 720, 540, 30))
            using (SolidBrush sb = new SolidBrush(Color.FromArgb(224, 242, 254))) {
                g.FillPath(sb, sp);
                using (Pen sPen = new Pen(Color.FromArgb(56, 189, 248), 4)) {
                    g.DrawPath(sPen, sp);
                }
            }

            // Mesh texture on small pouch
            using (Pen meshPen = new Pen(Color.FromArgb(40, 2, 132, 199), 2)) {
                for (int x = 460; x < 1140; x += 30) {
                    g.DrawLine(meshPen, x, 640, x, 1140);
                }
                for (int y = 640; y < 1140; y += 30) {
                    g.DrawLine(meshPen, 460, y, 1140, y);
                }
            }

            // Carry handle at top
            using (GraphicsPath handle = RoundedRect(680, 380, 240, 70, 20))
            using (Pen hp = new Pen(Color.FromArgb(15, 23, 42), 24) { StartCap = LineCap.Round, EndCap = LineCap.Round }) {
                g.DrawPath(hp, handle);
            }

            // ChaCha printed on front pouch (NO white background box)
            g.DrawImage(charVarsity, 580, 680, 440, 440);

            // Woven label tag
            using (GraphicsPath tag = RoundedRect(460, 640, 160, 50, 10))
            using (SolidBrush tb = new SolidBrush(Color.FromArgb(30, 58, 138))) {
                g.FillPath(tb, tag);
                using (Font tf = new Font("Arial", 16, FontStyle.Bold))
                using (SolidBrush w = new SolidBrush(Color.White)) {
                    g.DrawString("TRAVEL 3P", tf, w, 480, 655);
                }
            }

            SaveMultiRes(b, "prod-travel-pouch");
        }

        // 11. CAR FRESHENER (prod-car-freshener)
        using (Bitmap b = new Bitmap(1600, 1600))
        using (Graphics g = Graphics.FromImage(b)) {
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            DrawStudioBackground(g, 1600, 1600);
            DrawShadow(g, 800, 1260, 360, 50);

            // Car air vent clip ring (Chrome bezel)
            using (LinearGradientBrush cb = new LinearGradientBrush(new Rectangle(440, 420, 720, 720),
                Color.FromArgb(235, 240, 245), Color.FromArgb(170, 180, 195), 45f)) {
                g.FillEllipse(cb, 440, 420, 720, 720);
            }
            using (SolidBrush inner = new SolidBrush(Color.FromArgb(30, 41, 59))) {
                g.FillEllipse(inner, 480, 460, 640, 640);
            }

            // 3D ChaCha head diffuser
            g.DrawImage(charGrad, 460, 360, 680, 680);

            // Scent vent slits
            using (Pen slitPen = new Pen(Color.FromArgb(100, 255, 255, 255), 4)) {
                g.DrawLine(slitPen, 580, 1020, 1020, 1020);
                g.DrawLine(slitPen, 640, 1050, 960, 1050);
            }
            SaveMultiRes(b, "prod-car-freshener");
        }

        // 12. MEMO PAD (prod-memo)
        using (Bitmap b = new Bitmap(1600, 1600))
        using (Graphics g = Graphics.FromImage(b)) {
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            DrawStudioBackground(g, 1600, 1600);
            DrawShadow(g, 800, 1380, 460, 60);

            // 3D paper stack thickness on bottom/right (100 sheets)
            using (GraphicsPath thick = RoundedRect(440, 380, 780, 960, 30))
            using (SolidBrush tb = new SolidBrush(Color.FromArgb(230, 225, 210))) {
                g.FillPath(tb, thick);
            }
            // Sheet line textures
            using (Pen linePen = new Pen(Color.FromArgb(200, 195, 180), 2)) {
                for (int y = 1300; y < 1340; y += 8) {
                    g.DrawLine(linePen, 460, y, 1200, y);
                }
            }

            // Top sheet
            using (GraphicsPath top = RoundedRect(420, 340, 760, 940, 30))
            using (SolidBrush topBrush = new SolidBrush(Color.FromArgb(255, 253, 245))) {
                g.FillPath(topBrush, top);
                using (Pen edge = new Pen(Color.FromArgb(235, 230, 215), 2)) {
                    g.DrawPath(edge, top);
                }
            }

            // Study grid lines
            using (Pen gridPen = new Pen(Color.FromArgb(230, 238, 245), 2)) {
                for (int y = 820; y < 1220; y += 45) {
                    g.DrawLine(gridPen, 480, y, 1120, y);
                }
            }

            // ChaCha illustration on memo pad top
            g.DrawImage(charBasic, 580, 380, 440, 440);

            // Title
            using (Font f = new Font("Arial", 28, FontStyle.Bold))
            using (SolidBrush tb = new SolidBrush(Color.FromArgb(217, 119, 6)))
            using (StringFormat sf = new StringFormat { Alignment = StringAlignment.Center }) {
                g.DrawString("CHACHA STUDY MEMO PAD (100 SHEETS)", f, tb, 800, 780, sf);
            }
            SaveMultiRes(b, "prod-memo");
        }

        // 13. STICKER PACK (prod-limited-sticker)
        using (Bitmap b = new Bitmap(1600, 1600))
        using (Graphics g = Graphics.FromImage(b)) {
            g.SmoothingMode = SmoothingMode.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            DrawStudioBackground(g, 1600, 1600);
            DrawShadow(g, 800, 1380, 480, 60);

            // Holographic backing card
            using (GraphicsPath card = RoundedRect(380, 280, 840, 1060, 40)) {
                using (LinearGradientBrush cardBrush = new LinearGradientBrush(new Rectangle(380, 280, 840, 1060),
                    Color.FromArgb(254, 240, 255), Color.FromArgb(224, 231, 255), 45f)) {
                    g.FillPath(cardBrush, card);
                }
                using (Pen cPen = new Pen(Color.FromArgb(192, 132, 252), 4)) {
                    g.DrawPath(cPen, card);
                }
            }

            // Top title
            using (Font f = new Font("Arial", 30, FontStyle.Bold))
            using (SolidBrush tb = new SolidBrush(Color.FromArgb(147, 51, 234)))
            using (StringFormat sf = new StringFormat { Alignment = StringAlignment.Center }) {
                g.DrawString("CNU CHACHA HOLOGRAM STICKER PACK", f, tb, 800, 320, sf);
            }

            // 3 Die-cut ChaCha stickers arranged on sheet
            // Sticker 1 (Varsity)
            using (GraphicsPath s1 = RoundedRect(440, 400, 340, 420, 30)) {
                using (SolidBrush sb = new SolidBrush(Color.White)) { g.FillPath(sb, s1); }
                using (Pen sp = new Pen(Color.FromArgb(192, 132, 252), 3) { DashStyle = DashStyle.Dash }) { g.DrawPath(sp, s1); }
            }
            g.DrawImage(charVarsity, 460, 420, 300, 380);

            // Sticker 2 (Graduation)
            using (GraphicsPath s2 = RoundedRect(820, 400, 340, 420, 30)) {
                using (SolidBrush sb = new SolidBrush(Color.White)) { g.FillPath(sb, s2); }
                using (Pen sp = new Pen(Color.FromArgb(192, 132, 252), 3) { DashStyle = DashStyle.Dash }) { g.DrawPath(sp, s2); }
            }
            g.DrawImage(charGrad, 840, 420, 300, 380);

            // Sticker 3 (Basic center bottom)
            using (GraphicsPath s3 = RoundedRect(610, 840, 380, 460, 30)) {
                using (SolidBrush sb = new SolidBrush(Color.White)) { g.FillPath(sb, s3); }
                using (Pen sp = new Pen(Color.FromArgb(192, 132, 252), 3) { DashStyle = DashStyle.Dash }) { g.DrawPath(sp, s3); }
            }
            g.DrawImage(charBasic, 630, 860, 340, 420);

            // Rainbow holographic sheen arc
            using (Pen rain = new Pen(Color.FromArgb(60, 255, 255, 255), 24)) {
                g.DrawLine(rain, 400, 320, 1100, 1300);
            }
            SaveMultiRes(b, "prod-limited-sticker");
        }

        charBasic.Dispose();
        charVarsity.Dispose();
        charGrad.Dispose();

        Console.WriteLine("ALL 13 GOODS MOCKUPS GENERATED AND INSTALLED SUCCESSFULLY!");
    }
}
