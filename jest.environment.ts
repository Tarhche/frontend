import type {
  EnvironmentContext,
  JestEnvironmentConfig,
} from "@jest/environment";
import BaseJSDOMEnvironment from "@jest/environment-jsdom-abstract";
import * as jsdom from "jsdom";

// The tests' browser: jsdom, set up exactly as jest-environment-jsdom does it,
// but with the jsdom this project installs. jest-environment-jsdom pins jsdom
// 26, which still pulls in the deprecated whatwg-encoding; Jest 30 builds that
// package on this abstract environment so a project can hand it its own jsdom,
// and handing it over is all that package does.
export default class JSDOMEnvironment extends BaseJSDOMEnvironment {
  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context, jsdom);
  }
}
