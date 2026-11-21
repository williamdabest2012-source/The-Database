from __future__ import annotations

import math
import os
import random
import sys
import time
from dataclasses import dataclass

os.environ.setdefault("PYGAME_HIDE_SUPPORT_PROMPT", "1")

import pygame

from waffle_core.data import BUILDINGS, GOLDEN_SECONDS, LAYERS, RUSH_SECONDS
from waffle_core.state import (
    GameState,
    building_cost,
    depth_km,
    format_depth,
    format_number,
    format_rate,
    load_state,
    save_state,
)

WIDTH, HEIGHT = 1280, 720
EARTH_POS = (390, 390)
EARTH_R = 168

SOIL = (9, 6, 5)
BATTER = (255, 243, 214)
WAFFLE = (244, 185, 66)
CRUST = (139, 69, 19)
MAGMA = (255, 90, 31)
SYRUP = (196, 92, 18)
PANEL = (18, 12, 8)


@dataclass
class Particle:
    x: float
    y: float
    vx: float
    vy: float
    life: float
    max_life: float
    kind: str
    text: str = ""
    rot: float = 0.0


@dataclass
class Golden:
    x: float
    y: float
    vx: float
    vy: float
    until: float


def _font(size: int, bold: bool = False) -> pygame.font.Font:
    names = ["dejavusans", "ubuntu", "liberation sans", "freesans"]
    font = pygame.font.SysFont(names, size, bold=bold)
    return font


def _circle(surface: pygame.Surface, color: tuple, pos: tuple[float, float], radius: int) -> None:
    pygame.draw.circle(surface, color, (int(pos[0]), int(pos[1])), radius)


def _text(surface: pygame.Surface, font: pygame.font.Font, text: str, color, pos, center=False, right=False) -> pygame.Rect:
    image = font.render(text, True, color)
    rect = image.get_rect()
    if center:
        rect.center = pos
    elif right:
        rect.midright = pos
    else:
        rect.topleft = pos
    surface.blit(image, rect)
    return rect


def make_click_sound() -> pygame.mixer.Sound:
    sample_rate = 22050
    n = int(sample_rate * 0.07)
    buf = bytearray()
    for i in range(n):
        t = i / sample_rate
        env = max(0.0, 1.0 - t / 0.07)
        sample = int(12000 * env * math.sin(2 * math.pi * (210 + i * 0.08) * t))
        buf += int(sample).to_bytes(2, "little", signed=True)
    return pygame.mixer.Sound(buffer=bytes(buf))


