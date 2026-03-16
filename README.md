# Tipsy MVP Monorepo

Production-minded MVP monorepo for a Raspberry Pi cocktail machine.

## Structure

- `apps/api` - FastAPI backend, SQLite source of truth, service layer, hardware abstraction
- `apps/admin-ui` - React + Vite + Tailwind admin console
- `apps/touchscreen-ui` - React + Vite + Tailwind customer kiosk UI
- `shared/contracts` - shared contract notes and starter types
- `scripts` - local and Raspberry Pi startup helpers

## What Works

- FastAPI backend with service-first business logic
- SQLite persistence for ingredients, pumps, recipes, orders, and steps
- Mock hardware mode for local development
- Raspberry Pi GPIO hardware mode behind the existing `HardwareController`
- Customer touchscreen flow using real backend endpoints
- Admin UI for recipes, pumps, ingredients, calibration, logs, and settings
- Seeded demo data with a mix of available and unavailable drinks
- Backend pytest coverage for core service and API behavior

## Architecture Rules

- Business logic lives in services, not routes
- UI apps never access GPIO directly
- SQLite is the source of truth
- All hardware access flows through `HardwareController`
- Mock mode must remain usable on non-Pi machines

## Backend Setup

### Windows PowerShell

```powershell
cd apps/api
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e .[dev]
python -m app.seed
uvicorn app.main:app --reload
```

### Linux/macOS

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -e .[dev]
python -m app.seed
uvicorn app.main:app --reload
```

API URL: `http://127.0.0.1:8000`

## Frontend Setup

### Admin UI

```powershell
cd apps/admin-ui
npm install
npm run dev
```

Admin UI URL: `http://127.0.0.1:5173`

### Touchscreen UI

```powershell
cd apps/touchscreen-ui
npm install
npm run dev
```

Touchscreen UI URL: `http://127.0.0.1:5174`

Both frontend apps default to `/api` and use a Vite proxy to reach the FastAPI backend at `http://127.0.0.1:8000`.

Touchscreen kiosk-specific environment variables:

- `VITE_KIOSK_TITLE`
- `VITE_KIOSK_SUBTITLE`
- `VITE_KIOSK_AUTO_REFRESH_MS`
- `VITE_KIOSK_ORDER_POLL_MS`
- `VITE_KIOSK_IDLE_RESET_MS`
- `VITE_KIOSK_ATTRACT_CYCLE_MS`

## Hardware Modes

The backend supports:

- `HARDWARE_MODE=mock`
- `HARDWARE_MODE=raspberrypi`

Mock mode is the default and should be used for local development on Windows, macOS, and Linux.

### Mock Mode

1. Copy `apps/api/.env.example` to `apps/api/.env`
2. Set `HARDWARE_MODE=mock`
3. Start the API normally

Example:

```dotenv
HARDWARE_MODE=mock
DATABASE_URL=sqlite:///./tipsy.db
```

### Raspberry Pi Mode

1. Copy `apps/api/.env.example` to `apps/api/.env`
2. Set `HARDWARE_MODE=raspberrypi`
3. Set `GPIO_NUMBERING_MODE`
4. Configure pump pins either through `Pump.gpio_pin` records or `PUMP_PIN_MAP`
5. Start with `./scripts/pi_start.sh`

Example:

```dotenv
HARDWARE_MODE=raspberrypi
GPIO_NUMBERING_MODE=BCM
GPIO_ACTIVE_LOW=false
PUMP_PIN_MAP=1=17,2=27,3=22,4=5
```

Required Raspberry Pi packages:

```bash
sudo apt update
sudo apt install python3-rpi.gpio
```

Optional alternative:

```bash
pip install RPi.GPIO
```

If `raspberrypi` mode is selected on a non-Pi environment or without `RPi.GPIO`, startup now fails clearly instead of silently falling back.

## Environment Variables

Primary backend variables are shown in `apps/api/.env.example`.

Important ones:

