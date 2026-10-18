import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { prerenderRoutes } from '../kit/ssg/prerender.mjs';

const { files } = await prerenderRoutes({ root: dirname(fileURLToPath(import.meta.url)), routes: ['/', '/projects/'], notFound: '/404' });
console.log(`[app demo] prerendered ${files.length} files`);
