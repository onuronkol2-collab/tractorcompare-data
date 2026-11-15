import test from "node:test";
import assert from "node:assert/strict";
import { comparisonKey, specLabel } from "../src/lib/catalog.ts";

const spec = (canonical_key, spec_name) => ({ canonical_key, spec_name });

test("forward/reverse gears from published Başak and New Holland align", () => {
  assert.equal(comparisonKey(spec("transmission_forward_gears", "İleri vites sayısı")),
    comparisonKey(spec("forward_gears", "Forward gears")));
  assert.equal(comparisonKey(spec("transmission_reverse_gears", "Geri vites sayısı")),
    comparisonKey(spec("reverse_gears", "Reverse gears")));
  assert.notEqual(comparisonKey(spec("reverse_gears", "Reverse gears")),
    comparisonKey(spec("forward_gears", "Forward gears")));
});

test("nominal power and maximum power stay distinct", () => {
  assert.notEqual(comparisonKey(spec("engine_rated_power", "Rated engine power")),
    comparisonKey(spec("engine_max_power", "Azami motor gücü")));
});

test("different hydraulic quantities stay distinct", () => {
  assert.notEqual(comparisonKey(spec("hydraulic_remote_count", "Hydraulic remote outlet count")),
    comparisonKey(spec("hydraulic_valve_count", "Hidrolik çıkış / valf sayısı")));
});

test("Turkish labels cover the currently published English keys", () => {
  const examples = {
    adblue_tank_capacity: "AdBlue deposu kapasitesi",
    forward_gears: "İleri vites sayısı",
    reverse_gears: "Geri vites sayısı",
    fuel_injection_system: "Yakıt enjeksiyon sistemi",
    hydraulic_remote_count: "Hidrolik güç çıkışı sayısı",
    maximum_road_speed: "Azami yol hızı",
    engine_rated_power: "Nominal motor gücü",
    rear_track_width: "Arka iz genişliği",
    torque_reserve: "Tork rezervi",
  };
  for (const [key, label] of Object.entries(examples)) {
    assert.equal(specLabel(spec(key, "English key fallback"), "tr"), label, key);
  }
});

test("English route translates Turkish PTO heading without changing raw technical data", () => {
  assert.equal(specLabel(spec("pto_speed_engine_rpm", "Kuyruk Mili Devri (Motor Devri)"), "en"),
    "PTO speed (engine RPM)");
  assert.equal(specLabel(spec("pto_speed_engine_rpm", "Kuyruk Mili Devri (Motor Devri)"), "tr"),
    "Kuyruk mili devri (motor devri)");
});

test("comparison key normalisation does not alter original stored key", () => {
  const candidate = spec("reverse_gears", "Reverse gears");
  assert.equal(comparisonKey(candidate), "transmission_reverse_gears");
  assert.equal(candidate.canonical_key, "reverse_gears");
});
