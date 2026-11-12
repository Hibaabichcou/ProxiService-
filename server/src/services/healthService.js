export function getHealthStatus() {
  return {
    status: "ok",
    service: "proxiservice-api",
    timestamp: new Date().toISOString(),
  };
}