class WafflesonGame:
    def __init__(self) -> None:
        pygame.init()
        pygame.display.set_caption("Waffleson — Drill Earth. Serve Hot.")
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        self.clock = pygame.time.Clock()
        self.state = load_state()
        self.now = time.time()
        self.t = 0.0
        self.shake = 0.0
        self.squash = 1.0
        self.particles: list[Particle] = []
        self.golden: Golden | None = None
        self.next_golden_at = self.now + 8
        self.tab = "rigs"
        self.qty = 1
        self.scroll = 0
        self.banner: str | None = None
        self.banner_until = 0.0
        self.last_layer = self.state.layer()["id"]
        self.confirm_reset = False
        self.running = True
        self.big = _font(54, True)
        self.med = _font(22, True)
        self.body = _font(16)
        self.small = _font(13)
        self.tiny = _font(11)
        self.click_sound = None
        try:
            pygame.mixer.init(frequency=22050, size=-16, channels=1, buffer=256)
            self.click_sound = make_click_sound()
        except pygame.error:
            try:
                os.environ["SDL_AUDIODRIVER"] = "dummy"
                pygame.mixer.init(frequency=22050, size=-16, channels=1, buffer=256)
                self.click_sound = make_click_sound()
            except pygame.error:
                self.click_sound = None
        self.shop_rect = pygame.Rect(820, 24, 436, HEIGHT - 48)
        self.rows: list[tuple[pygame.Rect, str, str]] = []

    def play(self) -> None:
        if self.state.muted or not self.click_sound:
            return
        self.click_sound.set_volume(0.25)
        self.click_sound.play()

    def spawn_particles(self, x: float, y: float, amount: float, crit: bool) -> None:
        self.particles.append(
            Particle(x, y, 0, -70, 0.9, 0.9, "floater", f"+{format_number(amount, 1)}" + (" CRIT!" if crit else ""))
        )
        for _ in range(10):
            angle = random.random() * math.tau
            speed = 80 + random.random() * 140
            self.particles.append(
                Particle(x, y, math.cos(angle) * speed, math.sin(angle) * speed - 40, 0.7, 0.7, "crumb", rot=random.random() * 6)
            )

    def drill_at(self, pos: tuple[int, int] | None = None) -> None:
        amount, combo, crit = self.state.click(self.now, random.random())
        sx, sy = pos or EARTH_POS
        self.spawn_particles(sx, sy, amount, crit)
        self.shake = 8 if crit else 5
        self.squash = 0.88
        self.play()
        _ = combo

    def maybe_banner(self) -> None:
        layer_id = self.state.layer()["id"]
        if layer_id != self.last_layer and self.state.total_waffles > 0:
            layer = self.state.layer()
            self.banner = f"{layer['name']}  —  {layer['blurb']}"
            self.banner_until = self.t + 3.2
            self.last_layer = layer_id

    def handle_events(self) -> None:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
            elif event.type == pygame.KEYDOWN:
                if event.key == pygame.K_ESCAPE:
                    if self.confirm_reset:
                        self.confirm_reset = False
                    else:
                        self.running = False
                elif event.key == pygame.K_m:
                    self.state.muted = not self.state.muted
                elif event.key == pygame.K_SPACE:
                    self.drill_at(EARTH_POS)
                elif event.key in (pygame.K_1, pygame.K_2, pygame.K_3):
                    self.qty = {pygame.K_1: 1, pygame.K_2: 10, pygame.K_3: 100}[event.key]
            elif event.type == pygame.MOUSEWHEEL:
                if self.shop_rect.collidepoint(pygame.mouse.get_pos()):
                    self.scroll = max(0, self.scroll - event.y * 36)
            elif event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
                self.on_click(event.pos)

    def on_click(self, pos: tuple[int, int]) -> None:
        if self.confirm_reset:
            keep = pygame.Rect(WIDTH // 2 - 170, HEIGHT // 2 + 36, 150, 42)
            wipe = pygame.Rect(WIDTH // 2 + 10, HEIGHT // 2 + 36, 160, 42)
            if keep.collidepoint(pos):
                self.confirm_reset = False
            elif wipe.collidepoint(pos):
                muted = self.state.muted
                self.state = GameState()
                self.state.muted = muted
                self.confirm_reset = False
                self.banner = None
            return

        if self.golden and math.hypot(pos[0] - self.golden.x, pos[1] - self.golden.y) < 34:
            self.state.rush_until = self.now + RUSH_SECONDS
            self.golden = None
            self.banner = "SYRUP RUSH  x7  —  Waffleson is unhinged."
            self.banner_until = self.t + 2.4
            self.play()
            return

        ox, oy = self.cam()
        earth = (EARTH_POS[0] + ox, EARTH_POS[1] + oy)
        if math.hypot(pos[0] - earth[0], pos[1] - earth[1]) <= EARTH_R + 8:
            self.drill_at(pos)
            return

        for rect, kind, ident in self.rows:
            if rect.collidepoint(pos):
                if kind == "tab":
                    self.tab = ident
                    self.scroll = 0
                elif kind == "qty":
                    self.qty = int(ident)
                elif kind == "buy":
                    self.state.buy(ident, self.qty)
                    self.play()
                elif kind == "upgrade":
                    self.state.buy_upgrade(ident)
                    self.play()
                elif kind == "mute":
                    self.state.muted = not self.state.muted
                elif kind == "reset":
                    self.confirm_reset = True
                return

    def cam(self) -> tuple[float, float]:
        if self.shake <= 0:
            return 0.0, 0.0
        return random.uniform(-self.shake, self.shake), random.uniform(-self.shake, self.shake)

    def update(self, dt: float) -> None:
        self.now = time.time()
        self.t += dt
        self.state.tick(dt, self.now)
        self.shake = max(0.0, self.shake - dt * 28)
        self.squash += (1.0 - self.squash) * min(1.0, dt * 10)
        self.maybe_banner()

        alive = []
        for particle in self.particles:
            particle.life -= dt
            if particle.life <= 0:
                continue
            particle.x += particle.vx * dt
            particle.y += particle.vy * dt
            particle.vy += 90 * dt
            alive.append(particle)
        self.particles = alive

        if self.golden:
            self.golden.x += self.golden.vx * dt
            self.golden.y += self.golden.vy * dt
            if self.golden.x < 40 or self.golden.x > 760:
                self.golden.vx *= -1
            if self.golden.y < 80 or self.golden.y > 640:
                self.golden.vy *= -1
            if self.now > self.golden.until:
                self.golden = None
        elif self.now >= self.next_golden_at and self.state.total_waffles >= 12:
            self.golden = Golden(120, 160, 70, 55, self.now + GOLDEN_SECONDS)
            self.next_golden_at = self.now + 28 + random.random() * 18

        if int(self.t * 2) != int((self.t - dt) * 2):
            save_state(self.state)

    def draw_background(self) -> None:
        self.screen.fill(SOIL)
        stage = self.state.layer()["stage"]
        rushing = self.state.derived(self.now)["rushing"]
        glow = WAFFLE if rushing else MAGMA if stage >= 3 else CRUST
        for i in range(8, 0, -1):
            alpha_surf = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
            pygame.draw.circle(alpha_surf, (*glow, 10 + i * 4), (390, 390), 90 + i * 55)
            self.screen.blit(alpha_surf, (0, 0))
        rng = random.Random(7)
        for _ in range(70):
            x, y = rng.randint(0, 800), rng.randint(0, HEIGHT)
            pygame.draw.circle(self.screen, (255, 243, 214, ), (x, y), rng.choice((1, 1, 2)))

    def draw_earth(self, origin: tuple[float, float]) -> None:
        stage = self.state.layer()["stage"]
        cx, cy = origin
        _circle(self.screen, (90, 40, 12), (cx, cy), EARTH_R + 12)
        _circle(self.screen, (196, 92, 18), (cx, cy), EARTH_R)
        highlight = pygame.Surface((EARTH_R * 2, EARTH_R * 2), pygame.SRCALPHA)
        pygame.draw.circle(highlight, (255, 231, 168, 70), (int(EARTH_R * 0.7), int(EARTH_R * 0.65)), int(EARTH_R * 0.72))
        self.screen.blit(highlight, (cx - EARTH_R, cy - EARTH_R))
        pygame.draw.ellipse(self.screen, (122, 46, 8), pygame.Rect(cx - 110, cy - 70, 150, 80))
        pygame.draw.ellipse(self.screen, (90, 34, 8), pygame.Rect(cx + 8, cy + 8, 124, 72))
        pygame.draw.ellipse(self.screen, (244, 210, 122), pygame.Rect(cx - 18, cy - 70, 70, 28))
        pygame.draw.ellipse(self.screen, (232, 148, 42), pygame.Rect(cx - 70, cy + 40, 80, 36))
        if stage >= 2:
            _circle(self.screen, MAGMA, (cx, cy), 58 + stage * 6)
        if stage >= 4:
            _circle(self.screen, BATTER, (cx, cy), 24)
        drips = ((-42, 26, 9), (0, 40, 13), (38, 22, 8), (18, 16, 6))
        for dx, length, radius in drips:
            stem = pygame.Rect(0, 0, radius + 2, length)
            stem.midtop = (cx + dx, cy + EARTH_R - 8)
            pygame.draw.ellipse(self.screen, SYRUP, stem)
            pygame.draw.circle(self.screen, SYRUP, (int(cx + dx), int(cy + EARTH_R - 8 + length)), radius)
        pygame.draw.rect(self.screen, (20, 14, 10), pygame.Rect(cx - 5, cy - EARTH_R + 8, 10, EARTH_R - 8))
        pygame.draw.polygon(
            self.screen,
            (170, 176, 186),
            [
                (cx - 10, cy - EARTH_R - 18),
                (cx + 10, cy - EARTH_R - 18),
                (cx + 4, cy - EARTH_R + 10),
                (cx - 4, cy - EARTH_R + 10),
            ],
        )
        pygame.draw.rect(self.screen, (90, 90, 90), pygame.Rect(cx - 3, cy - EARTH_R - 48, 6, 34))

    def draw_waffleson(self, origin: tuple[float, float]) -> None:
        cx, cy = origin[0], origin[1] + 36
        h = 118 * self.squash
        w = 118 / self.squash
        body = pygame.Rect(0, 0, w, h)
        body.center = (cx, cy)
        pygame.draw.rect(self.screen, CRUST, body, border_radius=22)
        inset = 7
        pocket_w = (w - inset * 5) / 4
        pocket_h = (h - inset * 5) / 4
        for row in range(4):
            for col in range(4):
                pocket = pygame.Rect(
                    body.left + inset + col * (pocket_w + inset),
                    body.top + inset + row * (pocket_h + inset),
                    pocket_w,
                    pocket_h,
                )
                pygame.draw.rect(self.screen, WAFFLE, pocket, border_radius=6)

    def draw_depth(self) -> None:
        km = depth_km(self.state.total_waffles)
        col = pygame.Rect(28, 86, 22, 560)
        pygame.draw.rect(self.screen, (8, 6, 4), col, border_radius=12)
        pygame.draw.rect(self.screen, WAFFLE, col, width=1, border_radius=12)
        colors = {0: (61, 41, 20), 1: (107, 58, 31), 2: (196, 92, 18), 3: MAGMA, 4: WAFFLE}
        y = col.top
        current = self.state.layer()
        for i, layer in enumerate(LAYERS):
            nxt = LAYERS[i + 1] if i + 1 < len(LAYERS) else None
            start = layer["min_km"] / 6371
            end = (nxt["min_km"] if nxt else 6371) / 6371
            h = max(6, (end - start) * col.height)
            reached = km >= layer["min_km"]
            pygame.draw.rect(self.screen, colors[layer["stage"]] if reached else (26, 18, 12), pygame.Rect(col.x, y, col.w, h))
            if layer["id"] == current["id"]:
                _text(self.screen, self.tiny, layer["name"], WAFFLE, (col.right + 8, y + h / 2 - 6))
            y += h
        marker = col.top + min(0.99, km / 6371) * col.height
        pygame.draw.rect(self.screen, BATTER, pygame.Rect(col.x - 2, marker, col.w + 4, 3))
        _text(self.screen, self.tiny, "BOREHOLE", WAFFLE, (18, 64))
        _text(self.screen, self.small, format_depth(km), BATTER, (18, 656))

    def draw_hud(self, stats: dict) -> None:
        _text(self.screen, self.small, "WAFFLESON", WAFFLE, (WIDTH * 0.32, 28), center=True)
        _text(self.screen, self.big, format_number(self.state.waffles), WAFFLE, (WIDTH * 0.32, 78), center=True)
        _text(
            self.screen,
            self.body,
            f"waffles drilled  ·  {format_rate(stats['wps'])}",
            BATTER,
            (WIDTH * 0.32, 118),
            center=True,
        )
        chips = [
            self.state.layer()["name"],
            f"{format_number(stats['click_power'], 1)} / click",
        ]
        if self.state.combo > 1:
            chips.append(f"COMBO x{self.state.combo}")
        if stats["rushing"]:
            chips.append("SYRUP RUSH x7")
        x = WIDTH * 0.32 - (len(chips) * 70)
        for chip in chips:
            rect = pygame.Rect(0, 0, max(110, len(chip) * 9), 26)
            rect.center = (x + 70, 150)
            color = MAGMA if "COMBO" in chip else WAFFLE if "RUSH" in chip else (40, 28, 18)
            fg = SOIL if "RUSH" in chip else BATTER
            pygame.draw.rect(self.screen, color, rect, border_radius=14)
            pygame.draw.rect(self.screen, WAFFLE, rect, width=1, border_radius=14)
            _text(self.screen, self.tiny, chip, fg, rect.center, center=True)
            x += rect.w + 12
        if not self.state.seen_hint:
            hint = pygame.Rect(0, 0, 320, 28)
            hint.center = (EARTH_POS[0], 210)
            pygame.draw.rect(self.screen, WAFFLE, hint, border_radius=14)
            _text(self.screen, self.small, "Click Waffleson. Breakfast is down there.", SOIL, hint.center, center=True)
        nxt = self.state.next_layer()
        if nxt:
            _text(
                self.screen,
                self.tiny,
                f"Next layer: {nxt['name']} at {format_depth(nxt['min_km'])}",
                (180, 160, 130),
                (EARTH_POS[0], 640),
                center=True,
            )

    def draw_shop(self, stats: dict) -> None:
        self.rows = []
        pygame.draw.rect(self.screen, PANEL, self.shop_rect, border_radius=24)
        pygame.draw.rect(self.screen, (244, 185, 66, ), self.shop_rect, width=2, border_radius=24)
        tab_y = self.shop_rect.y + 16
        for i, (ident, label) in enumerate((("rigs", "Rigs"), ("toppings", "Toppings"))):
            rect = pygame.Rect(self.shop_rect.x + 16 + i * 110, tab_y, 100, 32)
            on = self.tab == ident
            pygame.draw.rect(self.screen, WAFFLE if on else (40, 28, 18), rect, border_radius=16)
            _text(self.screen, self.small, label, SOIL if on else BATTER, rect.center, center=True)
            self.rows.append((rect, "tab", ident))
        extras = 0
        if self.tab == "toppings":
            extras = len(self.state.visible_upgrades())
            if extras:
                badge = pygame.Rect(self.shop_rect.x + 198, tab_y - 6, 18, 18)
                pygame.draw.circle(self.screen, MAGMA, badge.center, 9)
                _text(self.screen, self.tiny, str(extras), BATTER, badge.center, center=True)
        for i, n in enumerate((1, 10, 100)):
            rect = pygame.Rect(self.shop_rect.right - 148 + i * 44, tab_y, 40, 32)
            on = self.qty == n and self.tab == "rigs"
            pygame.draw.rect(self.screen, WAFFLE if on else (40, 28, 18), rect, border_radius=12)
            _text(self.screen, self.tiny, f"x{n}", SOIL if on else BATTER, rect.center, center=True)
            self.rows.append((rect, "qty", str(n)))

        mute = pygame.Rect(self.shop_rect.x + 16, self.shop_rect.bottom - 48, 90, 32)
        reset = pygame.Rect(self.shop_rect.right - 106, self.shop_rect.bottom - 48, 90, 32)
        pygame.draw.rect(self.screen, (40, 28, 18), mute, border_radius=12)
        pygame.draw.rect(self.screen, (40, 28, 18), reset, border_radius=12)
        _text(self.screen, self.tiny, "Muted" if self.state.muted else "Sound", BATTER, mute.center, center=True)
        _text(self.screen, self.tiny, "Reset", BATTER, reset.center, center=True)
        self.rows.append((mute, "mute", "mute"))
        self.rows.append((reset, "reset", "reset"))

        clip = pygame.Rect(self.shop_rect.x + 10, tab_y + 48, self.shop_rect.w - 20, self.shop_rect.h - 112)
        self.screen.set_clip(clip)
        y = clip.y - self.scroll
        if self.tab == "rigs":
            if not any(self.state.buildings.values()):
                empty = pygame.Rect(clip.x + 8, y, clip.w - 16, 64)
                pygame.draw.rect(self.screen, (28, 18, 12), empty, border_radius=16)
                _text(self.screen, self.small, "Earn a few waffles, then hire a Pocket Fork.", BATTER, (empty.x + 12, empty.y + 22))
                y += 76
            for building in BUILDINGS:
                owned = self.state.buildings[building["id"]]
                cost = building_cost(building["id"], owned, self.qty)
                can = self.state.waffles >= cost
                locked = owned == 0 and self.state.total_waffles < building["base_cost"] * 0.25
                row = pygame.Rect(clip.x + 8, y, clip.w - 16, 78)
                bg = (70, 48, 18) if can and not locked else (28, 18, 12)
                pygame.draw.rect(self.screen, bg, row, border_radius=16)
                pygame.draw.rect(self.screen, WAFFLE if can and not locked else (60, 42, 28), row, width=1, border_radius=16)
                icon = pygame.Rect(row.x + 10, row.y + 14, 50, 50)
                pygame.draw.rect(self.screen, (12, 8, 6), icon, border_radius=12)
                self.draw_icon(icon.center, building["icon"])
                _text(self.screen, self.med, building["name"], BATTER, (row.x + 72, row.y + 10))
                _text(self.screen, self.tiny, f"x{owned}", WAFFLE, (row.right - 12, row.y + 14), right=True)
                blurb = "Keep drilling to unlock" if locked else building["blurb"]
                _text(self.screen, self.tiny, blurb[:46], (190, 170, 140), (row.x + 72, row.y + 36))
                _text(
                    self.screen,
                    self.tiny,
                    f"{format_rate(stats['per_building'][building['id']])} each  ·  {format_number(cost)} waffles",
                    WAFFLE,
                    (row.x + 72, row.y + 54),
                )
                if not locked:
                    self.rows.append((row, "buy", building["id"]))
                y += 86
        else:
            upgrades = self.state.visible_upgrades()
            if not upgrades:
                _text(self.screen, self.body, "No toppings yet. Keep drilling.", (180, 160, 130), (clip.centerx, clip.y + 80), center=True)
            for upgrade in upgrades:
                can = self.state.waffles >= upgrade["cost"]
                row = pygame.Rect(clip.x + 8, y, clip.w - 16, 78)
                pygame.draw.rect(self.screen, (70, 48, 18) if can else (28, 18, 12), row, border_radius=16)
                _text(self.screen, self.med, upgrade["name"], BATTER, (row.x + 16, row.y + 10))
                _text(self.screen, self.tiny, upgrade["blurb"][:52], (190, 170, 140), (row.x + 16, row.y + 36))
                buy = pygame.Rect(row.right - 108, row.y + 22, 92, 32)
                pygame.draw.rect(self.screen, WAFFLE if can else (60, 42, 28), buy, border_radius=12)
                _text(self.screen, self.tiny, format_number(upgrade["cost"]), SOIL if can else BATTER, buy.center, center=True)
                self.rows.append((row, "upgrade", upgrade["id"]))
                y += 86
        max_scroll = max(0, y - (clip.y - self.scroll) - clip.height + 12)
        self.scroll = min(self.scroll, max_scroll)
        self.screen.set_clip(None)

    def draw_icon(self, center: tuple[float, float], kind: str) -> None:
        x, y = center
        if kind == "fork":
            pygame.draw.rect(self.screen, BATTER, pygame.Rect(x - 3, y - 6, 6, 22), border_radius=2)
            for ox in (-8, 0, 8):
                pygame.draw.rect(self.screen, BATTER, pygame.Rect(x + ox - 2, y - 18, 4, 14), border_radius=2)
        elif kind == "waffle":
            r = pygame.Rect(x - 16, y - 16, 32, 32)
            pygame.draw.rect(self.screen, WAFFLE, r, border_radius=6)
            pygame.draw.line(self.screen, CRUST, (x - 16, y), (x + 16, y), 2)
            pygame.draw.line(self.screen, CRUST, (x, y - 16), (x, y + 16), 2)
        elif kind == "syrup":
            pygame.draw.circle(self.screen, SYRUP, (int(x), int(y - 4)), 12)
            pygame.draw.rect(self.screen, SYRUP, pygame.Rect(x - 5, y, 10, 16), border_radius=4)
        elif kind == "magma":
            pygame.draw.polygon(self.screen, MAGMA, [(x, y - 16), (x + 16, y + 14), (x - 16, y + 14)])
        elif kind == "void":
            pygame.draw.circle(self.screen, (80, 40, 90), (int(x), int(y)), 14)
            pygame.draw.circle(self.screen, WAFFLE, (int(x), int(y)), 6)
        else:
            pygame.draw.circle(self.screen, WAFFLE, (int(x), int(y)), 12)
            pygame.draw.circle(self.screen, CRUST, (int(x), int(y)), 12, 2)

    def draw_particles(self) -> None:
        for particle in self.particles:
            t = particle.life / particle.max_life
            if particle.kind == "floater":
                color = MAGMA if "CRIT" in particle.text else WAFFLE
                _text(self.screen, self.med, particle.text, color, (particle.x, particle.y), center=True)
            else:
                size = int(4 + 6 * t)
                rect = pygame.Rect(0, 0, size, size)
                rect.center = (particle.x, particle.y)
                pygame.draw.rect(self.screen, WAFFLE, rect, border_radius=2)

    def draw_golden(self) -> None:
        if not self.golden:
            return
        bounce = math.sin(self.t * 8) * 6
        x, y = self.golden.x, self.golden.y + bounce
        rect = pygame.Rect(0, 0, 52, 52)
        rect.center = (x, y)
        pygame.draw.rect(self.screen, (255, 214, 80), rect, border_radius=10)
        pygame.draw.rect(self.screen, CRUST, rect, width=4, border_radius=10)
        pygame.draw.line(self.screen, CRUST, (rect.left, y), (rect.right, y), 3)
        pygame.draw.line(self.screen, CRUST, (x, rect.top), (x, rect.bottom), 3)
        _text(self.screen, self.tiny, "GOLDEN", WAFFLE, (x, y + 38), center=True)

    def draw_banner(self) -> None:
        if not self.banner or self.t > self.banner_until:
            return
        rect = pygame.Rect(0, 0, min(720, 40 + len(self.banner) * 8), 56)
        rect.center = (WIDTH // 2, 70)
        pygame.draw.rect(self.screen, PANEL, rect, border_radius=16)
        pygame.draw.rect(self.screen, WAFFLE, rect, width=2, border_radius=16)
        _text(self.screen, self.body, self.banner, WAFFLE, rect.center, center=True)

    def draw_reset_modal(self) -> None:
        if not self.confirm_reset:
            return
        veil = pygame.Surface((WIDTH, HEIGHT), pygame.SRCALPHA)
        veil.fill((0, 0, 0, 170))
        self.screen.blit(veil, (0, 0))
        box = pygame.Rect(0, 0, 420, 220)
        box.center = (WIDTH // 2, HEIGHT // 2)
        pygame.draw.rect(self.screen, PANEL, box, border_radius=24)
        pygame.draw.rect(self.screen, WAFFLE, box, width=2, border_radius=24)
        _text(self.screen, self.med, "Abandon the borehole?", WAFFLE, (box.centerx, box.y + 40), center=True)
        _text(self.screen, self.body, "Wipes waffles, rigs, toppings, and depth.", BATTER, (box.centerx, box.y + 84), center=True)
        keep = pygame.Rect(box.centerx - 170, box.y + 130, 150, 42)
        wipe = pygame.Rect(box.centerx + 10, box.y + 130, 160, 42)
        pygame.draw.rect(self.screen, (40, 28, 18), keep, border_radius=12)
        pygame.draw.rect(self.screen, MAGMA, wipe, border_radius=12)
        _text(self.screen, self.small, "Keep drilling", BATTER, keep.center, center=True)
        _text(self.screen, self.small, "Reset run", BATTER, wipe.center, center=True)

    def draw(self) -> None:
        stats = self.state.derived(self.now)
        ox, oy = self.cam()
        origin = (EARTH_POS[0] + ox, EARTH_POS[1] + oy)
        self.draw_background()
        self.draw_depth()
        self.draw_earth(origin)
        self.draw_waffleson(origin)
        self.draw_particles()
        self.draw_golden()
        self.draw_hud(stats)
        self.draw_shop(stats)
        self.draw_banner()
        self.draw_reset_modal()
        pygame.display.flip()

    def run(self) -> None:
        while self.running:
            dt = self.clock.tick(60) / 1000.0
            self.handle_events()
            self.update(dt)
            self.draw()
        save_state(self.state)
        pygame.quit()


def main() -> None:
    os.environ.setdefault("PYGAME_HIDE_SUPPORT_PROMPT", "1")
    try:
        WafflesonGame().run()
    except pygame.error as exc:
        print("Waffleson needs a display to open a window.")
        print(f"Pygame error: {exc}")
        sys.exit(1)


if __name__ == "__main__":
    main()
