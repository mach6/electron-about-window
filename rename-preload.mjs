import fs from 'fs/promises';
import path from 'path';

// This script renames any dist/...preload*.js => .mjs and fixes corresponding .map files.
// It operates relative to project root and the tsconfig outDir (dist).

const OUT_DIR = 'dist';

async function run() {
  try {
    const files = await fs.readdir(OUT_DIR, { withFileTypes: true });
    for (const fi of files) {
      if (fi.isFile()) {
        const name = fi.name;
        // match files that include 'preload' and end with .js
        if (/preload.*\.js$/.test(name)) {
          const jsPath = path.join(OUT_DIR, name);
          const mjsName = name.replace(/\.js$/, '.mjs');
          const mjsPath = path.join(OUT_DIR, mjsName);

          // rename .js to .mjs
          await fs.rename(jsPath, mjsPath);

          // if a .map exists, rename and fix its 'file' property if present
          const mapPath = jsPath + '.map';
          const newMapPath = mjsPath + '.map';
          try {
            await fs.access(mapPath);
            const mapContent = await fs.readFile(mapPath, 'utf8');
            const mapJson = JSON.parse(mapContent);
            if (mapJson.file) {
              mapJson.file = mjsName;
            }
            await fs.writeFile(newMapPath, JSON.stringify(mapJson));
            await fs.unlink(mapPath);
          } catch (err) {
            // no map - ignore
          }
        }
      }
    }
    console.log('Preload renaming complete.');
  } catch (err) {
    console.error('Error renaming preload files:', err);
    process.exit(1);
  }
}

run();
