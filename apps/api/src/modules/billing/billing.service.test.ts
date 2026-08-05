import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";

import { BillingService } from "./billing.service.js";

const SECRET = "test-webhook-secret";

function signManifest(options: { dataId: string; requestId: string; ts: string; secret?: string }) {
  const manifest = `id:${options.dataId};request-id:${options.requestId};ts:${options.ts};`;
  const hash = createHmac("sha256", options.secret ?? SECRET).update(manifest).digest("hex");
  return `ts=${options.ts},v1=${hash}`;
}

function createBillingService(options?: {
  tenant?: { id: string } | null;
  subscription?: { status?: string; external_reference?: string };
  alreadyProcessed?: boolean;
}) {
  const tenantUpdateCalls: Array<Record<string, unknown>> = [];
  const markProcessedCalls: Array<{ notificationId: string; eventType: string; resourceId: string }> = [];

  const prisma = {
    tenant: {
      async findUnique(args: { where: { id: string } }) {
        if (options?.tenant && options.tenant.id === args.where.id) {
          return options.tenant;
        }
        return null;
      },
      async update(args: { where: { id: string }; data: Record<string, unknown> }) {
        tenantUpdateCalls.push({ id: args.where.id, ...args.data });
      }
    },
    billingWebhookEvent: {
      async wasProcessed() {
        return options?.alreadyProcessed ?? false;
      },
      async markProcessed(input: { notificationId: string; eventType: string; resourceId: string }) {
        markProcessedCalls.push(input);
      }
    }
  };

  const mercadoPagoClient = {
    async getSubscription() {
      return {
        status: options?.subscription?.status ?? "authorized",
        external_reference: options?.subscription?.external_reference ?? "tenant-1:COMPANY_PRO"
      };
    }
  };

  return {
    service: new BillingService(prisma as never, mercadoPagoClient as never),
    tenantUpdateCalls,
    markProcessedCalls
  };
}

function withSecret(secret: string | undefined, fn: () => Promise<void>) {
  const original = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (secret === undefined) {
    delete process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  } else {
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = secret;
  }
  return fn().finally(() => {
    if (original === undefined) {
      delete process.env.MERCADO_PAGO_WEBHOOK_SECRET;
    } else {
      process.env.MERCADO_PAGO_WEBHOOK_SECRET = original;
    }
  });
}

test("processWebhook rejects when MERCADO_PAGO_WEBHOOK_SECRET isn't configured", async () => {
  await withSecret(undefined, async () => {
    const { service } = createBillingService();

    await assert.rejects(() =>
      service.processWebhook({
        xSignature: "ts=1,v1=deadbeef",
        xRequestId: "req-1",
        dataId: "sub-1",
        body: { id: 1, type: "subscription_preapproval", data: { id: "sub-1" } }
      })
    );
  });
});

test("processWebhook rejects a tampered signature", async () => {
  await withSecret(SECRET, async () => {
    const { service, tenantUpdateCalls } = createBillingService();
    const ts = String(Math.floor(Date.now() / 1000));
    const signature = signManifest({ dataId: "sub-1", requestId: "req-1", ts, secret: "wrong-secret" });

    await assert.rejects(() =>
      service.processWebhook({
        xSignature: signature,
        xRequestId: "req-1",
        dataId: "sub-1",
        body: { id: 1, type: "subscription_preapproval", data: { id: "sub-1" } }
      })
    );
    assert.deepEqual(tenantUpdateCalls, []);
  });
});

test("processWebhook rejects a signature outside the replay-tolerance window", async () => {
  await withSecret(SECRET, async () => {
    const { service, tenantUpdateCalls } = createBillingService();
    const staleTs = String(Math.floor(Date.now() / 1000) - 3600);
    const signature = signManifest({ dataId: "sub-1", requestId: "req-1", ts: staleTs });

    await assert.rejects(() =>
      service.processWebhook({
        xSignature: signature,
        xRequestId: "req-1",
        dataId: "sub-1",
        body: { id: 1, type: "subscription_preapproval", data: { id: "sub-1" } }
      })
    );
    assert.deepEqual(tenantUpdateCalls, []);
  });
});

