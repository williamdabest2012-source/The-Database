from waffle_core.data import BUILDINGS
from waffle_core.state import GameState, building_cost, depth_km, format_number


def test_format_number_uses_suffixes():
    assert format_number(12) == "12"
    assert format_number(1500).endswith("K")
    assert format_number(2_000_000).endswith("M")


def test_building_cost_grows():
    first = building_cost("fork", 0, 1)
    tenth = building_cost("fork", 9, 1)
    assert first == BUILDINGS[0]["base_cost"]
    assert tenth > first


def test_click_increases_waffles_and_combo():
    state = GameState()
    amount, combo, crit = state.click(1.0, 1.0)
    assert amount == 1
    assert combo == 1
    assert crit is False
    assert state.waffles == 1
    amount, combo, _ = state.click(1.2, 1.0)
    assert combo == 2
    assert amount == 1


def test_buy_and_tick_produce_waffles():
    state = GameState(waffles=100)
    assert state.buy("fork", 1)
    assert state.buildings["fork"] == 1
    before = state.waffles
    state.tick(10, now=10)
    assert state.waffles > before


def test_crit_upgrade_can_crit():
    state = GameState(upgrades=["goldenGrid"])
    amount, _, crit = state.click(1.0, 0.001)
    assert crit is True
    assert amount > 10


def test_clicks_stay_flat_and_start_at_one():
    assert GameState().derived(0)["click_power"] == 1
    assert GameState(total_waffles=1e9).derived(0)["click_power"] == 1


def test_each_purchase_nudges_clicks_up():
    state = GameState(waffles=1_000_000)
    before = state.derived(0)["click_power"]
    assert state.buy("fork", 10)
    assert state.derived(0)["click_power"] == before + 1


def test_spending_waffles_does_not_weaken_clicks():
    state = GameState(waffles=10_000, total_waffles=10_000)
    before = state.derived(0)["click_power"]
    state.waffles = 0
    assert state.derived(0)["click_power"] == before


def test_click_caps_at_one_million():
    state = GameState(buildings={**GameState().buildings, "fork": 30_000_000})
    assert state.derived(0)["click_power"] == 1_000_000
    amount, _, _ = state.click(1.0, 1.0)
    assert amount == 1_000_000


def test_first_planet_is_not_instant():
    assert depth_km(24_000) < 1_000
    assert depth_km(4e8) > 6_300


def test_depth_caps_at_core():
    assert depth_km(0) == 0
    assert depth_km(1e18) == 6371
