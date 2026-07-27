import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Hooks here register window/document listeners, so leaving a tree mounted
// between tests would let one test's listeners fire during the next.
afterEach(cleanup);
