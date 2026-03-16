def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_crud_and_order_flow(client):
    ingredient = client.post(
        "/ingredients",
        json={"name": "Gin", "description": "Botanical spirit", "is_active": True},
    )
    assert ingredient.status_code == 201
    ingredient_id = ingredient.json()["id"]

    tonic = client.post(
        "/ingredients",
        json={"name": "Tonic", "description": "Mixer", "is_active": True},
    )
    tonic_id = tonic.json()["id"]

    pump_one = client.post(
        "/pumps",
        json={"name": "Pump A", "gpio_pin": 5, "ingredient_id": ingredient_id, "enabled": True, "ml_per_second": 10},
    )
    assert pump_one.status_code == 201

    pump_two = client.post(
        "/pumps",
        json={"name": "Pump B", "gpio_pin": 6, "ingredient_id": tonic_id, "enabled": True, "ml_per_second": 20},
    )
    assert pump_two.status_code == 201

    recipe = client.post(
        "/recipes",
        json={
            "name": "Gin and Tonic",
            "description": "Classic highball",
            "is_active": True,
            "ingredients": [
                {"ingredient_id": ingredient_id, "amount_ml": 50, "step_order": 0},
                {"ingredient_id": tonic_id, "amount_ml": 150, "step_order": 1},
            ],
        },
    )
    assert recipe.status_code == 201
    recipe_id = recipe.json()["id"]

    available = client.get("/recipes/available")
    assert available.status_code == 200
    assert available.json()[0]["can_make"] is True

    calibration = client.post("/pumps/1/calibrate", json={"volume_ml": 30, "duration_seconds": 3})
    assert calibration.status_code == 200
    assert calibration.json()["ml_per_second"] == 10

    order = client.post("/orders", json={"recipe_id": recipe_id, "size": "double"})
    assert order.status_code == 201
    body = order.json()
    assert body["status"] == "completed"
    assert len(body["steps"]) == 2
    assert body["target_volume_ml"] == 400

    logs = client.get("/logs/recent")
    assert logs.status_code == 200
    assert len(logs.json()) >= 2


def test_order_hardware_failure_returns_backend_detail(client, monkeypatch):
    from app.routes import orders as orders_route

    class BrokenHardware:
        def get_status(self):
            return {"active_pump_ids": [], "emergency_stop_engaged": False}

        def run_pump(self, pump_id, duration_seconds):
            raise RuntimeError("Hardware offline")

        def prime_pumps(self, pump_ids, duration_seconds):
            raise RuntimeError("Hardware offline")

        def clean_pumps(self, pump_ids, duration_seconds):
            raise RuntimeError("Hardware offline")

        def stop_all(self):
            raise RuntimeError("Hardware offline")

        def cleanup(self):
            pass

    ingredient = client.post("/ingredients", json={"name": "Rum", "description": "White rum", "is_active": True}).json()
    mixer = client.post("/ingredients", json={"name": "Cola", "description": "Mixer", "is_active": True}).json()
    client.post("/pumps", json={"name": "Pump R", "gpio_pin": 10, "ingredient_id": ingredient["id"], "enabled": True, "ml_per_second": 12})
    client.post("/pumps", json={"name": "Pump C", "gpio_pin": 11, "ingredient_id": mixer["id"], "enabled": True, "ml_per_second": 18})
    recipe = client.post(
        "/recipes",
        json={
            "name": "Rum and Cola",
            "description": "Classic serve",
            "is_active": True,
            "ingredients": [
                {"ingredient_id": ingredient["id"], "amount_ml": 50, "step_order": 0},
                {"ingredient_id": mixer["id"], "amount_ml": 150, "step_order": 1},
            ],
        },
    ).json()

    monkeypatch.setattr(orders_route, "get_hardware_controller", lambda: BrokenHardware())

    response = client.post("/orders", json={"recipe_id": recipe["id"], "size": "single"})
    assert response.status_code == 503
    assert response.json()["detail"] == "Hardware offline"