test("processWebhook activates the tenant's plan when the subscription is authorized", async () => {
  await withSecret(SECRET, async () => {
    const { service, tenantUpdateCalls, markProcessedCalls } = createBillingService({
      tenant: { id: "tenant-1" },
      subscription: { status: "authorized", external_reference: "tenant-1:COMPANY_PRO" }
    });
    const ts = String(Math.floor(Date.now() / 1000));
    const signature = signManifest({ dataId: "sub-1", requestId: "req-1", ts });

    const result = await service.processWebhook({
      xSignature: signature,
      xRequestId: "req-1",
      dataId: "sub-1",
      body: { id: 999, type: "subscription_preapproval", data: { id: "sub-1" } }
    });

    assert.deepEqual(result, { ok: true });
    assert.equal(tenantUpdateCalls.length, 1);
    assert.equal(tenantUpdateCalls[0]?.planCode, "COMPANY_PRO");
    assert.equal(tenantUpdateCalls[0]?.planStatus, "ACTIVE");
    assert.equal(tenantUpdateCalls[0]?.vehicleLimit, null);
    assert.deepEqual(markProcessedCalls, [{ notificationId: "999", eventType: "subscription_preapproval", resourceId: "sub-1" }]);
  });
});

test("processWebhook deactivates the plan when the subscription is cancelled", async () => {
  await withSecret(SECRET, async () => {
    const { service, tenantUpdateCalls } = createBillingService({
      tenant: { id: "tenant-1" },
      subscription: { status: "cancelled", external_reference: "tenant-1:COMPANY_PRO" }
    });
    const ts = String(Math.floor(Date.now() / 1000));
    const signature = signManifest({ dataId: "sub-1", requestId: "req-1", ts });

    await service.processWebhook({
      xSignature: signature,
      xRequestId: "req-1",
      dataId: "sub-1",
      body: { id: 999, type: "subscription_preapproval", data: { id: "sub-1" } }
    });

    assert.equal(tenantUpdateCalls[0]?.planStatus, "INACTIVE");
    assert.equal(tenantUpdateCalls[0]?.billingSubscriptionStatus, "cancelled");
    assert.equal(tenantUpdateCalls[0]?.planCode, undefined);
  });
});

test("processWebhook ignores a subscription with a malformed external_reference", async () => {
  await withSecret(SECRET, async () => {
    const { service, tenantUpdateCalls } = createBillingService({
      tenant: { id: "tenant-1" },
      subscription: { status: "authorized", external_reference: "not-a-valid-reference" }
    });
    const ts = String(Math.floor(Date.now() / 1000));
    const signature = signManifest({ dataId: "sub-1", requestId: "req-1", ts });

    await service.processWebhook({
      xSignature: signature,
      xRequestId: "req-1",
      dataId: "sub-1",
      body: { id: 999, type: "subscription_preapproval", data: { id: "sub-1" } }
    });

    assert.deepEqual(tenantUpdateCalls, []);
  });
});

test("processWebhook is idempotent for a notification id already processed", async () => {
  await withSecret(SECRET, async () => {
    const { service, tenantUpdateCalls, markProcessedCalls } = createBillingService({
      tenant: { id: "tenant-1" },
      alreadyProcessed: true
    });
    const ts = String(Math.floor(Date.now() / 1000));
    const signature = signManifest({ dataId: "sub-1", requestId: "req-1", ts });

    const result = await service.processWebhook({
      xSignature: signature,
      xRequestId: "req-1",
      dataId: "sub-1",
      body: { id: 999, type: "subscription_preapproval", data: { id: "sub-1" } }
    });

    assert.deepEqual(result, { ok: true });
    assert.deepEqual(tenantUpdateCalls, []);
    assert.deepEqual(markProcessedCalls, []);
  });
});
