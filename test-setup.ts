import { installImplementation } from "temporal-polyfill/shim";

// force to use polyfill on node so we can manipulate the date in tests while
// waiting for temporal support, see https://github.com/nodejs/node/issues/63369
installImplementation();
