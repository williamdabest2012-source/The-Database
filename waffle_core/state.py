from __future__ import annotations

import json
import math
from dataclasses import dataclass, field
from pathlib import Path

from waffle_core.data import (
    BUILDINGS,
    CLICK_CAP,
    CLICK_PER_PURCHASE,
    DEPTH_CORE_AT,
    COST_GROWTH,
    EARTH_RADIUS_KM,
    LAYERS,
    RUSH_MULT,
    SAVE_NAME,
    UPGRADES,
)

SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc"]


def format_number(value: float, digits: int = 2) -> str:
    if not math.isfinite(value):
        return "0"
    sign = "-" if value < 0 else ""
    abs_value = abs(value)
    if abs_value < 1000:
        if abs_value < 10 and abs_value % 1:
            return f"{sign}{abs_value:.1f}"
        return f"{sign}{int(abs_value):,}"
    exp = min(len(SUFFIXES) - 1, int(math.log10(abs_value) / 3))
    scaled = abs_value / (1000**exp)
    if scaled >= 100:
        text = f"{scaled:.0f}"
    elif scaled >= 10:
        text = f"{scaled:.1f}"
    else:
        text = f"{scaled:.{digits}f}"
    text = text.rstrip("0").rstrip(".") if "." in text else text
    return f"{sign}{text}{SUFFIXES[exp]}"


def format_rate(value: float) -> str:
    return f"{format_number(value, 1)}/sec"


def depth_km(total_waffles: float) -> float:
    return min(EARTH_RADIUS_KM, EARTH_RADIUS_KM * math.sqrt(max(total_waffles, 0) / DEPTH_CORE_AT))


def format_depth(km: float) -> str:
    if km < 1:
        return f"{max(0, int(km * 1000))} m"
    if km < 100:
        return f"{km:.1f} km"
    return f"{km:.0f} km"


def building_cost(building_id: str, owned: int, qty: int) -> float:
    base = next(b["base_cost"] for b in BUILDINGS if b["id"] == building_id)
    total = 0.0
    for i in range(qty):
        total += base * (COST_GROWTH ** (owned + i))
    return total


def empty_buildings() -> dict[str, int]:
    return {b["id"]: 0 for b in BUILDINGS}


