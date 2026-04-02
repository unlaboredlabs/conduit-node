import { afterAll, beforeAll, expect, mock, test } from "bun:test";
import { createServer } from "node:net";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { executeJob } from "./frps";
import type { AgentConfig } from "./config";
import type { AgentJob } from "./types";

let stateDir: string;
let frpsConfigDir: string;

beforeAll(async () => {
  stateDir = await mkdtemp(path.join(os.tmpdir(), "conduit-node-frps-"));
  frpsConfigDir = path.join(stateDir, "frps");
  await mkdir(frpsConfigDir, { recursive: true });
});

afterAll(async () => {
  await rm(stateDir, { recursive: true, force: true });
});

test("executeJob provisions FRPS after ensuring the reserved IP alias exists", async () => {
  const ensureReservedIpOnHost = mock(
    async () =>
      ({
        iface: "eth0",
        added: true,
      }) as const,
  );
  const removeReservedIpFromHost = mock(async () => true);
  const getReservedIpLease = mock(async () => null);
  const removeReservedIpLease = mock(async () => undefined);
  const upsertReservedIpLease = mock(async () => undefined);
  const probeContainerRunning = mock(async () => true);
  const removeContainer = mock(async () => undefined);
  const runFrpsContainer = mock(async () => undefined);
  const stopContainer = mock(async () => undefined);

  const probeServer = createServer((socket) => socket.end());
  await new Promise<void>((resolve) => probeServer.listen(0, "127.0.0.1", resolve));
  const address = probeServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind probe server.");
  }

  const config: AgentConfig = {
    controllerUrl: "https://conduit.invalid",
    registrationToken: null,
    label: "edge-node",
    hostname: "edge-node-01",
    vultrInstanceId: "instance-123",
    region: "dfw",
    stateDir,
    stateFile: path.join(stateDir, "node-state.json"),
    frpsConfigDir,
    reservedIpStateFile: path.join(stateDir, "reserved-ips.json"),
    heartbeatSeconds: 15,
    jobPollSeconds: 10,
    agentVersion: "0.1.0",
  };

  const job: AgentJob = {
    _id: "job_123",
    kind: "provision_frps",
    attemptCount: 1,
    payload: {
      frpsId: "frps_123",
      name: "edge-frps",
      containerName: "conduit-frps-edge",
      reservedIp: "127.0.0.1",
      bindPort: address.port,
      proxyPortStart: 1024,
      proxyPortEnd: 49151,
      authToken: "secret-token",
      image: "ghcr.io/fatedier/frps:v0.65.0",
    },
  };

  try {
    const completion = await executeJob(config, job, {
      ensureReservedIpOnHost,
      removeReservedIpFromHost,
      getReservedIpLease,
      removeReservedIpLease,
      upsertReservedIpLease,
      probeContainerRunning,
      removeContainer,
      runFrpsContainer,
      stopContainer,
    });

    expect(ensureReservedIpOnHost).toHaveBeenCalledWith("127.0.0.1");
    expect(runFrpsContainer).toHaveBeenCalledTimes(1);
    expect(completion).toEqual({
      status: "succeeded",
      message: "provision_frps succeeded",
      containerName: "conduit-frps-edge",
    });
    expect(removeReservedIpFromHost).not.toHaveBeenCalled();
  } finally {
    await new Promise<void>((resolve, reject) =>
      probeServer.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