- `APP_NAME`
- `ENVIRONMENT`
- `DATABASE_URL`
- `HARDWARE_MODE`
- `GPIO_NUMBERING_MODE`
- `PUMP_PIN_MAP`
- `GPIO_ACTIVE_LOW`
- `GPIO_CLEANUP_ON_SHUTDOWN`
- `GPIO_POLL_INTERVAL_SECONDS`
- `MIN_PUMP_ML_PER_SECOND`
- `MAX_PUMP_ML_PER_SECOND`
- `MAX_POUR_DURATION_SECONDS`

## Demo Data

`python -m app.seed` now creates:

- 10 ingredients
- 8 pump assignments with realistic calibration values
- 10 recipes
- a deliberate mix of available and unavailable drinks for demo purposes

This is intended to make both the admin UI and touchscreen UI useful immediately after setup.

## Local Startup Helpers

### Full local stack on Linux/macOS

```bash
./scripts/dev_start.sh
```

This starts:

- API on port `8000`
- Admin UI on port `5173`
- Touchscreen UI on port `5174`

### Raspberry Pi startup

```bash
./scripts/pi_start.sh
```

## Docker Compose

For a simple local dev setup:

```bash
docker compose up
```

This starts:

- API
- Admin UI
- Touchscreen UI

The compose file is aimed at MVP development convenience, not production orchestration.

## Testing

Run backend tests from `apps/api`:

```powershell
python -m pytest
```

Current coverage includes:

- recipe availability logic
- single vs double order scaling
- pour duration calculation
- order creation flow
- pump mapping validation
- cancellation behavior
- system status behavior
- hardware selection behavior
- hardware failure propagation without real GPIO
- recent logs ordering and structure

## Troubleshooting

### Frontend cannot reach backend

- Make sure the API is running on `http://127.0.0.1:8000`
- Make sure the frontend dev server is running through Vite
- If needed, set `VITE_API_BASE_URL`

### Raspberry Pi mode fails on startup

- Confirm `RPi.GPIO` is installed
- Confirm the app is running on a Raspberry Pi with GPIO access
- Confirm `GPIO_NUMBERING_MODE` is `BCM` or `BOARD`
- Confirm each required pump has either `gpio_pin` in the database or an override in `PUMP_PIN_MAP`

### Drink is unavailable in the UIs

- Check that every recipe ingredient maps to an enabled pump
- Check pump `ml_per_second` values are valid
- Check the recipe itself is active

### Hardware actions fail immediately

- Check logs for `event=` entries from `order_service`, `pump_service`, and the hardware module
- Verify calibration values and configured pump pins
- Use mock mode first to separate logic issues from GPIO issues

## MVP Deployment Notes

For an MVP Raspberry Pi deployment:

1. Run the backend directly on the Pi in `raspberrypi` mode
2. Keep SQLite on local disk for simplicity
3. Run the touchscreen UI in kiosk mode pointing at the local backend
4. Keep the admin UI available on the local network for operators
5. Use the provided logging and seed/demo flows for calibration and smoke tests before live use

### Touchscreen Fullscreen / Kiosk Mode on Raspberry Pi

For a more realistic kiosk deployment:

1. Start the backend locally on the Pi
2. Build the touchscreen UI or run it with Vite during setup
3. Open Chromium in fullscreen app mode pointing at the touchscreen URL

Example:

```bash
chromium-browser --kiosk --incognito http://127.0.0.1:5174
```

If you serve a production build locally, point Chromium to that served URL instead.

Useful Raspberry Pi setup tips:

- disable screen blanking for the kiosk user session
- autostart Chromium in kiosk mode after login
- keep the admin UI on a separate operator-facing screen or device

## Future Recommendation Boundary

Future recipe intelligence features are intentionally separated from pour execution.

The extension point lives in:

- `apps/api/app/intelligence/recommendations.py`

This boundary is intended for future work such as:

- recipe suggestion
- ingredient substitution suggestions
- "what can I make with installed ingredients?"
- admin-only recipe generation helpers

It is not connected to order execution or hardware control.

## Verification Commands

Backend:

```powershell
cd apps/api
python -m pytest
```

Admin UI build:

```powershell
cd apps/admin-ui
npm install
npm run build
```

Touchscreen UI build:

```powershell
cd apps/touchscreen-ui
npm install
npm run build
```