@dataclass
class GameState:
    waffles: float = 0.0
    total_waffles: float = 0.0
    buildings: dict[str, int] = field(default_factory=empty_buildings)
    upgrades: list[str] = field(default_factory=list)
    combo: int = 0
    last_click_at: float = 0.0
    rush_until: float = 0.0
    muted: bool = False
    seen_hint: bool = False

    def layer(self) -> dict:
        km = depth_km(self.total_waffles)
        current = LAYERS[0]
        for entry in LAYERS:
            if km >= entry["min_km"]:
                current = entry
        return current

    def next_layer(self) -> dict | None:
        current = self.layer()
        ids = [layer["id"] for layer in LAYERS]
        idx = ids.index(current["id"])
        if idx + 1 < len(LAYERS):
            return LAYERS[idx + 1]
        return None

    def derived(self, now: float) -> dict:
        click_add = 0.0
        wps_mul = 1.0
        crit = 0.0
        building_mul = {b["id"]: 1.0 for b in BUILDINGS}
        owned_upgrades = {u["id"]: u for u in UPGRADES if u["id"] in self.upgrades}
        for upgrade in owned_upgrades.values():
            click_add += float(upgrade.get("click_add", 0))
            wps_mul *= float(upgrade.get("wps_mul", 1))
            crit += float(upgrade.get("crit", 0))
            for bid, mul in upgrade.get("building_mul", {}).items():
                building_mul[bid] *= mul
        rushing = now < self.rush_until
        rush = RUSH_MULT if rushing else 1.0
        per_building = {}
        wps = 0.0
        for building in BUILDINGS:
            each = building["base_wps"] * building_mul[building["id"]] * wps_mul * rush
            per_building[building["id"]] = each
            wps += each * self.buildings.get(building["id"], 0)
        purchases = sum(self.buildings.values()) + len(self.upgrades)
        base_click = math.floor(1 + click_add + CLICK_PER_PURCHASE * purchases)
        click_power = min(CLICK_CAP, max(1, round(base_click * rush)))
        return {
            "click_add": click_add,
            "wps_mul": wps_mul,
            "crit": crit,
            "wps": wps,
            "click_power": click_power,
            "rushing": rushing,
            "per_building": per_building,
        }

    def click(self, now: float, rng_roll: float) -> tuple[float, int, bool]:
        stats = self.derived(now)
        combo = min(25, self.combo + 1) if now - self.last_click_at < 0.48 else 1
        crit = rng_roll < stats["crit"]
        rush = RUSH_MULT if now < self.rush_until else 1.0
        purchases = sum(self.buildings.values()) + len(self.upgrades)
        base_click = math.floor(1 + stats["click_add"] + CLICK_PER_PURCHASE * purchases)
        amount = min(CLICK_CAP, max(1, round(base_click * rush)) * (11 if crit else 1))
        self.waffles += amount
        self.total_waffles += amount
        self.combo = combo
        self.last_click_at = now
        self.seen_hint = True
        return amount, combo, crit

    def tick(self, dt: float, now: float) -> None:
        stats = self.derived(now)
        gain = stats["wps"] * dt
        self.waffles += gain
        self.total_waffles += gain
        if now - self.last_click_at > 0.7:
            self.combo = 0

    def buy(self, building_id: str, qty: int) -> bool:
        owned = self.buildings.get(building_id, 0)
        cost = building_cost(building_id, owned, qty)
        if self.waffles < cost:
            return False
        self.waffles -= cost
        self.buildings[building_id] = owned + qty
        return True

    def buy_upgrade(self, upgrade_id: str) -> bool:
        if upgrade_id in self.upgrades:
            return False
        upgrade = next((u for u in UPGRADES if u["id"] == upgrade_id), None)
        if not upgrade or self.waffles < upgrade["cost"]:
            return False
        requires = upgrade.get("requires")
        if requires and self.buildings.get(requires[0], 0) < requires[1]:
            return False
        self.waffles -= upgrade["cost"]
        self.upgrades.append(upgrade_id)
        return True

    def visible_upgrades(self) -> list[dict]:
        visible = []
        for upgrade in UPGRADES:
            if upgrade["id"] in self.upgrades:
                continue
            requires = upgrade.get("requires")
            if requires and self.buildings.get(requires[0], 0) < requires[1]:
                continue
            if self.total_waffles >= upgrade["cost"] * 0.06:
                visible.append(upgrade)
        return visible

    def to_json(self) -> dict:
        return {
            "waffles": self.waffles,
            "total_waffles": self.total_waffles,
            "buildings": self.buildings,
            "upgrades": self.upgrades,
            "rush_until": self.rush_until,
            "muted": self.muted,
            "seen_hint": self.seen_hint,
        }

    @classmethod
    def from_json(cls, data: dict) -> GameState:
        state = cls()
        state.waffles = float(data.get("waffles", 0))
        state.total_waffles = float(data.get("total_waffles", 0))
        state.buildings = {**empty_buildings(), **{k: int(v) for k, v in data.get("buildings", {}).items()}}
        state.upgrades = list(data.get("upgrades", []))
        state.rush_until = float(data.get("rush_until", 0))
        state.muted = bool(data.get("muted", False))
        state.seen_hint = bool(data.get("seen_hint", False))
        return state


def save_path() -> Path:
    return Path.home() / SAVE_NAME


def save_state(state: GameState) -> None:
    save_path().write_text(json.dumps(state.to_json()), encoding="utf-8")


def load_state() -> GameState:
    path = save_path()
    if not path.exists():
        return GameState()
    try:
        return GameState.from_json(json.loads(path.read_text(encoding="utf-8")))
    except (OSError, json.JSONDecodeError, TypeError, ValueError):
        return GameState()
