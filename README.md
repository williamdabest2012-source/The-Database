# Waffleson

A waffle-powered Earth-drilling clicker starring **Waffleson**, a plain waffle who drills a melted-syrup Earth for breakfast.

Click the planet. Hire syrup-powered rigs. Catch a golden waffle. Do not stop until the inner core is a grid.

## Play in the browser

The web game lives in `web/`. After this repo is on GitHub, GitHub Pages can host it automatically (Actions → Pages).

To run it locally:

```bash
cd web
npm install
npm run dev
```

Open the printed URL (port **4731**). Progress saves in the browser.

## Play the Python desktop version

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 -m waffle_core
```

Needs Python 3.11+ and a windowed desktop (pygame).

## Controls

- **Click Waffleson / Earth** — drill waffles. A click is worth 1 waffle and goes up by exactly 1 for every ten rigs or toppings you buy (Extra Batter and Maple Injection add a flat +1 and +2). Clicks never snowball; your rigs do, so the idle income is what carries you to the next planet. Spending never weakens a click, and a click never pays more than **1 million**. Fast clicks build a combo.
- **Rigs / Toppings** — buy auto-drillers and one-shot upgrades.
- **x1 / x10 / x100** — bulk buy.
- **Golden waffle** — click it for a 7× Syrup Rush.
- **Planet cores** — reach the core, then stock **500 million** of that planet’s waffles to buy the rocket to the next gem world: **Ruby Fold**, **Jade Batter**, and **Star Sapphire**. Hop back to any unlocked world from the gem row under the score.
- **Surface factories** — every 40 rigs and toppings, a factory appears on the planet and adds a trickle of waffle production.
- **Tools** — a spatula on the picnic crust, a drill once you hit the mantle. It upgrades with depth.
- **Waffle patrol** — every 7 minutes a cabinet drops: **Waffle Invaders**, **Syrup Breakout**, or **Meteor Batter**. They rotate. Difficulty does not ramp. Win loot and lose-theft both scale with how many waffles you have ever drilled. Add `?patrol` to the URL for a fast first wave.
- **WNN** — Waffle News Network runs a live ticker and breaking-news hits for patrols, factories, rockets, and geology.

## Tests

```bash
pip install pytest
python3 -m pytest
```
