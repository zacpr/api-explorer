// Force exit after tests complete to prevent hanging from Node.js fetch keepalive
export function teardown() {
  // Force exit after a short delay to let any async cleanup complete
  setTimeout(() => {
    process.exit(0);
  }, 100);
}
