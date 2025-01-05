const mongoose = require('mongoose');

const downloadRecordSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    selectionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserSelection',
        required: true
    },
    downloadType: {
        type: String,
        enum: {
            values: ['preview', 'package'],
            message: '无效的下载类型'
        },
        required: true
    },
    status: {
        type: String,
        enum: {
            values: ['pending', 'processing', 'completed', 'failed'],
            message: '无效的下载状态'
        },
        default: 'pending'
    },
    fileUrl: {
        type: String
    },
    fileSize: {
        type: Number
    },
    error: {
        type: String
    },
    ip: {
        type: String,
        required: true
    },
    userAgent: {
        type: String
    },
    completedAt: {
        type: Date
    }
}, {
    timestamps: true
});

// 索引
downloadRecordSchema.index({ userId: 1, createdAt: -1 });
downloadRecordSchema.index({ productId: 1 });
downloadRecordSchema.index({ selectionId: 1 });
downloadRecordSchema.index({ status: 1 });
downloadRecordSchema.index({ downloadType: 1 });

// 下载完成时更新相关计数
downloadRecordSchema.post('save', async function() {
    if (this.status === 'completed' && this.isModified('status')) {
        // 更新商品下载计数
        await mongoose.model('Product').findByIdAndUpdate(
            this.productId,
            { $inc: { downloadCount: 1 } }
        );

        // 更新用户选择下载计数
        await mongoose.model('UserSelection').findByIdAndUpdate(
            this.selectionId,
            {
                $inc: { downloadCount: 1 },
                lastDownloadAt: new Date()
            }
        );
    }
});

const DownloadRecord = mongoose.model('DownloadRecord', downloadRecordSchema);

module.exports = { DownloadRecord }; 