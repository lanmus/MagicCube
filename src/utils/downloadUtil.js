const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { promisify } = require('util');
const mkdir = promisify(fs.mkdir);

class DownloadUtil {
    static async createTempDir() {
        const tempDir = path.join(__dirname, '../../temp');
        await mkdir(tempDir, { recursive: true });
        return tempDir;
    }

    static async createZipArchive(productId, modules) {
        const tempDir = await this.createTempDir();
        const zipPath = path.join(tempDir, `product_${productId}.zip`);
        const output = fs.createWriteStream(zipPath);
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        return new Promise((resolve, reject) => {
            output.on('close', () => resolve(zipPath));
            archive.on('error', err => reject(err));

            archive.pipe(output);

            // 组织文件夹结构
            modules.forEach(module => {
                const folderName = `${module.module_type}/${module.sub_type}`;
                module.images.forEach(image => {
                    const imagePath = path.join(__dirname, '../../public', image.file_path);
                    if (fs.existsSync(imagePath)) {
                        archive.file(imagePath, { 
                            name: `${folderName}/${image.file_name}` 
                        });
                    }
                });
            });

            archive.finalize();
        });
    }

    static async cleanupTempFile(filePath) {
        try {
            await promisify(fs.unlink)(filePath);
        } catch (error) {
            console.error('清理临时文件失败:', error);
        }
    }
}

module.exports = DownloadUtil; 