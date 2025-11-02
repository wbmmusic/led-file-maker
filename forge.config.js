const { MakerSquirrel } = require('@electron-forge/maker-squirrel');
const { MakerZIP } = require('@electron-forge/maker-zip');
const { MakerDeb } = require('@electron-forge/maker-deb');
const { MakerRpm } = require('@electron-forge/maker-rpm');
const { MakerDMG } = require('@electron-forge/maker-dmg');
const { PublisherGithub } = require('@electron-forge/publisher-github');
const { VitePlugin } = require('@electron-forge/plugin-vite');
const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

module.exports = {
  hooks: {
    packageAfterCopy: async (forgeConfig, buildPath, electronVersion, platform, arch) => {
      console.log('📦 [packageAfterCopy] Installing production dependencies...');
      console.log(`   Build path: ${buildPath}`);

      const pkgJsonSource = path.resolve(__dirname, 'package.json');
      const pkgJsonDest = path.join(buildPath, 'package.json');

      await fs.copy(pkgJsonSource, pkgJsonDest);

      console.log('   Running: pnpm install --prod --no-optional');

      try {
        execSync('pnpm install --prod --no-optional --shamefully-hoist', {
          cwd: buildPath,
          stdio: 'inherit',
          env: { ...process.env, NODE_ENV: 'production' }
        });
        console.log('✓ [packageAfterCopy] Production dependencies installed successfully');
      } catch (error) {
        console.error('✗ [packageAfterCopy] Failed to install dependencies:', error);
        throw error;
      }
    }
  },
  packagerConfig: {
    name: 'LED File Maker',
    executableName: 'led-file-maker',
    appBundleId: 'com.wbm.led-file-maker',
    appCopyright: 'WBM Tek',
    icon: './public/logo512',
    extraResource: [
      './public/locos'
    ],
    asar: {
      unpack: '**/node_modules/**/*.{node,dll,dylib,so}'
    },
    afterCopy: [(buildPath, electronVersion, platform, arch, callback) => {
      if (platform !== 'win32') {
        callback();
        return;
      }

      try {
        console.log('🗑️  [afterCopy] Removing non-Windows prebuilt binaries...');

        const packagesToClean = [
          ['sharp']
        ];

        for (const packagePath of packagesToClean) {
          const prebuildsPath = path.join(buildPath, 'node_modules', ...packagePath, 'prebuilds');

          if (fs.existsSync(prebuildsPath)) {
            console.log(`   Cleaning: ${packagePath.join('/')}`);
            const entries = fs.readdirSync(prebuildsPath);

            for (const entry of entries) {
              if (!entry.startsWith('win32-')) {
                const fullPath = path.join(prebuildsPath, entry);
                console.log(`      Removing: ${entry}`);
                fs.removeSync(fullPath);
              }
            }
          }
        }

        console.log('✓ [afterCopy] Non-Windows binaries removed successfully');
        callback();
      } catch (error) {
        console.error('❌ [afterCopy] Error removing binaries:', error);
        callback(error);
      }
    }],
    osxSign: {
      identity: 'Developer ID Application: WBM Tek'
    },
    win32metadata: {
      CompanyName: 'WBM Tek',
      FileDescription: 'LED File Maker',
      ProductName: 'LED File Maker',
      InternalName: 'LED File Maker',
      OriginalFilename: 'led-file-maker.exe'
    }
  },
  rebuildConfig: {
    force: true,
  },
  makers: [
    new MakerSquirrel({
      name: 'led-file-maker',
      setupExe: 'LED-File-Maker-Setup.exe',
      setupIcon: './public/logo512.ico',
      signWithParams: '/sha1 b281b2c2413406e54ac73f3f3b204121b4a66e64 /fd sha256 /tr http://timestamp.sectigo.com /td sha256'
    }),
    new MakerZIP({}, ['darwin']),
    new MakerDMG({
      name: 'LED File Maker',
      icon: './public/logo512.icns'
    }),
    new MakerDeb({
      options: {
        name: 'led-file-maker',
        productName: 'LED File Maker',
        genericName: 'LED File Maker',
        description: 'App for generating raw video files from image sequences',
        categories: ['Graphics'],
        maintainer: 'WBM Tek',
        homepage: 'https://www.wbmtek.com'
      }
    }),
    new MakerRpm({
      options: {
        name: 'led-file-maker',
        productName: 'LED File Maker',
        genericName: 'LED File Maker',
        description: 'App for generating raw video files from image sequences',
        categories: ['Graphics']
      }
    })
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: 'public/main.ts',
          config: 'vite.main.config.ts',
        },
        {
          entry: 'public/preload.ts',
          config: 'vite.preload.config.ts',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
  ],
  publishers: [
    new PublisherGithub({
      repository: {
        owner: 'wbmmusic',
        name: 'led-file-maker'
      },
      prerelease: false,
      draft: true
    })
  ]
};