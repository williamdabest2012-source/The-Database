from __future__ import annotations

BUILDINGS = [
    {
        "id": "fork",
        "name": "Pocket Fork",
        "blurb": "Poke the dirt. Pretend it is breakfast.",
        "base_cost": 17,
        "base_wps": 0.5,
        "icon": "fork",
    },
    {
        "id": "bit",
        "name": "Waffle Bit",
        "blurb": "A spinning square of batter. Geology hates this.",
        "base_cost": 115,
        "base_wps": 5.0,
        "icon": "waffle",
    },
    {
        "id": "auger",
        "name": "Syrup Auger",
        "blurb": "Lubricates the borehole. Sticky, but legal.",
        "base_cost": 800,
        "base_wps": 33.0,
        "icon": "syrup",
    },
    {
        "id": "brigade",
        "name": "Belgian Brigade",
        "blurb": "Unionized. Grid-pattern certified.",
        "base_cost": 4600,
        "base_wps": 200.0,
        "icon": "crew",
    },
    {
        "id": "griddle",
        "name": "Magma Griddle",
        "blurb": "The mantle is just a very angry hot plate.",
        "base_cost": 29000,
        "base_wps": 1200.0,
        "icon": "magma",
    },
    {
        "id": "press",
        "name": "Inner-Core Press",
        "blurb": "Fold the planet. Serve immediately.",
        "base_cost": 200000,
        "base_wps": 7700.0,
        "icon": "press",
    },
    {
        "id": "iron",
        "name": "Continental Iron",
        "blurb": "One waffle the size of Eurasia. Butter sold separately.",
        "base_cost": 1580000.0,
        "base_wps": 49000.0,
        "icon": "earth",
    },
    {
        "id": "singularity",
        "name": "Breakfast Singularity",
        "blurb": "All matter becomes waffle. This was always the plan.",
        "base_cost": 11600000.0,
        "base_wps": 330000.0,
        "icon": "void",
    },
]

UPGRADES = [
    {"id": "extraBatter", "name": "Extra Batter", "blurb": "+1 waffle per click. More square.", "cost": 60, "click_add": 1},
    {"id": "mapleInjection", "name": "Maple Injection", "blurb": "Direct-to-crust syrup. +2 waffles per click.", "cost": 300, "click_add": 2},
    {
        "id": "toastedTines",
        "name": "Toasted Tines",
        "blurb": "Pocket forks now come pre-crisped. x3 forks.",
        "cost": 380,
        "requires": ("fork", 1),
        "building_mul": {"fork": 3},
    },
    {
        "id": "spinDoctor",
        "name": "Spin Doctor",
        "blurb": "Waffle bits rotate in both spacetime directions. x3 bits.",
        "cost": 1900,
        "requires": ("bit", 1),
        "building_mul": {"bit": 3},
    },
    {
        "id": "stickierSyrup",
        "name": "Stickier Syrup",
        "blurb": "The auger refuses to let go of the Earth. x3 augers.",
        "cost": 12000,
        "requires": ("auger", 1),
        "building_mul": {"auger": 3},
    },
    {
        "id": "unionBreakfast",
        "name": "Union Breakfast",
        "blurb": "The brigade negotiates a waffle-tripling clause.",
        "cost": 74000,
        "requires": ("brigade", 1),
        "building_mul": {"brigade": 3},
    },
    {
        "id": "oshaIgnore",
        "name": "OSHA? Never Heard of Her",
        "blurb": "Magma griddles may now operate at fun temperatures. x3.",
        "cost": 504000,
        "requires": ("griddle", 1),
        "building_mul": {"griddle": 3},
    },
    {
        "id": "foldTwice",
        "name": "Fold It Twice",
        "blurb": "Core presses discover lamination. x3 presses.",
        "cost": 3780000.0,
        "requires": ("press", 1),
        "building_mul": {"press": 3},
    },
    {
        "id": "continentalButter",
        "name": "Continental Butter",
        "blurb": "Grease a hemisphere. Slide it into the hole. x3 irons.",
        "cost": 29400000.0,
        "requires": ("iron", 1),
        "building_mul": {"iron": 3},
    },
    {
        "id": "eventHorizon",
        "name": "Maple Horizon",
        "blurb": "Nothing escapes the syrup. Not even lunch. x3 singularities.",
        "cost": 231000000.0,
        "requires": ("singularity", 1),
        "building_mul": {"singularity": 3},
    },
    {"id": "goldenGrid", "name": "Golden Grid", "blurb": "4% of clicks become legendary 11x strikes.", "cost": 2300, "crit": 0.04},
    {"id": "planetFlip", "name": "Planet Flip", "blurb": "Flip the Earth on the iron. Double every rig.", "cost": 5880000.0, "wps_mul": 2},
]

LAYERS = [
    {"id": "picnic", "name": "Picnic Blanket", "min_km": 0, "blurb": "Ants, grass, and a dangerous amount of optimism.", "stage": 0},
    {"id": "topsoil", "name": "Topsoil", "min_km": 0.02, "blurb": "Somebody should have asked the worms first.", "stage": 0},
    {"id": "crust", "name": "Continental Crust", "min_km": 8, "blurb": "Bedrock, but make it brunch.", "stage": 1},
    {"id": "moho", "name": "Moho Discontinuity", "min_km": 35, "blurb": "The crust ends. The batter thickens.", "stage": 1},
    {"id": "mantle", "name": "Upper Mantle", "min_km": 80, "blurb": "Toasty. Perfect waffle weather.", "stage": 2},
    {"id": "transition", "name": "Transition Zone", "min_km": 410, "blurb": "Minerals rearrange themselves into a grid.", "stage": 2},
    {"id": "lower", "name": "Lower Mantle", "min_km": 660, "blurb": "Syrup crystallizes into jewelry down here.", "stage": 3},
    {"id": "outer", "name": "Outer Core", "min_km": 2890, "blurb": "Liquid iron. Or batter. The lab is split.", "stage": 3},
    {"id": "inner", "name": "Inner Core", "min_km": 5150, "blurb": "Solid, spinning, and suspiciously square.", "stage": 4},
    {"id": "core", "name": "The Waffle Core", "min_km": 6368, "blurb": "Breakfast was always down here.", "stage": 4},
]

COST_GROWTH = 1.14
RUSH_MULT = 7.0
RUSH_SECONDS = 13.0
GOLDEN_SECONDS = 14.0
EARTH_RADIUS_KM = 6371.0
SAVE_NAME = ".waffle_core.json"
CLICK_CAP = 1_000_000
CLICK_PER_PURCHASE = 0.1
DEPTH_CORE_AT = 400_000_000
