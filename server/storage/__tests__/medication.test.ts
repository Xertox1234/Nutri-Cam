import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  afterAll,
  vi,
} from "vitest";
import {
  setupTestTransaction,
  rollbackTestTransaction,
  closeTestPool,
  createTestUser,
  getTestTx,
} from "../../../test/db-test-utils";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type * as schema from "@shared/schema";

vi.mock("../../db", () => ({
  get db() {
    return getTestTx();
  },
}));

const {
  getMedicationLogs,
  createMedicationLog,
  updateMedicationLog,
  deleteMedicationLog,
  createGoalAdjustmentLog,
  getGoalAdjustmentLogs,
} = await import("../medication");

let tx: NodePgDatabase<typeof schema>;
let testUser: schema.User;

describe("medication storage", () => {
  beforeEach(async () => {
    tx = await setupTestTransaction();
    testUser = await createTestUser(tx);
  });

  afterEach(async () => {
    await rollbackTestTransaction();
  });

  afterAll(async () => {
    await closeTestPool();
  });

  // ---- Medication Logs ----

  describe("createMedicationLog", () => {
    it("creates a medication log", async () => {
      const log = await createMedicationLog({
        userId: testUser.id,
        medicationName: "Ozempic",
        dosage: "0.5mg",
        takenAt: new Date("2024-06-01T08:00:00Z"),
      });
      expect(log.id).toBeDefined();
      expect(log.medicationName).toBe("Ozempic");
      expect(log.dosage).toBe("0.5mg");
    });
  });

  describe("getMedicationLogs", () => {
    it("returns logs for the user", async () => {
      await createMedicationLog({
        userId: testUser.id,
        medicationName: "Ozempic",
        dosage: "0.5mg",
        takenAt: new Date("2024-06-01T08:00:00Z"),
      });

      const logs = await getMedicationLogs(testUser.id);
      expect(logs).toHaveLength(1);
      expect(logs[0].medicationName).toBe("Ozempic");
    });

    it("filters by date range", async () => {
      await createMedicationLog({
        userId: testUser.id,
        medicationName: "Ozempic",
        dosage: "0.5mg",
        takenAt: new Date("2024-01-15T08:00:00Z"),
      });
      await createMedicationLog({
        userId: testUser.id,
        medicationName: "Ozempic",
        dosage: "1mg",
        takenAt: new Date("2024-06-15T08:00:00Z"),
      });

      const logs = await getMedicationLogs(testUser.id, {
        from: new Date("2024-06-01"),
        to: new Date("2024-06-30"),
      });
      expect(logs).toHaveLength(1);
      expect(logs[0].dosage).toBe("1mg");
    });

    it("respects limit", async () => {
      for (let i = 0; i < 5; i++) {
        await createMedicationLog({
          userId: testUser.id,
          medicationName: "Ozempic",
          dosage: "0.5mg",
          takenAt: new Date(`2024-0${i + 1}-15T08:00:00Z`),
        });
      }

      const logs = await getMedicationLogs(testUser.id, { limit: 3 });
      expect(logs).toHaveLength(3);
    });
  });

  describe("updateMedicationLog", () => {
    it("updates a log owned by the user", async () => {
      const log = await createMedicationLog({
        userId: testUser.id,
        medicationName: "Ozempic",
        dosage: "0.5mg",
        takenAt: new Date(),
      });

      const updated = await updateMedicationLog(log.id, testUser.id, {
        dosage: "1mg",
      });
      expect(updated).toBeDefined();
      expect(updated!.dosage).toBe("1mg");
    });

    it("returns undefined for wrong user (IDOR)", async () => {
      const otherUser = await createTestUser(tx);
      const log = await createMedicationLog({
        userId: otherUser.id,
        medicationName: "Ozempic",
        dosage: "0.5mg",
        takenAt: new Date(),
      });

      const updated = await updateMedicationLog(log.id, testUser.id, {
        dosage: "1mg",
      });
      expect(updated).toBeUndefined();
    });
  });

  describe("deleteMedicationLog", () => {
    it("deletes a log owned by the user", async () => {
      const log = await createMedicationLog({
        userId: testUser.id,
        medicationName: "Ozempic",
        dosage: "0.5mg",
        takenAt: new Date(),
      });

      const deleted = await deleteMedicationLog(log.id, testUser.id);
      expect(deleted).toBe(true);

      const logs = await getMedicationLogs(testUser.id);
      expect(logs).toHaveLength(0);
    });

    it("returns false for wrong user (IDOR)", async () => {
      const otherUser = await createTestUser(tx);
      const log = await createMedicationLog({
        userId: otherUser.id,
        medicationName: "Ozempic",
        dosage: "0.5mg",
        takenAt: new Date(),
      });

      const deleted = await deleteMedicationLog(log.id, testUser.id);
      expect(deleted).toBe(false);
    });

    it("returns false for non-existent log", async () => {
      const deleted = await deleteMedicationLog(999999, testUser.id);
      expect(deleted).toBe(false);
    });
  });

  // ---- Goal Adjustment Logs ----

  describe("createGoalAdjustmentLog", () => {
    it("creates a goal adjustment log", async () => {
      const log = await createGoalAdjustmentLog({
        userId: testUser.id,
        previousCalories: 2000,
        newCalories: 2200,
        previousProtein: 150,
        newProtein: 165,
        previousCarbs: 250,
        newCarbs: 275,
        previousFat: 67,
        newFat: 73,
        reason: "Plateau detected",
      });
      expect(log.id).toBeDefined();
      expect(log.previousCalories).toBe(2000);
      expect(log.newCalories).toBe(2200);
      expect(log.reason).toBe("Plateau detected");
    });
  });

  describe("getGoalAdjustmentLogs", () => {
    it("returns logs ordered by appliedAt desc", async () => {
      await createGoalAdjustmentLog({
        userId: testUser.id,
        previousCalories: 2000,
        newCalories: 2200,
        previousProtein: 150,
        newProtein: 165,
        previousCarbs: 250,
        newCarbs: 275,
        previousFat: 67,
        newFat: 73,
        reason: "First",
        appliedAt: new Date("2024-01-01"),
      });
      await createGoalAdjustmentLog({
        userId: testUser.id,
        previousCalories: 2200,
        newCalories: 2000,
        previousProtein: 165,
        newProtein: 150,
        previousCarbs: 275,
        newCarbs: 250,
        previousFat: 73,
        newFat: 67,
        reason: "Second",
        appliedAt: new Date("2024-06-01"),
      });

      const logs = await getGoalAdjustmentLogs(testUser.id);
      expect(logs).toHaveLength(2);
      expect(logs[0].reason).toBe("Second");
    });

    it("respects limit", async () => {
      for (let i = 0; i < 5; i++) {
        await createGoalAdjustmentLog({
          userId: testUser.id,
          previousCalories: 2000 + i * 100,
          newCalories: 2100 + i * 100,
          previousProtein: 150,
          newProtein: 160,
          previousCarbs: 250,
          newCarbs: 260,
          previousFat: 67,
          newFat: 70,
          reason: `Adjustment ${i}`,
        });
      }

      const logs = await getGoalAdjustmentLogs(testUser.id, 3);
      expect(logs).toHaveLength(3);
    });
  });
});
