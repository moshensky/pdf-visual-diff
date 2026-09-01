/**
 * Configure which packages to ignore version upgrades.
 */
const ignoredPackages = [];

/**
 * Configure which packages to ignore for major version upgrades.
 * Type: { [packageName]: reason }, i.e. { '@storybook/react': 'some reason' }
 */
const ignoreMajorVersions = {
  typescript: 'typescript-eslint supports typescript <6.1.0; TS 7 is the Go port and is not supported by it yet',
  '@types/node': 'keep node typings aligned with the Node 24 runtime floor in engines.node',
};

module.exports = {
  upgrade: true,
  /**
   * Supply chain protection: only consider versions published at least 14 days
   * ago. Mirrors `min-release-age=14` in .npmrc, so ncu never proposes a version
   * that `npm install` would subsequently reject.
   */
  cooldown: 14,
  reject: ignoredPackages,
  packageManager: 'npm',
  /** Custom target that performs minor upgrades for selected packages.
    @param dependencyName The name of the dependency.
    @param parsedVersion A parsed Semver object from semver-utils.
      (See https://git.coolaj86.com/coolaj86/semver-utils.js#semverutils-parse-semverstring)
    @returns 'latest' | 'newest' | 'greatest' | 'minor' | 'patch'
  */
  target: (dependencyName, parsedVersion) => {
    const ignored = ignoreMajorVersions[dependencyName]
    if (ignored !== undefined) {
      const res = 'minor';
      console.log(`\n👀  ️${dependencyName} is pinned to ${res}. Reason: ${ignored}`);
      return res;
    }
    return 'latest';
  },
};
