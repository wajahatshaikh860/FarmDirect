import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { registerAccount } from "../services/authService.js";
import { registerSchema } from "../validators/authValidator.js";

globalThis.farmdirectMongo.connection = {};
const buyer = {
  name: "Test Buyer",
  email: "BUYER@example.com",
  phone: "9876543210",
  password: "StrongPassword123",
  confirmPassword: "StrongPassword123",
  role: "BUYER",
};

test("Registration service persists normalized buyer fields and a cost-12 hash only", async (t) => {
  t.mock.method(User, "init", async () => {});
  t.mock.method(User, "exists", async () => null);
  let saved;
  t.mock.method(User, "create", async (value) => {
    saved = value;
  });
  assert.equal(await registerAccount(registerSchema.parse(buyer)), true);
  assert.equal(saved.email, "buyer@example.com");
  assert.equal(saved.role, "BUYER");
  assert.equal(saved.password, undefined);
  assert.equal(saved.confirmPassword, undefined);
  assert.equal(saved.farmerProfile, undefined);
  assert.equal(bcrypt.getRounds(saved.passwordHash), 12);
  assert.equal(await bcrypt.compare(buyer.password, saved.passwordHash), true);
});

test("Farmer registration preserves address and farm profile mapping", async (t) => {
  t.mock.method(User, "init", async () => {});
  t.mock.method(User, "exists", async () => null);
  let saved;
  t.mock.method(User, "create", async (value) => {
    saved = value;
  });
  const farmer = registerSchema.parse({
    ...buyer,
    role: "FARMER",
    farmName: "Test Farm",
    district: "Pune",
    state: "Maharashtra",
    farmingType: "Organic",
  });
  await registerAccount(farmer);
  assert.deepEqual(saved.address, { district: "Pune", state: "Maharashtra" });
  assert.deepEqual(saved.farmerProfile, {
    farmName: "Test Farm",
    farmingType: "Organic",
  });
});

test("Duplicate emails skip creation and unique-index races reach route error handling", async (t) => {
  t.mock.method(User, "init", async () => {});
  t.mock.method(User, "exists", async () => true);
  const create = t.mock.method(User, "create", async () => {
    throw Object.assign(new Error("duplicate"), { code: 11000 });
  });
  assert.equal(await registerAccount(registerSchema.parse(buyer)), false);
  assert.equal(create.mock.callCount(), 0);
  User.exists.mock.mockImplementation(async () => null);
  await assert.rejects(registerAccount(registerSchema.parse(buyer)), {
    code: 11000,
  });
});
