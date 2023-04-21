/**
 * Configure which packages to ignore version upgrades.
 */
const ignoredPackages = [];

/**
 * Configure which packages to ignore for major version upgrades.
 * Type: { [packageName]: reason }, i.e. { '@storybook/react': 'some reason' }
 */
const ignoreMajorVersions = {
};

module.exports = {
  upgrade: true,
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
