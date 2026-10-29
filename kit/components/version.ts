// The kit version (keep in sync with ../VERSION; static/build-static.mjs and the tests check it).
export const KIT_VERSION = '2.9.0';
/**
 * Content hash of the published kit (scripts/publish-kit.mjs stamps it into the copy levimc.org publishes, and into
 * levimc.org's own build): every site that fetched the same kit shows the same build, so a stale deployment is
 * visible — and the sites' scheduled checks rebuild when levimc.org publishes a new one. 'dev' in a working tree.
 */
export const KIT_BUILD: string = 'dev';
/** Value of <meta name="generator"> on every page the kit renders, so deployments are verifiable. */
export const KIT_GENERATOR = `levimc-kit ${KIT_VERSION}${KIT_BUILD === 'dev' ? '' : `+${KIT_BUILD}`}`;
export const GENERATOR_META = `<meta name="generator" content="${KIT_GENERATOR}">`;
